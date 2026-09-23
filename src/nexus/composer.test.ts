import { describe, expect, it } from "vitest";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import type { NexusCapability, NexusIntent } from "./types";
import type { NexusAdapter } from "./adapters/types";

const capRead: NexusCapability = {
  id: "cap-read",
  key: "resource.read",
  name: "Read Resource",
  adapterId: "adapter-1",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
};

const capWrite: NexusCapability = {
  id: "cap-write",
  key: "resource.write",
  name: "Write Resource",
  adapterId: "adapter-1",
  requiredPermissions: ["execute"],
  risk: "medium",
  availability: "available",
};

const dummyAdapter: NexusAdapter = {
  id: "adapter-1",
  kind: "dummy",
  describe: async () => ({ identity: { id: "a1", type: "connector", name: "Adapter 1" }, capabilities: [capRead, capWrite] }),
  invoke: async () => ({ ok: true }),
};

const baseIntent: NexusIntent = {
  id: "intent-base",
  projectId: "proj-1",
  objective: "Do some work",
  requestedBy: "user-1",
  requirements: [],
};

describe("composeIntent", () => {
  it("translates a single requirement intent into a direct execution plan", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capRead);
    const policy = new DefaultNexusPolicy();
    const adapters = [dummyAdapter];

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.read" }],
      metadata: { input: { someData: 123 } }
    };

    const plan = composeIntent(intent, registry, policy, adapters);

    expect(plan.intentId).toBe(intent.id);
    expect(plan.projectId).toBe(intent.projectId);
    expect(plan.actorId).toBe(intent.requestedBy);
    expect(plan.mode).toBe("direct");
    expect(plan.approvalRequired).toBe(false);
    expect(plan.steps).toHaveLength(1);

    const step = plan.steps[0];
    expect(step.id).toBe(`${intent.id}-step-0`);
    expect(step.capabilityId).toBe(capRead.id);
    expect(step.adapterId).toBe(dummyAdapter.id);
    expect(step.input).toEqual({ someData: 123 });
    expect(step.requiresApproval).toBe(false);
  });

  it("translates a multiple requirement intent into a chamber execution plan", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capRead);
    const policy = new DefaultNexusPolicy();
    const adapters = [dummyAdapter];

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.read" }, { key: "resource.read" }],
    };

    const plan = composeIntent(intent, registry, policy, adapters);

    expect(plan.mode).toBe("chamber");
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[0].id).toBe(`${intent.id}-step-0`);
    expect(plan.steps[1].id).toBe(`${intent.id}-step-1`);
  });

  it("throws an error if no compatible capability is found for a requirement", () => {
    const registry = new InMemoryCapabilityRegistry();
    const policy = new DefaultNexusPolicy();
    const adapters = [dummyAdapter];

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.read" }], // capRead is not registered
    };

    expect(() => composeIntent(intent, registry, policy, adapters)).toThrow("No compatible capability for resource.read");
  });

  it("throws an error if no adapter is found for a selected capability", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capRead);
    const policy = new DefaultNexusPolicy();
    const adapters: NexusAdapter[] = []; // Empty adapters array

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.read" }],
    };

    expect(() => composeIntent(intent, registry, policy, adapters)).toThrow(`No adapter for capability ${capRead.id}`);
  });

  it("throws an error if the policy denies access to the capability", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capRead);
    // Policy evaluating an actor with empty ID will deny, or we can use a blocked capability
    const blockedCap: NexusCapability = { ...capRead, id: "blocked-cap", tags: ["blocked"] };
    registry.register(blockedCap);
    const policy = new DefaultNexusPolicy();
    const adapters = [dummyAdapter];

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.read", tags: ["blocked"] }],
    };

    expect(() => composeIntent(intent, registry, policy, adapters)).toThrow("Capability is blocked by policy.");
  });

  it("propagates requiresApproval to the execution plan", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(capWrite); // capWrite requires "execute", DefaultPolicy requires approval for "execute"
    const policy = new DefaultNexusPolicy("execute");
    const adapters = [dummyAdapter];

    const intent: NexusIntent = {
      ...baseIntent,
      requirements: [{ key: "resource.write" }],
    };

    const plan = composeIntent(intent, registry, policy, adapters);

    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].requiresApproval).toBe(true);
    expect(plan.approvalRequired).toBe(true);
  });
});

// Rerun CI
