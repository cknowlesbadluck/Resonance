import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decideGitHubWebhook } from "../../../../src/nexus/github-webhook";

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
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

  const { error } = await db.rpc("emit_event", {
    p_project_id: decision.event.projectId,
    p_source: decision.event.source,
    p_type: decision.event.type,
    p_status: decision.event.status,
    p_external_id: decision.event.externalId,
    p_payload: decision.event.payload
  });
  if (error) {
    console.error("github webhook: failed to persist event", error);
    return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
  }
  return NextResponse.json({ accepted: true });
}
