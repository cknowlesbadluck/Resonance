import { describe, expect, it } from "vitest";
import { sortCapabilities } from "./capabilities";
import type { NexusCapability } from "./types";

const capability = (id: string, risk: NexusCapability["risk"], availability: NexusCapability["availability"], cost?: number): NexusCapability => ({
  id, key: "demo.read", name: id, risk, availability, requiredPermissions: [], cost,
});

describe("capability ranking", () => {
  it("prefers available capabilities, then lower risk, then lower cost", () => {
    const ranked = sortCapabilities([
      capability("unavailable-low", "low", "unavailable", 1),
      capability("available-high", "high", "available", 1),
      capability("available-low-expensive", "low", "available", 10),
      capability("available-low-cheap", "low", "available", 2),
    ]);
    expect(ranked.map((item) => item.id)).toEqual([
      "available-low-cheap",
      "available-low-expensive",
      "available-high",
      "unavailable-low",
    ]);
  });
});
