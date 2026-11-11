import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as capabilities } from "../../app/api/nexus/capabilities/route";
import { GET as identities } from "../../app/api/nexus/identities/route";
import { GET as skills } from "../../app/api/nexus/skills/route";

const PROJECT = "00000000-0000-4000-8000-000000000001";
const routes = [
  ["GET /api/nexus/capabilities", () => capabilities(new Request(`http://x/api/nexus/capabilities?projectId=${PROJECT}`))],
  ["GET /api/nexus/identities", () => identities(new Request(`http://x/api/nexus/identities?projectId=${PROJECT}`))],
  ["GET /api/nexus/skills", () => skills(new Request(`http://x/api/nexus/skills?projectId=${PROJECT}`))],
] as const;

describe("route auth matrix (no bearer token, no Supabase env)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  const modes: Array<[string, string | undefined, string, number]> = [
    ["unset (default)", undefined, "test", 401],
    ["required", "required", "test", 401],
    ["garbage", "enforced", "test", 401],
    ["optional in dev", "optional", "development", 200],
    ["optional in production", "optional", "production", 401],
    ["auto in production", "auto", "production", 401],
  ];

  for (const [label, mode, nodeEnv, expected] of modes) {
    for (const [name, call] of routes) {
      it(`${name} with mode ${label} -> ${expected}`, async () => {
        if (mode === undefined) vi.stubEnv("RESONANCE_AUTH_MODE", "");
        else vi.stubEnv("RESONANCE_AUTH_MODE", mode);
        vi.stubEnv("NODE_ENV", nodeEnv);
        const res = await call();
        // production may refuse earlier with 503 (productionUserDataBlock); both are fail-closed
        if (expected === 401) expect([401, 503]).toContain(res.status);
        else expect(res.status).toBe(expected);
      });
    }
  }
});
