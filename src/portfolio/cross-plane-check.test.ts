import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CANONICAL_POSTURES, compareVocabulary, extractPostures } from "../../scripts/cross-plane-check.mjs";

describe("cross-plane posture vocabulary", () => {
  it("extracts both object-style and string-return styles", () => {
    expect(extractPostures("return { posture: 'ready' }; if (x) return 'cold_start';")).toEqual(["cold_start", "ready"]);
  });

  it("Resonance's own classifier emits exactly the canonical vocabulary", () => {
    const src = readFileSync("scripts/portfolio-posture.mjs", "utf8");
    expect(extractPostures(src)).toEqual([...CANONICAL_POSTURES].sort());
  });

  it("flags an unknown posture as drift and a subset as ok", () => {
    expect(compareVocabulary("x", ["ready", "warming"]).ok).toBe(false);
    const subset = compareVocabulary("q", ["ready", "cold_start"]);
    expect(subset.ok).toBe(true);
    expect(subset.missing).toContain("stranger");
  });
});
