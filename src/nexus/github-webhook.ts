import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_GITHUB_WEBHOOK_BYTES = 1_048_576;
const MAX_EVENT_NAME_LENGTH = 100;

export function verifyGitHubWebhookSignature(raw: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  return /duplicate key value|events_external_id_unique/i.test(error.message ?? "");
}

export interface GitHubWebhookEvent {
  projectId: string;
  source: "github";
  type: string;
  status: "received";
  payload: unknown;
  externalId: string;
}

export type GitHubWebhookDecision =
  | { ok: false; status: 401 | 400 | 413 | 503; error: string }
  | { ok: true; event: GitHubWebhookEvent };

export function decideGitHubWebhook(input: {
  raw: string;
  signature: string | null;
  secret: string | undefined;
  eventName: string | null;
  deliveryId: string | null;
  projectId: string | null;
  persistenceConfigured: boolean;
}): GitHubWebhookDecision {
  if (Buffer.byteLength(input.raw) > MAX_GITHUB_WEBHOOK_BYTES) {
    return { ok: false, status: 413, error: "Webhook payload exceeds the 1 MiB limit." };
  }
  if (!verifyGitHubWebhookSignature(input.raw, input.signature, input.secret)) {
    return { ok: false, status: 401, error: "invalid signature" };
  }
  if (!input.eventName?.trim() || input.eventName.length > MAX_EVENT_NAME_LENGTH) {
    return { ok: false, status: 400, error: "x-github-event is required." };
  }
  if (!input.deliveryId?.trim() || input.deliveryId.length > 256) {
    return { ok: false, status: 400, error: "x-github-delivery is required." };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(input.raw);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON payload" };
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 400, error: "Webhook payload must be a JSON object." };
  }
  if (!input.persistenceConfigured || !input.projectId) {
    return { ok: false, status: 503, error: "Persistence is required before acknowledging a webhook." };
  }
  return {
    ok: true,
    event: {
      projectId: input.projectId,
      source: "github",
      type: `github.${input.eventName}`,
      status: "received",
      payload,
      externalId: input.deliveryId,
    },
  };
}
