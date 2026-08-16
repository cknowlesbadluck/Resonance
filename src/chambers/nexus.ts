import type { ChamberRuntime, OpenChamberRequest } from "./runtime";
import type { NexusExecutionPlan } from "../nexus/types";

export function chamberRequestFromPlan(plan: NexusExecutionPlan): OpenChamberRequest {
  return {
    projectId: "nexus",
    agenda: {
      projectId: "nexus",
      goal: `Execute intent ${plan.intentId}`,
      constraints: [{ type: "approval", value: plan.approvalRequired, description: "Execution plan approval state" }],
      successCriteria: [{ id: "execution-complete", description: "All composed capability steps complete", required: true }],
    },
    seedAgentIds: [],
    seedSkillIds: [],
    requestedBy: plan.actorId,
  };
}

export async function openChamberForPlan(runtime: ChamberRuntime, plan: NexusExecutionPlan) {
  return runtime.open(chamberRequestFromPlan(plan));
}
