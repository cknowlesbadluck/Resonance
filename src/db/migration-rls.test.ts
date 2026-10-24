/**
 * Static guard (no DB access): every table created in supabase/migrations must
 * have row level security enabled somewhere in the migration history, and no
 * migration may grant table privileges to anon/public or ALL to authenticated.
 * Function EXECUTE grants to authenticated are allowed (RLS helper functions).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
/** Remove -- and /* *\/ comments while leaving '...', "..." and $tag$...$tag$ literals intact. */
export function strip(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const two = sql.slice(i, i + 2);
    if (two === "--") { const n = sql.indexOf("\n", i); i = n === -1 ? sql.length : n; continue; }
    if (two === "/*") { const n = sql.indexOf("*/", i + 2); i = n === -1 ? sql.length : n + 2; out += " "; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < sql.length) { if (sql[j] === c) { if (sql[j + 1] === c) { j += 2; continue; } break; } j++; }
      out += sql.slice(i, j + 1); i = j + 1; continue;
    }
    const tag = c === "$" ? /^\$[A-Za-z_]*\$/.exec(sql.slice(i)) : null;
    if (tag) { const n = sql.indexOf(tag[0], i + tag[0].length); const end = n === -1 ? sql.length : n + tag[0].length; out += sql.slice(i, end); i = end; continue; }
    out += c; i++;
  }
  return out;
}
/** Blank out single-quoted string literal contents so SQL quoted as data (e.g. COMMENT ... IS '...') is never matched as a statement. */
export function maskStrings(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, (m) => "'" + " ".repeat(m.length - 2) + "'");
}
const sql = files.map((f) => maskStrings(strip(readFileSync(join(dir, f), "utf8")))).join(";\n");
/** Postgres identifier rules: unquoted parts fold to lower case, quoted parts keep case. */
export function norm(name: string): string {
  const parts = name.match(/"(?:[^"]|"")*"|[^.]+/g) ?? [];
  const folded = parts.map((p) => (p.startsWith('"') ? p.slice(1, -1).replace(/""/g, '"') : p.toLowerCase()));
  if (folded.length === 2 && folded[0] === "public") folded.shift();
  return folded.join(".");
}
const IDENT = String.raw`((?:"(?:[^"]|"")*"|[\w$]+)(?:\.(?:"(?:[^"]|"")*"|[\w$]+))?)`;

export function createdTables(text: string): string[] {
  const re = new RegExp(String.raw`create\s+(?:(?:global|local)\s+)?(?:(?:temp|temporary|unlogged)\s+)?table\s+(?:if\s+not\s+exists\s+)?` + IDENT, "gi");
  return [...text.matchAll(re)].map((m) => norm(m[1]));
}
export function rlsTables(text: string): Set<string> {
  const re = new RegExp(String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?` + IDENT + String.raw`\s+enable\s+row\s+level\s+security`, "gi");
  return new Set([...text.matchAll(re)].map((m) => norm(m[1])));
}
export function riskyGrants(text: string): string[] {
  const re = /grant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+?)\s*(?:;|$)/gi;
  return [...text.matchAll(re)]
    .filter(([, priv, obj, to]) => {
      const all = /\ball\b/i.test(priv);
      if (all && /\b(anon|public|authenticated)\b/i.test(to)) return true; // GRANT ALL on anything (incl. schema)
      if (/^\s*(function|schema)\b/i.test(obj)) return false; // EXECUTE/USAGE grants are policy-gated
      return /\b(anon|public)\b/i.test(to);
    })
    .map((m) => m[0].replace(/\s+/g, " ").trim());
}

describe("supabase migrations: RLS + grants (static)", () => {
  it("finds migrations", () => expect(files.length).toBeGreaterThan(0));

  it("every created table has RLS enabled", () => {
    const rls = rlsTables(sql);
    const missing = createdTables(sql).filter((t) => !rls.has(t));
    expect(missing).toEqual([]);
  });

  it("no table grants to anon/public and no ALL to authenticated", () => {
    expect(riskyGrants(sql)).toEqual([]);
  });

  it("parsers catch violations (self-test)", () => {
    const bad = "create table public.x (id int); grant select on table public.x to anon; grant all on y to authenticated;";
    expect(createdTables(bad)).toEqual(["x"]);
    expect(rlsTables(bad).has("x")).toBe(false);
    expect(riskyGrants(bad)).toHaveLength(2);
    expect(riskyGrants("grant execute on function private.f(uuid) to authenticated;")).toEqual([]);
    expect(riskyGrants(strip("grant all on schema public to authenticated;"))).toHaveLength(1);
    expect(riskyGrants(strip("select '/*'; grant select on table public.x to anon; select '*/';"))).toHaveLength(1);
    expect(strip("select $f$ -- not a comment $f$; -- real")).toContain("not a comment");
    expect(createdTables('create unlogged table public.u (id int); create table public."Accounts" (id int);')).toEqual(["u", "Accounts"]);
    expect(rlsTables("alter table public.accounts enable row level security;").has("Accounts")).toBe(false);
    expect(norm('PUBLIC.Foo')).toBe("foo");
    // string literals are data, not statements
    const leaky = maskStrings(strip("create table public.leaky (id int); comment on table public.leaky is 'alter table public.leaky enable row level security;';"));
    expect(rlsTables(leaky).has("leaky")).toBe(false);
    // a final statement without a trailing semicolon is still checked
    expect(riskyGrants("grant select on table public.projects to anon")).toHaveLength(1);
    expect(riskyGrants("grant all on table public.projects to authenticated")).toHaveLength(1);
  });
});
