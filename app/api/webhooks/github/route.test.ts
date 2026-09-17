import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

describe("POST /api/webhooks/github", () => {
  const originalEnv = process.env;
  const testSecret = "test-github-webhook-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GITHUB_WEBHOOK_SECRET;
    delete process.env.RESONANCE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function computeSignature(payload: string, secret: string = testSecret): string {
    const hmac = createHmac("sha256", secret).update(payload).digest("hex");
    return `sha256=${hmac}`;
  }

  describe("signature verification", () => {
    it("returns 401 when GITHUB_WEBHOOK_SECRET is not configured", async () => {
      const body = JSON.stringify({ action: "opened" });
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(body),
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toEqual({ error: "invalid signature" });
    });

    it("returns 401 when x-hub-signature-256 header is missing", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      const body = JSON.stringify({ action: "opened" });
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toEqual({ error: "invalid signature" });
    });

    it("returns 401 when x-hub-signature-256 signature is invalid", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      const body = JSON.stringify({ action: "opened" });
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": "sha256=invalid123456789012345678901234567890123456789012345678901234567890",
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toEqual({ error: "invalid signature" });
    });

    it("returns 401 when signature length does not match expected signature length", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      const body = JSON.stringify({ action: "opened" });
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": "sha256=short",
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toEqual({ error: "invalid signature" });
    });
  });

  describe("payload validation", () => {
    it("returns 400 when payload is not valid JSON", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      const rawBody = "{ invalid json payload ";
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(rawBody),
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toEqual({ error: "Invalid JSON payload" });
    });
  });

  describe("successful processing and event persistence", () => {
    it("returns 200 accepted when DB is not configured", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      const payload = { action: "ping" };
      const rawBody = JSON.stringify(payload);
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(rawBody),
          "x-github-event": "ping",
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({ accepted: true });
    });

    it("persists event to DB when DB and project ID are configured", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      process.env.RESONANCE_PROJECT_ID = "proj-456";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
      vi.mocked(createClient).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createClient>);

      const payload = { action: "opened", issue: { number: 42 } };
      const rawBody = JSON.stringify(payload);
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(rawBody),
          "x-github-event": "issues",
          "x-github-delivery": "delivery-uuid-789",
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({ accepted: true });

      expect(fromMock).toHaveBeenCalledWith("events");
      expect(insertMock).toHaveBeenCalledWith({
        project_id: "proj-456",
        source: "github",
        type: "github.issues",
        status: "received",
        payload,
        external_id: "delivery-uuid-789",
      });
    });

    it("uses default event type 'unknown' and handles missing delivery ID", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      process.env.RESONANCE_PROJECT_ID = "proj-456";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
      vi.mocked(createClient).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createClient>);

      const payload = { ref: "refs/heads/main" };
      const rawBody = JSON.stringify(payload);
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(rawBody),
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({ accepted: true });

      expect(insertMock).toHaveBeenCalledWith({
        project_id: "proj-456",
        source: "github",
        type: "github.unknown",
        status: "received",
        payload,
        external_id: undefined,
      });
    });

    it("returns 500 when DB event persistence returns an error", async () => {
      process.env.GITHUB_WEBHOOK_SECRET = testSecret;
      process.env.RESONANCE_PROJECT_ID = "proj-456";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const insertMock = vi.fn().mockResolvedValue({ error: { message: "DB Error" } });
      const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
      vi.mocked(createClient).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createClient>);

      const payload = { action: "opened" };
      const rawBody = JSON.stringify(payload);
      const req = new Request("http://localhost/api/webhooks/github", {
        method: "POST",
        headers: {
          "x-hub-signature-256": computeSignature(rawBody),
          "x-github-event": "issues",
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json).toEqual({ error: "Failed to persist event" });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
