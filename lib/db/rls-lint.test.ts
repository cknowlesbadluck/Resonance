import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Static lint over supabase/migrations: never touches a database.
const dir = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  .map((f) => readFileSync(join(dir, f), "utf8")).join("\n").toLowerCase();

const name = (s: string) => s.replace(/"/g, "").replace(/^public\./, "");
const created = new Set([...sql.matchAll(/create table (?:if not exists )?([\w."]+)/g)].map((m) => name(m[1])));
const rls = new Set([...sql.matchAll(/alter table (?:only )?(?:if exists )?([\w."]+)\s+enable row level security/g)].map((m) => name(m[1])));
// Replay policy create/drop in migration order, statement by statement.
const live = new Map<string, string>();
for (const stmt of sql.split(";")) {
  const c = stmt.match(/create policy\s+("[^"]+"|\w+)[^;]*?\son\s+([\w."]+)/);
  if (c) live.set(`${name(c[2])}:${name(c[1])}`, name(c[2]));
  const d = stmt.match(/drop policy (?:if exists )?("[^"]+"|\w+)\s+on\s+([\w."]+)/);
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
