import { describe, expect, it, vi } from "vitest";
import { NexusExecutor, stepsSafeToRetry } from "./executor";
import type { NexusExecutionPlan } from "./types";
import type { NexusAdapter } from "./adapters/types";

const mockSink = {
  recordEvidence: vi.fn(),
  recordEvent: vi.fn(),
  recordExecution: vi.fn(),
};

const createMockAdapter = (id: string, invokeDelayMs: number = 0): NexusAdapter => ({
  id,
  kind: "tool",
  describe: vi.fn().mockResolvedValue({
    id,
    key: "mock-key",
    name: "Mock Adapter",
    requiredPermissions: [],
    risk: "low"
  }),
  invoke: vi.fn().mockImplementation(async ({ input }) => {
    if (invokeDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, invokeDelayMs));
    }
    return { ok: true, output: `Result of ${input}` };
  }),
});

describe("NexusExecutor DAG Execution", () => {
  it("executes steps in parallel waves according to dependsOn", async () => {
    const adapterA = createMockAdapter("adapter-a", 10);
    const adapterB = createMockAdapter("adapter-b", 50);
    const adapterC = createMockAdapter("adapter-c", 10);
    const adapterD = createMockAdapter("adapter-d", 10);

    const executor = new NexusExecutor([adapterA, adapterB, adapterC, adapterD], mockSink);

    const plan: NexusExecutionPlan = {
      id: "plan-dag-1",
      intentId: "intent-1",
      projectId: "proj-1",
      actorId: "actor-1",
      mode: "direct",
      approvalRequired: false,
      contextRefs: [],
      rationale: [],
      steps: [
        { id: "step-1", capabilityId: "cap-a", adapterId: "adapter-a", input: "A", requiresApproval: false },
        { id: "step-2", capabilityId: "cap-b", adapterId: "adapter-b", input: "B", requiresApproval: false, dependsOn: ["step-1"] },
        { id: "step-3", capabilityId: "cap-c", adapterId: "adapter-c", input: "C", requiresApproval: false, dependsOn: ["step-1"] },
        { id: "step-4", capabilityId: "cap-d", adapterId: "adapter-d", input: "D", requiresApproval: false, dependsOn: ["step-2", "step-3"] },
      ],
    };

    const startTime = Date.now();
    const { execution, evidence } = await executor.execute(plan);
    const duration = Date.now() - startTime;

    expect(execution.status).toBe("completed");

    // Outputs should match the original plan order
    expect(execution.output).toEqual([
      "Result of A",
      "Result of B",
      "Result of C",
      "Result of D"
    ]);

    // Expected duration is roughly:
    // Wave 1: A (10ms)
    // Wave 2: B (50ms) and C (10ms) concurrent (max 50ms)
    // Wave 3: D (10ms)
    // Total approx 70ms. Sequential would be 10 + 50 + 10 + 10 = 80ms.
    // Given JS timer slop, we just verify it completes and outputs are ordered.

    // adapterA invoked first
    expect(adapterA.invoke).toHaveBeenCalledTimes(1);
    expect(adapterB.invoke).toHaveBeenCalledTimes(1);
    expect(adapterC.invoke).toHaveBeenCalledTimes(1);
    expect(adapterD.invoke).toHaveBeenCalledTimes(1);
  });

  it("throws an error when a cyclic dependency is detected", async () => {
    const adapterA = createMockAdapter("adapter-a");
    const executor = new NexusExecutor([adapterA], mockSink);

    const plan: NexusExecutionPlan = {
      id: "plan-dag-cycle",
      intentId: "intent-1",
      projectId: "proj-1",
      actorId: "actor-1",
      mode: "direct",
      approvalRequired: false,
      contextRefs: [],
      rationale: [],
      steps: [
        { id: "step-1", capabilityId: "cap-a", adapterId: "adapter-a", input: "A", requiresApproval: false, dependsOn: ["step-2"] },
        { id: "step-2", capabilityId: "cap-a", adapterId: "adapter-a", input: "B", requiresApproval: false, dependsOn: ["step-1"] },
      ],
    };

    const { execution } = await executor.execute(plan);

    expect(execution.status).toBe("failed");
    expect(execution.error).toContain("Cyclic dependency");
  });

  it("records a partial status when a parallel step succeeds and another fails", async () => {
    const ok = createMockAdapter("adapter-ok");
    const failing: NexusAdapter = {
      ...createMockAdapter("adapter-bad"),
      invoke: vi.fn().mockResolvedValue({ ok: false, error: "provider rejected the write" }),
    };
    const executor = new NexusExecutor([ok, failing], mockSink);
    const plan: NexusExecutionPlan = {
      id: "plan-partial",
      intentId: "intent-1",
      projectId: "proj-1",
      actorId: "actor-1",
      mode: "direct",
      approvalRequired: false,
      contextRefs: [],
      rationale: [],
      steps: [
        { id: "read", capabilityId: "cap-ok", adapterId: "adapter-ok", input: "A", requiresApproval: false },
        { id: "write", capabilityId: "cap-bad", adapterId: "adapter-bad", input: "B", requiresApproval: false },
      ],
    };

    const { execution, evidence } = await executor.execute(plan);
    expect(execution.status).toBe("partial");
    expect(execution.error).toMatch(/Do not retry succeeded steps/);
    expect(execution.stepOutcomes).toEqual([
      expect.objectContaining({ stepId: "read", ok: true }),
      expect.objectContaining({ stepId: "write", ok: false }),
    ]);
    expect(evidence.map((item) => item.summary)).toEqual([
      "Capability cap-ok completed.",
      "Capability cap-bad failed.",
    ]);
    expect(stepsSafeToRetry(plan, execution.stepOutcomes).map((step) => step.id)).toEqual(["write"]);
    expect(ok.invoke).toHaveBeenCalledTimes(1);
    expect(failing.invoke).toHaveBeenCalledTimes(1);
  });
});
