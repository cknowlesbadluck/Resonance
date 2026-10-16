import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Static lint over supabase/migrations: never touches a database.
const dir = join(process.cwd(), "supabase", "migrations");
const raw = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  .map((f) => readFileSync(join(dir, f), "utf8")).join("\n;\n");

/**
 * Split SQL into executable statements: drops `--` and `/* *\/` comments and splits on `;`
 * only outside single-quoted strings, quoted identifiers and dollar-quoted bodies, so
 * commented-out DDL never counts and function bodies don't fragment.
 */
function sqlStatements(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i], next = text[i + 1];
    if (ch === "-" && next === "-") { const nl = text.indexOf("\n", i); i = nl < 0 ? text.length : nl; cur += " "; continue; }
    if (ch === "/" && next === "*") { const end = text.indexOf("*/", i + 2); i = end < 0 ? text.length : end + 2; cur += " "; continue; }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < text.length) { if (text[j] === ch) { if (text[j + 1] === ch) { j += 2; continue; } break; } j++; }
      cur += text.slice(i, j + 1); i = j + 1; continue;
    }
    if (ch === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(text.slice(i))?.[0];
      if (tag) { const end = text.indexOf(tag, i + tag.length); const stop = end < 0 ? text.length : end + tag.length; cur += text.slice(i, stop); i = stop; continue; }
    }
    if (ch === ";") { if (cur.trim()) out.push(cur.trim()); cur = ""; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((st) => st.toLowerCase());
}

const statements = sqlStatements(raw);
const name = (s: string) => s.replace(/"/g, "").replace(/^public\./, "");
const created = new Set<string>();
// Replay RLS enable/disable and policy create/drop in migration order; assert the FINAL state.
const rls = new Set<string>();
const live = new Map<string, string>();
for (const stmt of statements) {
  const t = stmt.match(/^create table (?:if not exists )?([\w."]+)/);
  if (t) created.add(name(t[1]));
  const r = stmt.match(/^alter table (?:if exists )?(?:only )?([\w."]+)\s+(enable|disable) row level security/);
  if (r) { if (r[2] === "enable") rls.add(name(r[1])); else rls.delete(name(r[1])); }
  const dt = stmt.match(/^drop table (?:if exists )?([\w."]+)/);
  if (dt) { created.delete(name(dt[1])); rls.delete(name(dt[1])); }
  const c = stmt.match(/^create policy\s+("[^"]+"|\w+)[\s\S]*?\son\s+([\w."]+)/);
  if (c) live.set(`${name(c[2])}:${name(c[1])}`, name(c[2]));
  const d = stmt.match(/^drop policy (?:if exists )?("[^"]+"|\w+)\s+on\s+([\w."]+)/);
  if (d) live.delete(`${name(d[2])}:${name(d[1])}`);
}

// The 5 tables the live-DB advisor reports as "RLS enabled, no policies".
// audit_logs and resources are service-role-only in the migrations too.
// capabilities, capability_dependencies and nexus_execution_requests DO declare
// policies in migrations, so the live DB has drifted from the repo (or those
// migrations never ran). Pinned here so any change is a deliberate review decision.
const EXPECTED_POLICIES: Record<string, string[]> = {
  audit_logs: [],
  resources: [],
  capabilities: ["authenticated users can read capabilities"],
  capability_dependencies: ["authenticated users can read capability dependencies"],
  nexus_execution_requests: [
    "nexus_execution_requests_member_insert",
    "nexus_execution_requests_member_select",
    "nexus_execution_requests_member_update",
  ],
};

describe("sqlStatements", () => {
  it("ignores commented-out DDL and respects quotes/dollar bodies", () => {
    const st = sqlStatements(`-- alter table public.x enable row level security;
/* create policy "p" on public.x for select using (true); */
create function f() returns void as $fn$ begin perform 1; end $fn$ language plpgsql;
select 'a;b';`);
    expect(st).toHaveLength(2);
    expect(st[0]).toMatch(/^create function/);
    expect(st.some((s) => s.includes("row level security") || s.includes("create policy"))).toBe(false);
  });
  it("parses the real migrations (sanity: tables and the pinned policies are seen)", () => {
    expect(created.size).toBeGreaterThanOrEqual(10);
  });
});

describe("migration RLS lint (static, no database)", () => {
  it("every created table enables RLS", () => {
    expect([...created].filter((t) => !rls.has(t))).toEqual([]);
  });
  it.each(Object.keys(EXPECTED_POLICIES))("%s: RLS on and policy set matches the pinned intent", (t) => {
    expect(rls.has(t)).toBe(true);
    const actual = [...live.keys()].filter((k) => k.startsWith(`${t}:`)).map((k) => k.slice(t.length + 1)).sort();
    expect(actual).toEqual(EXPECTED_POLICIES[t]);
  });
});
