import { describe, expect, it } from "vitest";
import { validateIdempotencyKey, parseAndValidateIntent } from "../../app/api/nexus/executions/route";

describe("POST /api/nexus/executions validation helpers", () => {
  describe("validateIdempotencyKey", () => {
    it("rejects missing Idempotency-Key header", () => {
      const request = new Request("http://localhost/api/nexus/executions", { method: "POST" });
      const result = validateIdempotencyKey(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
      }
    });

    it("rejects blank Idempotency-Key header", () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "   " },
      });
      const result = validateIdempotencyKey(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
      }
    });

    it("accepts valid Idempotency-Key header", () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "test-key-123" },
      });
      const result = validateIdempotencyKey(request);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.idempotencyKey).toBe("test-key-123");
      }
    });
  });

  describe("parseAndValidateIntent", () => {
    it("rejects invalid JSON body", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        body: "invalid-json",
      });
      const result = await parseAndValidateIntent(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
      }
    });

    it("rejects missing objective", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        body: JSON.stringify({
          requirements: [{ key: "test" }],
          requestedBy: "user-1",
        }),
      });
      const result = await parseAndValidateIntent(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
      }
    });

    it("rejects missing or empty requirements", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        body: JSON.stringify({
          objective: "test objective",
          requirements: [],
          requestedBy: "user-1",
        }),
      });
      const result = await parseAndValidateIntent(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(400);
      }
    });

    it("accepts valid execution intent payload", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        body: JSON.stringify({
          projectId: "00000000-0000-4000-8000-000000000001",
          objective: "run automated health check",
          requirements: [{ key: "health.check" }],
          requestedBy: "user-123",
        }),
      });
      const result = await parseAndValidateIntent(request);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.intent.objective).toBe("run automated health check");
        expect(result.intent.requestedBy).toBe("user-123");
      }
    });
  });
});
