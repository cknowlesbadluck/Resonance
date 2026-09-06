import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

const makeDummyAdapter = (id: string): NexusAdapter => ({
  id,
  kind: "dummy",
  async describe() {
    return { identity: { id, type: "connector", name: id }, capabilities: [] };
  },
  async invoke() {
    return { ok: true, output: "ok" };
  },
});

describe("NexusExecutor Benchmark", () => {
  it("measures step execution time across many adapters", async () => {
    const adapterCount = 1000;
    const stepCount = 1000;

    const adapters: NexusAdapter[] = [];
    for (let i = 0; i < adapterCount; i++) {
      adapters.push(makeDummyAdapter(`adapter-${i}`));
    }

    // Place the target adapter near the end of the array to stress test Array.find()
    const targetAdapterId = `adapter-${adapterCount - 1}`;

    const plan: NexusExecutionPlan = {
      id: "bench-plan",
      intentId: "bench-intent",
      projectId: "bench-project",
      actorId: "bench-actor",
      mode: "direct",
      steps: Array.from({ length: stepCount }, (_, i) => ({
        id: `step-${i}`,
        capabilityId: `cap-${i}`,
        adapterId: targetAdapterId,
        input: {},
        requiresApproval: false,
      })),
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    const sink = {
      recordEvidence: async () => undefined,
      recordEvent: async () => undefined,
      recordExecution: async () => undefined,
    };

    const iterations = 10;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const executor = new NexusExecutor(adapters, sink);
      const result = await executor.execute(plan);
      expect(result.execution.status).toBe("completed");
    }
    const totalMs = performance.now() - start;
    const avgMsPerExecution = totalMs / iterations;

    console.log(`[BENCHMARK] Total: ${totalMs.toFixed(2)}ms, Avg per execution: ${avgMsPerExecution.toFixed(2)}ms (${stepCount} steps x ${adapterCount} adapters)`);
  });
});
