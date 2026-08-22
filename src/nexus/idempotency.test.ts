import { describe, expect, it } from "vitest";
import { hashExecutionRequest } from "./idempotency";
import type { NexusIntent } from "./types";

const intent: NexusIntent = {
  id: "intent-a",
  projectId: "project-a",
  objective: "test capability",
  requestedBy: "actor-a",
  requirements: [{ key: "capability.a", requiredPermissions: ["read", "write"] }],
  contextRefs: [],
  metadata: { z: { second: 2, first: 1 }, a: "stable" },
};

describe("execution request idempotency hashing", () => {
  it("produces the same hash for equivalent request content", () => {
    expect(hashExecutionRequest(intent)).toBe(hashExecutionRequest({ ...intent, id: "intent-b" }));
  });

  it("is independent of nested object insertion order", () => {
    const reordered: NexusIntent = {
      ...intent,
      requirements: [{ requiredPermissions: ["read", "write"], key: "capability.a" }],
      metadata: { a: "stable", z: { first: 1, second: 2 } },
    };
    expect(hashExecutionRequest(intent)).toBe(hashExecutionRequest(reordered));
  });

  it("changes the hash when execution-relevant input changes", () => {
    expect(hashExecutionRequest(intent)).not.toBe(hashExecutionRequest({
      ...intent,
      objective: "different objective",
    }));
  });
});
