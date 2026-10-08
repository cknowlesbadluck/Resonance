import { describe, expect, it } from "vitest";
import { bindingPhase, evaluatePhases } from "./phaseLedger";

describe("phase ledger", () => {
  it("binds the 2026-10-08 portfolio on the owner secret, not the absent alias", () => {
    const phases = evaluatePhases({
      conduitReady: true,
      resonanceStatus: 503,
      resonanceMissing: ["SUPABASE_SERVICE_ROLE_KEY"],
      resonanceLeaksContract: false,
      vercelAliasAbsent: true,
      witnessBudgetSpent: true,
      hardwareRunRecorded: false,
    });
    expect(phases).toHaveLength(10);
    expect(phases[0].state).toBe("owner_blocked");
    expect(phases[2].state).toBe("met");
    expect(bindingPhase(phases)).toBe(1);
  });

  it("treats a contract field on the public ready body as not an owner gate", () => {
    const phases = evaluatePhases({
      conduitReady: true,
      resonanceStatus: 503,
      resonanceMissing: ["SUPABASE_SERVICE_ROLE_KEY"],
      resonanceLeaksContract: true,
      vercelAliasAbsent: true,
      witnessBudgetSpent: true,
      hardwareRunRecorded: false,
    });
    expect(phases[0].state).toBe("open");
  });
});
