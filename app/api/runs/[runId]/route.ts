import { NextResponse } from "next/server";
import { adminClient, requireProjectMember } from "../../../../lib/server";

export async function GET(request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    const supabase = adminClient();
    const { data: run, error } = await supabase.from("workflow_runs").select("*").eq("id", runId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    await requireProjectMember(request, run.project_id);
    const { data: events, error: eventError } = await supabase.from("workflow_events").select("*").eq("run_id", runId).order("created_at");
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
    return NextResponse.json({ run, events: events ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
