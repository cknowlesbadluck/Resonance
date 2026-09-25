import { describe, expect, it } from "vitest";
import { ScopedExecutionMemory } from "./scoped-memory";
import type { NexusExecution } from "./types";

const execution = (id: string): NexusExecution => ({ id, planId: "plan", status: "completed" });

describe("scoped execution memory", () => {
  it("does not return another project's executions or evidence", () => {
    const memory = new ScopedExecutionMemory();
    memory.upsertExecution("project-a", execution("exec-a"));
    memory.addEvidence("project-a", {
      id: "ev-a",
      executionId: "exec-a",
      type: "event",
      summary: "a",
      payload: { secret: true },
      createdAt: "2026-09-25T00:00:00.000Z",
    });
    memory.upsertExecution("project-b", execution("exec-b"));

    expect(memory.list("project-b")).toEqual({
      executions: [execution("exec-b")],
      evidence: [],
    });
    expect(memory.list("project-a").evidence).toHaveLength(1);
  });
});
