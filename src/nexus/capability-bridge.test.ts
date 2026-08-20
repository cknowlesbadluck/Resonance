import { describe, expect, it } from "vitest";
import { catalogToNexus, listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "./capability-bridge";

describe("capability bridge → NexusCapability", () => {
  it("maps catalog entries to NexusCapability shape", () => {
    const list = listNexusCapabilitiesFromCatalog();
    expect(list.length).toBeGreaterThan(0);
    const sample = list[0];
    expect(sample).toMatchObject({
      id: expect.any(String),
      key: expect.any(String),
      name: expect.any(String),
      requiredPermissions: expect.any(Array),
      risk: expect.any(String),
    });
    expect(sample.kind).toBeDefined();
  });

  it("resolves dependencies into NexusCapability list", () => {
    const result = resolveNexusCapabilities(["skill.ios-swiftui"]);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual([]);
    expect(result.resolved.map((c) => c.key)).toEqual(["tool.github", "skill.ios-swiftui"]);
    expect(result.resolved.every((c) => c.requiredPermissions)).toBe(true);
  });

  it("preserves planned as availability", () => {
    const result = resolveNexusCapabilities(["integration.kora"]);
    expect(result.resolved).toEqual([]);
    expect(result.unavailable).toEqual(["integration.kora"]);
  });
});
