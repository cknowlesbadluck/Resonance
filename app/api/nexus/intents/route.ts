import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../src/auth/nexus-request";
import { composeNexusIntent } from "../../../../src/nexus/runtime";
import type { CapabilityRequirement, NexusIntent } from "../../../../src/nexus/types";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OBJECTIVE_LENGTH = 4_000;
const MAX_REQUIREMENTS = 32;

function isRequirement(value: unknown): value is CapabilityRequirement {
  if (!value || typeof value !== "object") return false;
  const key = (value as CapabilityRequirement).key;
  return typeof key === "string" && key.trim().length > 0 && key.length <= 256;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request body exceeds the 64 KiB limit." }, { status: 400 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request body exceeds the 64 KiB limit." }, { status: 400 });
  const body = (() => {
    try { return JSON.parse(text) as Partial<NexusIntent>; }
    catch { return null; }
  })();
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const projectId = body.projectId ?? process.env.RESONANCE_PROJECT_ID ?? "demo";
  let actorId = body.requestedBy;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    actorId = auth.userId;
  }
  if (typeof body.objective !== "string" || !body.objective.trim() || body.objective.length > MAX_OBJECTIVE_LENGTH) {
    return NextResponse.json({ error: "objective is required and must be at most 4000 characters." }, { status: 400 });
  }
  if (!actorId) return NextResponse.json({ error: "requestedBy is required when auth is not configured" }, { status: 400 });
  if (!Array.isArray(body.requirements) || body.requirements.length === 0 || body.requirements.length > MAX_REQUIREMENTS || !body.requirements.every(isRequirement)) {
    return NextResponse.json({ error: "requirements must contain between 1 and 32 items with a key." }, { status: 400 });
  }

  try {
    const intent: NexusIntent = {
      id: body.id ?? crypto.randomUUID(),
      projectId,
      objective: body.objective.trim(),
      requestedBy: actorId,
      requirements: body.requirements,
      contextRefs: body.contextRefs ?? [],
      metadata: body.metadata ?? {},
    };
    return NextResponse.json({ intent, plan: composeNexusIntent(intent) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
