export type NexusActorType = "human" | "model" | "agent" | "skill" | "tool" | "plugin" | "application" | "service" | "resource" | "connector";
export type CapabilityRisk = "low" | "medium" | "high" | "critical";
export type ExecutionMode = "direct" | "chamber";

export interface NexusProvider { id: string; key: string; name: string; category: string; version?: string; metadata?: Record<string, unknown>; }
export interface NexusIdentity { id: string; type: NexusActorType; name: string; providerId?: string; externalId?: string; metadata?: Record<string, unknown>; }
export interface NexusResource { id: string; type: string; name: string; providerId?: string; externalId?: string; uri?: string; metadata?: Record<string, unknown>; }
export interface NexusCapability {
  id: string; key: string; name: string; description?: string; providerId?: string; identityId?: string; resourceType?: string;
  requiredPermissions: string[]; risk: CapabilityRisk; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown>;
  tags?: string[]; compatibility?: string[]; availability?: "available" | "degraded" | "unavailable"; provenance?: string; version?: string;
}
export interface CapabilityRequirement { key: string; requiredPermissions?: string[]; resourceType?: string; preferredProviderIds?: string[]; maxRisk?: CapabilityRisk; tags?: string[]; }
export interface NexusIntent { id: string; objective: string; projectId: string; requirements: CapabilityRequirement[]; contextRefs?: string[]; requestedBy: string; metadata?: Record<string, unknown>; }
export interface ExecutionStep { id: string; capabilityId: string; adapterId: string; input: unknown; requiresApproval: boolean; }
export interface NexusExecutionPlan { id: string; intentId: string; mode: ExecutionMode; steps: ExecutionStep[]; contextRefs: string[]; approvalRequired: boolean; rationale: string[]; }
export interface NexusExecution { id: string; planId: string; status: "planned" | "running" | "waiting" | "completed" | "failed" | "cancelled"; startedAt?: string; completedAt?: string; output?: unknown; error?: string; }
export interface NexusEvidence { id: string; executionId: string; type: "event" | "artifact" | "decision" | "audit" | "knowledge"; summary: string; payload: unknown; createdAt: string; }
export interface NexusEvent { id: string; source: string; type: string; correlationId: string; actorId?: string; projectId?: string; resourceId?: string; payload: unknown; createdAt: string; externalId?: string; }
export interface ContextEntry { id: string; scope: string; key: string; value: unknown; visibility: "private" | "participants" | "project"; createdBy: string; provenance?: string; persistent: boolean; createdAt: string; }
