import { describe, expect, it } from "vitest";
import { capabilityMatches } from "./capabilities";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import { InMemoryContextStore } from "./context";
import { EventBus, InMemoryEventStore } from "./events";
import type { NexusCapability, NexusIntent } from "./types";

const low: NexusCapability = { id: "cap-1", key: "resource.read", name: "Read", adapterId: "http-1", requiredPermissions: ["read"], risk: "low", availability: "available" };
const write: NexusCapability = { id: "cap-2", key: "resource.write", name: "Write", adapterId: "mcp-1", requiredPermissions: ["execute"], risk: "high", availability: "available" };

const intent: NexusIntent = { id: "intent-1", projectId: "p1", objective: "inspect", requestedBy: "u1", requirements: [{ key: "resource.read" }] };

describe("Nexus primitives", () => {
  it("matches capabilities without provider-specific logic", () => expect(capabilityMatches(low, { key: "resource.read" })).toBe(true));
  it("rejects capabilities above a risk ceiling", () => expect(capabilityMatches(write, { key: "resource.write", maxRisk: "medium" })).toBe(false));
  it("discovers and composes a direct intent", () => {
    const registry = new InMemoryCapabilityRegistry(); registry.register(low);
    const plan = composeIntent(intent, registry, new DefaultNexusPolicy(), [{ id: "http-1", kind: "http", describe: async () => ({ identity: { id: "x", type: "connector", name: "x" }, capabilities: [] }), invoke: async () => ({ ok: true }) }]);
    expect(plan.mode).toBe("direct"); expect(plan.steps[0].adapterId).toBe("http-1");
  });
  it("scopes context to the requested participant", () => {
    const store = new InMemoryContextStore();
    store.put({ scope: "c1", key: "secret", value: 1, visibility: "participants", createdBy: "a", persistent: false });
    expect(store.viewFor("b", { id: "c1", visibility: "participants", participants: ["a"] })).toHaveLength(0);
    expect(store.viewFor("a", { id: "c1", visibility: "participants", participants: ["a"] })).toHaveLength(1);
  });
  it("deduplicates external events", async () => {
    const store = new InMemoryEventStore(); const bus = new EventBus(store);
    const event = { id: "1", source: "github", type: "push", status: "received", correlationId: "c1", externalId: "e1", payload: {}, createdAt: new Date().toISOString() };
    expect(await bus.publish(event)).toBe(true); expect(await bus.publish({ ...event, id: "2" })).toBe(false); expect(store.events).toHaveLength(1);
  });
});
