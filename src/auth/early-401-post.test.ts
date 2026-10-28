import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postExecution } from "../../app/api/nexus/executions/route";
import { POST as postEvent } from "../../app/api/events/route";

const PROJECT = "00000000-0000-4000-8000-000000000001";
const req = (path: string, body: string, headers: Record<string, string> = {}) =>
  new Request(`http://x${path}`, { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("unauthenticated POST fails closed with 401 before validation", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.RESONANCE_AUTH_MODE = "required";
    delete process.env.NETLIFY; delete process.env.CONTEXT; delete process.env.VERCEL_ENV;
  });
  afterEach(() => { process.env = { ...saved }; });

  for (const [name, path, fn] of [["executions", "/api/nexus/executions", postExecution], ["events", "/api/events", postEvent]] as const) {
    it(`${name}: 401 for invalid JSON and no Idempotency-Key (no validation leak)`, async () => {
      const res = await fn(req(path, "not json"));
      expect(res.status).toBe(401);
    });
    it(`${name}: 401 for a valid-looking body without a token`, async () => {
      const res = await fn(req(path, JSON.stringify({ projectId: PROJECT, project_id: PROJECT, objective: "x", requirements: [{ key: "a" }] }), { "Idempotency-Key": "k1" }));
      expect(res.status).toBe(401);
    });
    it(`${name}: 401 for a non-Bearer scheme`, async () => {
      const res = await fn(req(path, "{}", { authorization: "Basic abc", "Idempotency-Key": "k1" }));
      expect(res.status).toBe(401);
    });
  }

  it("optional mode (dev only) still reaches validation", async () => {
    process.env.RESONANCE_AUTH_MODE = "optional";
    const res = await postExecution(req("/api/nexus/executions", "{}"));
    expect(res.status).toBe(400);
  });
});
