import { describe, expect, it } from "vitest";
import { evaluateDeployContract, readinessPosture } from "./contract";

describe("readiness posture", () => {
  it("names the live service-role gap as owner work, not an agent defect", () => {
    const contract = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000001",
      RESONANCE_AUTH_MODE: "required",
    });
    expect(readinessPosture(contract)).toEqual({
      ready: false,
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      note: "owner_must_set_service_role_on_production_host",
    });
  });

  it("does not ask the owner to act when the contract already passed", () => {
    const contract = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000001",
      RESONANCE_AUTH_MODE: "required",
    });
    expect(readinessPosture(contract).ownerActionRequired).toBe(false);
    expect(readinessPosture(contract).note).toBe("contract_passed");
  });

  it("marks a missing public project id as agent work", () => {
    const contract = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      RESONANCE_AUTH_MODE: "required",
    });
    const posture = readinessPosture(contract);
    expect(posture.agentActionRequired).toBe(true);
    expect(posture.ownerActionRequired).toBe(false);
    expect(posture.note).toBe("agent_must_fix_non_secret_contract_gap");
  });

  it("does not hide owner work when an agent gap is also present", () => {
    const contract = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      RESONANCE_AUTH_MODE: "required",
    });
    expect(readinessPosture(contract)).toEqual({
      ready: false,
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: true,
      note: "owner_and_agent_must_both_act",
    });
  });
});
