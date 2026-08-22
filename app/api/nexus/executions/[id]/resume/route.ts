import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest } from "../../../../../../src/auth/nexus-request";
import { composeNexusIntent, nexusAdapters } from "../../../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../../../src/nexus/persistence/supabase";
import type { NexusEvent, NexusEvidence, NexusExecution, NexusIntent } from "../../../../../../src/nexus/types";

const MAX_ID_LENGTH = 128;

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function loadRequest(db: NonNullable<ReturnType<typeof dbClient>>, projectId: string, id: string) {
  const byKey = await db
    .from("nexus_execution_requests")
    .select("response,status,idempotency_key,execution_id")
    .eq("project_id", projectId)
    .eq("idempotency_key", id)
    .maybeSingle();
  if (byKey.data) return byKey.data;
  const byExecution = await db
    .from("nexus_execution_requests")
    .select("response,status,idempotency_key,execution_id")
    .eq("project_id", projectId)
    .eq("execution_id", id)
    .maybeSingle();
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
  const existing = db && projectId ? await loadRequest(db, projectId, id) : null;

  if (body.approved === false) {
    if (db && projectId && existing) {
      await db.from("nexus_execution_requests").update({
        status: "cancelled",
        response: { ...(typeof existing.response === "object" && existing.response ? existing.response : {}), status: "cancelled" },
        updated_at: new Date().toISOString(),
      }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);
    }
    return NextResponse.json({ status: "cancelled", id }, { status: 200 });
  }

  let intent: NexusIntent | null = null;
  if (existing?.response && typeof existing.response === "object") {
    const response = existing.response as { intent?: NexusIntent };
    if (response.intent) intent = response.intent;
  }

  if (!intent) {
    return NextResponse.json(
      { error: "No resumable approval_required intent found for id" },
      { status: 404 },
    );
  }

  try {
    const plan = composeNexusIntent(intent);
    plan.approvalRequired = false;
    for (const step of plan.steps) step.requiresApproval = false;

    const sink = {
      recordEvidence: async (item: NexusEvidence) => {
        if (persistence) await persistence.saveEvidence(item, intent!.projectId);
      },
      recordExecution: async (execution: NexusExecution) => {
        if (persistence) await persistence.saveExecution(execution, intent!.projectId);
      },
      recordEvent: async (event: NexusEvent) => {
        if (!db || !event.projectId) return;
        await db.from("events").upsert({
          id: event.id,
          project_id: event.projectId,
          source: event.source,
          type: event.type,
          status: event.status,
          correlation_id: event.correlationId,
          actor_id: event.actorId ?? null,
          resource_type: "execution",
          resource_id: event.resourceId ?? null,
          external_id: `${event.correlationId}:${event.type}`,
          payload: event.payload ?? {},
          created_at: event.createdAt,
          updated_at: event.createdAt,
        }, { onConflict: "project_id,source,external_id" });
      },
    };

    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);

    if (db && projectId && existing) {
      await db.from("nexus_execution_requests").update({
        execution_id: result.execution.id,
        status: result.execution.status,
        response: { intent, plan, ...result, resumed: true },
        updated_at: new Date().toISOString(),
      }).eq("project_id", projectId).eq("idempotency_key", existing.idempotency_key);
    }

    return NextResponse.json(
      { intent, plan, ...result, resumed: true },
      { status: result.execution.status === "completed" ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 422 },
    );
  }
}
