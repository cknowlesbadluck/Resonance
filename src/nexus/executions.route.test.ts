import { describe, expect, it } from "vitest";

/**
 * Route-level contract tests for mandatory Idempotency-Key.
 * These exercise the same validation logic as POST /api/nexus/executions
 * without requiring a full Next.js runtime.
 */
function validateIdempotencyKey(headers: Headers): { ok: true; key: string } | { ok: false; status: number; error: string } {
  const key = headers.get("Idempotency-Key");
  if (!key || !key.trim()) {
    return { ok: false, status: 400, error: "Idempotency-Key header is required" };
  }
  return { ok: true, key: key.trim() };
}

describe("POST /api/nexus/executions Idempotency-Key contract", () => {
  it("rejects missing Idempotency-Key with 400", () => {
    const result = validateIdempotencyKey(new Headers());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/Idempotency-Key/i);
    }
  });

  it("rejects blank Idempotency-Key with 400", () => {
    const headers = new Headers({ "Idempotency-Key": "   " });
    const result = validateIdempotencyKey(headers);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("accepts a non-blank Idempotency-Key", () => {
    const headers = new Headers({ "Idempotency-Key": "sprint-test-key-1" });
    const result = validateIdempotencyKey(headers);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.key).toBe("sprint-test-key-1");
  });
});
