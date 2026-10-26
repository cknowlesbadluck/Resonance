import { describe, expect, it } from "vitest";
import { DefaultPolicyGate, requirePolicy } from "./gate";
import type { PolicyGate } from "../chambers/runtime";

const gate = new DefaultPolicyGate();
const base = { actorId: "a", projectId: "p", resourceType: "repo" };

describe("requirePolicy deny-by-default", () => {
  it("passes auto-allowed read", async () => {
    await expect(requirePolicy(gate, { ...base, action: "read", requiredLevel: "read" })).resolves.toMatchObject({ allowed: true, requiresApproval: false });
  });
  it("denies 'allowed, needs approval' without approval", async () => {
    await expect(requirePolicy(gate, { ...base, action: "deploy", requiredLevel: "deploy" })).rejects.toThrow(/approval required/);
  });
  it("allows privileged action only with verified approval", async () => {
    await expect(requirePolicy(gate, { ...base, action: "deploy", requiredLevel: "deploy" }, { approved: true })).resolves.toMatchObject({ requiresApproval: true });
  });
  it("denies missing identity even with approval", async () => {
    await expect(requirePolicy(gate, { ...base, actorId: "", action: "read", requiredLevel: "read" }, { approved: true })).rejects.toThrow(/Missing actor/);
  });
  it("denies unknown level without approval", async () => {
    await expect(requirePolicy(gate, { ...base, action: "x", requiredLevel: "weird" as never })).rejects.toThrow(/approval required/);
  });
  it("fails closed on malformed decision", async () => {
    const bad = { evaluate: async () => ({ allowed: true }) } as unknown as PolicyGate;
    await expect(requirePolicy(bad, { ...base, action: "read", requiredLevel: "read" })).rejects.toThrow(/approval required/);
  });
});
