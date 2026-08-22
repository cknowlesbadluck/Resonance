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

  it("resolves dependencies into deterministic NexusCapability order", () => {
    const first = resolveNexusCapabilities(["skill.ios-swiftui"]);
    const second = resolveNexusCapabilities(["skill.ios-swiftui"]);
    expect(first).toEqual(second);
    expect(first.missing).toEqual([]);
    expect(first.unavailable).toEqual([]);
    expect(first.resolved.map((c) => c.key)).toEqual(["tool.github", "skill.ios-swiftui"]);
    expect(first.resolved.every((c) => c.requiredPermissions)).toBe(true);
  });

  it("reports missing capabilities without throwing", () => {
    const result = resolveNexusCapabilities(["capability.does-not-exist"]);
    expect(result.resolved).toEqual([]);
    expect(result.missing).toEqual(["capability.does-not-exist"]);
    expect(result.unavailable).toEqual([]);
  });

  it("preserves planned as unavailable", () => {
    const result = resolveNexusCapabilities(["integration.kora"]);
    expect(result.resolved).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual(["integration.kora"]);
  });
});
