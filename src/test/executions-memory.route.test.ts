import { afterEach, describe, expect, it, vi } from "vitest";

// Memory mode: dev opt-out, no Supabase. Env must be set before the route module loads.
vi.stubEnv("NODE_ENV", "development");
vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
// CI exports GITHUB_TOKEN for the vertical-slice job; keep this test offline and deterministic.
vi.stubEnv("GITHUB_TOKEN", "");
vi.stubEnv("GITHUB_VERTICAL_SLICE", "");
const executions = await import("../../app/api/nexus/executions/route");

const PROJECT = "00000000-0000-4000-8000-000000000001";
const post = (key: string, body: unknown) =>
  executions.POST(new Request("http://x/", { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) }));

describe("POST /api/nexus/executions (memory mode)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requires requestedBy when auth is not configured", async () => {
    expect((await post("m0", { projectId: PROJECT, objective: "x", requirements: [{ key: "github.repository.read" }] })).status).toBe(400);
  });

  it("returns a structured, non-leaky result and replays it for the same key", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const body = { projectId: PROJECT, objective: "read repo", requestedBy: "dev", requirements: [{ key: "github.repository.read" }] };
    const first = await post("m1", body);
    expect([200, 202, 207, 422]).toContain(first.status);
    const json = await first.json();
    // A thrown failure must use the sanitized envelope; an executed-but-failed result has no code.
    if (first.status === 422 && "code" in json) expect(["composition_error", "executor_failed"]).toContain(json.code);
    expect(JSON.stringify(json)).not.toMatch(/ghp_|Bad credentials/);
    const replay = await post("m1", body);
    expect(replay.status).toBe(first.status);
  });

  it("409/422 when the same key is reused with a different body", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const base = { projectId: PROJECT, objective: "a", requestedBy: "dev", requirements: [{ key: "github.repository.read" }] };
    await post("m2", base);
    const conflict = await post("m2", { ...base, objective: "b" });
    expect([409, 422]).toContain(conflict.status);
  });

  it("GET lists from memory", async () => {
    const res = await executions.GET(new Request(`http://x/?projectId=${PROJECT}`));
    expect(res.status).toBe(200);
    expect((await res.json()).source).toBe("memory");
  });
});
