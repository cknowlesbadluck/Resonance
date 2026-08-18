import { createHash } from "node:crypto";
import type { NexusIntent } from "./types";

export function hashExecutionRequest(intent: NexusIntent): string {
  return createHash("sha256")
    .update(JSON.stringify({
      objective: intent.objective,
      projectId: intent.projectId,
      requestedBy: intent.requestedBy,
      requirements: intent.requirements,
      contextRefs: intent.contextRefs ?? [],
      metadata: intent.metadata ?? {},
    }))
    .digest("hex");
}
