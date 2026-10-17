import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeState, fakeClient, type FakeState } from "./fake-supabase";

let state: FakeState = createFakeState();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => fakeClient(state) }));
const { GET: capabilities } = await import("../../app/api/nexus/capabilities/route");
const { GET: skills } = await import("../../app/api/nexus/skills/route");
const { POST: resolve } = await import("../../app/api/nexus/skills/resolve/route");
const { POST: webhook } = await import("../../app/api/webhooks/github/route");

const PROJECT = "00000000-0000-4000-8000-000000000001";
const SECRET = "placeholder-webhook-secret";

describe("discovery routes (dev opt-out)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("capabilities and skills return 200 lists", async () => {
    const c = await capabilities(new Request(`http://x/?projectId=${PROJECT}`));
    expect(c.status).toBe(200);
    expect(Array.isArray((await c.json()).capabilities)).toBe(true);
    expect((await skills(new Request(`http://x/?projectId=${PROJECT}`))).status).toBe(200);
  });

  it("skills/resolve validates body and 404s unknown skills", async () => {
    const r = (b: string) => resolve(new Request("http://x/", { method: "POST", body: b }));
    expect((await r("{bad")).status).toBe(400);
    expect((await r("x".repeat(17 * 1024))).status).toBe(400);
    const unknown = await r(JSON.stringify({ projectId: PROJECT, skillId: "no.such.skill" }));
    expect([400, 404]).toContain(unknown.status);
  });
});

describe("POST /api/webhooks/github", () => {
  beforeEach(() => {
    state = createFakeState();
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", SECRET);
    vi.stubEnv("RESONANCE_PROJECT_ID", PROJECT);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-not-a-secret");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  const send = (raw: string, signature: string | null, delivery = "d-1") =>
    webhook(new Request("http://x/", { method: "POST", body: raw, headers: { "x-github-event": "push", "x-github-delivery": delivery, ...(signature ? { "x-hub-signature-256": signature } : {}) } }));
  const sign = (raw: string) => `sha256=${createHmac("sha256", SECRET).update(raw).digest("hex")}`;

  it("rejects a missing or wrong signature", async () => {
    const raw = JSON.stringify({ ref: "refs/heads/main" });
    expect((await send(raw, null)).status).toBeGreaterThanOrEqual(400);
    expect((await send(raw, sign(raw + " "))).status).toBeGreaterThanOrEqual(400);
  });

  it("accepts a correctly signed delivery and reports duplicates", async () => {
    const raw = JSON.stringify({ ref: "refs/heads/main" });
    const ok = await send(raw, sign(raw));
    expect(ok.status).toBe(200);
    expect((await ok.json()).accepted).toBe(true);
    state.tables.events = { data: null, error: { code: "23505", message: "duplicate key" } };
    expect((await (await send(raw, sign(raw))).json()).duplicate).toBe(true);
  });

  it("500 without leaking DB detail when persistence fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.tables.events = { data: null, error: { code: "42501", message: "permission denied for table events" } };
    const raw = JSON.stringify({ ref: "x" });
    const res = await send(raw, sign(raw));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("permission");
  });
});
