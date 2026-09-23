import { describe, expect, it } from "vitest";
import { InMemoryCapabilityRegistry } from "./registry";
import type { NexusCapability, CapabilityRequirement } from "./types";

const makeCapability = (
  id: string,
  risk: NexusCapability["risk"],
  availability: NexusCapability["availability"],
  key: string = "demo.read",
  extras: Partial<NexusCapability> = {},
): NexusCapability => ({
  id,
  key,
  name: id,
  risk,
  availability,
  requiredPermissions: [],
  ...extras,
});

describe("InMemoryCapabilityRegistry", () => {
  it("registers and lists capabilities", () => {
    const registry = new InMemoryCapabilityRegistry();
    const cap1 = makeCapability("c1", "low", "available");
    const cap2 = makeCapability("c2", "medium", "available", "demo.write");

    registry.register(cap1);
    registry.register(cap2);

    const listed = registry.list();
    expect(listed).toHaveLength(2);
    expect(listed).toContainEqual(cap1);
    expect(listed).toContainEqual(cap2);
  });

  it("findByCapability filters out non-matching capabilities", () => {
    const registry = new InMemoryCapabilityRegistry();
    const cap1 = makeCapability("c1", "low", "available", "demo.read");
    const cap2 = makeCapability("c2", "medium", "available", "demo.write");
    const cap3 = makeCapability("c3", "low", "available", "demo.read", { resourceType: "file" });

    registry.register(cap1);
    registry.register(cap2);
    registry.register(cap3);

    const req: CapabilityRequirement = { key: "demo.read", resourceType: "file" };
    const matches = registry.findByCapability(req);

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("c3");
  });

  it("findByCapability sorts capabilities via sortCapabilities", () => {
    const registry = new InMemoryCapabilityRegistry();
    const capExpensive = makeCapability("c-expensive", "low", "available", "demo.read", { cost: 10 });
    const capCheap = makeCapability("c-cheap", "low", "available", "demo.read", { cost: 1 });
    const capHighRisk = makeCapability("c-high-risk", "high", "available", "demo.read");

    registry.register(capExpensive);
    registry.register(capHighRisk);
    registry.register(capCheap);

    const req: CapabilityRequirement = { key: "demo.read" };
    const matches = registry.findByCapability(req);

    // Should prefer lower risk, then lower cost
    expect(matches.map((c) => c.id)).toEqual([
      "c-cheap",
      "c-expensive",
      "c-high-risk",
    ]);
  });

  it("findByCapability returns an empty array when no capability matches", () => {
    const registry = new InMemoryCapabilityRegistry();
    const cap1 = makeCapability("c1", "low", "available", "demo.read");
    registry.register(cap1);

    const req: CapabilityRequirement = { key: "demo.write" }; // Different key
    const matches = registry.findByCapability(req);

    expect(matches).toEqual([]);
  });

  it("findCompatible aliases findByCapability", () => {
    const registry = new InMemoryCapabilityRegistry();
    const cap1 = makeCapability("c1", "low", "available", "demo.read");
    registry.register(cap1);

    const req: CapabilityRequirement = { key: "demo.read" };

    const findByCap = registry.findByCapability(req);
    const findComp = registry.findCompatible(req);

    expect(findComp).toEqual(findByCap);
  });

  it("replaces capability registered with the same id", () => {
    const registry = new InMemoryCapabilityRegistry();
    const cap1 = makeCapability("c1", "low", "available", "demo.read");
    const cap2 = makeCapability("c1", "high", "available", "demo.read", { description: "updated" });

    registry.register(cap1);
    registry.register(cap2);

    const listed = registry.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].description).toBe("updated");
  });
});
