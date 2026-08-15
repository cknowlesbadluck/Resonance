import { NextResponse } from "next/server";
import { adminClient, audit, requireProjectMember } from "../../../../../lib/server";
import { executeWorkflow, validateDefinition } from "../../../../../lib/workflow-engine";

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    const supabase = adminClient();
    const { data: run, error: runError } = await supabase.from("workflow_runs").select("*").eq("id", runId).maybeSingle();
    if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    const { user, role } = await requireProjectMember(request, run.project_id);
    if (role === "viewer") return NextResponse.json({ error: "Viewer role cannot approve runs" }, { status: 403 });
    if (run.status !== "approval_required") return NextResponse.json({ error: "Run is not awaiting approval" }, { status: 409 });

    const { data: workflow, error: workflowError } = await supabase.from("workflows").select("definition").eq("id", run.workflow_id).single();
    if (workflowError) return NextResponse.json({ error: workflowError.message }, { status: 500 });
    const definition = validateDefinition(workflow.definition);
    const currentIndex = definition.steps.findIndex((step) => step.id === run.current_step);
    if (currentIndex < 0) return NextResponse.json({ error: "Approval step no longer exists" }, { status: 409 });

    await audit(run.project_id, user.id, "workflow.approved", "workflow_run", run.id, { step_id: run.current_step });
    const result = await executeWorkflow(supabase, run.id, run.project_id, definition, currentIndex + 1, (run.output ?? {}) as Record<string, unknown>);
    return NextResponse.json({ run_id: run.id, ...result });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
