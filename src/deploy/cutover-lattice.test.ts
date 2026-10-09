import { describe, expect, it } from "vitest";
import { classifyHost, decideCutover, discretionaryOpen } from "./cutover-lattice";

describe("cutover lattice", () => {
  it("admits only the owner gate for the live portfolio", () => {
    const decision = decideCutover({
      hosts: [
        { name: "conduit", httpStatus: 200, missingRequired: [] },
        { name: "resonance", httpStatus: 503, missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"], bodyHasContractRevision: false, bodyHasOwnerActionRequired: false },
        { name: "supabase:Resonance", httpStatus: null, projectPaused: true },
        { name: "vercel", httpStatus: 404, deploymentNotFound: true },
      ],
      repos: [
        { repo: "Conduit", openPullRequests: 5, keepRed: 4 },
        { repo: "Resonance", openPullRequests: 1, keepRed: 0 },
        { repo: "QuicksilverV1", openPullRequests: 2, keepRed: 0 },
      ],
      legacyQuicksilverArchived: true,
      latticeFamilyOpen: true,
      openPullNumbers: [187, 154, 242, 209],
    });
    expect(classifyHost({ name: "vercel", httpStatus: 404, deploymentNotFound: true })).toBe("alias_absent");
    expect(classifyHost({ name: "supabase:Resonance", httpStatus: null, projectPaused: true })).toBe("project_paused");
    expect(discretionaryOpen({ repo: "Conduit", openPullRequests: 5, keepRed: 4 })).toBe(1);
    expect(decision.admittedPhase).toBe("p0_owner_gates");
    expect(decision.admission).toBe("owner_only");
    expect(decision.entropyBreach).toBe(false);
    expect(decision.deviceFence).toBe("landed_unverified");
    expect(decision.revision).toBe("2026-10-09-landed-fence");
    expect(decision.ownerActions.join(" ")).toContain("Do not invent");
    expect(decision.ownerActions.join(" ")).toContain("83f13504");
  });

  it("refuses to hold the landed device fence as open", () => {
    expect(() => decideCutover({
      hosts: [{ name: "resonance", httpStatus: 503, missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"] }],
      repos: [],
      openPullNumbers: [241],
    })).toThrow(/refusing to hold landed pull/);
  });
});
