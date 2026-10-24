import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_EVENT_EXTERNAL_ID_LENGTH, resolveEventExternalId } from "./event-idempotency";

describe("resolveEventExternalId", () => {
  it("returns null when neither header nor body is supplied", () => {
    expect(resolveEventExternalId(null, undefined)).toEqual({ ok: true, externalId: null });
    expect(resolveEventExternalId("   ", null)).toEqual({ ok: true, externalId: null });
  });
  it("uses the Idempotency-Key header when external_id is absent", () => {
    expect(resolveEventExternalId(" key-1 ", undefined)).toEqual({ ok: true, externalId: "key-1" });
  });
  it("uses external_id when the header is absent, and accepts matching values", () => {
    expect(resolveEventExternalId(null, "ext-1")).toEqual({ ok: true, externalId: "ext-1" });
    expect(resolveEventExternalId("ext-1", "ext-1")).toEqual({ ok: true, externalId: "ext-1" });
  });
  it("rejects disagreeing header and body", () => {
    expect(resolveEventExternalId("a", "b")).toMatchObject({ ok: false });
  });
  it("rejects non-string, blank and oversized ids", () => {
    expect(resolveEventExternalId(null, 42)).toMatchObject({ ok: false });
    expect(resolveEventExternalId(null, "  ")).toMatchObject({ ok: false });
    expect(resolveEventExternalId(null, "x".repeat(MAX_EVENT_EXTERNAL_ID_LENGTH + 1))).toMatchObject({ ok: false });
    expect(resolveEventExternalId("x".repeat(MAX_EVENT_EXTERNAL_ID_LENGTH + 1), undefined)).toMatchObject({ ok: false });
  });
});

// ---- Route: POST /api/events replays duplicates instead of 500-ing ----

const PROJECT = "11111111-1111-4111-8111-111111111111";
const stored = { id: "evt-1", project_id: PROJECT, source: "ios", type: "t", status: "received", external_id: "k1", payload: {} };
let insertError: { code?: string; message?: string } | null = null;
const lookups: Array<Record<string, unknown>> = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      insert: (row: Record<string, unknown>) => ({
        select: () => ({ single: async () => (insertError ? { data: null, error: insertError } : { data: { id: "evt-new", ...row }, error: null }) }),
      }),
      select: () => {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq: (col: string, value: unknown) => { filters[col] = value; return chain; },
          maybeSingle: async () => { lookups.push({ ...filters }); return { data: stored, error: null }; },
        };
        return chain;
      },
    }),
  }),
}));

describe("POST /api/events idempotency", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-placeholder";
    process.env.RESONANCE_AUTH_MODE = "optional";
    delete process.env.RESONANCE_DEPLOY_STAGE;
    (process.env as Record<string, string>).NODE_ENV = "test";
    insertError = null;
    lookups.length = 0;
  });
  afterEach(() => { process.env = { ...env }; });

  const post = async (body: Record<string, unknown>, headers: Record<string, string> = {}) => {
    const { POST } = await import("../../app/api/events/route");
    return POST(new Request("http://localhost/api/events", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
  };

  it("creates a new event with the Idempotency-Key as external_id (201)", async () => {
    const res = await post({ project_id: PROJECT, source: "ios" }, { "Idempotency-Key": "k1" });
    expect(res.status).toBe(201);
    expect((await res.json()).event.external_id).toBe("k1");
  });

  it("replays the stored event on a unique violation (200, no raw DB error)", async () => {
    insertError = { code: "23505", message: "duplicate key value violates unique constraint \"events_external_id_unique\"" };
    const res = await post({ project_id: PROJECT, source: "ios", external_id: "k1" });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Idempotent-Replay")).toBe("true");
    const json = await res.json();
    expect(json).toMatchObject({ duplicate: true, event: { id: "evt-1" } });
    expect(JSON.stringify(json)).not.toMatch(/duplicate key value/);
    expect(lookups).toEqual([{ project_id: PROJECT, source: "ios", external_id: "k1" }]);
  });

  it("rejects a header/body mismatch with 400 before touching the database", async () => {
    const res = await post({ project_id: PROJECT, external_id: "a" }, { "Idempotency-Key": "b" });
    expect(res.status).toBe(400);
  });
});
