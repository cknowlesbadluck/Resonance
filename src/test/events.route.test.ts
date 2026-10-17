import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeState, fakeClient, type FakeState } from "./fake-supabase";

let state: FakeState;
vi.mock("@supabase/supabase-js", () => ({ createClient: () => fakeClient(state) }));

const { GET, POST } = await import("../../app/api/events/route");

const PROJECT = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const TOKEN = "test-token-not-a-secret";

function get(query: string, token?: string) {
  return GET(new Request(`http://x/api/events?${query}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }));
}
function post(body: unknown, token?: string) {
  return POST(new Request("http://x/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

describe("/api/events (fake Supabase, auth required)", () => {
  beforeEach(() => {
    state = createFakeState();
    state.users[TOKEN] = "user-1";
    state.members.push({ project_id: PROJECT, user_id: "user-1" });
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESONANCE_AUTH_MODE", "required");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-not-a-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("401 without a bearer token", async () => {
    expect((await get(`projectId=${PROJECT}`)).status).toBe(401);
  });

  it("401 for an unknown token", async () => {
    expect((await get(`projectId=${PROJECT}`, "nope")).status).toBe(401);
  });

  it("401 for a valid user who is not a project member", async () => {
    expect((await get(`projectId=${OTHER}`, TOKEN)).status).toBe(401);
  });

  it("200 lists events for a member and clamps limit to 100", async () => {
    state.tables.events = { data: [{ id: "e1" }], error: null };
    const res = await get(`projectId=${PROJECT}&limit=5000`, TOKEN);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ events: [{ id: "e1" }] });
    expect(state.calls.find((c) => c.table === "events" && c.op === "limit")?.args).toEqual([100]);
  });

  it("500 returns the sanitized persistence envelope, never the DB message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.tables.events = { data: null, error: { message: 'relation "public.events" does not exist', code: "42P01" } };
    const res = await get(`projectId=${PROJECT}`, TOKEN);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("persistence_error");
    expect(JSON.stringify(body)).not.toContain("relation");
  });

  it("POST validates project_id, payload shape, and body size", async () => {
    expect((await post({ project_id: "nope" }, TOKEN)).status).toBe(400);
    expect((await post({ project_id: PROJECT, payload: [1] }, TOKEN)).status).toBe(400);
    expect((await post("{not json", TOKEN)).status).toBe(400);
    expect((await post({ project_id: PROJECT, payload: { x: "y".repeat(70 * 1024) } }, TOKEN)).status).toBe(400);
  });

  it("POST 201 inserts for a member; 401 for a non-member", async () => {
    state.tables.events = { data: { id: "new" }, error: null };
    const ok = await post({ project_id: PROJECT, type: "t", payload: { a: 1 } }, TOKEN);
    expect(ok.status).toBe(201);
    expect((await post({ project_id: OTHER, payload: {} }, TOKEN)).status).toBe(401);
  });

  it("503 in production when configuration is incomplete (fail closed)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await get(`projectId=${PROJECT}`, TOKEN)).status).toBe(503);
  });
});
