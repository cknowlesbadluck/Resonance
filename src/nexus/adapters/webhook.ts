import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";
import type { NexusCapability } from "../types";

/**
 * Signed outbound webhook adapter: delivers a Nexus event to ONE operator-configured HTTPS
 * endpoint as an HMAC-SHA256 signed JSON POST.
 *
 * Fail-closed by construction:
 * - Disabled unless both RESONANCE_WEBHOOK_URL and RESONANCE_WEBHOOK_SECRET are set and valid
 *   (`webhookAdapterFromEnv` returns null otherwise, so the capability is never advertised).
 * - The destination comes from configuration, never from invocation input.
 * - SSRF guard: https only, no credentials in the URL, no localhost/.local/.internal names,
 *   and every address the host resolves to is checked against private, loopback, link-local,
 *   CGNAT, multicast, documentation and reserved ranges (IPv4, IPv6, v4-mapped, NAT64) on every
 *   delivery. Redirects are refused, not followed. Residual risk: fetch re-resolves the host,
 *   so a DNS-rebinding receiver could race the check; pinning the resolved IP needs a custom
 *   dispatcher and is a follow-up. The destination is operator-chosen, which bounds this.
 * - Size caps: request body <= 64 KiB, response read <= 8 KiB (then discarded, never echoed).
 * - Timeout: default 5 s, clamped to 0.5–15 s.
 * - Errors are redacted to a stable code; they never contain the URL, the secret, resolved
 *   addresses or the receiver's response body.
 *
 * Signature (Stripe-style, replay-resistant):
 *   X-Resonance-Timestamp: <unix seconds>
 *   X-Resonance-Signature: v1=<hex hmac_sha256(secret, `${timestamp}.${rawBody}`)>
 * X-Resonance-Delivery is deterministic per (correlationId, event, body), so executor retries
 * reuse it and receivers can dedupe. Receivers can verify with `verifyWebhookSignature`.
 */

export const WEBHOOK_CAPABILITY_ID = "webhook.event.deliver";
export const WEBHOOK_MAX_BODY_BYTES = 64 * 1024;
export const WEBHOOK_MAX_RESPONSE_BYTES = 8 * 1024;
export const WEBHOOK_MIN_SECRET_LENGTH = 32;
const DEFAULT_TIMEOUT_MS = 5_000;
const EVENT_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export const webhookEventDeliverCapability: NexusCapability = {
  id: WEBHOOK_CAPABILITY_ID,
  key: WEBHOOK_CAPABILITY_ID,
  name: "Deliver signed webhook event",
  description: "POSTs an HMAC-SHA256 signed JSON event to the operator-configured webhook endpoint.",
  providerId: "webhook",
  adapterId: "webhook",
  kind: "integration",
  requiredPermissions: ["webhook.deliver"],
  risk: "medium",
  availability: "available",
  provenance: "webhook-adapter",
  tags: ["webhook", "event", "deliver", "outbound"],
  executable: true,
  inputSchema: {
    type: "object",
    required: ["event", "payload"],
    additionalProperties: false,
    properties: {
      event: { type: "string", pattern: EVENT_RE.source },
      payload: { type: "object" },
    },
  },
};

export type WebhookFailureCode =
  | "invalid_input"
  | "unsupported_capability"
  | "payload_too_large"
  | "blocked_destination"
  | "redirect_refused"
  | "rejected"
  | "rate_limited"
  | "unavailable"
  | "timeout";

export interface WebhookAdapterConfig { url: string; secret: string; timeoutMs?: number; }
export interface WebhookAdapterOptions {
  fetchImpl?: typeof fetch;
  /** Resolves a hostname to every address it maps to. Injected for tests. */
  resolveImpl?: (hostname: string) => Promise<string[]>;
  now?: () => number;
}

/* ─── SSRF guard ──────────────────────────────────────────────────────────── */

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}
const V4_BLOCKED: Array<[string, number]> = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];
function isBlockedV4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return V4_BLOCKED.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

/** Expands an IPv6 literal to 8 hextets; returns null when malformed. */
function expandV6(ip: string): number[] | null {
  let s = ip.toLowerCase().split("%")[0];
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    if (isIP(v4[1]) !== 4) return null;
    const n = ipv4ToInt(v4[1]);
    s = s.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0) return null;
  const parts = [...head, ...Array(fill).fill("0"), ...tail];
  if (parts.length !== 8) return null;
  const out = parts.map((p) => (/^[0-9a-f]{1,4}$/.test(p) ? parseInt(p, 16) : NaN));
  return out.some(Number.isNaN) ? null : out;
}

/** True for any address a server-side webhook must never reach. Unknown/malformed input is blocked. */
export function isBlockedAddress(ip: string): boolean {
  const family = isIP(ip.split("%")[0]);
  if (family === 4) return isBlockedV4(ip);
  if (family !== 6) return true;
  const h = expandV6(ip);
  if (!h) return true;
  const embeddedV4 = () => `${h[6] >> 8}.${h[6] & 0xff}.${h[7] >> 8}.${h[7] & 0xff}`;
  if (h.slice(0, 7).every((x) => x === 0)) return true; // :: and ::1 (and deprecated ::a.b.c.d)
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) return isBlockedV4(embeddedV4()); // ::ffff:a.b.c.d
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0)) return isBlockedV4(embeddedV4()); // NAT64
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((h[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site local (deprecated)
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentation
  if (h[0] === 0x2002) return isBlockedV4(`${h[1] >> 8}.${h[1] & 0xff}.${h[2] >> 8}.${h[2] & 0xff}`); // 6to4
  if (h[0] === 0x2001 && h[1] === 0) return true; // Teredo
  return false;
}

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".home.arpa"];

/** Static URL validation (no DNS). Returns a reason code or null when acceptable. */
export function webhookUrlProblem(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw); } catch { return "invalid_url"; }
  if (url.protocol !== "https:") return "https_required";
  if (url.username || url.password) return "credentials_in_url";
  if (url.port && url.port !== "443") return "non_standard_port";
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host || host === "localhost" || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) return "blocked_host";
  if (isIP(host) && isBlockedAddress(host)) return "blocked_host";
  if (!isIP(host) && !host.includes(".")) return "blocked_host"; // single-label names resolve via local search domains
  return null;
}

async function defaultResolve(hostname: string): Promise<string[]> {
  return (await lookup(hostname, { all: true, verbatim: true })).map((r) => r.address);
}

/* ─── Signing ─────────────────────────────────────────────────────────────── */

export function signWebhookBody(secret: string, timestamp: number, body: string): string {
  return `v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

/** Receiver-side verification: constant-time compare plus a replay window (default 300 s). */
export function verifyWebhookSignature(input: { secret: string; timestamp: string | null; body: string; signature: string | null; toleranceSeconds?: number; nowSeconds?: number }): boolean {
  const ts = Number(input.timestamp);
  if (!input.signature || !input.timestamp || !/^\d{1,12}$/.test(input.timestamp) || !Number.isSafeInteger(ts)) return false;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > (input.toleranceSeconds ?? 300)) return false;
  const expected = Buffer.from(signWebhookBody(input.secret, ts, input.body));
  const supplied = Buffer.from(input.signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

/* ─── Adapter ─────────────────────────────────────────────────────────────── */

function fail(error: string, code: WebhookFailureCode, extra?: Record<string, unknown>): InvocationResult {
  return { ok: false, error, evidence: { provider: "webhook", code, ...extra } };
}

function isAbortError(error: unknown): boolean {
  const name = error && typeof error === "object" ? (error as { name?: string }).name : undefined;
  return name === "AbortError" || name === "TimeoutError";
}

function eventInput(value: unknown): { event: string; payload: Record<string, unknown> } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { event, payload, ...rest } = value as Record<string, unknown>;
  if (Object.keys(rest).length > 0) return null;
  if (typeof event !== "string" || !EVENT_RE.test(event)) return null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return { event, payload: payload as Record<string, unknown> };
}

async function drainCapped(response: Response, cap: number): Promise<number> {
  const reader = response.body?.getReader();
  if (!reader) return 0;
  let total = 0;
  try {
    while (total <= cap) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Math.min(total, cap);
}

export class WebhookAdapter implements NexusAdapter {
  readonly id = "webhook";
  readonly kind = "webhook";
  private readonly url: URL;
  private readonly secret: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly resolveImpl: (hostname: string) => Promise<string[]>;
  private readonly now: () => number;

  constructor(config: WebhookAdapterConfig, options: WebhookAdapterOptions = {}) {
    const problem = webhookUrlProblem(config.url);
    if (problem) throw new Error(`Webhook adapter misconfigured: ${problem}.`);
    if (typeof config.secret !== "string" || config.secret.length < WEBHOOK_MIN_SECRET_LENGTH) {
      throw new Error(`Webhook adapter misconfigured: secret must be at least ${WEBHOOK_MIN_SECRET_LENGTH} characters.`);
    }
    this.url = new URL(config.url);
    this.secret = config.secret;
    const t = Number(config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    this.timeoutMs = Number.isFinite(t) ? Math.min(15_000, Math.max(500, t)) : DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.resolveImpl = options.resolveImpl ?? defaultResolve;
    this.now = options.now ?? Date.now;
  }

  async describe(): Promise<AdapterDescription> {
    // The destination host is deliberately not described; discovery must not leak configuration.
    return { identity: { id: "webhook", type: "connector", name: "Signed Webhook", providerId: "webhook" }, capabilities: [webhookEventDeliverCapability] };
  }

  private async destinationAllowed(): Promise<boolean> {
    const host = this.url.hostname.replace(/^\[|\]$/g, "");
    if (isIP(host)) return !isBlockedAddress(host);
    let addresses: string[];
    try { addresses = await this.resolveImpl(host); } catch { return false; }
    return addresses.length > 0 && addresses.every((address) => !isBlockedAddress(address));
  }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    if (request.capabilityId !== WEBHOOK_CAPABILITY_ID) return fail("Unsupported webhook capability.", "unsupported_capability");
    const input = eventInput(request.input);
    if (!input) return fail("Webhook input must be { event: \"lower.case.name\", payload: { ... } } with no other keys.", "invalid_input");

    const occurredAt = new Date(this.now()).toISOString();
    const timestamp = Math.floor(this.now() / 1000);
    let body: string;
    let deliveryId: string;
    try {
      const payloadJson = JSON.stringify(input.payload);
      deliveryId = createHash("sha256").update(`${request.correlationId}\n${input.event}\n${payloadJson}`).digest("hex").slice(0, 32);
      body = JSON.stringify({ id: deliveryId, event: input.event, occurredAt, correlationId: request.correlationId, actorId: request.actorId, payload: input.payload });
    } catch {
      return fail("Webhook payload is not serialisable JSON.", "invalid_input");
    }
    const bytes = Buffer.byteLength(body, "utf8");
    if (bytes > WEBHOOK_MAX_BODY_BYTES) return fail(`Webhook body exceeds ${WEBHOOK_MAX_BODY_BYTES} bytes.`, "payload_too_large", { bytes });

    if (!(await this.destinationAllowed())) return fail("Webhook destination is not allowed.", "blocked_destination");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.url.toString(), {
        method: "POST",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "user-agent": "Resonance-Nexus-Webhook/1",
          "x-resonance-event": input.event,
          "x-resonance-delivery": deliveryId,
          "x-resonance-timestamp": String(timestamp),
          "x-resonance-signature": signWebhookBody(this.secret, timestamp, body),
          "idempotency-key": deliveryId,
        },
        body,
      });
      const responseBytes = await drainCapped(response, WEBHOOK_MAX_RESPONSE_BYTES).catch(() => 0);
      const evidence = { provider: "webhook", deliveryId, event: input.event, status: response.status, requestBytes: bytes, responseBytes };
      if (response.status >= 300 && response.status < 400) return fail("Webhook receiver redirected; redirects are refused.", "redirect_refused", { deliveryId, status: response.status });
      if (response.status === 429) return fail("Webhook receiver rate limited the delivery.", "rate_limited", { deliveryId, status: 429 });
      if (response.status >= 500) return fail("Webhook receiver is unavailable.", "unavailable", { deliveryId, status: response.status });
      if (!response.ok) return fail("Webhook receiver rejected the delivery.", "rejected", { deliveryId, status: response.status });
      return { ok: true, output: { delivered: true, deliveryId, status: response.status }, evidence };
    } catch (error) {
      if (isAbortError(error)) return fail("Webhook delivery timed out.", "timeout", { deliveryId });
      return fail("Webhook delivery failed.", "unavailable", { deliveryId });
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Builds the adapter only when fully configured. Misconfiguration (bad URL, short secret)
 * leaves it disabled; the returned `reason` is a fixed code, never a configured value.
 */
export function webhookAdapterFromEnv(env: Record<string, string | undefined> = process.env, options: WebhookAdapterOptions = {}): { adapter: WebhookAdapter | null; reason?: string } {
  const url = env.RESONANCE_WEBHOOK_URL?.trim();
  const secret = env.RESONANCE_WEBHOOK_SECRET?.trim();
  if (!url && !secret) return { adapter: null, reason: "not_configured" };
  if (!url || !secret) return { adapter: null, reason: "incomplete_configuration" };
  const problem = webhookUrlProblem(url);
  if (problem) return { adapter: null, reason: problem };
  if (secret.length < WEBHOOK_MIN_SECRET_LENGTH) return { adapter: null, reason: "secret_too_short" };
  const timeoutMs = env.RESONANCE_WEBHOOK_TIMEOUT_MS ? Number(env.RESONANCE_WEBHOOK_TIMEOUT_MS) : undefined;
  return { adapter: new WebhookAdapter({ url, secret, timeoutMs }, options) };
}
