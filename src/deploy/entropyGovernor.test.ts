import { describe, expect, it } from "vitest";
import { admitWork, bindingConstraint, classifyProbe } from "./entropyGovernor";

const liveReady = {
  status: "not_ready",
  service: "resonance-nexus",
  missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
  authMode: "required",
  authModeOk: true,
  persistenceConfigured: false,
};

describe("entropy governor", () => {
  it("classifies the 2026-10-08 public probes", () => {
    expect(classifyProbe("resonance_ready", 503, liveReady)).toBe("resonance_owner_gate");
    expect(classifyProbe("vercel_alias", 404, { vercelError: "DEPLOYMENT_NOT_FOUND" })).toBe("alias_absent");
    expect(
      classifyProbe("conduit_ready", 200, {
        version: "0.8.0",
        contractRevision: "2026-10-03-ready-surface",
        persistence: "postgres",
      }),
    ).toBe("conduit_ready");
  });

  it("treats a leaked owner field as a contract break", () => {
    expect(classifyProbe("resonance_ready", 503, { ...liveReady, ownerActionRequired: false })).toBe(
      "contract_leak",
    );
  });

  it("refuses another witness once the budget is spent", () => {
    expect(admitWork({ kind: "witness", openWitnessPulls: 2 }).admit).toBe(false);
    expect(admitWork({ kind: "implementation", openWitnessPulls: 2 }).reason).toBe("implementation_allowed");
    expect(admitWork({ kind: "owner", openWitnessPulls: 0 }).admit).toBe(false);
  });

  it("names the owner secret as the binding constraint", () => {
    expect(bindingConstraint(["conduit_ready", "resonance_owner_gate", "alias_absent"])).toBe("owner_secret");
  });
});
