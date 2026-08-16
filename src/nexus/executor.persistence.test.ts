import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecution, NexusExecutionPlan } from "./types";

const plan: NexusExecutionPlan = {
  id: "durable-plan",
  intentId: "durable-intent",
  projectId: "project",
  actorId: "actor",
  mode: "direct",
  steps: [{ id: "step", capabilityId: "capability", adapterId: "adapter", input: {}, requiresApproval: false }],
  contextRefs: [],
  approvalRequired: false,
  rationale: [],
  retry: { maxAttempts: 2, backoffMs: 0 },
};

const adapter: NexusAdapter = {
  id: "adapter",
  kind: "test",
  async describe() { return { identity: { id: "adapter", type: "connector", name: "adapter" }, capabilities: [] }; },
  async invoke() { return { ok: true, output: "done" }; },
};

describe("NexusExecutor durable execution persistence", () => {
  it("persists running, attempt progress, and terminal state", async () => {
    const snapshots: NexusExecution[] = [];
    const result = await new NexusExecutor([adapter], {
      recordEvidence: async () => undefined,
      recordExecution: async (execution) => snapshots.push({ ...execution }),
    }).execute(plan);

    expect(result.execution.status).toBe("completed");
    expect(result.execution.attempts).toBe(1);
    expect(snapshots.map((snapshot) => snapshot.status)).toEqual(["running", "running", "completed"]);
    expect(snapshots.map((snapshot) => snapshot.attempts)).toEqual([0, 1, 1]);
  });

  it("persists the waiting state before returning for approval", async () => {
    const snapshots: NexusExecution[] = [];
    const result = await new NexusExecutor([adapter], {
      recordEvidence: async () => undefined,
      recordExecution: async (execution) => snapshots.push({ ...execution }),
    }).execute({
      ...plan,
      steps: [{ ...plan.steps[0], requiresApproval: true }],
    });

    expect(result.execution.status).toBe("waiting");
    expect(snapshots.map((snapshot) => snapshot.status)).toEqual(["running", "waiting"]);
  });
});
