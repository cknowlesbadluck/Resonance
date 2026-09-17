import type { SupabaseClient } from "@supabase/supabase-js";
import type { NexusEvent, NexusEvidence, NexusExecution, NexusExecutionPlan } from "./types";
import type { NexusPersistence } from "./persistence/supabase";

export interface StoredPlan {
  approvalRequired?: boolean;
  steps?: Array<{ requiresApproval?: boolean }>;
}

export interface ExecutionRequestRow {
  response: unknown;
  status: string;
  idempotency_key: string;
  execution_id: string | null;
  updated_at: string;
}

export async function loadExecutionRequest(
  db: SupabaseClient,
  projectId: string,
  id: string,
): Promise<ExecutionRequestRow | null> {
  const byKey = await db
    .from("nexus_execution_requests")
    .select("response,status,idempotency_key,execution_id,updated_at")
    .eq("project_id", projectId)
    .eq("idempotency_key", id)
    .maybeSingle();
  if (byKey.error) throw byKey.error;
  if (byKey.data) return byKey.data;

  const byExecution = await db
    .from("nexus_execution_requests")
    .select("response,status,idempotency_key,execution_id,updated_at")
    .eq("project_id", projectId)
    .eq("execution_id", id)
    .maybeSingle();
  if (byExecution.error) throw byExecution.error;

  return byExecution.data ?? null;
}

export async function cancelExecutionRequest(
  db: SupabaseClient,
  projectId: string,
  idempotencyKey: string,
  currentResponse: unknown,
): Promise<boolean> {
  const responseData =
    typeof currentResponse === "object" && currentResponse ? currentResponse : {};
  const { data: cancelled } = await db
    .from("nexus_execution_requests")
    .update({
      status: "cancelled",
      response: { ...responseData, status: "cancelled" },
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "waiting")
    .select("id")
    .maybeSingle();

  return Boolean(cancelled);
}

export async function claimExecutionRequest(
  db: SupabaseClient,
  projectId: string,
  idempotencyKey: string,
  expectedStatus: string,
  isStuck: boolean,
): Promise<boolean> {
  const claimQuery = db
    .from("nexus_execution_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("idempotency_key", idempotencyKey)
    .eq("status", expectedStatus);

  const claimReq = isStuck
    ? claimQuery.lt(
        "updated_at",
        new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      )
    : claimQuery;

  const { data: claimed } = await claimReq.select("id").maybeSingle();
  return Boolean(claimed);
}

export async function updateExecutionRequestStatus(
  db: SupabaseClient,
  projectId: string,
  idempotencyKey: string,
  update: {
    status: string;
    response?: unknown;
    execution_id?: string;
  },
): Promise<void> {
  await db
    .from("nexus_execution_requests")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("idempotency_key", idempotencyKey);
}

export function checkPlanEscalation(
  originalPlan: StoredPlan | null,
  newPlan: NexusExecutionPlan,
): boolean {
  if (!originalPlan) return true;

  const originalStepApproval = new Map(
    (originalPlan.steps ?? []).map((step, index) => [
      index,
      Boolean(step.requiresApproval),
    ]),
  );

  return newPlan.steps.some(
    (step: { requiresApproval?: boolean }, index: number) =>
      step.requiresApproval && !(originalStepApproval.get(index) ?? false),
  );
}

export function createExecutionSink(
  db: SupabaseClient | null,
  persistence: NexusPersistence | null,
  projectId: string,
) {
  return {
    recordEvidence: async (item: NexusEvidence) => {
      if (persistence) await persistence.saveEvidence(item, projectId);
    },
    recordExecution: async (execution: NexusExecution) => {
      if (persistence) await persistence.saveExecution(execution, projectId);
    },
    recordEvent: async (event: NexusEvent) => {
      if (!db) return;
      const { error } = await db.from("events").upsert(
        {
          id: event.id,
          project_id: projectId,
          source: event.source,
          type: event.type,
          status: event.status,
          correlation_id: event.correlationId,
          actor_id: event.actorId ?? null,
          resource_type: "execution",
          resource_id: event.resourceId ?? null,
          external_id: event.externalId ?? event.id,
          payload: event.payload ?? {},
          created_at: event.createdAt,
          updated_at: event.createdAt,
        },
        { onConflict: "project_id,source,external_id" },
      );
      if (error) throw error;
    },
  };
}
