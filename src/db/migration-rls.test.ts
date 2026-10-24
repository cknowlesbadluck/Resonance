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
const strip = (sql: string) => sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const sql = files.map((f) => strip(readFileSync(join(dir, f), "utf8"))).join("\n");
const norm = (name: string) => name.replace(/"/g, "").toLowerCase().replace(/^public\./, "");

export function createdTables(text: string): string[] {
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)/gi;
  return [...text.matchAll(re)].map((m) => norm(m[1]));
}
export function rlsTables(text: string): Set<string> {
  const re = /alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?([\w."]+)\s+enable\s+row\s+level\s+security/gi;
  return new Set([...text.matchAll(re)].map((m) => norm(m[1])));
}
export function riskyGrants(text: string): string[] {
  const re = /grant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+);/gi;
  return [...text.matchAll(re)]
    .filter(([, priv, obj, to]) => {
      if (/^\s*(function|schema)\b/i.test(obj)) return false; // execute/usage grants are policy-gated
      if (/\b(anon|public)\b/i.test(to)) return true;
      return /\ball\b/i.test(priv) && /\bauthenticated\b/i.test(to);
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
  });
});
