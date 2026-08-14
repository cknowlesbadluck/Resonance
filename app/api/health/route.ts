import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!configured) return NextResponse.json({ status: "degraded", service: "resonance", supabase: "not_configured" }, { status: 503 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await supabase.from("events").select("id", { head: true, count: "exact" });
  return NextResponse.json({ status: error ? "degraded" : "operational", service: "resonance", supabase: error ? "unhealthy" : "healthy" }, { status: error ? 503 : 200 });
}
