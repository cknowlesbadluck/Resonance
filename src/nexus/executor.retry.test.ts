import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

const adapter = (id: string, invoke: NexusAdapter["invoke"]): NexusAdapter => ({
  id,
  kind: "test",
  async describe() { return { identity: { id, type: "connector", name: id }, capabilities: [] }; },
  invoke,
});

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
    const flaky = adapter("flaky", async () => {
      attempts += 1;
      return attempts < 3 ? { ok: false, error: "temporary" } : { ok: true, output: "done" };
    });

    const result = await new NexusExecutor([flaky], { recordEvidence: async () => undefined }).execute(plan);

    expect(attempts).toBe(3);
    expect(result.execution.status).toBe("completed");
  });

  it("retries transient adapter exceptions and completes", async () => {
    let attempts = 0;
    const flaky = adapter("flaky", async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary exception");
      return { ok: true, output: "done" };
    });

    const result = await new NexusExecutor([flaky], { recordEvidence: async () => undefined }).execute(plan);

    expect(attempts).toBe(3);
    expect(result.execution.status).toBe("completed");
  });

  it("records audit evidence when the final adapter attempt throws", async () => {
    const flaky = adapter("flaky", async () => { throw new Error("permanent exception"); });
    const evidence: Array<{ type: string; summary: string; payload: unknown }> = [];

    const result = await new NexusExecutor([flaky], {
      recordEvidence: async (item) => { evidence.push(item); },
    }).execute({ ...plan, retry: { maxAttempts: 2, backoffMs: 0 } });

    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toBe("permanent exception");
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({ type: "audit", summary: "Capability capability failed." });
    expect(evidence[0].payload).toBe("permanent exception");
  });

  it("stops after the configured attempts and records the final failure", async () => {
    let attempts = 0;
    const flaky = adapter("flaky", async () => {
      attempts += 1;
      return { ok: false, error: "permanent failure" };
    });
    const evidence: unknown[] = [];

    const result = await new NexusExecutor([flaky], {
      recordEvidence: async (item) => { evidence.push(item); },
    }).execute({ ...plan, retry: { maxAttempts: 2, backoffMs: 0 } });

    expect(attempts).toBe(2);
    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toBe("permanent failure");
    expect(evidence).toHaveLength(1);
  });

  it("waits for approval without invoking the adapter", async () => {
    let attempts = 0;
    const gated = adapter("gated", async () => {
      attempts += 1;
      return { ok: true, output: "should not run" };
    });

    const result = await new NexusExecutor([gated], { recordEvidence: async () => undefined }).execute({
      ...plan,
      steps: [{ ...plan.steps[0], adapterId: "gated", requiresApproval: true }],
    });

    expect(result.execution.status).toBe("waiting");
    expect(result.execution.error).toBe("Approval required before execution.");
    expect(attempts).toBe(0);
    expect(result.evidence).toHaveLength(0);
  });

  it("fails cleanly when an adapter is missing", async () => {
    const result = await new NexusExecutor([], { recordEvidence: async () => undefined }).execute(plan);

    expect(result.execution.status).toBe("failed");
    expect(result.execution.error).toBe("Adapter flaky not found");
    expect(result.evidence).toHaveLength(0);
  });

  it("preserves output order across multiple successful steps", async () => {
    const first = adapter("first", async () => ({ ok: true, output: "one" }));
    const second = adapter("second", async () => ({ ok: true, output: "two" }));
    const multiStepPlan: NexusExecutionPlan = {
      ...plan,
      steps: [
        { id: "first", capabilityId: "first-capability", adapterId: "first", input: {}, requiresApproval: false },
        { id: "second", capabilityId: "second-capability", adapterId: "second", input: {}, requiresApproval: false },
      ],
    };

    const result = await new NexusExecutor([first, second], { recordEvidence: async () => undefined }).execute(multiStepPlan);

    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual(["one", "two"]);
    expect(result.evidence).toHaveLength(2);
  });
});
