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

  it("detects dependency cycles and throws descriptive error", () => {
    const cyclicCatalog = [
      {
        id: "tool.a",
        name: "Tool A",
        description: "Cyclic tool A",
        kind: "tool" as const,
        provider: "test",
        version: "1.0.0",
        status: "available" as const,
        permissions: [],
        dependencies: [{ id: "tool.b", kind: "tool" as const }],
        tags: [],
      },
      {
        id: "tool.b",
        name: "Tool B",
        description: "Cyclic tool B",
        kind: "tool" as const,
        provider: "test",
        version: "1.0.0",
        status: "available" as const,
        permissions: [],
        dependencies: [{ id: "tool.a", kind: "tool" as const }],
        tags: [],
      },
    ];

    expect(() => resolveCapabilities(["tool.a"], cyclicCatalog)).toThrow(
      "Capability dependency cycle detected at tool.a"
    );
  });

  it("detects self-referencing dependency cycles", () => {
    const selfCyclicCatalog = [
      {
        id: "tool.self",
        name: "Self Tool",
        description: "Self cyclic tool",
        kind: "tool" as const,
        provider: "test",
        version: "1.0.0",
        status: "available" as const,
        permissions: [],
        dependencies: [{ id: "tool.self", kind: "tool" as const }],
        tags: [],
      },
    ];

    expect(() => resolveCapabilities(["tool.self"], selfCyclicCatalog)).toThrow(
      "Capability dependency cycle detected at tool.self"
    );
  });
});
