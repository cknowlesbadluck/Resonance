import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decideGitHubWebhook, isUniqueViolation, MAX_GITHUB_WEBHOOK_BYTES } from "./github-webhook";

const secret = "test-webhook-secret";

function sign(raw: string, key = secret) {
  return `sha256=${createHmac("sha256", key).update(raw).digest("hex")}`;
}

const base = {
  secret,
  eventName: "push",
  deliveryId: "delivery-1",
  projectId: "00000000-0000-4000-8000-000000000001",
  persistenceConfigured: true,
};

describe("GitHub webhook decisions", () => {
  it("verifies the signature over the raw body, not a re-serialized payload", () => {
    const raw = '{ "zen" : "keep" }';
    const reformatted = JSON.stringify(JSON.parse(raw));
    expect(reformatted).not.toBe(raw);
    const decision = decideGitHubWebhook({ ...base, raw, signature: sign(reformatted) });
    expect(decision).toMatchObject({ ok: false, status: 401 });
    const accepted = decideGitHubWebhook({ ...base, raw, signature: sign(raw) });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) expect(accepted.event.payload).toEqual({ zen: "keep" });
  });

  it("does not acknowledge when persistence is not configured", () => {
    const raw = '{"ok":true}';
    const decision = decideGitHubWebhook({ ...base, raw, signature: sign(raw), persistenceConfigured: false });
    expect(decision).toEqual({ ok: false, status: 503, error: "Persistence is required before acknowledging a webhook." });
  });

  it("bounds the payload and requires a delivery id for deduplication", () => {
    const raw = `{"blob":"${"a".repeat(MAX_GITHUB_WEBHOOK_BYTES)}"}`;
    const bounded = decideGitHubWebhook({ ...base, raw, signature: sign(raw) });
    expect(bounded.ok).toBe(false);
    if (!bounded.ok) expect(bounded.status).toBe(413);
    const small = "{}";
    const missingDelivery = decideGitHubWebhook({ ...base, raw: small, signature: sign(small), deliveryId: "  " });
    expect(missingDelivery.ok).toBe(false);
    if (!missingDelivery.ok) expect(missingDelivery.status).toBe(400);
  });

  it("recognizes unique-violation duplicates", () => {
    expect(isUniqueViolation({ code: "23505", message: "duplicate key value violates unique constraint" })).toBe(true);
    expect(isUniqueViolation({ message: "permission denied" })).toBe(false);
  });
});
