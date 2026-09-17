import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

const makeDummyAdapter = (id: string, delayMs = 0): NexusAdapter => ({
  id,
  kind: "dummy",
  async describe() {
    return { identity: { id, type: "connector", name: id }, capabilities: [] };
  },
  async invoke() {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
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

  it("compares latency of sequential vs parallel DAG step execution", async () => {
    const stepCount = 10;
    const ioDelayMs = 10;
    const adapter = makeDummyAdapter("io-adapter", ioDelayMs);
    const sink = {
      recordEvidence: async () => undefined,
      recordEvent: async () => undefined,
      recordExecution: async () => undefined,
    };

    const seqSteps = Array.from({ length: stepCount }, (_, i) => ({
      id: `seq-step-${i}`,
      capabilityId: `cap-${i}`,
      adapterId: "io-adapter",
      input: {},
      requiresApproval: false,
      dependsOn: i === 0 ? [] : [`seq-step-${i - 1}`],
    }));

    const seqPlan: NexusExecutionPlan = {
      id: "seq-plan",
      intentId: "intent",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: seqSteps,
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    const parSteps = Array.from({ length: stepCount }, (_, i) => ({
      id: `par-step-${i}`,
      capabilityId: `cap-${i}`,
      adapterId: "io-adapter",
      input: {},
      requiresApproval: false,
      dependsOn: [],
    }));

    const parPlan: NexusExecutionPlan = {
      id: "par-plan",
      intentId: "intent",
      projectId: "project",
      actorId: "actor",
      mode: "direct",
      steps: parSteps,
      contextRefs: [],
      approvalRequired: false,
      rationale: [],
    };

    const executor = new NexusExecutor([adapter], sink);

    const seqStart = performance.now();
    const seqResult = await executor.execute(seqPlan);
    const seqDurationMs = performance.now() - seqStart;

    const parStart = performance.now();
    const parResult = await executor.execute(parPlan);
    const parDurationMs = performance.now() - parStart;

    expect(seqResult.execution.status).toBe("completed");
    expect(parResult.execution.status).toBe("completed");

    const speedup = seqDurationMs / parDurationMs;
    console.log(`[DAG BENCHMARK] Sequential: ${seqDurationMs.toFixed(2)}ms, Parallel DAG: ${parDurationMs.toFixed(2)}ms, Speedup: ${speedup.toFixed(2)}x (${stepCount} steps with ${ioDelayMs}ms I/O delay)`);

    expect(parDurationMs).toBeLessThan(seqDurationMs);
  });
});
