import { createHash } from "node:crypto";
import type { NexusIntent } from "./types";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function hashExecutionRequest(intent: NexusIntent): string {
  const executionRequest = {
    objective: intent.objective,
    projectId: intent.projectId,
    requestedBy: intent.requestedBy,
    requirements: intent.requirements,
    contextRefs: intent.contextRefs ?? [],
    metadata: intent.metadata ?? {},
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(executionRequest)))
    .digest("hex");
}
