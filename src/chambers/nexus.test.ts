import { describe, it, expect, vi } from "vitest";
import { chamberRequestFromPlan, openChamberForPlan } from "./nexus";
import type { NexusExecutionPlan } from "../nexus/types";
import type { ChamberRuntime } from "./runtime";

describe("nexus", () => {
  const mockPlan: NexusExecutionPlan = {
    id: "plan-1",
    intentId: "intent-1",
    projectId: "project-1",
    actorId: "actor-1",
    mode: "chamber",
    steps: [],
    contextRefs: [],
    approvalRequired: true,
    rationale: ["To test the mapping"],
  };

  describe("chamberRequestFromPlan", () => {
    it("should correctly map a NexusExecutionPlan to an OpenChamberRequest", () => {
      const result = chamberRequestFromPlan(mockPlan);

      expect(result).toEqual({
        projectId: mockPlan.projectId,
        agenda: {
          projectId: mockPlan.projectId,
          goal: `Execute intent ${mockPlan.intentId}`,
          constraints: [
            {
              type: "approval",
              value: mockPlan.approvalRequired,
              description: "Execution plan approval state",
            },
          ],
          successCriteria: [
            {
              id: "execution-complete",
              description: "All composed capability steps complete",
              required: true,
            },
          ],
        },
        seedAgentIds: [],
        seedSkillIds: [],
        requestedBy: mockPlan.actorId,
      });
    });

    it("should handle false approvalRequired correctly", () => {
      const unapprovedPlan = { ...mockPlan, approvalRequired: false };
      const result = chamberRequestFromPlan(unapprovedPlan);

      expect(result.agenda.constraints).toContainEqual({
        type: "approval",
        value: false,
        description: "Execution plan approval state",
      });
    });
  });

  describe("openChamberForPlan", () => {
    it("should call runtime.open with the mapped request", async () => {
      const mockRuntime: ChamberRuntime = {
        open: vi.fn().mockResolvedValue({ runId: "run-1" }),
        activateAgent: vi.fn(),
        pullResource: vi.fn(),
        getContextView: vi.fn(),
        updateContext: vi.fn(),
        contribute: vi.fn(),
        dissolve: vi.fn(),
        get: vi.fn(),
      };

      const expectedRequest = chamberRequestFromPlan(mockPlan);
      const result = await openChamberForPlan(mockRuntime, mockPlan);

      expect(mockRuntime.open).toHaveBeenCalledWith(expectedRequest);
      expect(result).toEqual({ runId: "run-1" });
    });
  });
});
