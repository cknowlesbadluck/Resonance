import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest, isUuid } from "../../../../src/auth/nexus-request";
import { composeDemoIntent, nexusAdapters } from "../../../../src/nexus/runtime";
import { NexusExecutor } from "../../../../src/nexus/executor";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";
import { hashExecutionRequest } from "../../../../src/nexus/idempotency";
import type { CapabilityRequirement, NexusEvent, NexusEvidence, NexusIntent } from "../../../../src/nexus/types";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OBJECTIVE_LENGTH = 4_000;
const MAX_REQUIREMENTS = 32;
const MAX_CONTEXT_REFS = 64;
const MAX_CONTEXT_REF_LENGTH = 500;
const MAX_METADATA_KEYS = 32;
const MAX_IDEMPOTENCY_LENGTH = 128;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/** Demo fallback only when durable store is absent. */
const memoryExecutions: unknown[] = [];
const memoryEvidence: unknown[] = [];
const persistence = createNexusPersistenceFromEnv();

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const db = dbClient();
const durable = Boolean(db && persistence);

const sink = {
  recordEvidence: async (item: NexusEvidence, projectId?: string) => {
    memoryEvidence.unshift(item);
    if (persistence) await persistence.saveEvidence(item, projectId ?? process.env.RESONANCE_PROJECT_ID);
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

function isRequirement(value: unknown): value is CapabilityRequirement {
  if (!value || typeof value !== "object") return false;
  const key = (value as CapabilityRequirement).key;
  return typeof key === "string" && key.trim().length > 0 && key.length <= 256;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID ?? null;

  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
  }

  if (persistence && projectId) {
    try {
      const [executions, evidence] = await Promise.all([
        persistence.listExecutions(projectId),
        persistence.listEvidence(projectId),
      ]);
      return NextResponse.json({ executions, evidence, source: "durable" });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ executions: memoryExecutions, evidence: memoryEvidence, source: "memory" });
}

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_LENGTH) {
    return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
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

  let actorId = body.requestedBy;
  if (authRequired()) {
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
  if (!body.requirements.every(isRequirement)) {
    return NextResponse.json({ error: "each requirement must include a non-empty key string." }, { status: 400 });
  }
  if (
    body.contextRefs !== undefined
    && (!Array.isArray(body.contextRefs)
      || body.contextRefs.length > MAX_CONTEXT_REFS
      || body.contextRefs.some((item) => typeof item !== "string" || item.length > MAX_CONTEXT_REF_LENGTH))
  ) {
    return NextResponse.json({ error: "contextRefs must contain at most 64 strings of at most 500 characters." }, { status: 400 });
  }
  if (
    body.metadata !== undefined
    && (!body.metadata || typeof body.metadata !== "object" || Array.isArray(body.metadata) || Object.keys(body.metadata).length > MAX_METADATA_KEYS)
  ) {
    return NextResponse.json({ error: "metadata must be an object with at most 32 keys." }, { status: 400 });
  }
  if (!actorId) {
    return NextResponse.json({ error: "requestedBy is required when auth is not configured" }, { status: 400 });
  }
  if ((authRequired() || durable) && !isUuid(projectId)) {
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
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentCount, error: rateError } = await db
      .from("nexus_execution_requests")
      .select("id", { count: "exact", head: true })
      .eq("project_id", intent.projectId)
      .gte("created_at", windowStart);
    if (rateError) return NextResponse.json({ error: rateError.message }, { status: 500 });
    if ((recentCount ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Execution rate limit exceeded. Retry after the current window." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

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

    const result = await new NexusExecutor(nexusAdapters, {
      recordEvidence: async (item: NexusEvidence) => sink.recordEvidence(item, intent.projectId),
      recordEvent: sink.recordEvent,
    }).execute(plan);

    memoryExecutions.unshift(result.execution);
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
    if (db) {
      await db.from("nexus_execution_requests").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("project_id", intent.projectId).eq("idempotency_key", idempotencyKey);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
