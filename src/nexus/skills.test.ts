import { describe, expect, it } from "vitest";
import { DefaultNexusPolicy } from "./policy";
import { InMemorySkillRegistry, resolveSkill, validateSkill } from "./skills";
import type { NexusCapability, NexusSkill } from "./types";

function skill(overrides: Partial<NexusSkill> = {}): NexusSkill {
  return {
    id: "resonance.observe.sample",
    name: "Sample",
    namespace: "resonance.observe",
    version: "1.0.0",
    requirements: [{ key: "demo.read" }],
    ...overrides,
  };
}

function capability(overrides: Partial<NexusCapability> = {}): NexusCapability {
  return {
    id: "demo.read",
    key: "demo.read",
    name: "Demo read",
    requiredPermissions: ["read"],
    risk: "low",
    availability: "available",
    executable: true,
    ...overrides,
  };
}

describe("skill plane", () => {
  it("rejects malformed identity and duplicate ids", () => {
    expect(validateSkill(skill({ id: "  " }))).toContain("Skill id is required.");
    expect(validateSkill(skill({ version: "" }))).toContain("Skill version is required.");
    const registry = new InMemorySkillRegistry();
    registry.register(skill());
    expect(() => registry.register(skill())).toThrow(/already registered/);
    expect(() => registry.register(skill({ id: "", name: "x" }))).toThrow(/Invalid skill/);
  });

  it("discovers deterministically by namespace, name, then version", () => {
    const registry = new InMemorySkillRegistry();
    registry.register(skill({ id: "b", name: "Beta", namespace: "z", version: "1.0.0", tags: ["review"] }));
    registry.register(skill({ id: "a", name: "Alpha", namespace: "a", version: "2.0.0", description: "repository metadata" }));
    registry.register(skill({ id: "c", name: "Alpha", namespace: "a", version: "1.0.0" }));
    expect(registry.discover().map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(registry.discover({ namespace: "a" }).map((item) => item.id)).toEqual(["c", "a"]);
    expect(registry.discover({ tags: ["review"] }).map((item) => item.id)).toEqual(["b"]);
    expect(registry.discover({ query: "REPOSITORY" }).map((item) => item.id)).toEqual(["a"]);
  });

  it("does not treat planned or unavailable capabilities as satisfying a requirement", () => {
    const resolution = resolveSkill(
      skill(),
      [capability({ availability: "planned" }), capability({ id: "other", availability: "unavailable" })],
      new DefaultNexusPolicy(),
      "actor",
    );
    expect(resolution.composable).toBe(false);
    expect(resolution.missing).toEqual(["demo.read"]);
  });

  it("denies composability when policy denies the only match", () => {
    const resolution = resolveSkill(
      skill(),
      [capability({ executable: false, unexecutableReason: "no adapter" })],
      new DefaultNexusPolicy(),
      "actor",
    );
    expect(resolution.composable).toBe(false);
    expect(resolution.denied).toEqual(["demo.read"]);
    expect(resolution.requirements[0].policyReasons?.[0]).toMatch(/no adapter/);
  });

  it("requires approval without silently denying an allowed high-risk capability", () => {
    const resolution = resolveSkill(
      skill({ requirements: [{ key: "demo.write", requiredPermissions: ["execute"] }] }),
      [capability({ id: "demo.write", key: "demo.write", requiredPermissions: ["execute"], risk: "high" })],
      new DefaultNexusPolicy(),
      "actor",
    );
    expect(resolution.composable).toBe(true);
    expect(resolution.approvalRequired).toBe(true);
    expect(resolution.requirements[0].requiresApproval).toBe(true);
    expect(resolution.denied).toEqual([]);
  });
});
