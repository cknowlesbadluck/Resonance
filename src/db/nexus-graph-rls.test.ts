import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Effective policy guard: every Nexus graph policy must be authenticated-only; writes must be project-scoped. */
const DIR = join(process.cwd(), "supabase", "migrations");
const TABLES = ["events", "nexus_execution_requests", "project_members", "projects", "nexus_identities", "nexus_resources", "nexus_capabilities", "nexus_context_entries", "nexus_executions", "nexus_evidence"];
const CATALOG = new Set(["nexus_identities", "nexus_resources", "nexus_capabilities"]);
const EXECUTION = new Set(["events", "nexus_execution_requests", "nexus_context_entries", "nexus_executions", "nexus_evidence"]);

type Policy = { table: string; name: string; sql: string };

function statements(sql: string): string[] {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").map((line) => line.replace(/--.*$/, "")).join("\n")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
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

const isWrite = (sql: string) => / for (all|insert|update|delete)\b/.test(sql);

const lockdownSql = readFileSync(join(DIR, "20261112160500_nexus_graph_rls_lockdown.sql"), "utf8").replace(/\s+/g, " ").toLowerCase();

describe("Nexus graph RLS lockdown", () => {
  const policies = [...effectivePolicies().values()].filter((p) => TABLES.includes(p.table));

  it("revokes broad ACLs and grants only the required authenticated operations", () => {
    expect(lockdownSql).toMatch(/revoke all privileges on table[\s\S]*from anon, public/);
    expect(lockdownSql).toMatch(/revoke all privileges on table[\s\S]*from authenticated/);
    expect(lockdownSql).toMatch(/grant select, insert, update, delete on table[\s\S]*to authenticated/);
    expect(lockdownSql).toMatch(/grant select on table public\.nexus_evidence to authenticated/);
    expect(lockdownSql).toMatch(/grant select, insert on table public\.events to authenticated/);
    expect(lockdownSql).toMatch(/grant select, insert, update on table public\.nexus_execution_requests to authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on tables from anon, public/);
    expect(lockdownSql).toMatch(/alter default privileges for role supabase_admin in schema public revoke all on tables from anon, public/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke execute on functions from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role supabase_admin in schema public revoke execute on functions from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on sequences from anon, public/);
    expect(lockdownSql).toMatch(/alter default privileges for role supabase_admin in schema public revoke all on sequences from anon, public/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on tables from authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role supabase_admin in schema public revoke all on tables from authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role supabase_admin in schema public grant select, insert, update, delete on tables to authenticated/);
    expect(lockdownSql).not.toMatch(/grant (all|truncate|trigger|maintain|references)\b/);
  });

  it("retains policies for all six graph tables", () => {
    for (const table of TABLES) expect(policies.some((p) => p.table === table), table).toBe(true);
  });

  it("scopes every effective policy to authenticated", () => {
    for (const policy of policies) expect(policy.sql, `${policy.table}.${policy.name}`).toMatch(/ to authenticated\b/);
  });

  it("permits global reads only for catalog tables", () => {
    for (const policy of policies) {
      if (policy.sql.includes("for select") && policy.sql.includes("project_id is null")) {
        expect(CATALOG.has(policy.table), policy.table).toBe(true);
      }
    }
  });

  it("requires project membership for every write policy", () => {
    for (const policy of policies.filter((p) => isWrite(p.sql))) {
      expect(policy.sql, `${policy.table}.${policy.name}`).toMatch(/project_id is not null and private\.is_project_member\(project_id\)/);
      expect(policy.sql).not.toMatch(/project_id is null/);
    }
  });

  it("never exposes unscoped execution-plane rows", () => {
    for (const policy of policies.filter((p) => EXECUTION.has(p.table))) {
      expect(policy.sql, `${policy.table}.${policy.name}`).not.toMatch(/project_id is null/);
    }
  });
});
