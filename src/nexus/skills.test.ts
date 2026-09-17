import { describe, expect, it } from "vitest";
import {
  InMemorySkillRegistry,
  resolveSkill,
  validateSkill,
} from "./skills";
import { DefaultNexusPolicy } from "./policy";
import type { NexusCapability, NexusSkill } from "./types";

const sampleSkill: NexusSkill = {
  id: "skill-code-review",
  name: "Code Review",
  namespace: "engineering",
  version: "1.0.0",
  description: "Automated code review skill",
  tags: ["review", "quality"],
  requirements: [{ key: "repo.read" }],
};

const sampleCapability: NexusCapability = {
  id: "cap-repo-read",
  key: "repo.read",
  name: "Repository Read",
  adapterId: "github-1",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
};

describe("validateSkill", () => {
  it("returns no errors for a valid skill", () => {
    expect(validateSkill(sampleSkill)).toEqual([]);
  });

  it("returns errors when required fields are missing or invalid", () => {
    const invalidSkill = {
      id: "  ",
      name: "",
      namespace: "",
      version: "",
      requirements: "invalid" as unknown as [],
    } as NexusSkill;

    const errors = validateSkill(invalidSkill);
    expect(errors).toContain("Skill id is required.");
    expect(errors).toContain("Skill name is required.");
    expect(errors).toContain("Skill namespace is required.");
    expect(errors).toContain("Skill version is required.");
    expect(errors).toContain("Skill requirements must be an array.");
  });
});

describe("InMemorySkillRegistry", () => {
  it("registers and retrieves a valid skill", () => {
    const registry = new InMemorySkillRegistry();
    registry.register(sampleSkill);

    const fetched = registry.get(sampleSkill.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(sampleSkill.id);
    expect(fetched?.name).toBe("Code Review");
  });

  it("throws an error when registering a duplicate skill ID", () => {
    const registry = new InMemorySkillRegistry();
    registry.register(sampleSkill);

    expect(() => registry.register(sampleSkill)).toThrow(
      `Skill ${sampleSkill.id} is already registered.`
    );
  });

  it("throws an error when registering an invalid skill", () => {
    const registry = new InMemorySkillRegistry();
    const invalidSkill: NexusSkill = {
      id: "",
      name: "Bad Skill",
      namespace: "test",
      version: "1.0.0",
      requirements: [],
    };

    expect(() => registry.register(invalidSkill)).toThrow(
      "Invalid skill: Skill id is required."
    );
  });

  it("isolates registered and retrieved skill objects via deep clones", () => {
    const registry = new InMemorySkillRegistry();
    const original: NexusSkill = {
      id: "skill-1",
      name: "Original Name",
      namespace: "ns",
      version: "1.0.0",
      requirements: [],
      tags: ["tag1"],
    };

    registry.register(original);
    original.name = "Mutated Name";
    original.tags?.push("tag2");

    const fetched = registry.get("skill-1");
    expect(fetched?.name).toBe("Original Name");
    expect(fetched?.tags).toEqual(["tag1"]);

    if (fetched) {
      fetched.name = "Mutated Again";
    }

    const fetchedAgain = registry.get("skill-1");
    expect(fetchedAgain?.name).toBe("Original Name");
  });

  it("removes registered skills correctly", () => {
    const registry = new InMemorySkillRegistry();
    registry.register(sampleSkill);

    expect(registry.remove(sampleSkill.id)).toBe(true);
    expect(registry.get(sampleSkill.id)).toBeUndefined();
    expect(registry.remove(sampleSkill.id)).toBe(false);
  });

  it("discovers skills filtered by namespace, tags, query, and sorts them", () => {
    const registry = new InMemorySkillRegistry();
    const skillA: NexusSkill = {
      id: "skill-a",
      name: "Alpha Skill",
      namespace: "frontend",
      version: "1.0.0",
      description: "React component generator",
      tags: ["ui", "react"],
      requirements: [],
    };
    const skillB: NexusSkill = {
      id: "skill-b",
      name: "Beta Skill",
      namespace: "backend",
      version: "2.0.0",
      description: "Database optimizer",
      tags: ["db", "sql"],
      requirements: [],
    };
    const skillC: NexusSkill = {
      id: "skill-c",
      name: "Gamma Skill",
      namespace: "frontend",
      version: "0.9.0",
      description: "UI component linter",
      tags: ["ui", "linter"],
      requirements: [],
    };

    registry.register(skillA);
    registry.register(skillB);
    registry.register(skillC);

    // No filter: sorted by namespace, name, version
    const all = registry.discover();
    expect(all.map((s) => s.id)).toEqual(["skill-b", "skill-a", "skill-c"]);

    // Filter by namespace
    const frontendSkills = registry.discover({ namespace: "frontend" });
    expect(frontendSkills.map((s) => s.id)).toEqual(["skill-a", "skill-c"]);

    // Filter by tags
    const uiSkills = registry.discover({ tags: ["ui"] });
    expect(uiSkills.map((s) => s.id)).toEqual(["skill-a", "skill-c"]);

    // Filter by search query
    const dbSkills = registry.discover({ query: "optimizer" });
    expect(dbSkills.map((s) => s.id)).toEqual(["skill-b"]);
  });
});

describe("resolveSkill", () => {
  const policy = new DefaultNexusPolicy();

  it("resolves a skill with matching capability requirements", () => {
    const resolution = resolveSkill(sampleSkill, [sampleCapability], policy, "user-1");

    expect(resolution.composable).toBe(true);
    expect(resolution.approvalRequired).toBe(false);
    expect(resolution.missing).toHaveLength(0);
    expect(resolution.denied).toHaveLength(0);
    expect(resolution.requirements[0].capability?.id).toBe(sampleCapability.id);
  });

  it("identifies missing capabilities when requirements cannot be met", () => {
    const resolution = resolveSkill(sampleSkill, [], policy, "user-1");

    expect(resolution.composable).toBe(false);
    expect(resolution.missing).toEqual(["repo.read"]);
  });

  it("identifies denied capabilities when blocked by policy", () => {
    const highRiskCapability: NexusCapability = {
      id: "cap-admin-write",
      key: "admin.write",
      name: "Admin Write",
      adapterId: "admin-1",
      requiredPermissions: ["admin"],
      risk: "critical",
      availability: "available",
      tags: ["blocked"],
    };

    const skillRequiringAdmin: NexusSkill = {
      id: "skill-admin",
      name: "Admin Skill",
      namespace: "system",
      version: "1.0.0",
      requirements: [{ key: "admin.write" }],
    };

    const resolution = resolveSkill(skillRequiringAdmin, [highRiskCapability], policy, "user-1");

    expect(resolution.composable).toBe(false);
    expect(resolution.denied).toEqual(["admin.write"]);
    expect(resolution.requirements[0].denied).toBe(true);
  });
});
