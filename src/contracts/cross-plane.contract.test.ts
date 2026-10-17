import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Cross-plane contract (roadmap phase 8 / Innovate I2). Conduit's portfolio probe and the
 * Quicksilver client consume these shapes. Route handlers are invoked in-process: no
 * network, no real credentials (placeholder values only, asserted never to be echoed).
 */
const PLACEHOLDER = "contract-placeholder-value-not-a-secret";
const FULL_PROD = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: PLACEHOLDER,
  SUPABASE_SERVICE_ROLE_KEY: PLACEHOLDER,
  RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000000",
  RESONANCE_AUTH_MODE: "required",
};
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

async function ready(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  const { GET } = await import("../../app/api/ready/route");
  const res = await GET();
  const text = await res.text();
  return { res, body: JSON.parse(text), text };
}

afterEach(() => { vi.unstubAllEnvs(); });

describe("/api/ready contract (consumed by Conduit probe + Quicksilver)", () => {
  it("not ready in production with a missing key: 503, stable fields, names only", async () => {
    const { res, body, text } = await ready({ ...FULL_PROD, SUPABASE_SERVICE_ROLE_KEY: "" });
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({ status: "not_ready", service: "resonance-nexus", stage: "deployment", production: true });
    expect(body.missingRequired).toContain("SUPABASE_SERVICE_ROLE_KEY");
    for (const m of body.missingRequired) expect(m).toMatch(ENV_NAME);
    expect(typeof body.contractRevision).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(text).not.toContain(PLACEHOLDER);
  });

  it("ready when fully configured: 200, empty missing list, no values echoed", async () => {
    const { res, body, text } = await ready(FULL_PROD);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: "ready", service: "resonance-nexus", missingRequired: [] });
    expect(text).not.toContain(PLACEHOLDER);
    expect(text).not.toContain("example.invalid");
  });

  it("status and HTTP code never disagree (probe relies on both)", async () => {
    for (const env of [FULL_PROD, { ...FULL_PROD, RESONANCE_AUTH_MODE: "optional" }, { NODE_ENV: "production" }]) {
      const { res, body } = await ready(env);
      expect(res.status === 200).toBe(body.status === "ready");
    }
  });
});

describe("error envelope contract", () => {
  it("production without persistence refuses user data with 503 { error: string } and no values", async () => {
    vi.resetModules();
    for (const [k, v] of Object.entries({ ...FULL_PROD, SUPABASE_SERVICE_ROLE_KEY: "" })) vi.stubEnv(k, v);
    const { GET } = await import("../../app/api/events/route");
    const res = await GET(new Request("http://localhost/api/events?projectId=00000000-0000-4000-8000-000000000000"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(typeof body.error).toBe("string");
    expect(JSON.stringify(body)).not.toContain(PLACEHOLDER);
  });
});
