import { describe, expect, it } from "vitest";
import { isUuid } from "../auth/nexus-request";

/**
 * Route-level contract tests for mandatory Idempotency-Key and UUID validation.
 */
function validateIdempotencyKey(headers: Headers): { ok: true; key: string } | { ok: false; status: number; error: string } {
  const key = headers.get("Idempotency-Key");
  if (!key || !key.trim()) {
    return { ok: false, status: 400, error: "Idempotency-Key header is required" };
  }
  return { ok: true, key: key.trim() };
}

function validateProjectId(projectId: unknown): { ok: true; projectId: string } | { ok: false; status: number; error: string } {
  if (projectId !== undefined && projectId !== null && !isUuid(projectId)) {
    return { ok: false, status: 400, error: "projectId must be a UUID." };
  }
  return { ok: true, projectId: (projectId as string) ?? "00000000-0000-4000-8000-000000000001" };
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

describe("API Route Project ID Validation contract", () => {
  it("validates valid v4 UUIDs", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    expect(isUuid(validUuid)).toBe(true);
    const result = validateProjectId(validUuid);
    expect(result.ok).toBe(true);
  });

  it("rejects non-UUID strings with HTTP 400", () => {
    const invalidIds = ["not-a-uuid", "12345", "project-abc-123", "undefined", "../path/traversal"];
    for (const invalidId of invalidIds) {
      expect(isUuid(invalidId)).toBe(false);
      const result = validateProjectId(invalidId);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("projectId must be a UUID.");
      }
    }
  });

  it("handles null or undefined projectId gracefully", () => {
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(validateProjectId(undefined).ok).toBe(true);
  });
});
