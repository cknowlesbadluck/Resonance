import { describe, expect, it } from "vitest";
import { classifyReadyBody } from "./deployLag";

describe("classifyReadyBody", () => {
  it("marks the 16:01 production body as deploy lag, adapter gap, and not proof", () => {
    const live = {
      status: "not_ready",
      service: "resonance-nexus",
      stage: "deployment",
      production: true,
      authMode: "required",
      authModeOk: true,
      persistenceConfigured: false,
      githubAdapterConfigured: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      timestamp: "2026-10-02T20:01:32.631Z",
    };
    const result = classifyReadyBody(live);
    expect(result.deployLag).toBe(true);
    expect(result.missingContractFields).toContain("ownerActionRequired");
    expect(result.ownerGateOpen).toBe(true);
    expect(result.adapterUnconfigured).toBe(true);
    expect(result.countsAsProof).toBe(false);
  });

  it("does not call a contract-shaped 503 proof", () => {
    const result = classifyReadyBody({
      status: "not_ready",
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      contractRevision: "2026-10-03-owner-gate",
    });
    expect(result.deployLag).toBe(false);
    expect(result.ownerGateOpen).toBe(true);
    expect(result.adapterUnconfigured).toBe(false);
    expect(result.countsAsProof).toBe(false);
  });

  it("does not open the owner gate from agentActionRequired alone", () => {
    const result = classifyReadyBody({
      status: "not_ready",
      ownerActionRequired: false,
      ownerKeys: [],
      agentActionRequired: true,
      missingRequired: [],
      contractRevision: "2026-10-03-owner-gate",
    });
    expect(result.deployLag).toBe(false);
    expect(result.ownerGateOpen).toBe(false);
    expect(result.countsAsProof).toBe(false);
  });

  it("treats a contract-shaped body without the current revision as deploy lag", () => {
    const result = classifyReadyBody({
      status: "not_ready",
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
    });
    expect(result.deployLag).toBe(true);
    expect(result.missingContractFields).toContain("contractRevision");
    expect(result.ownerGateOpen).toBe(true);
    expect(result.countsAsProof).toBe(false);
  });

  it("treats a non-current contractRevision as deploy lag and not proof", () => {
    const result = classifyReadyBody({
      status: "not_ready",
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      contractRevision: "2026-10-02-stale",
    });
    expect(result.deployLag).toBe(true);
    expect(result.missingContractFields).toEqual(["contractRevision"]);
    expect(result.ownerGateOpen).toBe(true);
    expect(result.countsAsProof).toBe(false);
  });

  it("rejects a ready body that still omits the contract fields", () => {
    const result = classifyReadyBody({ status: "ready", missingRequired: [] });
    expect(result.deployLag).toBe(true);
    expect(result.ownerGateOpen).toBe(false);
    expect(result.countsAsProof).toBe(false);
  });
});
