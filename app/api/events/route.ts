import { NextResponse } from "next/server";
import { adminClient, authenticate, requireProjectMember } from "../../../lib/server";

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
    const projectId = url.searchParams.get("project_id");
    const supabase = adminClient();

    if (projectId) {
      await requireProjectMember(request, projectId);
      const { data, error } = await supabase.from("events").select("id,project_id,source,type,status,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ events: data ?? [] });
    }

    const { data: memberships, error: membershipError } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
    const projectIds = (memberships ?? []).map((membership) => membership.project_id);
    if (!projectIds.length) return NextResponse.json({ events: [] });
    const { data, error } = await supabase.from("events").select("id,project_id,source,type,status,created_at").in("project_id", projectIds).order("created_at", { ascending: false }).limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = typeof body.project_id === "string" ? body.project_id : "";
    const { user } = projectId ? await requireProjectMember(request, projectId) : { user: await authenticate(request) };
    const event = {
      project_id: projectId || null,
      source: body.source ?? "unknown",
      type: body.type ?? "event.received",
      status: body.status ?? "received",
      payload: body.payload ?? {},
      external_id: body.external_id ?? null,
    };
    const { data, error } = await adminClient().from("events").insert(event).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event, actor: user.id, persisted: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
