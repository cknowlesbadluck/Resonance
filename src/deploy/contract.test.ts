import { describe, expect, it } from "vitest";
import { DEPLOY_ENV_KEYS, evaluateDeployContract } from "./contract";

describe("deploy contract", () => {
  it("never treats adapter tokens as required for process boot", () => {
    const adapterKeys = DEPLOY_ENV_KEYS.filter((item) => item.role === "adapter");
    expect(adapterKeys.length).toBeGreaterThan(0);
    expect(adapterKeys.every((item) => item.requiredInProduction === false)).toBe(true);
  });

  it("is not ready in production without required secrets or auth mode", () => {
    const result = evaluateDeployContract({
      NODE_ENV: "production",
    });
    expect(result.production).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.authModeOk).toBe(false);
    expect(result.missingRequired).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(result.keys.every((item) => !("value" in item))).toBe(true);
  });

  it("requires RESONANCE_AUTH_MODE=required in production even when secrets exist", () => {
    const result = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000001",
      RESONANCE_AUTH_MODE: "auto",
    });
    expect(result.ready).toBe(false);
    expect(result.authModeOk).toBe(false);
    expect(result.missingRequired).toEqual([]);
  });

  it("is ready in production when persistence + project + required auth mode are set", () => {
    const result = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000001",
      RESONANCE_AUTH_MODE: "required",
    });
    expect(result.ready).toBe(true);
    expect(result.githubAdapterConfigured).toBe(false);
  });

  it("does not fail closed in non-production when secrets are absent", () => {
    const result = evaluateDeployContract({
      NODE_ENV: "test",
    });
    expect(result.production).toBe(false);
    expect(result.ready).toBe(true);
    expect(result.missingRequired).toEqual([]);
  });

  it("treats RESONANCE_DEPLOY_STAGE=production as production even in development NODE_ENV", () => {
    const result = evaluateDeployContract({
      NODE_ENV: "development",
      RESONANCE_DEPLOY_STAGE: "production",
    });
    expect(result.production).toBe(true);
    expect(result.ready).toBe(false);
  });
});
