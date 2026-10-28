import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeState, fakeClient, type FakeState } from "./fake-supabase";

let state: FakeState = createFakeState();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => fakeClient(state) }));

const PROJECT = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const TOKEN = "test-token-not-a-secret";

// The executions route builds its persistence at module load, so env must be set before import.
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("RESONANCE_AUTH_MODE", "required");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-not-a-secret");
const executions = await import("../../app/api/nexus/executions/route");
const intents = await import("../../app/api/nexus/intents/route");

const auth = { authorization: `Bearer ${TOKEN}` };

describe("/api/nexus/executions and /api/nexus/intents (fake Supabase)", () => {
  beforeEach(() => {
    state.users = { [TOKEN]: "user-1" };
    state.members = [{ project_id: PROJECT, user_id: "user-1" }];
    state.tables = {};
    state.calls = [];
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESONANCE_AUTH_MODE", "required");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-not-a-secret");
  });
  afterEach(() => vi.restoreAllMocks());

  it("GET executions: 401 without token, 401 for non-member, 200 durable for member", async () => {
    expect((await executions.GET(new Request(`http://x/?projectId=${PROJECT}`))).status).toBe(401);
    expect((await executions.GET(new Request(`http://x/?projectId=${OTHER}`, { headers: auth }))).status).toBe(401);
    const ok = await executions.GET(new Request(`http://x/?projectId=${PROJECT}`, { headers: auth }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).source).toBe("durable");
  });

  it("GET executions: DB failure returns the sanitized envelope", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.tables.nexus_executions = { data: null, error: { message: "permission denied for table nexus_executions", code: "42501" } };
    const res = await executions.GET(new Request(`http://x/?projectId=${PROJECT}`, { headers: auth }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("persistence_error");
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("POST executions: requires Idempotency-Key, then auth, then a valid body", async () => {
    const post = (headers: Record<string, string>, body: unknown) =>
      executions.POST(new Request("http://x/", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
    expect((await post(auth, { projectId: PROJECT })).status).toBe(400);
    expect((await post({ "Idempotency-Key": "k1" }, { projectId: PROJECT, objective: "x", requirements: [{ key: "a" }] })).status).toBe(401);
    expect((await post({ ...auth, "Idempotency-Key": "k1" }, { projectId: PROJECT, objective: "", requirements: [{ key: "a" }] })).status).toBe(400);
    expect((await post({ ...auth, "Idempotency-Key": "k1" }, { projectId: PROJECT, objective: "x", requirements: [] })).status).toBe(400);
  });

  it("POST intents: validates JSON and projectId, requires membership", async () => {
    const post = (body: string, headers: Record<string, string> = auth) =>
      intents.POST(new Request("http://x/", { method: "POST", headers: { "content-type": "application/json", ...headers }, body }));
    expect((await post("{bad")).status).toBe(400);
    expect((await post(JSON.stringify({ projectId: "nope" }))).status).toBe(400);
    expect((await post(JSON.stringify({ projectId: OTHER, objective: "x" }))).status).toBe(401);
    expect((await post(JSON.stringify({ projectId: PROJECT, objective: "" }))).status).toBe(400);
  });
});
