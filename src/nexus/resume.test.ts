import { describe, expect, it } from "vitest";
import { checkPlanEscalation, type StoredPlan } from "./resume";
import type { NexusExecutionPlan } from "./types";

describe("checkPlanEscalation", () => {
  const dummyPlan: NexusExecutionPlan = {
    id: "plan-1",
    intentId: "intent-1",
    projectId: "proj-1",
    actorId: "actor-1",
    mode: "direct",
    contextRefs: [],
    approvalRequired: false,
    rationale: [],
    steps: [
      { id: "s1", capabilityId: "c1", adapterId: "a1", input: {}, requiresApproval: false },
      { id: "s2", capabilityId: "c2", adapterId: "a2", input: {}, requiresApproval: true },
    ],
  };

  it("returns true when originalPlan is null", () => {
    expect(checkPlanEscalation(null, dummyPlan)).toBe(true);
  });

  it("returns false when steps requiring approval were already flagged in originalPlan", () => {
    const originalPlan: StoredPlan = {
      approvalRequired: true,
      steps: [{ requiresApproval: false }, { requiresApproval: true }],
    };
    expect(checkPlanEscalation(originalPlan, dummyPlan)).toBe(false);
  });

  it("returns true when a step in the new plan requires approval but was not flagged in originalPlan", () => {
    const originalPlan: StoredPlan = {
      approvalRequired: true,
      steps: [{ requiresApproval: false }, { requiresApproval: false }],
    };
    expect(checkPlanEscalation(originalPlan, dummyPlan)).toBe(true);
  });

  it("returns false when no steps in new plan require approval", () => {
    const noApprovalPlan: NexusExecutionPlan = {
      ...dummyPlan,
      steps: [
        { id: "s1", capabilityId: "c1", adapterId: "a1", input: {}, requiresApproval: false },
        { id: "s2", capabilityId: "c2", adapterId: "a2", input: {}, requiresApproval: false },
      ],
    };
    const originalPlan: StoredPlan = {
      approvalRequired: false,
      steps: [{ requiresApproval: false }, { requiresApproval: false }],
    };
    expect(checkPlanEscalation(originalPlan, noApprovalPlan)).toBe(false);
  });
});
