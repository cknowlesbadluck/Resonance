import { NextResponse } from "next/server";
import { adminClient, audit, capabilityAllowed, requireProjectMember } from "../../../../../lib/server";
import { executeWorkflow, validateDefinition } from "../../../../../lib/workflow-engine";

export async function POST(request: Request, context: { params: Promise<{ workflowId: string }> }) {
  try {
    const { workflowId } = await context.params;
    const supabase = adminClient();
    const { data: workflow, error: workflowError } = await supabase.from("workflows").select("*").eq("id", workflowId).maybeSingle();
    if (workflowError) return NextResponse.json({ error: workflowError.message }, { status: 500 });
    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const { user, role } = await requireProjectMember(request, workflow.project_id);
    if (!workflow.enabled) return NextResponse.json({ error: "Workflow is disabled" }, { status: 409 });
    const definition = validateDefinition(workflow.definition);
    const firstApproval = definition.steps.findIndex((step) => step.type === "approval");
    const executableSteps = firstApproval < 0 ? definition.steps : definition.steps.slice(0, firstApproval);
    const blocked = executableSteps.find((step) => !capabilityAllowed(role, step.capability));
    if (blocked) {
      await audit(workflow.project_id, user.id, "workflow.denied", "workflow", workflow.id, { step_id: blocked.id, capability: blocked.capability });
      return NextResponse.json({ error: "Permission denied before approval gate", step_id: blocked.id }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { data: run, error: runError } = await supabase.from("workflow_runs").insert({
      workflow_id: workflow.id,
      project_id: workflow.project_id,
      requested_by: user.id,
      status: "queued",
      input: body,
    }).select("*").single();
    if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

    await audit(workflow.project_id, user.id, "workflow.started", "workflow_run", run.id, { workflow_id: workflow.id });
    const result = await executeWorkflow(supabase, run.id, workflow.project_id, definition);
    return NextResponse.json({ run_id: run.id, ...result }, { status: result.status === "approval_required" ? 202 : 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
