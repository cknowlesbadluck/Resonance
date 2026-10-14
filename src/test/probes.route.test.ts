import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as health } from "../../app/api/health/route";
import { GET as ready } from "../../app/api/ready/route";
import { GET as identities } from "../../app/api/nexus/identities/route";

describe("probe and discovery routes", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("/api/health is 200 and no-store", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).status).toBe("ok");
  });

  it("/api/ready is 503 owner-gated without the service role and never echoes values", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESONANCE_AUTH_MODE", "required");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const res = await ready();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.missingRequired).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(body.contractRevision).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("fake.supabase.test");
  });

  it("/api/nexus/identities rejects a non-UUID projectId in dev opt-out mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
    const res = await identities(new Request("http://x/api/nexus/identities?projectId=bad"));
    expect(res.status).toBe(400);
  });
});
