import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { authRequired } from "./nexus-request";

describe("RESONANCE_AUTH_MODE", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("optional (dev opt-out) does not require auth outside production", () => {
    process.env.RESONANCE_AUTH_MODE = "optional";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    expect(authRequired()).toBe(false);
  });

  it("required always requires auth", () => {
    process.env.RESONANCE_AUTH_MODE = "required";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(authRequired()).toBe(true);
  });

  it("trims whitespace from mode values", () => {
    process.env.RESONANCE_AUTH_MODE = "  required  ";
    expect(authRequired()).toBe(true);
    process.env.RESONANCE_AUTH_MODE = "  optional  ";
    expect(authRequired()).toBe(false);
  });

  it("fails closed on unrecognized modes", () => {
    process.env.RESONANCE_AUTH_MODE = "enforced";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(authRequired()).toBe(true);

    process.env.RESONANCE_AUTH_MODE = "strict";
    expect(authRequired()).toBe(true);
  });

  it("auto requires auth only when Supabase is configured", () => {
    process.env.RESONANCE_AUTH_MODE = "auto";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(authRequired()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    expect(authRequired()).toBe(true);
  });

  it("defaults to required when unset, even without Supabase env (fail closed)", () => {
    delete process.env.RESONANCE_AUTH_MODE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(authRequired()).toBe(true);
    process.env.RESONANCE_AUTH_MODE = "   ";
    expect(authRequired()).toBe(true);
  });

  it("ignores the optional opt-out in production", () => {
    expect(authRequired({ RESONANCE_AUTH_MODE: "optional", NODE_ENV: "production" })).toBe(true);
    expect(authRequired({ RESONANCE_AUTH_MODE: "optional", RESONANCE_DEPLOY_STAGE: "production" })).toBe(true);
    expect(authRequired({ RESONANCE_AUTH_MODE: "optional", NODE_ENV: "development" })).toBe(false);
  });

  it("auto is always required in production", () => {
    expect(authRequired({ RESONANCE_AUTH_MODE: "auto", NODE_ENV: "production" })).toBe(true);
  });
});
