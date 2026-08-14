import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function validSignature(raw: string, signature: string | null, secret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 503 });
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"), secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const payload = JSON.parse(raw);
  const eventType = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("events").insert({ source: "github", type: `github.${eventType}`, status: "received", external_id: deliveryId, payload }).select("id").single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ accepted: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ accepted: true, event_id: data.id }, { status: 202 });
}
