import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../app/api/webhooks/github/route";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(),
  };
});

describe("GitHub Webhook Route", () => {
  const secret = "test-secret";
  const payload = { test: "data" };
  const rawPayload = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", secret).update(rawPayload).digest("hex")}`;
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.RESONANCE_PROJECT_ID = "test-project-id";

    vi.mocked(createClient).mockReturnValue({
      rpc: mockRpc,
    } as any);
  });

  it("should verify signature and deduplicate via emit_event", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const request = new Request("http://localhost/api/webhooks/github", {
      method: "POST",
      body: rawPayload,
      headers: {
        "x-hub-signature-256": signature,
        "x-github-event": "push",
        "x-github-delivery": "test-delivery-id",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.accepted).toBe(true);

    expect(mockRpc).toHaveBeenCalledWith("emit_event", {
      p_project_id: "test-project-id",
      p_source: "github",
      p_type: "github.push",
      p_status: "received",
      p_external_id: "test-delivery-id",
      p_payload: payload,
    });
  });

  it("should fail with invalid signature", async () => {
    const request = new Request("http://localhost/api/webhooks/github", {
      method: "POST",
      body: rawPayload,
      headers: {
        "x-hub-signature-256": "invalid-signature",
        "x-github-event": "push",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
