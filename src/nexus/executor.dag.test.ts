import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan, NexusEvent, ExecutionStep } from "./types";

const makeDelayAdapter = (id: string, delayMs: number, shouldFail: boolean = false): NexusAdapter => ({
  id,
  kind: "delay",
  async describe() { return { identity: { id, type: "connector", name: id }, capabilities: [] }; },
  async invoke({ capabilityId }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (shouldFail) resolve({ ok: false, error: `Failed: ${capabilityId}` });
        else resolve({ ok: true, output: `Done: ${capabilityId}` });
      }, delayMs);
    });
  },
});

function createPlan(steps: ExecutionStep[]): NexusExecutionPlan {
  return {
    id: "dag-plan",
    intentId: "dag-intent",
    projectId: "project",
    actorId: "actor",
    mode: "direct",
    steps,
    contextRefs: [],
    approvalRequired: false,
    rationale: [],
  };
}

describe("NexusExecutor DAG Semantics", () => {
  it("executes independent steps concurrently in a single wave", async () => {
    const adapters = [
      makeDelayAdapter("adapter-1", 50),
      makeDelayAdapter("adapter-2", 50),
    ];

    const plan = createPlan([
      { id: "step1", capabilityId: "cap1", adapterId: "adapter-1", input: {}, requiresApproval: false },
      { id: "step2", capabilityId: "cap2", adapterId: "adapter-2", input: {}, requiresApproval: false },
    ]);

    const events: NexusEvent[] = [];
    const executor = new NexusExecutor(adapters, {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); }
    });

    const start = performance.now();
    const result = await executor.execute(plan);
    const end = performance.now();

    expect(result.execution.status).toBe("completed");
    expect((result.execution.output as string[])).toContain("Done: cap1");
    expect((result.execution.output as string[])).toContain("Done: cap2");

    // Concurrent execution should take ~50ms, not 100ms.
    expect(end - start).toBeLessThan(90);

    const stepCompletions = events.filter(e => e.type === "execution.step.completed");
    expect(stepCompletions.length).toBe(2);
  });

  it("waits for dependent steps before executing", async () => {
    const adapters = [
      makeDelayAdapter("adapter-1", 50),
      makeDelayAdapter("adapter-2", 50),
    ];

    const plan = createPlan([
      { id: "step1", capabilityId: "cap1", adapterId: "adapter-1", input: {}, requiresApproval: false },
      { id: "step2", capabilityId: "cap2", adapterId: "adapter-2", input: {}, requiresApproval: false, dependsOn: ["step1"] },
    ]);

    const executor = new NexusExecutor(adapters, {
      recordEvidence: async () => undefined,
    });

    const start = performance.now();
    const result = await executor.execute(plan);
    const end = performance.now();

    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual(["Done: cap1", "Done: cap2"]);

    // Sequential execution should take ~100ms.
    expect(end - start).toBeGreaterThan(90);
  });

  it("halts execution and dependent steps if a wave fails", async () => {
    const adapters = [
      makeDelayAdapter("adapter-fail", 20, true),
      makeDelayAdapter("adapter-ok", 20),
    ];

    const plan = createPlan([
      { id: "step1", capabilityId: "cap1", adapterId: "adapter-fail", input: {}, requiresApproval: false },
      { id: "step2", capabilityId: "cap2", adapterId: "adapter-ok", input: {}, requiresApproval: false, dependsOn: ["step1"] },
    ]);

    const events: NexusEvent[] = [];
    const executor = new NexusExecutor(adapters, {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); }
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toBe("Failed: cap1");

    const stepEvents = events.filter(e => e.type.startsWith("execution.step"));
    expect(stepEvents.length).toBe(1); // Only step1 should have run
    expect(stepEvents[0].type).toBe("execution.step.failed");
  });

  it("detects cycles and halts execution", async () => {
    const plan = createPlan([
      { id: "step1", capabilityId: "cap1", adapterId: "adapter", input: {}, requiresApproval: false, dependsOn: ["step2"] },
      { id: "step2", capabilityId: "cap2", adapterId: "adapter", input: {}, requiresApproval: false, dependsOn: ["step1"] },
    ]);

    const executor = new NexusExecutor([makeDelayAdapter("adapter", 10)], {
      recordEvidence: async () => undefined,
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toContain("cycle detected or missing dependencies");
  });

  it("short-circuits and waits if a step in a wave requires approval", async () => {
    const adapters = [
      makeDelayAdapter("adapter-1", 10),
      makeDelayAdapter("adapter-2", 10),
    ];

    const plan = createPlan([
      { id: "step1", capabilityId: "cap1", adapterId: "adapter-1", input: {}, requiresApproval: false },
      { id: "step2", capabilityId: "cap2", adapterId: "adapter-2", input: {}, requiresApproval: true },
    ]);

    const executor = new NexusExecutor(adapters, {
      recordEvidence: async () => undefined,
    });

    const result = await executor.execute(plan);

    expect(result.execution.status).toBe("waiting");
    expect(result.execution.error).toBe("Approval required before execution.");
    expect(result.execution.output).toBeUndefined(); // no outputs should be captured yet
  });
});
