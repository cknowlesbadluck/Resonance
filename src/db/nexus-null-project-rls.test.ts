import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static check over supabase/migrations (applied in filename order): the effective
 * RLS policies on the Nexus graph tables must not let `anon` touch rows, and must
 * never allow writes to unscoped (project_id is null) rows.
 */
const DIR = join(process.cwd(), "supabase", "migrations");
const TABLES = [
  "nexus_identities",
  "nexus_resources",
  "nexus_capabilities",
  "nexus_context_entries",
  "nexus_executions",
  "nexus_evidence",
];
const EXECUTION_PLANE = new Set(["nexus_context_entries", "nexus_executions", "nexus_evidence"]);

type Policy = { table: string; name: string; sql: string };

function statements(sql: string): string[] {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").map((line) => line.replace(/--.*$/, "")).join("\n")
    .replace(/\$\$[\s\S]*?\$\$/g, "$$$$")
    .split(";").map((s) => s.replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean);
}

function effectivePolicies(): Map<string, Policy> {
  const policies = new Map<string, Policy>();
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort()) {
    for (const stmt of statements(readFileSync(join(DIR, file), "utf8"))) {
      const drop = stmt.match(/^drop policy (?:if exists )?"?([\w ]+?)"? on (?:public\.)?(\w+)/);
      if (drop) { policies.delete(`${drop[2]}.${drop[1]}`); continue; }
      const create = stmt.match(/^create policy "?([\w ]+?)"? on (?:public\.)?(\w+)/);
      if (create) policies.set(`${create[2]}.${create[1]}`, { table: create[2], name: create[1], sql: stmt });
    }
  }
  return policies;
}

const isWrite = (sql: string) => / for (all|insert|update|delete)\b/.test(sql) || !/ for select\b/.test(sql);

describe("Nexus graph RLS: no anon access, no writes to unscoped rows", () => {
  const all = [...effectivePolicies().values()].filter((p) => TABLES.includes(p.table));

  it("every Nexus graph table still has at least one policy", () => {
    for (const table of TABLES) expect(all.some((p) => p.table === table), table).toBe(true);
  });

  it("every effective policy is scoped to authenticated (never anon/public by default)", () => {
    for (const p of all) expect(p.sql, `${p.table}.${p.name}`).toMatch(/ to authenticated\b/);
  });

  it("no write-capable policy admits project_id is null", () => {
    for (const p of all.filter((p) => isWrite(p.sql))) {
      expect(p.sql, `${p.table}.${p.name}`).not.toMatch(/project_id is null/);
      expect(p.sql, `${p.table}.${p.name}`).toMatch(/project_id is not null and private\.is_project_member\(project_id\)/);
    }
  });

  it("execution-plane tables never expose unscoped rows, even for read", () => {
    for (const p of all.filter((p) => EXECUTION_PLANE.has(p.table))) {
      expect(p.sql, `${p.table}.${p.name}`).not.toMatch(/project_id is null/);
    }
  });
});
