import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "./nexus-catalog";
import type { NexusCapability } from "../src/nexus/types";

const bindGitHub = (capability: NexusCapability) => (capability.providerId === "GitHub" ? "github" : undefined);

const capabilityMigration = readFileSync(
  new URL("../supabase/migrations/20261111000000_nexus_capabilities_sync.sql", import.meta.url),
  "utf8",
);

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

  it("seeds providers against the live name/type/metadata schema", () => {
    expect(capabilityMigration).toContain("INSERT INTO public.providers (name, type, metadata)");
    expect(capabilityMigration).toContain("existing.metadata->>'key'");
    expect(capabilityMigration).not.toMatch(/providers\s*\(key\s*,\s*name\s*,\s*category\)/i);
    expect(capabilityMigration).not.toMatch(/ON CONFLICT\s*\(key\)/i);
  });

  it("keeps the global catalog read-only to anon/authenticated clients", () => {
    expect(capabilityMigration).toContain("DROP POLICY IF EXISTS nexus_capabilities_member_all");
    expect(capabilityMigration).toContain("CREATE POLICY nexus_capabilities_global_read");
    expect(capabilityMigration).toContain("FOR SELECT TO authenticated");
    expect(capabilityMigration).toContain("CREATE POLICY nexus_capabilities_member_write");
    expect(capabilityMigration).toContain("REVOKE ALL ON TABLE public.nexus_capabilities FROM anon, authenticated");
    expect(capabilityMigration).not.toMatch(/GRANT\\s+[^;]+\\s+TO\\s+anon/i);
    expect(capabilityMigration).toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nexus_capabilities TO authenticated");
    expect(capabilityMigration).not.toMatch(/CREATE POLICY[^;]+TO public/i);
  });

  it("preserves legacy capability tables until their data is migrated", () => {
    expect(capabilityMigration.toLowerCase()).not.toContain("drop table if exists public.capabilities");
    expect(capabilityMigration.toLowerCase()).not.toContain("drop table if exists public.capability_dependencies");
  });

  it("allows planned capabilities before seeding the catalog", () => {
    expect(capabilityMigration).toContain("check (availability in ('available', 'degraded', 'unavailable', 'planned'))");
  });

  it("reports missing dependencies instead of fabricating them", () => {
    const result = resolveNexusCapabilities(["missing.capability"]);
    expect(result.resolved).toEqual([]);
    expect(result.missing).toEqual(["missing.capability"]);
  });
});
