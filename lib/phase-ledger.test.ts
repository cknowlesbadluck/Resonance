import { describe, expect, it } from "vitest";
import { advanceLedger, classifyAlias, classifyPull, type HostProbe, type OpenPull } from "./phase-ledger";

const conduit: HostProbe = {
  service: "conduit",
  httpStatus: 200,
  persistence: "postgres",
  contractRevision: "2026-10-03-ready-surface",
};
const resonanceBlocked: HostProbe = {
  service: "resonance",
  httpStatus: 503,
  missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
  bodyHasOwnerAction: false,
};
const alias: HostProbe = { service: "vercel_alias", httpStatus: 404, alias: "absent" };
const pulls: OpenPull[] = [
  { repo: "Conduit", number: 182, title: "feat: project-agnostic degrade planner", draft: false, doNotMerge: false },
  { repo: "Conduit", number: 181, title: "bolt/avoid-event-publisher-array-allocation", draft: false, doNotMerge: false },
  { repo: "Conduit", number: 119, title: "DRAFT KEEP RED: Add explicit ordered database migrations", draft: true, doNotMerge: true },
  { repo: "Conduit", number: 155, title: "DB TLS: verify Postgres certificates by default (DO NOT MERGE until Render env is set)", draft: false, doNotMerge: true },
];

describe("phase ledger", () => {
  it("stays on the owner gate and does not treat a missing alias as that gate", () => {
    const state = advanceLedger({ probes: [conduit, resonanceBlocked, alias], pulls });
    expect(state.phase).toBe(1);
    expect(state.reason).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(state.reason).toContain("alias is absent");
    expect(classifyAlias(alias)).toBe("alias_absent");
  });

  it("classifies bolt noise and keep-red without closing either", () => {
    expect(classifyPull(pulls[1])).toBe("collapse_candidate");
    expect(classifyPull(pulls[2])).toBe("keep_red");
    expect(classifyPull(pulls[0])).toBe("refresh_in_place");
  });

  it("refuses release lock before the device gate", () => {
    const ready: HostProbe = { service: "resonance", httpStatus: 200, missingRequired: [], bodyHasOwnerAction: false };
    const state = advanceLedger({
      probes: [conduit, ready],
      pulls: [],
      tlsEnvSet: true,
      capabilityPlaneShipped: true,
      deviceHgPassed: false,
      legacyArchived: true,
      chamberLifecycleShipped: true,
      observabilityShipped: true,
    });
    expect(state.phase).toBe(5);
    expect(state.reason).toContain("iPhone 16e");
  });
});
