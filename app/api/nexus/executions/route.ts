import { NextResponse } from "next/server";
import { authenticateNexusRequest, isUuid } from "../../../../src/auth/nexus-request";
import { composeDemoIntent, nexusAdapters } from "../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";
import type { NexusIntent } from "../../../../src/nexus/types";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OBJECTIVE_LENGTH = 4_000;
const MAX_REQUIREMENTS = 32;
const MAX_CONTEXT_REFS = 64;
const MAX_IDEMPOTENCY_LENGTH = 128;

async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  return JSON.parse(text) as Partial<NexusIntent>;
}

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const auth = await authenticateNexusRequest(request, projectId);
  if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  const persistence = createNexusPersistenceFromEnv();
  if (!persistence) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  try {
    const [executions, evidence] = await Promise.all([persistence.listExecutions(auth.projectId), persistence.listEvidence(auth.projectId)]);
    return NextResponse.json({ executions, evidence });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Partial<NexusIntent>;
  try { body = await readJson(request); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON body." }, { status: 400 }); }

  const auth = await authenticateNexusRequest(request, body.projectId);
  if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_LENGTH) return NextResponse.json({ error: "A valid Idempotency-Key header is required." }, { status: 400 });
  if (typeof body.objective !== "string" || body.objective.trim().length === 0 || body.objective.length > MAX_OBJECTIVE_LENGTH) return NextResponse.json({ error: "objective is required and must be at most 4000 characters." }, { status: 400 });
  if (!Array.isArray(body.requirements) || body.requirements.length === 0 || body.requirements.length > MAX_REQUIREMENTS) return NextResponse.json({ error: "requirements must contain between 1 and 32 items." }, { status: 400 });
  if (body.contextRefs !== undefined && (!Array.isArray(body.contextRefs) || body.contextRefs.length > MAX_CONTEXT_REFS)) return NextResponse.json({ error: "contextRefs must contain at most 64 items." }, { status: 400 });
  if (!isUuid(auth.projectId)) return NextResponse.json({ error: "projectId must be a UUID." }, { status: 400 });

  const persistence = createNexusPersistenceFromEnv();
  if (!persistence) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });

  try {
    const existing = await persistence.findExecutionByIdempotencyKey(auth.projectId, idempotencyKey);
    if (existing) {
      const evidence = await persistence.listEvidence(auth.projectId, existing.id);
      return NextResponse.json({ execution: existing, evidence, idempotentReplay: true }, { status: 200 });
    }

    const intent: NexusIntent = { id: body.id ?? crypto.randomUUID(), projectId: auth.projectId, objective: body.objective.trim(), requestedBy: auth.userId, requirements: body.requirements, contextRefs: body.contextRefs ?? [] };
    await persistence.recordAudit({ projectId: auth.projectId, actorUserId: auth.userId, action: "nexus.execution.requested", resourceType: "nexus_intent", resourceId: intent.id, payload: { idempotencyKey } });

    const plan = composeDemoIntent(intent);
    if (plan.approvalRequired) {
      await persistence.recordAudit({ projectId: auth.projectId, actorUserId: auth.userId, action: "nexus.execution.approval_required", resourceType: "nexus_intent", resourceId: intent.id });
      return NextResponse.json({ intent, plan, status: "approval_required" }, { status: 202 });
    }

    const executionSink = {
      recordEvidence: async (item: Parameters<typeof persistence.saveEvidence>[0]) => persistence.saveEvidence(item, auth.projectId),
      recordExecution: async (execution: Parameters<typeof persistence.saveExecution>[0]) => persistence.saveExecution(execution, auth.projectId, idempotencyKey),
    };
    const result = await new NexusExecutor(nexusAdapters, executionSink).execute(plan);
    await persistence.recordAudit({ projectId: auth.projectId, actorUserId: auth.userId, action: `nexus.execution.${result.execution.status}`, resourceType: "nexus_execution", resourceId: result.execution.id, payload: { planId: plan.id, idempotencyKey } });
    return NextResponse.json({ intent, plan, ...result }, { status: result.execution.status === "completed" ? 201 : 422 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
