import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guard: the list queries in src/nexus/persistence/supabase.ts must be backed by a
 * composite (project_id, <sort column> desc) index somewhere in supabase/migrations, so a
 * project listing never degrades into a full per-project scan and sort.
 */
const root = process.cwd();
const migrations = readdirSync(join(root, "supabase", "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(root, "supabase", "migrations", f), "utf8").toLowerCase().replace(/\s+/g, " "))
  .join("\n");
const persistence = readFileSync(join(root, "src", "nexus", "persistence", "supabase.ts"), "utf8");

const HOT = [
  { table: "nexus_executions", sort: "started_at" },
  { table: "nexus_evidence", sort: "created_at" },
];

describe("hot list queries have matching composite indexes", () => {
  for (const { table, sort } of HOT) {
    it(`${table}: project_id filter ordered by ${sort} desc`, () => {
      const query = new RegExp(`from\\("${table}"\\)[\\s\\S]{0,200}?\\.eq\\("project_id"[\\s\\S]{0,120}?\\.order\\("${sort}", \\{ ascending: false \\}\\)`);
      expect(persistence, "persistence query shape changed; update this guard").toMatch(query);
      const index = new RegExp(`create index if not exists \\w+ on public\\.${table} ?\\( ?project_id, ${sort} desc ?\\)`);
      expect(migrations).toMatch(index);
    });
  }
});
