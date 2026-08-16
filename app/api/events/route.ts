import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateNexusRequest } from "../../../src/auth/nexus-request";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_PAYLOAD_KEYS = 100;

async function readBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error("Request body exceeds the 64 KiB limit.");
  return JSON.parse(text) as Record<string, unknown>;
}

function dbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const auth = await authenticateNexusRequest(request, projectId);
  if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 100);
  const supabase = dbClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data, error } = await supabase.from("events").select("id,source,type,status,created_at").eq("project_id", auth.projectId).order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON body." }, { status: 400 }); }

  const projectId = body.projectId;
  const auth = await authenticateNexusRequest(request, projectId);
  if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });

  const source = typeof body.source === "string" ? body.source.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "received";
  const payload = body.payload ?? {};
  if (!source || source.length > 128 || !type || type.length > 128 || status.length > 64) return NextResponse.json({ error: "source, type, and status are required and bounded." }, { status: 400 });
  if (typeof payload !== "object" || payload === null || Array.isArray(payload) || Object.keys(payload).length > MAX_PAYLOAD_KEYS) return NextResponse.json({ error: "payload must be a JSON object with at most 100 keys." }, { status: 400 });

  const supabase = dbClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const event = { project_id: auth.projectId, source, type, status, payload, external_id: typeof body.external_id === "string" ? body.external_id.slice(0, 256) : null };
  const { data, error } = await supabase.from("events").insert(event).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
