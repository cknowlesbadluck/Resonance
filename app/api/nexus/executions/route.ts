import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { composeDemoIntent, nexusAdapters } from "../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";
import { hashExecutionRequest } from "../../../../src/nexus/idempotency";
import type { NexusEvidence, NexusIntent } from "../../../../src/nexus/types";

const executions: unknown[] = [];
const evidence: unknown[] = [];
const persistence = createNexusPersistenceFromEnv();
const sink = {
  recordEvidence: async (item: NexusEvidence) => {
    evidence.unshift(item);
    if (persistence) await persistence.saveEvidence(item, process.env.RESONANCE_PROJECT_ID);
  },
};

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function emitLifecycleEvent(db: ReturnType<typeof dbClient>, event: {
  projectId: string;
  source: string;
  type: string;
  status: string;
  correlationId: string;
  resourceType: string;
  resourceId: string;
  externalId: string;
  payload?: Record<string, unknown>;
}) {
  if (!db) return;
  const { error } = await db.from("events").upsert({
    project_id: event.projectId,
    source: event.source,
    type: event.type,
    status: event.status,
    correlation_id: event.correlationId,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    external_id: event.externalId,
    payload: event.payload ?? {},
    updated_at: new Date().toISOString(),
  }, { onConflict: "project_id,source,external_id" });
  if (error) throw error;
}

export async function GET() { return NextResponse.json({ executions, evidence }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Partial<NexusIntent> | null;
  if (!body?.objective || !body.requestedBy || !Array.isArray(body.requirements)) {
    return NextResponse.json({ error: "objective, requestedBy and requirements are required" }, { status: 400 });
  }

  const intent: NexusIntent = {
    id: body.id ?? crypto.randomUUID(),
    projectId: body.projectId ?? process.env.RESONANCE_PROJECT_ID ?? "00000000-0000-4000-8000-000000000001",
    objective: body.objective,
    requestedBy: body.requestedBy,
    requirements: body.requirements,
    contextRefs: body.contextRefs ?? [],
    metadata: body.metadata ?? {},
  };
  const idempotencyKey = request.headers.get("Idempotency-Key");
  const hash = hashExecutionRequest(intent);
  const db = dbClient();

  if (idempotencyKey && db) {
    const claim = await db.from("nexus_execution_requests").insert({
      project_id: intent.projectId,
      idempotency_key: idempotencyKey,
      request_hash: hash,
      status: "accepted",
    });
    if (claim.error) {
      const { data: existing, error: lookupError } = await db
        .from("nexus_execution_requests")
        .select("request_hash,response,status,execution_id")
        .eq("project_id", intent.projectId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
      if (!existing) return NextResponse.json({ error: claim.error.message }, { status: 500 });
      if (existing.request_hash !== hash) {
        return NextResponse.json({ error: "Idempotency-Key was already used for a different execution request." }, { status: 409 });
      }
      return NextResponse.json(existing.response ?? { status: existing.status, executionId: existing.execution_id }, { status: existing.response ? 200 : 202, headers: { "X-Idempotent-Replay": "true" } });
    }
  }

  const lifecycle = (type: string, status: string, resourceId: string, payload?: Record<string, unknown>) =>
    emitLifecycleEvent(db, {
      projectId: intent.projectId,
      source: "nexus",
      type,
      status,
      correlationId: intent.id,
      resourceType: "execution",
      resourceId,
      externalId: `${intent.id}:${type}`,
      payload,
    });

  await lifecycle("execution.accepted", "accepted", intent.id, { idempotencyKeyPresent: Boolean(idempotencyKey) });

  try {
    const plan = composeDemoIntent(intent);
    await lifecycle("execution.planned", plan.approvalRequired ? "waiting" : "planned", intent.id, { planId: plan.id, stepCount: plan.steps.length });

    if (plan.approvalRequired) {
      const response = { intent, plan, status: "approval_required" };
      if (idempotencyKey && db) await db.from("nexus_execution_requests").update({ status: "waiting", response, updated_at: new Date().toISOString() }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
      await lifecycle("execution.waiting", "waiting", intent.id, { reason: "approval_required" });
      return NextResponse.json(response, { status: 202 });
    }

    await lifecycle("execution.started", "running", intent.id, { planId: plan.id });
    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);
    executions.unshift(result.execution);
    if (persistence) await persistence.saveExecution(result.execution, intent.projectId);
    const response = { intent, plan, ...result };

    if (idempotencyKey && db) {
      await db.from("nexus_execution_requests").update({ execution_id: result.execution.id, status: result.execution.status, response, updated_at: new Date().toISOString() }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
    }

    await lifecycle(
      result.execution.status === "completed" ? "execution.completed" : "execution.failed",
      result.execution.status,
      result.execution.id,
      { planId: plan.id, error: result.execution.error ?? null, evidenceCount: result.evidence.length },
    );

    return NextResponse.json(response, { status: result.execution.status === "completed" ? 201 : 422 });
  } catch (error) {
    await lifecycle("execution.failed", "failed", intent.id, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
