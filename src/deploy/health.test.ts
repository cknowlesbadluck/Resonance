import { describe, expect, it } from "vitest";
import { evaluateDeployContract } from "./contract";
import { liveness, readiness, readinessStatus } from "./health";

describe("health probes", () => {
  it("liveness is always ok and never includes secrets", () => {
    const body = liveness(new Date("2026-09-02T22:00:00.000Z"));
    expect(body.status).toBe("ok");
    expect(body.stage).toBe("deployment");
    expect(JSON.stringify(body)).not.toMatch(/service_role|sk-|github_pat/i);
  });

  it("readiness is 503 in production when the contract is incomplete", () => {
    const contract = evaluateDeployContract({ NODE_ENV: "production" });
    const body = readiness(contract, new Date("2026-09-02T22:00:00.000Z"));
    expect(body.status).toBe("not_ready");
    expect(readinessStatus(body)).toBe(503);
    expect(body.missingRequired.length).toBeGreaterThan(0);
  });

  it("readiness is 200 in production when the contract passes", () => {
    const contract = evaluateDeployContract({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000001",
      RESONANCE_AUTH_MODE: "required",
      GITHUB_TOKEN: "ghs_example",
    });
    const body = readiness(contract);
    expect(body.status).toBe("ready");
    expect(readinessStatus(body)).toBe(200);
    expect(body.githubAdapterConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("ghs_example");
  });
});
