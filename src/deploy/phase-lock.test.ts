import { describe, expect, it } from "vitest";
import { decidePhaseLock, disposePull, KEEP_RED, type OpenPull } from "./phase-lock";

const pulls: OpenPull[] = [
  { repo: "Resonance", number: 154, title: "feat: portfolio cutover lattice" },
  { repo: "Resonance", number: 153, title: "feat: entropy governor for witness budget and keep-red" },
  { repo: "Resonance", number: 151, title: "feat: degrade planner for host probes" },
  { repo: "Resonance", number: 150, title: "feat: pin public ready body to the owner-gate contract" },
  { repo: "QuicksilverV1", number: 241, title: "feat: refuse device acceptance on gateway health" },
];

describe("phase lock", () => {
  it("closes superseded families and never opens a new witness", () => {
    const decision = decidePhaseLock({ latticeOpen: true, pulls });
    expect(decision.openNewWitness).toBe(false);
    expect(decision.revision).toBe("2026-10-08-2300-collapse");
    expect(decision.closeNumbers.sort((a, b) => a - b)).toEqual([150, 151, 153]);
    expect(decision.holdNumbers).toContain(241);
    for (const number of KEEP_RED) {
      expect(disposePull({ repo: "Conduit", number, title: "keep" }, true)).toBe("keep_red");
    }
  });

  it("holds older families when the lattice pull is absent", () => {
    expect(disposePull({ repo: "Resonance", number: 153, title: "feat: entropy governor" }, false)).toBe("hold");
  });
});
