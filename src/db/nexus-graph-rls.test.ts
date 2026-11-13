import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Effective policy guard: every exposed Nexus API table must be authenticated-only; writes must be project-scoped. */
const DIR = join(process.cwd(), "supabase", "migrations");
const TABLES = ["events", "nexus_execution_requests", "project_members", "projects", "nexus_identities", "nexus_resources", "nexus_capabilities", "nexus_context_entries", "nexus_executions", "nexus_evidence", "providers"];
const CATALOG = new Set(["nexus_identities", "nexus_resources", "nexus_capabilities"]);
const EXECUTION = new Set(["events", "nexus_execution_requests", "nexus_context_entries", "nexus_executions", "nexus_evidence"]);

type Policy = { table: string; name: string; sql: string };
type PolicyExpressions = { command: string | null; using: string | null; check: string | null; explicitCheck: string | null };

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

function extractExpression(sql: string, keyword: string): string | null {
  const keywordIndex = sql.indexOf(keyword);
  if (keywordIndex < 0) return null;
  const open = sql.indexOf("(", keywordIndex + keyword.length);
  if (open < 0) return null;
  let depth = 0;
  for (let index = open; index < sql.length; index += 1) {
    if (sql[index] === "(") depth += 1;
    if (sql[index] === ")") {
      depth -= 1;
      if (depth === 0) return sql.slice(open + 1, index).trim();
    }
  }
  return null;
}

function policyExpressions(sql: string): PolicyExpressions {
  const command = sql.match(/\bfor (all|insert|update|delete|select)\b/)?.[1] ?? null;
  const using = extractExpression(sql, "using");
  const explicitCheck = extractExpression(sql, "with check");
  // PostgreSQL uses USING as the default WITH CHECK for UPDATE and ALL policies.
  const check = explicitCheck ?? (command === "update" || command === "all" ? using : null);
  return { command, using, check, explicitCheck };
}

function isProjectScoped(expression: string | null): boolean {
  return expression !== null
    && /project_id is not null/.test(expression)
    && /private\.is_project_member\(project_id\)/.test(expression)
    && !/project_id is null/.test(expression);
}

function policyRoles(sql: string): string[] {
  const match = sql.match(/\bto\s+(.+?)(?=\s+(?:using|with check)\b|$)/);
  return match?.[1].split(",").map((role) => role.trim().replace(/^["']|["']$/g, "")) ?? [];
}

const lockdownSource = readFileSync(join(DIR, "20261112160500_nexus_graph_rls_lockdown.sql"), "utf8");
const lockdownSql = lockdownSource.replace(/\s+/g, " ").toLowerCase();

describe("Nexus graph RLS lockdown", () => {
  const policies = [...effectivePolicies().values()].filter((p) => TABLES.includes(p.table));

  it("revokes broad current and future API grants", () => {
    const providerRevokes = statements(lockdownSource).filter((statement) => statement.startsWith("revoke all privileges on table") && statement.includes("public.providers"));
    expect(providerRevokes).toHaveLength(2);
    expect(providerRevokes.some((statement) => statement.endsWith("from anon, public"))).toBe(true);
    expect(providerRevokes.some((statement) => statement.endsWith("from authenticated"))).toBe(true);
    expect(lockdownSql).toMatch(/revoke all privileges on all sequences in schema public from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/revoke execute on all functions in schema public from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/grant select, insert on table public\.events to authenticated/);
    expect(lockdownSql).toMatch(/grant select, insert, update on table public\.nexus_execution_requests to authenticated/);
    expect(lockdownSql).toMatch(/grant select on table public\.nexus_evidence, public\.providers to authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on tables from anon, public/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on tables from authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke all on sequences from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres in schema public revoke execute on functions from anon, public, authenticated/);
    expect(lockdownSql).toMatch(/alter default privileges for role postgres revoke execute on functions from public/);
    expect(lockdownSql).not.toMatch(/alter default privileges for role postgres in schema public grant .* on tables to authenticated/);
    // The project postgres role is not a member of supabase_admin; altering its defaults would abort the migration.
    expect(lockdownSql).not.toMatch(/alter default privileges for role supabase_admin/);
    expect(lockdownSql).not.toMatch(/grant (all|truncate|trigger|maintain|references)\b/);
  });

  it("pins the SECURITY DEFINER membership helper to an empty search_path", () => {
    expect(lockdownSql).toMatch(/alter function private\.is_project_member\(uuid\) set search_path = ''/);
  });

  it("retains policies for every exposed API table", () => {
    for (const table of TABLES) expect(policies.some((p) => p.table === table), table).toBe(true);
  });

  it("restricts every effective policy to authenticated only", () => {
    for (const policy of policies) {
      expect(policyRoles(policy.sql), `${policy.table}.${policy.name}`).toEqual(["authenticated"]);
    }
  });

  it("rejects policies that add another role", () => {
    const roles = policyRoles("create policy unsafe on public.events for select to authenticated, anon using (true)");
    expect(roles).toEqual(["authenticated", "anon"]);
    expect(roles).not.toEqual(["authenticated"]);
  });

  it("permits global reads only for catalog tables", () => {
    for (const policy of policies) {
      if (policy.sql.includes("for select") && policy.sql.includes("project_id is null")) {
        expect(CATALOG.has(policy.table), policy.table).toBe(true);
      }
    }
  });

  it("checks USING and WITH CHECK independently for every write policy", () => {
    for (const policy of policies) {
      const expressions = policyExpressions(policy.sql);
      if (!["all", "insert", "update", "delete"].includes(expressions.command ?? "")) continue;
      if (expressions.command !== "insert") {
        expect(isProjectScoped(expressions.using), `${policy.table}.${policy.name} USING`).toBe(true);
      }
      if (expressions.command !== "delete") {
        expect(isProjectScoped(expressions.check), `${policy.table}.${policy.name} WITH CHECK`).toBe(true);
      }
    }
  });

  it("rejects an unrestricted WITH CHECK even when USING is correctly scoped", () => {
    const unsafe = policyExpressions(
      "create policy unsafe on public.events for update to authenticated using (project_id is not null and private.is_project_member(project_id)) with check (true)",
    );
    expect(isProjectScoped(unsafe.using)).toBe(true);
    expect(isProjectScoped(unsafe.check)).toBe(false);
  });

  it("preserves PostgreSQL USING-to-WITH-CHECK fallback for UPDATE and ALL", () => {
    const using = "project_id is not null and private.is_project_member(project_id)";
    const update = policyExpressions(`create policy update_fallback on public.events for update to authenticated using (${using})`);
    const all = policyExpressions(`create policy all_fallback on public.events for all to authenticated using (${using})`);
    expect(update.check).toBe(update.using);
    expect(all.check).toBe(all.using);
    expect(isProjectScoped(update.check)).toBe(true);
    expect(isProjectScoped(all.check)).toBe(true);
  });

  it("never exposes unscoped execution-plane rows", () => {
    for (const policy of policies.filter((p) => EXECUTION.has(p.table))) {
      expect(policy.sql, `${policy.table}.${policy.name}`).not.toMatch(/project_id is null/);
    }
  });
});
