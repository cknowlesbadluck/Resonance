import { describe, expect, it } from "vitest";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import type { NexusCapability, NexusIntent } from "./types";

const capability: NexusCapability = {
  id: "github.repository.read",
  key: "github.repository.read",
  name: "Read GitHub repository metadata",
  adapterId: "github",
  requiredPermissions: ["read"],
  risk: "low",
};

describe("intent input propagation", () => {
  it("carries normalized metadata input into the execution step", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capability);
    const intent: NexusIntent = {
      id: "intent-input",
      projectId: "project-1",
      objective: "inspect repository",
      requestedBy: "actor-1",
      requirements: [{ key: capability.key }],
      metadata: { input: { owner: "octo", repo: "repo" } },
    };
    const plan = composeIntent(intent, registry, new DefaultNexusPolicy(), [{
      id: "github",
      kind: "github",
      describe: async () => ({ identity: { id: "github", type: "connector", name: "GitHub" }, capabilities: [capability] }),
      invoke: async () => ({ ok: true }),
    }]);
    expect(plan.steps[0].input).toEqual({ owner: "octo", repo: "repo" });
  });
});
