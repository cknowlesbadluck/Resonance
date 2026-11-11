import { describe, expect, it } from "vitest";
import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "./nexus-catalog";
import type { NexusCapability } from "../src/nexus/types";

const bindGitHub = (capability: NexusCapability) => (capability.providerId === "GitHub" ? "github" : undefined);

describe("catalog → NexusCapability", () => {
  it("maps catalog entries to the NexusCapability shape", () => {
    const list = listNexusCapabilitiesFromCatalog();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toMatchObject({
      id: expect.any(String),
      key: expect.any(String),
      name: expect.any(String),
      requiredPermissions: expect.any(Array),
      risk: expect.any(String),
    });
    expect(list[0].kind).toBeDefined();
  });

  it("resolves dependencies into a NexusCapability list", () => {
    const result = resolveNexusCapabilities(["skill.ios-swiftui"]);
    expect(result.missing).toEqual([]);
    expect(result.unavailable).toEqual([]);
    expect(result.resolved.map((c) => c.key)).toEqual(["tool.github", "skill.ios-swiftui"]);
  });

  it("preserves planned as availability", () => {
    const result = resolveNexusCapabilities(["integration.kora"]);
    expect(result.resolved).toEqual([]);
    expect(result.unavailable).toEqual(["integration.kora"]);
  });

  it("derives risk from declared grants instead of a constant", () => {
    const risks = new Set(listNexusCapabilitiesFromCatalog().map((c) => c.risk));
    expect(risks.size).toBeGreaterThan(1);
    const github = listNexusCapabilitiesFromCatalog().find((c) => c.id === "tool.github");
    // repo.write → modify, pr.write → create_pr ⇒ high
    expect(github?.risk).toBe("high");
  });

  it("marks capabilities with no bound adapter as not executable, with a reason", () => {
    const unbound = listNexusCapabilitiesFromCatalog();
    expect(unbound.every((c) => c.executable === false)).toBe(true);
    expect(unbound[0].unexecutableReason).toContain("No adapter is bound");

    const bound = listNexusCapabilitiesFromCatalog(bindGitHub);
    const github = bound.find((c) => c.id === "tool.github");
    expect(github?.executable).toBe(true);
    expect(github?.adapterId).toBe("github");
    expect(github?.unexecutableReason).toBeUndefined();
  });

  it("passes the fully hydrated capability to custom adapter bindings", () => {
    const bound = listNexusCapabilitiesFromCatalog((capability) =>
      capability.kind === "tool" && capability.requiredPermissions.includes("repo.write")
        ? "write-capable-tool"
        : undefined,
    );
    const github = bound.find((capability) => capability.id === "tool.github");
    expect(github?.adapterId).toBe("write-capable-tool");
  });

  it("does not expose the catalog dependency arrays to caller mutation", () => {
    const listed = listNexusCapabilitiesFromCatalog();
    const skill = listed.find((capability) => capability.id === "skill.ios-swiftui");
    skill?.dependencies?.splice(0);

    const resolved = resolveNexusCapabilities(["skill.ios-swiftui"]);
    expect(resolved.resolved.map((capability) => capability.key)).toEqual([
      "tool.github",
      "skill.ios-swiftui",
    ]);
  });

  it("reports missing dependencies instead of fabricating them", () => {
    const result = resolveNexusCapabilities(["missing.capability"]);
    expect(result.resolved).toEqual([]);
    expect(result.missing).toEqual(["missing.capability"]);
  });
});
