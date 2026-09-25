import { describe, expect, it } from "vitest";
import { productionUserDataBlock } from "./production-boundary";

describe("production user-data boundary", () => {
  it("allows a non-production process to use local fallbacks", () => {
    expect(productionUserDataBlock({ NODE_ENV: "test" })).toBeNull();
  });

  it("fails closed in production when persistence or required auth is missing", () => {
    const error = productionUserDataBlock({
      NODE_ENV: "production",
      RESONANCE_AUTH_MODE: "auto",
    });
    expect(error).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(error).toMatch(/RESONANCE_AUTH_MODE=required/);
  });

  it("allows production only when durable auth-required configuration is present", () => {
    expect(productionUserDataBlock({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      RESONANCE_AUTH_MODE: "required",
    })).toBeNull();
  });
});
