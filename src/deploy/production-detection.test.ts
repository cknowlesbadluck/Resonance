import { describe, expect, it } from "vitest";
import { isProductionRuntime } from "./contract";
import { productionUserDataBlock } from "../nexus/production-boundary";

describe("isProductionRuntime fails closed on host signals", () => {
  it.each([
    [{ NODE_ENV: "production" }],
    [{ RESONANCE_DEPLOY_STAGE: "production" }],
    [{ NODE_ENV: "development", CONTEXT: "production" }],
    [{ VERCEL_ENV: "production" }],
  ])("treats %o as production", (env) => { expect(isProductionRuntime(env)).toBe(true); });

  it.each([
    [{}],
    [{ NODE_ENV: "test" }],
    [{ CONTEXT: "deploy-preview" }],
    [{ CONTEXT: "branch-deploy" }],
    [{ VERCEL_ENV: "preview" }],
  ])("does not treat %o as production", (env) => { expect(isProductionRuntime(env)).toBe(false); });

  it("Netlify production without NODE_ENV refuses in-memory user data", () => {
    expect(productionUserDataBlock({ CONTEXT: "production" })).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
