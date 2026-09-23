import { describe, expect, it, beforeEach } from "vitest";
import { InMemorySkillRegistry, validateSkill } from "./skills";
import type { NexusSkill } from "./types";

describe("Skills Registry", () => {
  describe("validateSkill", () => {
    it("should return empty array for valid skill", () => {
      const validSkill: NexusSkill = {
        id: "test-skill-1",
        name: "Test Skill",
        namespace: "test",
        version: "1.0.0",
        requirements: [],
      };
      expect(validateSkill(validSkill)).toEqual([]);
    });

    it("should return errors for missing required fields", () => {
      const invalidSkill = {} as NexusSkill;
      const errors = validateSkill(invalidSkill);
      expect(errors).toContain("Skill id is required.");
      expect(errors).toContain("Skill name is required.");
      expect(errors).toContain("Skill namespace is required.");
      expect(errors).toContain("Skill version is required.");
      expect(errors).toContain("Skill requirements must be an array.");
    });

    it("should return errors for empty string fields", () => {
      const invalidSkill: NexusSkill = {
        id: "   ",
        name: " ",
        namespace: "",
        version: " \t ",
        requirements: [] as any,
      };
      const errors = validateSkill(invalidSkill);
      expect(errors).toContain("Skill id is required.");
      expect(errors).toContain("Skill name is required.");
      expect(errors).toContain("Skill namespace is required.");
      expect(errors).toContain("Skill version is required.");
    });
  });

  describe("InMemorySkillRegistry", () => {
    let registry: InMemorySkillRegistry;
    let baseSkill: NexusSkill;

    beforeEach(() => {
      registry = new InMemorySkillRegistry();
      baseSkill = {
        id: "skill-1",
        name: "My Skill",
        namespace: "system",
        version: "1.0.0",
        description: "A test skill",
        tags: ["core", "test"],
        requirements: [],
      };
    });

    describe("register and get", () => {
      it("should successfully register and retrieve a skill", () => {
        registry.register(baseSkill);
        const retrieved = registry.get("skill-1");
        expect(retrieved).toEqual(baseSkill);
        expect(retrieved).not.toBe(baseSkill); // Should be a clone
      });

      it("should throw error if skill is invalid", () => {
        const invalidSkill = { ...baseSkill, name: "" };
        expect(() => registry.register(invalidSkill)).toThrow(/Invalid skill: Skill name is required./);
      });

      it("should throw error if skill id is already registered", () => {
        registry.register(baseSkill);
        expect(() => registry.register(baseSkill)).toThrow("Skill skill-1 is already registered.");
      });

      it("should return undefined for non-existent skill", () => {
        expect(registry.get("non-existent")).toBeUndefined();
      });
    });

    describe("discover", () => {
      beforeEach(() => {
        registry.register(baseSkill);
        registry.register({
          id: "skill-2",
          name: "Other Skill",
          namespace: "user",
          version: "2.0.0",
          description: "Another skill",
          tags: ["addon"],
          requirements: [],
        });
        registry.register({
          id: "skill-3",
          name: "Third Skill",
          namespace: "system",
          version: "1.1.0",
          tags: ["core", "addon"],
          requirements: [],
        });
      });

      it("should return all skills if no filter is provided", () => {
        const skills = registry.discover();
        expect(skills.length).toBe(3);
      });

      it("should filter by namespace", () => {
        const skills = registry.discover({ namespace: "system" });
        expect(skills.length).toBe(2);
        expect(skills.map((s) => s.id)).toContain("skill-1");
        expect(skills.map((s) => s.id)).toContain("skill-3");
      });

      it("should filter by tags (must contain all tags)", () => {
        const skills1 = registry.discover({ tags: ["core"] });
        expect(skills1.length).toBe(2);

        const skills2 = registry.discover({ tags: ["core", "addon"] });
        expect(skills2.length).toBe(1);
        expect(skills2[0].id).toBe("skill-3");
      });

      it("should filter by query (matching name, description, or id)", () => {
        const skills1 = registry.discover({ query: "other" });
        expect(skills1.length).toBe(1);
        expect(skills1[0].id).toBe("skill-2");

        const skills2 = registry.discover({ query: "skill-3" }); // match ID
        expect(skills2.length).toBe(1);
        expect(skills2[0].id).toBe("skill-3");

        const skills3 = registry.discover({ query: "test skill" }); // match description
        expect(skills3.length).toBe(1);
        expect(skills3[0].id).toBe("skill-1");
      });

      it("should combine filters", () => {
        const skills = registry.discover({ namespace: "system", tags: ["core"], query: "my skill" });
        expect(skills.length).toBe(1);
        expect(skills[0].id).toBe("skill-1");
      });

      it("should return a sorted array of cloned skills", () => {
        const skills = registry.discover();
        expect(skills[0].namespace).toBe("system");
        expect(skills[1].namespace).toBe("system");
        expect(skills[2].namespace).toBe("user");
        expect(skills[0]).not.toBe(registry.get(skills[0].id)); // Must be clones
      });
    });

    describe("remove", () => {
      it("should remove a registered skill", () => {
        registry.register(baseSkill);
        expect(registry.remove("skill-1")).toBe(true);
        expect(registry.get("skill-1")).toBeUndefined();
      });

      it("should return false if skill does not exist", () => {
        expect(registry.remove("non-existent")).toBe(false);
      });
    });
  });
});
