import { describe, expect, it } from "vitest";
import { normalizeGrant, normalizeGrants, riskForGrants } from "./grants";
import { DefaultNexusPolicy } from "./policy";
import type { NexusCapability } from "./types";

describe("grant normalization", () => {
  it("passes through canonical policy levels", () => {
    expect(normalizeGrant("read")).toBe("read");
    expect(normalizeGrant("deploy")).toBe("deploy");
  });

  it("maps resource.action grants onto policy levels", () => {
    expect(normalizeGrant("repo.read")).toBe("read");
    expect(normalizeGrant("database.write")).toBe("modify");
    expect(normalizeGrant("build.run")).toBe("execute");
    expect(normalizeGrant("model.invoke")).toBe("execute");
    expect(normalizeGrant("pr.write")).toBe("create_pr");
    expect(normalizeGrant("realtime.subscribe")).toBe("read");
  });

  it("accepts colon-separated grants", () => {
    expect(normalizeGrant("repo:write")).toBe("modify");
  });

  it("fails closed on grants it cannot interpret", () => {
    expect(normalizeGrant("wat")).toBeNull();
    expect(normalizeGrant("repo.frobnicate")).toBeNull();
    expect(normalizeGrant("")).toBeNull();
    expect(normalizeGrants(["repo.read", "nonsense"]).unrecognized).toEqual(["nonsense"]);
  });

  it("derives risk from declared authority", () => {
    expect(riskForGrants([])).toBe("low");
    expect(riskForGrants(["repo.read"])).toBe("low");
    expect(riskForGrants(["database.write"])).toBe("medium");
    expect(riskForGrants(["agent.execute"])).toBe("high");
    expect(riskForGrants(["pr.merge"])).toBe("critical");
    expect(riskForGrants(["mystery.grant"])).toBe("critical");
  });
});

const capability = (over: Partial<NexusCapability> = {}): NexusCapability => ({
  id: "c1", key: "c1", name: "C1", requiredPermissions: ["repo.read"], risk: "low",
  availability: "available", executable: true, ...over,
});

describe("DefaultNexusPolicy with normalized grants", () => {
  const policy = new DefaultNexusPolicy();

  it("allows catalog-vocabulary read capabilities that were previously denied outright", () => {
    expect(policy.evaluate("actor", capability())).toEqual({ allowed: true, requiresApproval: false });
  });

  it("still requires approval above the execute threshold", () => {
    const decision = policy.evaluate("actor", capability({ requiredPermissions: ["agent.execute"], risk: "high" }));
    expect(decision).toMatchObject({ allowed: true, requiresApproval: true });
  });

  it("still fails closed on uninterpretable grants", () => {
    const decision = policy.evaluate("actor", capability({ requiredPermissions: ["totally.bogus"] }));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("unsupported permission");
  });

  it("denies capabilities with no bound adapter before they reach an executor", () => {
    const decision = policy.evaluate("actor", capability({ executable: false, unexecutableReason: "no adapter" }));
    expect(decision).toEqual({ allowed: false, requiresApproval: false, reason: "no adapter" });
  });
});
