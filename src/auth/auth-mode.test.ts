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

  it("auto requires auth only when Supabase is configured", () => {
    process.env.RESONANCE_AUTH_MODE = "auto";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(authRequired()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    expect(authRequired()).toBe(true);
  });
});
