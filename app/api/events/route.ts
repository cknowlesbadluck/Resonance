import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest, isUuid } from "../../../src/auth/nexus-request";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_PAYLOAD_KEYS = 32;
const MAX_SOURCE_LENGTH = 100;
const MAX_TYPE_LENGTH = 200;
const MAX_STATUS_LENGTH = 100;
const MAX_EXTERNAL_ID_LENGTH = 256;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function body(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  return JSON.parse(text) as Record<string, unknown>;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  }
  if (!projectId || !isUuid(projectId)) return NextResponse.json({ error: "projectId is required and must be a UUID." }, { status: 400 });
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 100);
  const supabase = client();
  if (!supabase) return NextResponse.json({ events: [], source: "unconfigured" });
  const { data, error } = await supabase.from("events").select("id,project_id,source,type,status,correlation_id,actor_id,resource_type,resource_id,payload,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try { input = await body(request); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON body." }, { status: 400 }); }
  const projectId = input.project_id;
  if (!isUuid(projectId)) return NextResponse.json({ error: "project_id is required and must be a UUID." }, { status: 400 });
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  }
  const source = input.source ?? "unknown";
  const type = input.type ?? "event.received";
  const status = input.status ?? "received";
  const payload = input.payload ?? {};
  const externalId = input.external_id ?? null;
  if (typeof source !== "string" || source.length > MAX_SOURCE_LENGTH || typeof type !== "string" || type.length > MAX_TYPE_LENGTH || typeof status !== "string" || status.length > MAX_STATUS_LENGTH) return NextResponse.json({ error: "Invalid event metadata." }, { status: 400 });
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length > MAX_PAYLOAD_KEYS) return NextResponse.json({ error: "payload must be an object with at most 32 keys." }, { status: 400 });
  if (externalId !== null && (typeof externalId !== "string" || externalId.length > MAX_EXTERNAL_ID_LENGTH)) return NextResponse.json({ error: "external_id is invalid." }, { status: 400 });
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const event = { project_id: projectId, source, type, status, payload, external_id: externalId };
  const { data, error } = await supabase.from("events").insert(event).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
