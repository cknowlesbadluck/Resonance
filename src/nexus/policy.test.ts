import { describe, expect, it } from "vitest";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import { InMemoryCapabilityRegistry } from "./registry";
import type { NexusCapability, NexusIntent } from "./types";

const read: NexusCapability = {
  id: "cap-read",
  key: "resource.read",
  name: "Read",
  adapterId: "http-1",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
};

describe("DefaultNexusPolicy", () => {
  const policy = new DefaultNexusPolicy();

  it("denies a missing actor", () => {
    expect(policy.evaluate("", read)).toEqual({
      allowed: false,
      requiresApproval: false,
      reason: "Missing actor.",
    });
  });

  it("denies unavailable capabilities", () => {
    expect(policy.evaluate("u1", { ...read, availability: "unavailable" }).allowed).toBe(false);
  });

  it("denies blocked capabilities", () => {
    expect(policy.evaluate("u1", { ...read, tags: ["blocked"] }).allowed).toBe(false);
  });

  it("denies unsupported permissions instead of defaulting to read", () => {
    expect(policy.evaluate("u1", { ...read, requiredPermissions: ["future_permission"] })).toEqual({
      allowed: false,
      requiresApproval: false,
      reason: "Capability declares unsupported permission: future_permission.",
    });
  });

  it("denies inherited Object.prototype keys instead of treating them as a supported permission (CHR-47)", () => {
    // "toString", "constructor", and "__proto__" all resolve through Object.prototype
    // rather than being own properties of the rank map. Before the own-property
    // check, these bypassed the undefined guard and left `highest` at "read",
    // letting a capability execute without approval.
    for (const inherited of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      const result = policy.evaluate("u1", { ...read, requiredPermissions: [inherited as never] });
      expect(result).toEqual({
        allowed: false,
        requiresApproval: false,
        reason: `Capability declares unsupported permission: ${inherited}.`,
      });
    }
  });

  it("allows low-risk reads without approval", () => {
    expect(policy.evaluate("u1", read)).toEqual({ allowed: true, requiresApproval: false });
  });

  it("requires approval for execute-level work", () => {
    const write: NexusCapability = { ...read, id: "cap-write", requiredPermissions: ["execute"], risk: "high" };
    expect(policy.evaluate("u1", write)).toEqual({
      allowed: true,
      requiresApproval: true,
      reason: "Capability requires explicit approval.",
    });
  });

  it("stops composition when policy denies", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register({ ...read, tags: ["blocked"] });
    const intent: NexusIntent = {
      id: "intent-1",
      projectId: "p1",
      objective: "inspect",
      requestedBy: "u1",
      requirements: [{ key: "resource.read" }],
    };
    expect(() => composeIntent(intent, registry, policy, [{
      id: "http-1",
      kind: "http",
      describe: async () => ({ identity: { id: "x", type: "connector", name: "x" }, capabilities: [] }),
      invoke: async () => ({ ok: true }),
    }])).toThrow(/blocked by policy/);
  });
});
