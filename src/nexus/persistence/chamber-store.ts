import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chamber } from "../chamber";
import type { ChamberAuditRecord, ChamberScenarioStore } from "../chamber-scenario";
import type { ContextEntry, NexusEvidence } from "../types";

export type ChamberSnapshot = {
  kind: "chamber";
  cursor: number;
  chamber: Chamber;
  idempotencyKey?: string;
};

type ExecutionRow = {
  id: string;
  project_id: string | null;
  plan_id: string;
  status: string;
  output: ChamberSnapshot | null;
};

type EvidenceRow = {
  id: string;
  project_id: string | null;
  execution_id: string;
  evidence_type: string;
  summary: string;
  payload: unknown;
  created_at: string;
};

/**
 * Narrow table port so the store can be tested without a live Supabase project.
 * Service-role clients bypass RLS; anon clients must not be passed here.
 */
export interface ChamberTables {
  upsertExecution(row: ExecutionRow): Promise<void>;
  getExecution(projectId: string, id: string): Promise<ExecutionRow | null>;
  listExecutions(projectId: string): Promise<ExecutionRow[]>;
  insertEvidence(row: EvidenceRow): Promise<void>;
  listEvidence(executionId: string): Promise<EvidenceRow[]>;
  listProjectEvidence(projectId: string): Promise<EvidenceRow[]>;
  upsertContext(row: {
    id: string;
    project_id: string;
    scope: string;
    key: string;
    value: unknown;
    visibility: string;
    created_by: string;
    provenance: string | null;
    persistent: boolean;
    created_at: string;
  }): Promise<void>;
  getContext(projectId: string, id: string): Promise<{
    id: string;
    project_id: string;
    value: unknown;
  } | null>;
}

function idempotencyRowId(projectId: string, key: string): string {
  const hex = createHash("sha256").update(`chamber-idempotency\n${projectId}\n${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.slice(18, 30)}`;
}

function snapshotOf(row: ExecutionRow | null): { chamber: Chamber; cursor: number } | null {
  const output = row?.output;
  if (!output || output.kind !== "chamber" || !output.chamber) return null;
  return { chamber: output.chamber, cursor: output.cursor ?? 0 };
}

export class TableChamberStore implements ChamberScenarioStore {
  private idempotencyKey?: string;

  constructor(private readonly tables: ChamberTables) {}

  tag(idempotencyKey: string) {
    this.idempotencyKey = idempotencyKey;
  }

  async findByIdempotency(projectId: string, idempotencyKey: string) {
    const marker = await this.tables.getContext(projectId, idempotencyRowId(projectId, idempotencyKey));
    const chamberId = marker && marker.value && typeof marker.value === "object" && "chamberId" in marker.value
      ? String((marker.value as { chamberId?: unknown }).chamberId ?? "")
      : "";
    if (chamberId) {
      const direct = snapshotOf(await this.tables.getExecution(projectId, chamberId));
      if (direct) return direct;
    }
    const rows = await this.tables.listExecutions(projectId);
    const match = rows.find((row) => row.output?.kind === "chamber" && row.output.idempotencyKey === idempotencyKey);
    return snapshotOf(match ?? null);
  }

  private async ensureExecution(projectId: string, chamberId: string) {
    const existing = await this.tables.getExecution(projectId, chamberId);
    if (existing) return;
    await this.tables.upsertExecution({
      id: chamberId,
      project_id: projectId,
      plan_id: chamberId,
      status: "active",
      output: null,
    });
  }

  async saveChamber(chamber: Chamber, cursor: number) {
    const existing = await this.tables.getExecution(chamber.projectId, chamber.id);
    const previousKey = existing?.output?.kind === "chamber" ? existing.output.idempotencyKey : undefined;
    await this.tables.upsertExecution({
      id: chamber.id,
      project_id: chamber.projectId,
      plan_id: chamber.agendaId,
      status: chamber.status,
      output: {
        kind: "chamber",
        cursor,
        chamber,
        idempotencyKey: this.idempotencyKey ?? previousKey,
      },
    });
    const key = this.idempotencyKey ?? previousKey;
    if (key) {
      await this.tables.upsertContext({
        id: idempotencyRowId(chamber.projectId, key),
        project_id: chamber.projectId,
        scope: "chamber.idempotency",
        key,
        value: { chamberId: chamber.id },
        visibility: "private",
        created_by: "chamber-store",
        provenance: "chamber-http",
        persistent: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  async saveContext(projectId: string, entry: ContextEntry) {
    if (!entry.persistent) return;
    await this.tables.upsertContext({
      id: entry.id,
      project_id: projectId,
      scope: entry.scope,
      key: entry.key,
      value: entry.value,
      visibility: entry.visibility,
      created_by: entry.createdBy,
      provenance: entry.provenance ?? null,
      persistent: entry.persistent,
      created_at: entry.createdAt,
    });
  }

  async saveAudit(record: ChamberAuditRecord) {
    await this.ensureExecution(record.projectId, record.chamberId);
    await this.tables.insertEvidence({
      id: record.id,
      project_id: record.projectId,
      execution_id: record.chamberId,
      evidence_type: "audit",
      summary: record.type,
      payload: { auditType: record.type, ...(record.payload && typeof record.payload === "object" ? record.payload as object : { value: record.payload }) },
      created_at: record.createdAt,
    });
  }

  async saveEvidence(projectId: string, evidence: NexusEvidence) {
    await this.ensureExecution(projectId, evidence.executionId);
    await this.tables.insertEvidence({
      id: evidence.id,
      project_id: projectId,
      execution_id: evidence.executionId,
      evidence_type: evidence.type,
      summary: evidence.summary,
      payload: evidence.payload,
      created_at: evidence.createdAt,
    });
  }

  async listAudit(projectId: string, chamberId: string) {
    const rows = await this.tables.listEvidence(chamberId);
    return rows
      .filter((row) => row.project_id === projectId && row.evidence_type === "audit")
      .map((row) => {
        const payload = row.payload && typeof row.payload === "object" ? row.payload as { auditType?: string } : {};
        return {
          id: row.id,
          projectId,
          chamberId,
          type: payload.auditType ?? row.summary,
          payload: row.payload,
          createdAt: row.created_at,
        };
      });
  }

  async listEvidence(projectId: string) {
    const rows = await this.tables.listProjectEvidence(projectId);
    return rows
      .filter((row) => row.evidence_type !== "audit")
      .map((row) => ({
        id: row.id,
        executionId: row.execution_id,
        type: (row.evidence_type === "event" || row.evidence_type === "artifact" || row.evidence_type === "decision" || row.evidence_type === "knowledge" ? row.evidence_type : "audit") as NexusEvidence["type"],
        summary: row.summary,
        payload: row.payload,
        createdAt: row.created_at,
      }));
  }

  async listChambers(projectId: string) {
    const rows = await this.tables.listExecutions(projectId);
    return rows.flatMap((row) => {
      const snap = snapshotOf(row);
      return snap ? [snap] : [];
    });
  }

  async getChamber(projectId: string, chamberId: string) {
    return snapshotOf(await this.tables.getExecution(projectId, chamberId));
  }
}

export function chamberTablesFromSupabase(db: SupabaseClient): ChamberTables {
  return {
    async upsertExecution(row) {
      const { error } = await db.from("nexus_executions").upsert({
        id: row.id,
        project_id: row.project_id,
        plan_id: row.plan_id,
        status: row.status,
        output: row.output,
      });
      if (error) throw error;
    },
    async getExecution(projectId, id) {
      const { data, error } = await db.from("nexus_executions").select("id, project_id, plan_id, status, output").eq("project_id", projectId).eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as ExecutionRow | null) ?? null;
    },
    async listExecutions(projectId) {
      const { data, error } = await db.from("nexus_executions").select("id, project_id, plan_id, status, output").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as ExecutionRow[];
    },
    async insertEvidence(row) {
      const { error } = await db.from("nexus_evidence").upsert({
        id: row.id,
        project_id: row.project_id,
        execution_id: row.execution_id,
        evidence_type: row.evidence_type,
        summary: row.summary,
        payload: row.payload ?? {},
        created_at: row.created_at,
      });
      if (error) throw error;
    },
    async listEvidence(executionId) {
      const { data, error } = await db.from("nexus_evidence").select("id, project_id, execution_id, evidence_type, summary, payload, created_at").eq("execution_id", executionId).order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      return (data ?? []) as EvidenceRow[];
    },
    async listProjectEvidence(projectId) {
      const { data, error } = await db.from("nexus_evidence").select("id, project_id, execution_id, evidence_type, summary, payload, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as EvidenceRow[];
    },
    async upsertContext(row) {
      const { error } = await db.from("nexus_context_entries").upsert(row);
      if (error) throw error;
    },
    async getContext(projectId, id) {
      const { data, error } = await db.from("nexus_context_entries").select("id, project_id, value").eq("project_id", projectId).eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as { id: string; project_id: string; value: unknown } | null) ?? null;
    },
  };
}
