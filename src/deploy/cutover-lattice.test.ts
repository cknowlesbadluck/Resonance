import { describe, expect, it } from "vitest";
import { classifyHost, decideCutover, discretionaryOpen } from "./cutover-lattice";

describe("cutover lattice", () => {
  it("admits only the owner gate for the live portfolio", () => {
    const decision = decideCutover({
      hosts: [
        { name: "conduit", httpStatus: 200, missingRequired: [] },
        { name: "resonance", httpStatus: 503, missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"], bodyHasContractRevision: false, bodyHasOwnerActionRequired: false },
        { name: "vercel", httpStatus: 404, deploymentNotFound: true },
      ],
      repos: [{ repo: "QuicksilverV1", openPullRequests: 3, keepRed: 0 }],
      legacyQuicksilverArchived: true,
      latticeFamilyOpen: true,
    });
    expect(classifyHost({ name: "vercel", httpStatus: 404, deploymentNotFound: true })).toBe("alias_absent");
    expect(discretionaryOpen({ repo: "Conduit", openPullRequests: 5, keepRed: 4 })).toBe(1);
    expect(decision.admittedPhase).toBe("p0_owner_gates");
    expect(decision.admission).toBe("owner_only");
    expect(decision.entropyBreach).toBe(true);
    expect(decision.ownerActions.join(" ")).toContain("Do not invent");
  });
});
