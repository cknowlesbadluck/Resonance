import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest } from "../../../../../../src/auth/nexus-request";
import { composeNexusIntent, nexusAdapters } from "../../../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../../../src/nexus/persistence/supabase";
import {
  cancelExecutionRequest,
  checkPlanEscalation,
  claimExecutionRequest,
  createExecutionSink,
  loadExecutionRequest,
  updateExecutionRequestStatus,
  type StoredPlan,
} from "../../../../../../src/nexus/resume";
import type { NexusIntent } from "../../../../../../src/nexus/types";

const MAX_ID_LENGTH = 128;

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || id.length > MAX_ID_LENGTH) {
    return NextResponse.json({ error: "execution or request id is required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
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

  let existing;
  try {
    existing = await loadExecutionRequest(db, projectId, id);
  } catch (error) {
    console.error("resume: failed to load execution request", error);
    return NextResponse.json({ error: "Failed to load execution request." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "No execution request found for id" }, { status: 404 });
  }

  if (body.approved !== true) {
    if (body.approved === false && existing.status === "waiting") {
      const cancelled = await cancelExecutionRequest(
        db,
        projectId,
        existing.idempotency_key,
        existing.response,
      );
      if (cancelled) return NextResponse.json({ status: "cancelled", id }, { status: 200 });
    }
    return NextResponse.json({ error: "Explicit approval=true is required to resume this execution." }, { status: 409 });
  }

  const isStuck = Boolean(
    existing.status === "accepted" &&
      existing.updated_at &&
      new Date().getTime() - new Date(existing.updated_at).getTime() > 5 * 60 * 1000,
  );

  if (existing.status !== "waiting" && !isStuck) {
    return NextResponse.json(
      { error: `Execution request is not awaiting approval (status: ${existing.status}).` },
      { status: 409 },
    );
  }

  const claimed = await claimExecutionRequest(
    db,
    projectId,
    existing.idempotency_key,
    existing.status,
    isStuck,
  );
  if (!claimed) {
    return NextResponse.json(
      { error: "Execution approval was already claimed or is no longer pending." },
      { status: 409 },
    );
  }

  let intent: NexusIntent | null = null;
  let originalPlan: StoredPlan | null = null;
  if (existing.response && typeof existing.response === "object") {
    const response = existing.response as { intent?: NexusIntent; plan?: StoredPlan };
    if (response.intent) intent = response.intent;
    if (response.plan) originalPlan = response.plan;
  }

  if (!intent) {
    await updateExecutionRequestStatus(db, projectId, existing.idempotency_key, {
      status: "failed",
    });
    return NextResponse.json(
      { error: "No resumable approval_required intent found for id" },
      { status: 404 },
    );
  }

  try {
    const plan = composeNexusIntent(intent);

    const escalated = checkPlanEscalation(originalPlan, plan);
    if (!originalPlan || escalated) {
      await updateExecutionRequestStatus(db, projectId, existing.idempotency_key, {
        status: "waiting",
        response: { intent, plan, status: "approval_required" },
      });
      return NextResponse.json(
        {
          error: "Plan requirements changed since approval was requested; re-approval is required.",
          intent,
          plan,
        },
        { status: 409 },
      );
    }

    plan.approvalRequired = false;
    for (const step of plan.steps) step.requiresApproval = false;

    const sink = createExecutionSink(db, persistence, projectId);
    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);

    await updateExecutionRequestStatus(db, projectId, existing.idempotency_key, {
      execution_id: result.execution.id,
      status: result.execution.status,
      response: { intent, plan, ...result, resumed: true },
    });

    return NextResponse.json(
      { intent, plan, ...result, resumed: true },
      { status: result.execution.status === "completed" ? 200 : 422 },
    );
  } catch (error) {
    await updateExecutionRequestStatus(db, projectId, existing.idempotency_key, {
      status: "failed",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 422 },
    );
  }
}
