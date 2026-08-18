import { describe, expect, it } from "vitest";
import { hashExecutionRequest } from "./idempotency";
import type { NexusIntent } from "./types";

const intent: NexusIntent = {
  id: "intent-a",
  projectId: "project-a",
  objective: "test capability",
  requestedBy: "actor-a",
  requirements: [{ key: "capability.a" }],
  contextRefs: [],
};

describe("execution request idempotency hashing", () => {
  it("produces the same hash for equivalent request content", () => {
    expect(hashExecutionRequest(intent)).toBe(hashExecutionRequest({ ...intent, id: "intent-b" }));
  });

  it("changes the hash when execution-relevant input changes", () => {
    expect(hashExecutionRequest(intent)).not.toBe(hashExecutionRequest({
      ...intent,
      objective: "different objective",
    }));
  });
});
