import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateNexusRequest, isUuid } from "../../../../src/auth/nexus-request";
import { composeDemoIntent, nexusAdapters } from "../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";
import { hashExecutionRequest } from "../../../../src/nexus/idempotency";
import type { NexusEvent, NexusEvidence, NexusIntent } from "../../../../src/nexus/types";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OBJECTIVE_LENGTH = 4_000;
const MAX_REQUIREMENTS = 32;
const MAX_CONTEXT_REFS = 64;
const MAX_IDEMPOTENCY_LENGTH = 128;

const executions: unknown[] = [];
const evidence: unknown[] = [];
const persistence = createNexusPersistenceFromEnv();

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const db = dbClient();
const sink = {
  recordEvidence: async (item: NexusEvidence) => {
    evidence.unshift(item);
    if (persistence) await persistence.saveEvidence(item, process.env.RESONANCE_PROJECT_ID);
  },
  recordEvent: async (event: NexusEvent) => {
    if (!db || !event.projectId) return;
    const { error } = await db.from("events").upsert({
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
    if (error) throw error;
  },
};

async function readJson(request: Request): Promise<Partial<NexusIntent>> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new Error("Request body exceeds the 64 KiB limit.");
  }
  return JSON.parse(text) as Partial<NexusIntent>;
}

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId")
    ?? process.env.RESONANCE_PROJECT_ID
    ?? null;
  const authRequired = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (authRequired) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
  }
  return NextResponse.json({ executions, evidence });
}

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_LENGTH) {
    return NextResponse.json(
      { error: "Idempotency-Key header is required" },
      { status: 400 },
    );
  }

  let body: Partial<NexusIntent>;
  try {
    body = await readJson(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid JSON body." },
      { status: 400 },
    );
  }

  const projectId = body.projectId
    ?? process.env.RESONANCE_PROJECT_ID
    ?? "00000000-0000-4000-8000-000000000001";

  const authRequired = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
  let actorId = body.requestedBy;
  if (authRequired) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
    actorId = auth.userId;
  }

  if (typeof body.objective !== "string" || !body.objective.trim() || body.objective.length > MAX_OBJECTIVE_LENGTH) {
    return NextResponse.json({ error: "objective is required and must be at most 4000 characters." }, { status: 400 });
  }
  if (!Array.isArray(body.requirements) || body.requirements.length === 0 || body.requirements.length > MAX_REQUIREMENTS) {
    return NextResponse.json({ error: "requirements must contain between 1 and 32 items." }, { status: 400 });
  }
  if (body.contextRefs !== undefined && (!Array.isArray(body.contextRefs) || body.contextRefs.length > MAX_CONTEXT_REFS)) {
    return NextResponse.json({ error: "contextRefs must contain at most 64 items." }, { status: 400 });
  }
  if (!actorId) {
    return NextResponse.json({ error: "requestedBy is required when auth is not configured" }, { status: 400 });
  }
  if (authRequired && !isUuid(projectId)) {
    return NextResponse.json({ error: "projectId must be a UUID." }, { status: 400 });
  }

  const intent: NexusIntent = {
    id: body.id ?? crypto.randomUUID(),
    projectId,
    objective: body.objective.trim(),
    requestedBy: actorId,
    requirements: body.requirements,
    contextRefs: body.contextRefs ?? [],
    metadata: body.metadata ?? {},
  };
  const hash = hashExecutionRequest(intent);

  if (db) {
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
      return NextResponse.json(
        existing.response ?? { status: existing.status, executionId: existing.execution_id },
        { status: existing.response ? 200 : 202, headers: { "X-Idempotent-Replay": "true" } },
      );
    }
  }

  try {
    const plan = composeDemoIntent(intent);
    if (plan.approvalRequired) {
      const response = { intent, plan, status: "approval_required" };
      if (db) {
        await db.from("nexus_execution_requests").update({
          status: "waiting",
          response,
          updated_at: new Date().toISOString(),
        }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
      }
      return NextResponse.json(response, { status: 202 });
    }

    const result = await new NexusExecutor(nexusAdapters, sink).execute(plan);
    executions.unshift(result.execution);
    if (persistence) await persistence.saveExecution(result.execution, intent.projectId);
    const response = { intent, plan, ...result };

    if (db) {
      await db.from("nexus_execution_requests").update({
        execution_id: result.execution.id,
        status: result.execution.status,
        response,
        updated_at: new Date().toISOString(),
      }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
    }

    return NextResponse.json(response, { status: result.execution.status === "completed" ? 201 : 422 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
