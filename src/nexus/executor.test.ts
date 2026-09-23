import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan, NexusEvidence } from "./types";

const makeAdapter = (id: string, invoke: NexusAdapter["invoke"]): NexusAdapter => ({
  id,
  kind: "test",
  async describe() { return { identity: { id, type: "connector", name: id }, capabilities: [] }; },
  invoke,
});

describe("NexusExecutor execution semantics", () => {
  it("executes successfully with a single step", async () => {
    const plan: NexusExecutionPlan = {
      id: "plan-1",
      intentId: "intent-1",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: [{ id: "step-1", capabilityId: "cap-1", adapterId: "adapter-1", input: { arg: 1 }, requiresApproval: false }],
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    let invokeCalled = false;
    const adapter = makeAdapter("adapter-1", async () => {
      invokeCalled = true;
      return { ok: true, output: "done" };
    });

    const executor = new NexusExecutor([adapter], {
      recordEvidence: async () => undefined,
    });

    const result = await executor.execute(plan);

    expect(invokeCalled).toBe(true);
    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual(["done"]);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].summary).toBe("Capability cap-1 completed.");
  });

  it("executes successfully with multiple steps passing output", async () => {
    const plan: NexusExecutionPlan = {
      id: "plan-2",
      intentId: "intent-2",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: [
        { id: "step-1", capabilityId: "cap-1", adapterId: "adapter-1", input: { arg: 1 }, requiresApproval: false },
        { id: "step-2", capabilityId: "cap-2", adapterId: "adapter-2", input: { arg: 2 }, requiresApproval: false },
      ],
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    const evidenceItems: NexusEvidence[] = [];

    const adapter1 = makeAdapter("adapter-1", async () => ({ ok: true, output: "one" }));
    const adapter2 = makeAdapter("adapter-2", async () => ({ ok: true, output: "two" }));

    const executor = new NexusExecutor([adapter1, adapter2], {
      recordEvidence: async (evidence) => { evidenceItems.push(evidence); },
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual(["one", "two"]);

    expect(evidenceItems).toHaveLength(2);
    expect(evidenceItems[0].summary).toBe("Capability cap-1 completed.");
    expect(evidenceItems[1].summary).toBe("Capability cap-2 completed.");
  });

  it("throws and records failure when an adapter fails without retry", async () => {
    const plan: NexusExecutionPlan = {
      id: "plan-3",
      intentId: "intent-3",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: [{ id: "step-1", capabilityId: "cap-1", adapterId: "adapter-fail", input: {}, requiresApproval: false }],
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
      retry: { maxAttempts: 1, backoffMs: 0 },
    };

    const evidenceItems: NexusEvidence[] = [];

    const failAdapter = makeAdapter("adapter-fail", async () => ({ ok: false, error: "Permanent error" }));

    const executor = new NexusExecutor([failAdapter], {
      recordEvidence: async (evidence) => { evidenceItems.push(evidence); },
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toBe("Permanent error");

    expect(evidenceItems).toHaveLength(1);
    expect(evidenceItems[0].type).toBe("audit");
    expect(evidenceItems[0].summary).toBe("Capability cap-1 failed.");
    expect(evidenceItems[0].payload).toBe("Permanent error");
  });

  it("executes successfully with no steps (empty plan)", async () => {
    const plan: NexusExecutionPlan = {
      id: "plan-empty",
      intentId: "intent-empty",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: [],
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    const executor = new NexusExecutor([], {
      recordEvidence: async () => undefined,
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual([]);
    expect(result.evidence).toHaveLength(0);
  });
});
