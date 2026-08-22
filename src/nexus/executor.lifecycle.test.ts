import { describe, expect, it } from "vitest";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusEvent, NexusExecution, NexusExecutionPlan } from "./types";

const plan: NexusExecutionPlan = {
  id: "lifecycle-plan",
  intentId: "lifecycle-intent",
  projectId: "project",
  actorId: "actor",
  mode: "direct",
  steps: [{ id: "step", capabilityId: "capability", adapterId: "adapter", input: {}, requiresApproval: false }],
  contextRefs: [],
  approvalRequired: false,
  rationale: [],
};

const makeAdapter = (invoke: NexusAdapter["invoke"]): NexusAdapter => ({
  id: "adapter",
  kind: "test",
  async describe() { return { identity: { id: "adapter", type: "connector", name: "adapter" }, capabilities: [] }; },
  invoke,
});

function eventTypes(events: NexusEvent[]) {
  return events.map((event) => event.type);
}

describe("NexusExecutor lifecycle semantics", () => {
  it("emits ordered events for successful execution", async () => {
    const events: NexusEvent[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => ({ ok: true, output: "done" }))], {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); },
    }).execute(plan);

    expect(result.execution.status).toBe("completed");
    expect(eventTypes(events)).toEqual(["execution.started", "execution.step.completed", "execution.completed"]);
    expect(new Set(events.map((event) => event.correlationId))).toHaveLength(1);
  });

  it("persists running and terminal states through the execution sink", async () => {
    const persisted: NexusExecution[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => ({ ok: true, output: "done" }))], {
      recordEvidence: async () => undefined,
      recordExecution: async (execution) => { persisted.push({ ...execution }); },
    }).execute(plan);

    expect(persisted.map((execution) => execution.status)).toEqual(["running", "completed"]);
    expect(persisted[0].id).toBe(result.execution.id);
    expect(persisted[1]).toMatchObject({ id: result.execution.id, status: "completed" });
  });

  it("persists waiting before returning an approval-gated execution", async () => {
    const persisted: NexusExecution[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => ({ ok: true, output: "must not run" }))], {
      recordEvidence: async () => undefined,
      recordExecution: async (execution) => { persisted.push({ ...execution }); },
    }).execute({ ...plan, steps: [{ ...plan.steps[0], requiresApproval: true }], approvalRequired: true });

    expect(result.execution.status).toBe("waiting");
    expect(persisted.map((execution) => execution.status)).toEqual(["running", "waiting"]);
  });

  it("emits started then waiting without invoking an approval-gated step", async () => {
    let invocations = 0;
    const events: NexusEvent[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => {
      invocations += 1;
      return { ok: true, output: "must not run" };
    })], {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); },
    }).execute({ ...plan, steps: [{ ...plan.steps[0], requiresApproval: true }], approvalRequired: true });

    expect(result.execution.status).toBe("waiting");
    expect(invocations).toBe(0);
    expect(eventTypes(events)).toEqual(["execution.started", "execution.waiting"]);
  });

  it("emits step failure before terminal failure", async () => {
    const events: NexusEvent[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => ({ ok: false, error: "permanent" }))], {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); },
    }).execute(plan);

    expect(result.execution.status).toBe("failed");
    expect(eventTypes(events)).toEqual(["execution.started", "execution.step.failed", "execution.failed"]);
  });

  it("emits retry events before the eventual successful step", async () => {
    let attempts = 0;
    const events: NexusEvent[] = [];
    const result = await new NexusExecutor([makeAdapter(async () => {
      attempts += 1;
      return attempts === 1 ? { ok: false, error: "temporary" } : { ok: true, output: "done" };
    })], {
      recordEvidence: async () => undefined,
      recordEvent: async (event) => { events.push(event); },
    }).execute({ ...plan, retry: { maxAttempts: 2, backoffMs: 0 } });

    expect(result.execution.status).toBe("completed");
    expect(eventTypes(events)).toEqual(["execution.started", "execution.retrying", "execution.step.completed", "execution.completed"]);
  });
});
