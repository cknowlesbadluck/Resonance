import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as resume } from "../../app/api/nexus/executions/[id]/resume/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://x/api/nexus/executions/x/resume", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("POST /api/nexus/executions/[id]/resume fails closed with 401 before validation", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.RESONANCE_AUTH_MODE = "required";
    delete process.env.NETLIFY; delete process.env.CONTEXT; delete process.env.VERCEL_ENV;
  });
  afterEach(() => { process.env = { ...saved }; });

  it("401 for an oversized id without a token (was 400: id validation leaked before auth)", async () => {
    expect((await resume(req("{}"), ctx("a".repeat(600)))).status).toBe(401);
  });
  it("401 for an empty id without a token", async () => {
    expect((await resume(req("{}"), ctx(""))).status).toBe(401);
  });
  it("401 for invalid JSON without a token", async () => {
    expect((await resume(req("not json"), ctx("abc"))).status).toBe(401);
  });
  it("401 for a non-Bearer scheme", async () => {
    expect((await resume(req("{}", { authorization: "Basic abc" }), ctx("abc"))).status).toBe(401);
  });
  it("optional mode (dev only) still reaches id validation", async () => {
    process.env.RESONANCE_AUTH_MODE = "optional";
    expect((await resume(req("{}"), ctx("a".repeat(600)))).status).toBe(400);
  });
});
