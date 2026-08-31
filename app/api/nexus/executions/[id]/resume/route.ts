import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest } from "../../../../../../src/auth/nexus-request";
import { composeNexusIntent, nexusAdapters } from "../../../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../../../src/nexus/persistence/supabase";
import type { NexusEvent, NexusEvidence, NexusExecution, NexusIntent } from "../../../../../../src/nexus/types";

const MAX_ID_LENGTH = 128;

interface StoredPlan {
  approvalRequired?: boolean;
  steps?: Array<{ requiresApproval?: boolean }>;
}

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function loadRequest(db: NonNullable<ReturnType<typeof dbClient>>, projectId: string, id: string) {
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || id.length > MAX_ID_LENGTH) {
    return NextResponse.json({ error: "execution or request id is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as {
    projectId?: string;
    approved?: boolean;
  };

  const projectId = body.projectId ?? process.env.RESONANCE_PROJECT_ID ?? null;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
  }

  const db = dbClient();
  const persistence = createNexusPersistenceFromEnv();
  if (!db || !projectId) {
    return NextResponse.json({ error: "Durable approval state is required to resume an execution." }, { status: 503 });
  }

  let existing: Awaited<ReturnType<typeof loadRequest>>;
  try {
    existing = await loadRequest(db, projectId, id);
  } catch (error) {
    console.error("resume: failed to load execution request", error);
    return NextResponse.json({ error: "Failed to load execution request." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "No execution request found for id" }, { status: 404 });
  }

  if (body.approved !== true) {
    if (body.approved === false && existing.status === "waiting") {
      const { data: cancelled } = await db
        .from("nexus_execution_requests")
        .update({
          status: "cancelled",
          response: { ...(typeof existing.response === "object" && existing.response ? existing.response : {}), status: "cancelled" },
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("idempotency_key", existing.idempotency_key)
        .eq("status", "waiting")
        .select("id")
        .maybeSingle();
      if (cancelled) return NextResponse.json({ status: "cancelled", id }, { status: 200 });
    }
    return NextResponse.json({ error: "Explicit approval=true is required to resume this execution." }, { status: 409 });
  }

  const isStuck = existing.status === "accepted" && existing.updated_at && (new Date().getTime() - new Date(existing.updated_at).getTime() > 5 * 60 * 1000);

  if (existing.status !== "waiting" && !isStuck) {
    return NextResponse.json({ error: `Execution request is not awaiting approval (status: ${existing.status}).` }, { status: 409 });
  }

  // Claim the waiting request before composing or executing. A second concurrent
  // resume sees no row because the conditional update requires status=waiting (or stuck accepted).
  const expectedStatus = existing.status;
  const claimQuery = db
    .from("nexus_execution_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("idempotency_key", existing.idempotency_key)
    .eq("status", expectedStatus);

  const claimReq = isStuck
    ? claimQuery.lt("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    : claimQuery;

  const { data: claimed } = await claimReq.select("id").maybeSingle();
  if (!claimed) {
    return NextResponse.json({ error: "Execution approval was already claimed or is no longer pending." }, { status: 409 });
  }

  let intent: NexusIntent | null = null;
  let originalPlan: StoredPlan | null = null;
  if (existing.response && typeof existing.response === "object") {
    const response = existing.response as { intent?: NexusIntent; plan?: StoredPlan };
    if (response.intent) intent = response.intent;
    if (response.plan) originalPlan = response.plan;
  }

  if (!intent) {
    await db.from("nexus_execution_requests").update({ status: "failed", updated_at: new Date().toISOString() }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);
    return NextResponse.json({ error: "No resumable approval_required intent found for id" }, { status: 404 });
  }

  try {
    const plan = composeNexusIntent(intent);

    // The human approved the plan that was originally shown to them (recorded in
    // `originalPlan` at compose time). Recomposing here must not silently escalate
    // beyond that: if the fresh composition now requires approval on a step that
    // wasn't already flagged as requiring it originally (e.g. a policy or
    // capability change since the request was created), that's a *new* approval
    // requirement this specific `approved: true` call never covered. Reject rather
    // than clearing it (CHR-48).
    const originalStepApproval = new Map((originalPlan?.steps ?? []).map((step, index) => [index, Boolean(step.requiresApproval)]));
    const escalated = plan.steps.some((step, index) => step.requiresApproval && !(originalStepApproval.get(index) ?? false));
    if (!originalPlan || escalated) {
      await db.from("nexus_execution_requests").update({ status: "waiting", response: { intent, plan, status: "approval_required" }, updated_at: new Date().toISOString() }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);
      return NextResponse.json({ error: "Plan requirements changed since approval was requested; re-approval is required.", intent, plan }, { status: 409 });
    }

    plan.approvalRequired = false;
    for (const step of plan.steps) step.requiresApproval = false;

    const sink = {
      recordEvidence: async (item: NexusEvidence) => {
        // Always scope to the authenticated, request-validated projectId — never the
        // deserialized intent.projectId, which is stored data and must not be trusted
        // as an authorization boundary (CHR-49).
        if (persistence) await persistence.saveEvidence(item, projectId);
      },
      recordExecution: async (execution: NexusExecution) => {
        if (persistence) await persistence.saveExecution(execution, projectId);
      },
      recordEvent: async (event: NexusEvent) => {
        if (!db) return;
        const { error } = await db.from("events").upsert({
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
        }, { onConflict: "project_id,source,external_id" });
        if (error) throw error;
      },
    };

    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);

    await db.from("nexus_execution_requests").update({
      execution_id: result.execution.id,
      status: result.execution.status,
      response: { intent, plan, ...result, resumed: true },
      updated_at: new Date().toISOString(),
    }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);

    return NextResponse.json(
      { intent, plan, ...result, resumed: true },
      { status: result.execution.status === "completed" ? 200 : 422 },
    );
  } catch (error) {
    await db.from("nexus_execution_requests").update({ status: "failed", updated_at: new Date().toISOString() }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 422 },
    );
  }
}
