import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NexusEvidence, NexusExecution, NexusCapability, ContextEntry } from "../types";

export interface NexusPersistence {
  saveCapability(capability: NexusCapability, projectId?: string): Promise<void>;
  listCapabilities(projectId: string): Promise<NexusCapability[]>;
  saveContext(entry: ContextEntry, projectId?: string): Promise<void>;
  saveExecution(execution: NexusExecution, projectId?: string, idempotencyKey?: string): Promise<void>;
  findExecutionByIdempotencyKey(projectId: string, idempotencyKey: string): Promise<NexusExecution | null>;
  listExecutions(projectId: string): Promise<NexusExecution[]>;
  saveEvidence(evidence: NexusEvidence, projectId?: string): Promise<void>;
  listEvidence(projectId: string, executionId?: string): Promise<NexusEvidence[]>;
  recordAudit(input: { projectId: string; actorUserId?: string; action: string; resourceType?: string; resourceId?: string; payload?: unknown }): Promise<void>;
}

export function createNexusPersistenceFromEnv(): NexusPersistence | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return new SupabaseNexusPersistence(createClient(url, key, { auth: { persistSession: false } }));
}

export class SupabaseNexusPersistence implements NexusPersistence {
  constructor(private readonly db: SupabaseClient) {}

  async saveCapability(capability: NexusCapability, projectId?: string) {
    const { error } = await this.db.from("nexus_capabilities").upsert({ id: capability.id, project_id: projectId ?? null, capability_key: capability.key, name: capability.name, description: capability.description ?? null, provider_id: capability.providerId ?? null, identity_id: capability.identityId ?? null, adapter_id: capability.adapterId ?? null, resource_type: capability.resourceType ?? null, required_permissions: capability.requiredPermissions, risk: capability.risk, input_schema: capability.inputSchema ?? null, output_schema: capability.outputSchema ?? null, tags: capability.tags ?? [], compatibility: capability.compatibility ?? [], availability: capability.availability ?? "available", provenance: capability.provenance ?? null, version: capability.version ?? null, cost: capability.cost ?? null, latency_ms: capability.latencyMs ?? null });
    if (error) throw error;
  }

  async listCapabilities(projectId: string) {
    const { data, error } = await this.db.from("nexus_capabilities").select("*").eq("project_id", projectId).order("capability_key");
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, key: row.capability_key, name: row.name, description: row.description ?? undefined, providerId: row.provider_id ?? undefined, identityId: row.identity_id ?? undefined, adapterId: row.adapter_id ?? undefined, resourceType: row.resource_type ?? undefined, requiredPermissions: row.required_permissions ?? [], risk: row.risk, inputSchema: row.input_schema ?? undefined, outputSchema: row.output_schema ?? undefined, tags: row.tags ?? [], compatibility: row.compatibility ?? [], availability: row.availability, provenance: row.provenance ?? undefined, version: row.version ?? undefined, cost: row.cost ?? undefined, latencyMs: row.latency_ms ?? undefined }));
  }

  async saveContext(entry: ContextEntry, projectId?: string) {
    const { error } = await this.db.from("nexus_context_entries").upsert({ id: entry.id, project_id: projectId ?? null, scope: entry.scope, key: entry.key, value: entry.value, visibility: entry.visibility, created_by: entry.createdBy, provenance: entry.provenance ?? null, persistent: entry.persistent, created_at: entry.createdAt });
    if (error) throw error;
  }

  async saveExecution(execution: NexusExecution, projectId?: string, idempotencyKey?: string) {
    const { error } = await this.db.from("nexus_executions").upsert({ id: execution.id, project_id: projectId ?? null, plan_id: execution.planId, status: execution.status, output: execution.output ?? null, error: execution.error ?? null, started_at: execution.startedAt ?? null, completed_at: execution.completedAt ?? null, idempotency_key: idempotencyKey ?? null });
    if (error) throw error;
  }

  async findExecutionByIdempotencyKey(projectId: string, idempotencyKey: string) {
    const { data, error } = await this.db.from("nexus_executions").select("*").eq("project_id", projectId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id, planId: data.plan_id, status: data.status, output: data.output ?? undefined, error: data.error ?? undefined, startedAt: data.started_at ?? undefined, completedAt: data.completed_at ?? undefined } as NexusExecution;
  }

  async listExecutions(projectId: string) {
    const { data, error } = await this.db.from("nexus_executions").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, planId: row.plan_id, status: row.status, output: row.output ?? undefined, error: row.error ?? undefined, startedAt: row.started_at ?? undefined, completedAt: row.completed_at ?? undefined } as NexusExecution));
  }

  async saveEvidence(evidence: NexusEvidence, projectId?: string) {
    const { error } = await this.db.from("nexus_evidence").upsert({ id: evidence.id, project_id: projectId ?? null, execution_id: evidence.executionId, evidence_type: evidence.type, summary: evidence.summary, payload: evidence.payload, created_at: evidence.createdAt });
    if (error) throw error;
  }

  async listEvidence(projectId: string, executionId?: string) {
    let query = this.db.from("nexus_evidence").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(200);
    if (executionId) query = query.eq("execution_id", executionId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, executionId: row.execution_id, type: row.evidence_type, summary: row.summary, payload: row.payload, createdAt: row.created_at } as NexusEvidence));
  }

  async recordAudit(input: { projectId: string; actorUserId?: string; action: string; resourceType?: string; resourceId?: string; payload?: unknown }) {
    const { error } = await this.db.from("audit_events").insert({ project_id: input.projectId, actor_user_id: input.actorUserId ?? null, actor_type: "user", action: input.action, resource_type: input.resourceType ?? null, resource_id: input.resourceId ?? null, payload: input.payload ?? {} });
    if (error) throw error;
  }
}
