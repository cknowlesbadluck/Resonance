import { describe, expect, it } from "vitest";
import { POST } from "../../app/api/nexus/executions/route";

describe("POST /api/nexus/executions contract", () => {
  describe("Idempotency-Key validation", () => {
    it("rejects missing Idempotency-Key header", async () => {
      const request = new Request("http://localhost/api/nexus/executions", { method: "POST" });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/Idempotency-Key/i);
    });

    it("rejects blank Idempotency-Key header", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "   " },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/Idempotency-Key/i);
    });
  });

  describe("Payload validation", () => {
    it("rejects invalid JSON body", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "test-key-123" },
        body: "invalid-json",
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/JSON/i);
    });

    it("rejects missing objective", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "test-key-123" },
        body: JSON.stringify({
          requirements: [{ key: "test" }],
          requestedBy: "user-1",
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/objective/i);
    });

    it("rejects missing or empty requirements", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "test-key-123" },
        body: JSON.stringify({
          objective: "test objective",
          requirements: [],
          requestedBy: "user-1",
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/requirements/i);
    });

    it("handles valid execution intent payload response", async () => {
      const request = new Request("http://localhost/api/nexus/executions", {
        method: "POST",
        headers: { "Idempotency-Key": "test-key-123" },
        body: JSON.stringify({
          projectId: "00000000-0000-4000-8000-000000000001",
          objective: "run automated health check",
          requirements: [{ key: "health.check" }],
          requestedBy: "user-123",
        }),
      });
      const response = await POST(request);
      expect([201, 202, 422]).toContain(response.status);
      const data = await response.json();
      if (data.intent) {
        expect(data.intent.objective).toBe("run automated health check");
        expect(data.intent.requestedBy).toBe("user-123");
      } else {
        expect(data.error).toBeDefined();
      }
    });
  });
});
