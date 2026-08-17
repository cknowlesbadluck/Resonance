import { describe, expect, it } from "vitest";
import { listCapabilities, resolveCapabilities } from "./capabilities";

describe("capability plane", () => {
  it("registers skills, tools and integrations", () => {
    const kinds = new Set(listCapabilities().map(capability => capability.kind));
    expect(kinds).toEqual(new Set(["skill", "tool", "integration"]));
  });

  it("resolves dependencies before the requested skill", () => {
    const result = resolveCapabilities(["skill.ios-swiftui"]);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual([]);
    expect(result.resolved.map(capability => capability.id)).toEqual([
      "tool.github",
      "skill.ios-swiftui"
    ]);
  });

  it("reports unavailable planned capabilities without pretending they work", () => {
    const result = resolveCapabilities(["integration.kora"]);
    expect(result.resolved).toEqual([]);
    expect(result.unavailable).toEqual(["integration.kora"]);
  });
});
