import { describe, expect, it } from "vitest";
import type { Chamber } from "../chamber";
import { TableChamberStore, type ChamberTables } from "./chamber-store";

function memoryTables(): ChamberTables {
  const executions = new Map<string, { id: string; project_id: string | null; plan_id: string; status: string; output: { kind: "chamber"; cursor: number; chamber: Chamber; idempotencyKey?: string } | null }>();
  const evidence: Array<{ id: string; project_id: string | null; execution_id: string; evidence_type: string; summary: string; payload: unknown; created_at: string }> = [];
  const context = new Map<string, { id: string; project_id: string; value: unknown }>();
  return {
    async upsertExecution(row) { executions.set(row.id, row); },
    async getExecution(projectId, id) {
      const row = executions.get(id);
      return row && row.project_id === projectId ? row : null;
    },
    async listExecutions(projectId) { return [...executions.values()].filter((row) => row.project_id === projectId); },
    async insertEvidence(row) { evidence.push(row); },
    async listEvidence(executionId) { return evidence.filter((row) => row.execution_id === executionId); },
    async listProjectEvidence(projectId) { return evidence.filter((row) => row.project_id === projectId); },
    async upsertContext(row) { context.set(row.id, { id: row.id, project_id: row.project_id, value: row.value }); },
    async getContext(projectId, id) {
      const row = context.get(id);
      return row && row.project_id === projectId ? row : null;
    },
  };
}

describe("TableChamberStore", () => {
  it("persists a chamber snapshot and finds it by idempotency key", async () => {
    const store = new TableChamberStore(memoryTables());
    store.tag("idem-9");
    const chamber: Chamber = {
      id: "00000000-0000-4000-8000-000000000099",
      agendaId: "agenda-1",
      projectId: "00000000-0000-4000-8000-000000000001",
      status: "dissolved",
      toolkitCapabilityKeys: [],
      participantIds: ["actor-1"],
      createdAt: new Date().toISOString(),
      dissolvedAt: new Date().toISOString(),
    };
    await store.saveChamber(chamber, 1);
    const found = await store.findByIdempotency(chamber.projectId, "idem-9");
    expect(found?.chamber.id).toBe(chamber.id);
    expect(found?.cursor).toBe(1);
    const listed = await store.listChambers(chamber.projectId);
    expect(listed).toHaveLength(1);
  });
});
