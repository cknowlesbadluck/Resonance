import { describe, expect, it } from "vitest";
import { evaluatePhaseLedger } from "./phaseLedger";

const live = {
  conduitReady: true,
  conduitContractAligned: true,
  publicReadyStatus: 503,
  publicMissingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
  publicHasContractRevision: false,
  publicHasOwnerActionRequired: false,
  aliasKind: "alias_absent" as const,
  openRedDrafts: 4,
  legacyArchiveStatus: 403,
};

describe("phase ledger", () => {
  it("marks the live owner gate as not agent work and Conduit parity as met", () => {
    const phases = evaluatePhaseLedger(live);
    expect(phases).toHaveLength(10);
    expect(phases[0].state).toBe("not_agent_work");
    expect(phases[2].state).toBe("met");
    expect(phases[1].state).toBe("blocked");
    expect(phases[9].state).toBe("blocked");
  });

  it("does not treat a 200 as proof of cross-plane acceptance", () => {
    const phases = evaluatePhaseLedger({
      ...live,
      publicReadyStatus: 200,
      publicMissingRequired: [],
      publicHasContractRevision: true,
      publicHasOwnerActionRequired: true,
    });
    expect(phases[0].state).toBe("met");
    expect(phases[9].state).toBe("open");
  });
});
