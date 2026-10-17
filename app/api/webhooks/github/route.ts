import { NextResponse } from "next/server";
import { createServiceRoleClient } from "../../../../src/db/service-client";
import { decideGitHubWebhook, isUniqueViolation } from "../../../../src/nexus/github-webhook";

function getDbClient() {
  return createServiceRoleClient();
}

export async function POST(request: Request) {
  const raw = await request.text();
  const db = getDbClient();
  const projectId = process.env.RESONANCE_PROJECT_ID ?? null;
  const decision = decideGitHubWebhook({
    raw,
    signature: request.headers.get("x-hub-signature-256"),
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    eventName: request.headers.get("x-github-event"),
    deliveryId: request.headers.get("x-github-delivery"),
    projectId,
    persistenceConfigured: Boolean(db && projectId),
  });
  if (!decision.ok) return NextResponse.json({ error: decision.error }, { status: decision.status });
  if (!db) return NextResponse.json({ error: "Persistence is required before acknowledging a webhook." }, { status: 503 });

  const { error } = await db.from("events").insert({
    project_id: decision.event.projectId,
    source: decision.event.source,
    type: decision.event.type,
    status: decision.event.status,
    payload: decision.event.payload,
    external_id: decision.event.externalId,
  });
  if (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ accepted: true, duplicate: true });
    console.error("github webhook: failed to persist event", error);
    return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
  }
  return NextResponse.json({ accepted: true });
}
