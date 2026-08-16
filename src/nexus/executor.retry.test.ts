import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

const plan: NexusExecutionPlan = {
  id: "retry-plan",
  intentId: "retry-intent",
  projectId: "project",
  actorId: "actor",
  mode: "direct",
  steps: [{ id: "step", capabilityId: "capability", adapterId: "flaky", input: {}, requiresApproval: false }],
  contextRefs: [],
  approvalRequired: false,
  rationale: [],
  retry: { maxAttempts: 3, backoffMs: 0 },
};

describe("NexusExecutor retry semantics", () => {
  it("retries a transient adapter failure and completes", async () => {
    let attempts = 0;
    const adapter: NexusAdapter = {
      id: "flaky",
      kind: "test",
      async describe() { return { identity: { id: "flaky", type: "connector", name: "Flaky" }, capabilities: [] }; },
      async invoke() {
        attempts += 1;
        return attempts < 3 ? { ok: false, error: "temporary" } : { ok: true, output: "done" };
      },
    };
    const result = await new NexusExecutor([adapter], { recordEvidence: async () => undefined }).execute(plan);
    expect(attempts).toBe(3);
    expect(result.execution.status).toBe("completed");
  });
});
