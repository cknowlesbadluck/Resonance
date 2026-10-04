import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("security headers", () => {
  it("denies framing, sniffing, and eval, and only connects to self plus the configured Supabase origin", () => {
    const policy = contentSecurityPolicy({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("connect-src 'self' https://example.supabase.co wss://example.supabase.co");
    expect(policy).not.toContain("http://");
  });

  it("ignores a non-https Supabase URL and adds HSTS only for production", () => {
    const dev = securityHeaders({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" });
    expect(dev.find((header) => header.key === "Strict-Transport-Security")).toBeUndefined();
    expect(dev.find((header) => header.key === "Content-Security-Policy")?.value).toContain("connect-src 'self'");
    expect(dev.find((header) => header.key === "Content-Security-Policy")?.value).not.toContain("127.0.0.1");

    const prod = securityHeaders({ NODE_ENV: "production" });
    expect(prod.find((header) => header.key === "Strict-Transport-Security")?.value).toContain("max-age=63072000");
    expect(prod.find((header) => header.key === "X-Content-Type-Options")?.value).toBe("nosniff");
    expect(prod.find((header) => header.key === "Content-Security-Policy")?.value).not.toContain("unsafe-eval");

    const development = contentSecurityPolicy({ NODE_ENV: "development" });
    expect(development).toContain("unsafe-eval");
    const productionPolicy = contentSecurityPolicy({ NODE_ENV: "development", RESONANCE_DEPLOY_STAGE: "production" });
    expect(productionPolicy).not.toContain("unsafe-eval");
  });

  it("is what next.config actually sends, with the framework banner disabled", () => {
    const config = readFileSync(join(__dirname, "..", "..", "next.config.ts"), "utf8");
    expect(config).toContain("poweredByHeader: false");
    expect(config).toContain("securityHeaders()");
  });
});
