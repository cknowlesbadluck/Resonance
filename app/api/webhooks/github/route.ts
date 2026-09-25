import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function verify(raw: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) {
    // Perform dummy timingSafeEqual to avoid timing side-channel
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery") ?? undefined;
  const projectId = process.env.RESONANCE_PROJECT_ID ?? null;

  const db = getDbClient();
  if (db && projectId) {
    const args = {
      p_project_id: projectId,
      p_source: "github",
      p_type: `github.${event}`,
      p_status: "received",
      p_payload: payload,
      ...(deliveryId ? { p_external_id: deliveryId } : {})
    };
    const { error } = await db.rpc("emit_event", args);
    if (error) {
      console.error("github webhook: failed to persist event", error);
      return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
    }
  }

  return NextResponse.json({ accepted: true });
}
