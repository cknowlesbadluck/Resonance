import { describe, expect, it } from "vitest";
import { sortCapabilities } from "./capabilities";
import type { NexusCapability } from "./types";

const capability = (
  id: string,
  risk: NexusCapability["risk"],
  availability: NexusCapability["availability"],
  cost?: number,
  extras: Partial<NexusCapability> = {},
): NexusCapability => ({
  id,
  key: "demo.read",
  name: id,
  risk,
  availability,
  requiredPermissions: [],
  cost,
  ...extras,
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

  it("breaks remaining ties by latency, then provider, then id", () => {
    const ranked = sortCapabilities([
      capability("zeta", "low", "available", 1, { latencyMs: 40, providerId: "b" }),
      capability("alpha", "low", "available", 1, { latencyMs: 40, providerId: "b" }),
      capability("mid", "low", "available", 1, { latencyMs: 40, providerId: "a" }),
      capability("fast", "low", "available", 1, { latencyMs: 10, providerId: "z" }),
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["fast", "mid", "alpha", "zeta"]);
  });
});
