import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryCapabilityRegistry } from "./registry";
import type { NexusCapability, CapabilityRequirement } from "./types";

describe("InMemoryCapabilityRegistry", () => {
  let registry: InMemoryCapabilityRegistry;

  const mockCapability1: NexusCapability = {
    id: "cap-1",
    key: "test.capability",
    name: "Test Capability 1",
    description: "A test capability",
    version: "1.0.0",
    risk: "low",
    requiredPermissions: [],
    availability: "available",
  };

  const mockCapability2: NexusCapability = {
    id: "cap-2",
    key: "test.capability.another",
    name: "Test Capability 2",
    description: "Another test capability",
    version: "1.0.0",
    risk: "low",
    requiredPermissions: [],
    availability: "available",
  };

  const mockCapability3: NexusCapability = {
    id: "cap-3",
    key: "test.capability",
    name: "Test Capability 3 (High Risk)",
    description: "A high risk test capability",
    version: "1.0.0",
    risk: "high",
    requiredPermissions: [],
    availability: "available",
  };

  beforeEach(() => {
    registry = new InMemoryCapabilityRegistry();
  });

  describe("register and list", () => {
    it("should register a capability and return it in the list", () => {
      registry.register(mockCapability1);

      const capabilities = registry.list();
      expect(capabilities).toHaveLength(1);
      expect(capabilities[0]).toEqual(mockCapability1);
    });

    it("should register multiple capabilities", () => {
      registry.register(mockCapability1);
      registry.register(mockCapability2);

      const capabilities = registry.list();
      expect(capabilities).toHaveLength(2);
      expect(capabilities).toContainEqual(mockCapability1);
      expect(capabilities).toContainEqual(mockCapability2);
    });

    it("should overwrite a capability if registered with the same id", () => {
      registry.register(mockCapability1);

      const updatedCapability = { ...mockCapability1, name: "Updated Name" };
      registry.register(updatedCapability);

      const capabilities = registry.list();
      expect(capabilities).toHaveLength(1);
      expect(capabilities[0]).toEqual(updatedCapability);
    });
  });

  describe("findByCapability", () => {
    beforeEach(() => {
      registry.register(mockCapability1); // test.capability, low risk
      registry.register(mockCapability2); // test.capability.another, low risk
      registry.register(mockCapability3); // test.capability, high risk
    });

    it("should return capabilities matching the key", () => {
      const requirement: CapabilityRequirement = { key: "test.capability" };
      const matches = registry.findByCapability(requirement);

      expect(matches).toHaveLength(2);
      expect(matches).toContainEqual(mockCapability1);
      expect(matches).toContainEqual(mockCapability3);
      expect(matches).not.toContainEqual(mockCapability2);
    });

    it("should filter capabilities based on risk requirement", () => {
      const requirement: CapabilityRequirement = { key: "test.capability", maxRisk: "medium" };
      const matches = registry.findByCapability(requirement);

      expect(matches).toHaveLength(1);
      expect(matches).toContainEqual(mockCapability1); // low risk matches
      // mockCapability3 is high risk, so it should be filtered out
    });

    it("should return an empty array if no capabilities match", () => {
      const requirement: CapabilityRequirement = { key: "non.existent.capability" };
      const matches = registry.findByCapability(requirement);

      expect(matches).toHaveLength(0);
    });

    it("should return sorted capabilities", () => {
      const requirement: CapabilityRequirement = { key: "test.capability" };
      const matches = registry.findByCapability(requirement);

      // Expected to be sorted by risk, so low risk (mockCapability1) should come before high risk (mockCapability3)
      expect(matches[0]).toEqual(mockCapability1);
      expect(matches[1]).toEqual(mockCapability3);
    });
  });

  describe("findCompatible", () => {
    it("should be an alias for findByCapability", () => {
      registry.register(mockCapability1);

      const requirement: CapabilityRequirement = { key: "test.capability" };
      const findByCapabilityResult = registry.findByCapability(requirement);
      const findCompatibleResult = registry.findCompatible(requirement);

      expect(findCompatibleResult).toEqual(findByCapabilityResult);
    });
  });
});
