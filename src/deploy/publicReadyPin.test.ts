import { describe, expect, it } from "vitest";
import { classifyPublicReady } from "../../scripts/public-ready-pin.mjs";

describe("public ready pin", () => {
  it("flags the live 2026-10-05 body as deploy lag and not proof", () => {
    const result = classifyPublicReady({
      status: "not_ready",
      service: "resonance-nexus",
      stage: "deployment",
      production: true,
      authMode: "required",
      authModeOk: true,
      persistenceConfigured: false,
      githubAdapterConfigured: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      timestamp: "2026-10-05T17:01:07.580Z",
    });
    expect(result.deployLag).toBe(true);
    expect(result.missingContractFields).toContain("contractRevision");
    expect(result.missingContractFields).toContain("ownerActionRequired");
    expect(result.countsAsProof).toBe(false);
  });

  it("accepts a contract-shaped owner gate without calling it proof", () => {
    const result = classifyPublicReady({
      status: "not_ready",
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      contractRevision: "2026-10-03-owner-gate",
    });
    expect(result.deployLag).toBe(false);
    expect(result.ownerGateOpen).toBe(true);
    expect(result.countsAsProof).toBe(false);
  });
});
