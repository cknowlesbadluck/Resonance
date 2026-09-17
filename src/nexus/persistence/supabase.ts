import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NexusEvidence, NexusExecution, NexusCapability, ContextEntry } from "../types";

export interface NexusPersistence {
  saveCapability(capability: NexusCapability, projectId?: string): Promise<void>;
  saveContext(entry: ContextEntry, projectId?: string): Promise<void>;
  saveExecution(execution: NexusExecution, projectId?: string): Promise<void>;
  saveEvidence(evidence: NexusEvidence, projectId?: string): Promise<void>;
  listExecutions(projectId: string): Promise<NexusExecution[]>;
  listEvidence(projectId: string, executionId?: string): Promise<NexusEvidence[]>;
}

export function createNexusPersistenceFromEnv(): NexusPersistence | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return new SupabaseNexusPersistence(createClient(url, key, { auth: { persistSession: false } }));
}

// Data Mappers

export function mapCapabilityToRow(capability: NexusCapability, projectId?: string) {
  return {
    id: capability.id,
    project_id: projectId ?? null,
    capability_key: capability.key,
    name: capability.name,
    description: capability.description ?? null,
    provider_id: capability.providerId ?? null,
    identity_id: capability.identityId ?? null,
    adapter_id: capability.adapterId ?? null,
    resource_type: capability.resourceType ?? null,
    required_permissions: capability.requiredPermissions,
    risk: capability.risk,
    input_schema: capability.inputSchema ?? null,
    output_schema: capability.outputSchema ?? null,
    tags: capability.tags ?? [],
    compatibility: capability.compatibility ?? [],
    availability: capability.availability ?? "available",
    provenance: capability.provenance ?? null,
    version: capability.version ?? null,
    cost: capability.cost ?? null,
    latency_ms: capability.latencyMs ?? null,
  };
}

export function mapContextEntryToRow(entry: ContextEntry, projectId?: string) {
  return {
    id: entry.id,
    project_id: projectId ?? null,
    scope: entry.scope,
    key: entry.key,
    value: entry.value,
    visibility: entry.visibility,
    created_by: entry.createdBy,
    provenance: entry.provenance ?? null,
    persistent: entry.persistent,
    created_at: entry.createdAt,
  };
}

export function mapExecutionToRow(execution: NexusExecution, projectId?: string) {
  return {
    id: execution.id,
    project_id: projectId ?? null,
    plan_id: execution.planId,
    status: execution.status,
    output: execution.output ?? null,
    error: execution.error ?? null,
    started_at: execution.startedAt ?? null,
    completed_at: execution.completedAt ?? null,
  };
}

export function mapRowToExecution(row: Record<string, any>): NexusExecution {
  return {
    id: row.id,
    planId: row.plan_id,
    status: row.status,
    output: row.output ?? undefined,
    error: row.error ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export function mapEvidenceToRow(evidence: NexusEvidence, projectId?: string) {
  return {
    id: evidence.id,
    project_id: projectId ?? null,
    execution_id: evidence.executionId,
    evidence_type: evidence.type,
    summary: evidence.summary,
    payload: evidence.payload,
    created_at: evidence.createdAt,
  };
}

export function mapRowToEvidence(row: Record<string, any>): NexusEvidence {
  return {
    id: row.id,
    executionId: row.execution_id,
    type: row.evidence_type,
    summary: row.summary,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

// Database Operations

export async function upsertCapability(
  db: SupabaseClient,
  capability: NexusCapability,
  projectId?: string,
): Promise<void> {
  const { error } = await db.from("nexus_capabilities").upsert(mapCapabilityToRow(capability, projectId));
  if (error) throw error;
}

export async function upsertContextEntry(
  db: SupabaseClient,
  entry: ContextEntry,
  projectId?: string,
): Promise<void> {
  const { error } = await db.from("nexus_context_entries").upsert(mapContextEntryToRow(entry, projectId));
  if (error) throw error;
}

export async function upsertExecution(
  db: SupabaseClient,
  execution: NexusExecution,
  projectId?: string,
): Promise<void> {
  const { error } = await db.from("nexus_executions").upsert(mapExecutionToRow(execution, projectId));
  if (error) throw error;
}

export async function upsertEvidence(
  db: SupabaseClient,
  evidence: NexusEvidence,
  projectId?: string,
): Promise<void> {
  const { error } = await db.from("nexus_evidence").upsert(mapEvidenceToRow(evidence, projectId));
  if (error) throw error;
}

export async function fetchExecutions(db: SupabaseClient, projectId: string): Promise<NexusExecution[]> {
  const { data, error } = await db
    .from("nexus_executions")
    .select("*")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(mapRowToExecution);
}

export async function fetchEvidence(
  db: SupabaseClient,
  projectId: string,
  executionId?: string,
): Promise<NexusEvidence[]> {
  let query = db
    .from("nexus_evidence")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (executionId) query = query.eq("execution_id", executionId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRowToEvidence);
}

// Persistence Class Implementation

export class SupabaseNexusPersistence implements NexusPersistence {
  constructor(private readonly db: SupabaseClient) {}

  async saveCapability(capability: NexusCapability, projectId?: string): Promise<void> {
    return upsertCapability(this.db, capability, projectId);
  }

  async saveContext(entry: ContextEntry, projectId?: string): Promise<void> {
    return upsertContextEntry(this.db, entry, projectId);
  }

  async saveExecution(execution: NexusExecution, projectId?: string): Promise<void> {
    return upsertExecution(this.db, execution, projectId);
  }

  async saveEvidence(evidence: NexusEvidence, projectId?: string): Promise<void> {
    return upsertEvidence(this.db, evidence, projectId);
  }

  async listExecutions(projectId: string): Promise<NexusExecution[]> {
    return fetchExecutions(this.db, projectId);
  }

  async listEvidence(projectId: string, executionId?: string): Promise<NexusEvidence[]> {
    return fetchEvidence(this.db, projectId, executionId);
  }
}
