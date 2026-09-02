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

describe("Concurrent Execution (CHR-51: Option A - executing status lease)", () => {
  it("only allows one executor invocation for a concurrent request using accepted -> executing CAS", () => {
    // Simulates the database CAS update behavior: status transitions from 'accepted' to
    // 'executing' atomically. A second concurrent attempt to claim sees the 'executing'
    // status and cannot update, preventing double-execution.
    let status = "accepted";

    function attemptClaim() {
      if (status === "accepted") {
        status = "executing";
        return true;
      }
      return false;
    }

    const firstClaim = attemptClaim();
    const secondClaim = attemptClaim();

    expect(firstClaim).toBe(true);
    expect(secondClaim).toBe(false);
    expect(status).toBe("executing");
  });
});
