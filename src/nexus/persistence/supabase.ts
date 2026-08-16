import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NexusEvidence, NexusExecution, NexusCapability, ContextEntry } from "../types";

export interface NexusPersistence {
  saveCapability(capability: NexusCapability, projectId?: string): Promise<void>;
  saveContext(entry: ContextEntry, projectId?: string): Promise<void>;
  saveExecution(execution: NexusExecution, projectId?: string): Promise<void>;
  saveEvidence(evidence: NexusEvidence, projectId?: string): Promise<void>;
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
    const { error } = await this.db.from("nexus_capabilities").upsert({ id: capability.id, project_id: projectId ?? null, capability_key: capability.key, name: capability.name, description: capability.description ?? null, provider_id: capability.providerId ?? null, identity_id: capability.identityId ?? null, adapter_id: capability.adapterId ?? null, resource_type: capability.resourceType ?? null, required_permissions: capability.requiredPermissions, risk: capability.risk, input_schema: capability.inputSchema ?? null, output_schema: capability.outputSchema ?? null, tags: capability.tags ?? [], compatibility: capability.compatibility ?? [], availability: capability.availability ?? "available", provenance: capability.provenance ?? null, version: capability.version ?? null });
    if (error) throw error;
  }
  async saveContext(entry: ContextEntry, projectId?: string) {
    const { error } = await this.db.from("nexus_context_entries").upsert({ id: entry.id, project_id: projectId ?? null, scope: entry.scope, key: entry.key, value: entry.value, visibility: entry.visibility, created_by: entry.createdBy, provenance: entry.provenance ?? null, persistent: entry.persistent, created_at: entry.createdAt });
    if (error) throw error;
  }
  async saveExecution(execution: NexusExecution, projectId?: string) {
    const { error } = await this.db.from("nexus_executions").upsert({ id: execution.id, project_id: projectId ?? null, plan_id: execution.planId, status: execution.status, output: execution.output ?? null, error: execution.error ?? null, started_at: execution.startedAt ?? null, completed_at: execution.completedAt ?? null });
    if (error) throw error;
  }
  async saveEvidence(evidence: NexusEvidence, projectId?: string) {
    const { error } = await this.db.from("nexus_evidence").upsert({ id: evidence.id, project_id: projectId ?? null, execution_id: evidence.executionId, evidence_type: evidence.type, summary: evidence.summary, payload: evidence.payload, created_at: evidence.createdAt });
    if (error) throw error;
  }
}
