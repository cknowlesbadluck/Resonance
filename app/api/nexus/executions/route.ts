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
        .select("request_hash,response,status")
        .eq("project_id", intent.projectId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
      if (!existing) return NextResponse.json({ error: claim.error.message }, { status: 500 });
      if (existing.request_hash !== hash) {
        return NextResponse.json({ error: "Idempotency-Key was already used for a different execution request." }, { status: 409 });
      }
      return NextResponse.json(existing.response ?? { status: existing.status }, { status: existing.response ? 200 : 202, headers: { "X-Idempotent-Replay": "true" } });
    }
  }

  try {
    const plan = composeDemoIntent(intent);
    if (plan.approvalRequired) {
      const response = { intent, plan, status: "approval_required" };
      if (idempotencyKey && db) await db.from("nexus_execution_requests").update({ status: "waiting", response, updated_at: new Date().toISOString() }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
      return NextResponse.json(response, { status: 202 });
    }

    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);
    executions.unshift(result.execution);
    if (persistence) await persistence.saveExecution(result.execution, intent.projectId);
    const response = { intent, plan, ...result };

    if (idempotencyKey && db) {
      await db.from("nexus_execution_requests").update({ execution_id: result.execution.id, status: result.execution.status, response, updated_at: new Date().toISOString() }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
    }

    return NextResponse.json(response, { status: result.execution.status === "completed" ? 201 : 422 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
