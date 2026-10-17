import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeState, fakeClient, type FakeState } from "./fake-supabase";

let state: FakeState = createFakeState();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => fakeClient(state) }));
const { POST } = await import("../../app/api/nexus/executions/[id]/resume/route");

const PROJECT = "00000000-0000-4000-8000-000000000001";
const TOKEN = "test-token-not-a-secret";
const auth = { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" };
const call = (id: string, body: unknown, headers: Record<string, string> = auth) =>
  POST(new Request("http://x/", { method: "POST", headers, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });

describe("POST /api/nexus/executions/[id]/resume (fake Supabase)", () => {
  beforeEach(() => {
    state = createFakeState();
    state.users[TOKEN] = "user-1";
    state.members.push({ project_id: PROJECT, user_id: "user-1" });
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESONANCE_AUTH_MODE", "required");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-not-a-secret");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("400 for an oversized id", async () => {
    expect((await call("x".repeat(200), { projectId: PROJECT })).status).toBe(400);
  });
  it("401 without a token", async () => {
    expect((await call("req-1", { projectId: PROJECT }, { "content-type": "application/json" })).status).toBe(401);
  });
  it("503 without durable state (dev opt-out, no Supabase)", async () => {
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await call("req-1", { projectId: PROJECT })).status).toBe(503);
  });
  it("404 when the request does not exist", async () => {
    state.tables.nexus_execution_requests = { data: null, error: null };
    expect((await call("req-1", { projectId: PROJECT, approved: true })).status).toBe(404);
  });
  it("500 with a generic message when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.tables.nexus_execution_requests = { data: null, error: { message: "relation does not exist" } };
    const res = await call("req-1", { projectId: PROJECT, approved: true });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("relation");
  });
  it("409 unless approved is explicitly true", async () => {
    state.tables.nexus_execution_requests = { data: { status: "completed", idempotency_key: "k", response: {} }, error: null };
    expect((await call("req-1", { projectId: PROJECT })).status).toBe(409);
  });
  it("200 cancels a waiting request when approved=false", async () => {
    state.tables.nexus_execution_requests = { data: { id: "r", status: "waiting", idempotency_key: "k", response: {} }, error: null };
    const res = await call("req-1", { projectId: PROJECT, approved: false });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("cancelled");
  });
  it("409 when the request is not awaiting approval", async () => {
    state.tables.nexus_execution_requests = { data: { status: "completed", idempotency_key: "k", response: {}, updated_at: new Date().toISOString() }, error: null };
    expect((await call("req-1", { projectId: PROJECT, approved: true })).status).toBe(409);
  });
});
