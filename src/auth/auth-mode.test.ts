import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { authRequired, unauthenticatedActor } from "./nexus-request";

describe("RESONANCE_AUTH_MODE", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("optional never requires auth", () => {
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

  it("auto fails closed when Supabase is missing and no dev opt-in is set", () => {
    process.env.RESONANCE_AUTH_MODE = "auto";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.RESONANCE_DEV_ALLOW_ANONYMOUS;
    expect(authRequired()).toBe(true);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    expect(authRequired()).toBe(true);
  });

  it("unset mode behaves like auto and fails closed", () => {
    delete process.env.RESONANCE_AUTH_MODE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.RESONANCE_DEV_ALLOW_ANONYMOUS;
    expect(authRequired()).toBe(true);
  });

  it("auto allows anonymous access only with the explicit dev opt-in", () => {
    process.env.RESONANCE_AUTH_MODE = "auto";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.RESONANCE_DEV_ALLOW_ANONYMOUS = "true";
    expect(authRequired()).toBe(false);
    process.env.RESONANCE_DEV_ALLOW_ANONYMOUS = "0";
    expect(authRequired()).toBe(true);
  });

  it("dev opt-in never disables auth once Supabase is configured", () => {
    process.env.RESONANCE_AUTH_MODE = "auto";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    process.env.RESONANCE_DEV_ALLOW_ANONYMOUS = "true";
    expect(authRequired()).toBe(true);
  });
});

describe("unauthenticatedActor", () => {
  it("never passes a client-claimed identity through verbatim", () => {
    expect(unauthenticatedActor("0b9f0d1e-1111-4111-8111-111111111111")).toBe("unauthenticated:0b9f0d1e-1111-4111-8111-111111111111");
    expect(unauthenticatedActor("  alice  ")).toBe("unauthenticated:alice");
    expect(unauthenticatedActor(undefined)).toBe("unauthenticated");
    expect(unauthenticatedActor(42)).toBe("unauthenticated");
    expect(unauthenticatedActor("x".repeat(500))).toHaveLength("unauthenticated:".length + 128);
  });
});
