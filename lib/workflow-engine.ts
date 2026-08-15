import type { SupabaseClient } from "@supabase/supabase-js";
import type { CapabilityLevel, RunStatus } from "./domain";

export type WorkflowStep = {
  id: string;
  name: string;
  type: "event" | "approval" | "noop";
  capability?: CapabilityLevel;
  event_type?: string;
  payload?: Record<string, unknown>;
};

export type WorkflowDefinition = { steps: WorkflowStep[] };

export function validateDefinition(definition: unknown): WorkflowDefinition {
  if (!definition || typeof definition !== "object") throw new Error("Workflow definition must be an object");
  const steps = (definition as { steps?: unknown }).steps;
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("Workflow must contain at least one step");
  for (const step of steps) {
    if (!step || typeof step !== "object") throw new Error("Invalid workflow step");
    const value = step as Partial<WorkflowStep>;
    if (!value.id || !value.name || !["event", "approval", "noop"].includes(value.type ?? "")) {
      throw new Error("Each step needs id, name and a supported type");
    }
  }
  return { steps: steps as WorkflowStep[] };
}

async function setRun(supabase: SupabaseClient, runId: string, status: RunStatus, patch: Record<string, unknown> = {}) {
  const { error } = await supabase.from("workflow_runs").update({ status, ...patch }).eq("id", runId);
  if (error) throw new Error(error.message);
}

async function emit(supabase: SupabaseClient, runId: string, projectId: string, step: WorkflowStep, status: string, payload: Record<string, unknown> = {}) {
  const { error } = await supabase.from("workflow_events").insert({
    run_id: runId,
    project_id: projectId,
    event_type: step.event_type ?? `workflow.${step.type}`,
    status,
    payload: { step_id: step.id, step_name: step.name, ...payload },
  });
  if (error) throw new Error(error.message);
}

export async function executeWorkflow(
  supabase: SupabaseClient,
  runId: string,
  projectId: string,
  definition: WorkflowDefinition,
  startIndex = 0,
  initialOutput: Record<string, unknown> = {},
) {
  await setRun(supabase, runId, "running", { started_at: new Date().toISOString() });
  const output: Record<string, unknown> = { ...initialOutput };

  for (let index = startIndex; index < definition.steps.length; index += 1) {
    const step = definition.steps[index];
    await setRun(supabase, runId, "running", { current_step: step.id, output });

    if (step.type === "approval") {
      await emit(supabase, runId, projectId, step, "approval_required");
      await setRun(supabase, runId, "approval_required", { current_step: step.id, output });
      return { status: "approval_required" as const, nextIndex: index, output };
    }

    await emit(supabase, runId, projectId, step, "started");
    if (step.type === "event") {
      output[step.id] = { emitted: true, type: step.event_type ?? "workflow.event", payload: step.payload ?? {} };
    } else {
      output[step.id] = { ok: true };
    }
    await emit(supabase, runId, projectId, step, "completed", { output: output[step.id] as Record<string, unknown> });
  }

  await setRun(supabase, runId, "completed", {
    current_step: null,
    output,
    completed_at: new Date().toISOString(),
  });
  return { status: "completed" as const, nextIndex: null, output };
}
