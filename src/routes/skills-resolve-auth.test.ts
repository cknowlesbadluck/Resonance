import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resolveSpy = vi.fn();
vi.mock("../composition/skills", async (orig) => {
  const real = await orig<typeof import("../composition/skills")>();
  return { ...real, resolveBuiltinSkill: (...a: unknown[]) => resolveSpy(...a) };
});

import { POST } from "../../app/api/nexus/skills/resolve/route";

const PROJECT = "00000000-0000-4000-8000-000000000000";
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://x/api/nexus/skills/resolve", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("POST /api/nexus/skills/resolve auth", () => {
  const saved = { ...process.env };
  beforeEach(() => { resolveSpy.mockReset(); process.env.RESONANCE_AUTH_MODE = "required"; });
  afterEach(() => { process.env = { ...saved }; });

  it("returns 401 without a Bearer token even for an invalid body (no validation leak)", async () => {
    const res = await POST(req("not json"));
    expect(res.status).toBe(401);
    expect(resolveSpy).not.toHaveBeenCalled();
  });

  it("returns 401 without a Bearer token for a valid body and never resolves", async () => {
    const res = await POST(req(JSON.stringify({ skillId: "x", projectId: PROJECT })));
    expect(res.status).toBe(401);
    expect(resolveSpy).not.toHaveBeenCalled();
  });

  it("returns 401 for a non-Bearer scheme", async () => {
    const res = await POST(req(JSON.stringify({ skillId: "x", projectId: PROJECT }), { authorization: "Basic abc" }));
    expect(res.status).toBe(401);
  });

  it("optional mode still validates the body (dev only)", async () => {
    process.env.RESONANCE_AUTH_MODE = "optional";
    const res = await POST(req("not json"));
    expect(res.status).toBe(400);
  });
});
