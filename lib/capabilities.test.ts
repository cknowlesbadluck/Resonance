import { describe, expect, it } from "vitest";
import { listCapabilities, resolveCapabilities } from "./capabilities";

describe("capability plane", () => {
  it("registers skills, tools and integrations", () => {
    const kinds = new Set(listCapabilities().map(capability => capability.kind));
    expect(kinds).toEqual(new Set(["skill", "tool", "integration"]));
  });

  it("resolves dependencies before the requested capability", () => {
    const result = resolveCapabilities(["skill.ios-swiftui"]);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual([]);
    expect(result.resolved.map(capability => capability.id)).toEqual([
      "tool.github",
      "skill.ios-swiftui"
    ]);
  });

  it("reports planned capabilities as unavailable", () => {
    const result = resolveCapabilities(["integration.kora"]);
    expect(result.resolved).toEqual([]);
    expect(result.unavailable).toEqual(["integration.kora"]);
  });

  it("reports missing dependencies instead of fabricating them", () => {
    const result = resolveCapabilities(["missing.capability"]);
    expect(result.resolved).toEqual([]);
    expect(result.missing).toEqual(["missing.capability"]);
  });

  it("resolves capabilities from a custom catalog", () => {
    const customCatalog = [
      { id: "custom.skill", name: "Custom Skill", description: "A custom skill", kind: "skill" as const, provider: "Custom", version: "1.0.0", status: "available" as const, permissions: [], dependencies: [], tags: [] }
    ];
    const result = resolveCapabilities(["custom.skill"], customCatalog);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual([]);
    expect(result.resolved.map(capability => capability.id)).toEqual(["custom.skill"]);

    const missingResult = resolveCapabilities(["skill.ios-swiftui"], customCatalog);
    expect(missingResult.missing).toEqual(["skill.ios-swiftui"]);
  });
});
