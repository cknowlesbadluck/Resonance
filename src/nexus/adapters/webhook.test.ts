import { describe, expect, it, vi } from "vitest";
import {
  WEBHOOK_CAPABILITY_ID, WEBHOOK_MAX_BODY_BYTES, WebhookAdapter, isBlockedAddress, signWebhookBody,
  verifyWebhookSignature, webhookAdapterFromEnv, webhookEventDeliverCapability, webhookUrlProblem,
} from "./webhook";
import type { InvocationRequest } from "./types";

const SECRET = "s".repeat(40);
const URL_OK = "https://hooks.example.com/resonance";
const NOW = Date.UTC(2026, 9, 17, 5, 0, 0);
const publicResolve = async () => ["93.184.216.34"];

function request(input: unknown, overrides: Partial<InvocationRequest> = {}): InvocationRequest {
  return { capabilityId: WEBHOOK_CAPABILITY_ID, input, actorId: "actor-1", correlationId: "corr-1", ...overrides };
}
function adapter(fetchImpl: typeof fetch, resolveImpl: (h: string) => Promise<string[]> = publicResolve, timeoutMs?: number) {
  return new WebhookAdapter({ url: URL_OK, secret: SECRET, timeoutMs }, { fetchImpl, resolveImpl, now: () => NOW });
}
function okFetch(status = 202, body = "ok") {
  return vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}
const valid = { event: "execution.completed", payload: { executionId: "exe_1", status: "succeeded" } };

describe("webhook adapter: configuration (disabled unless configured)", () => {
  it("is absent with no env, incomplete env, bad URL or short secret; reasons never echo values", () => {
    expect(webhookAdapterFromEnv({})).toEqual({ adapter: null, reason: "not_configured" });
    expect(webhookAdapterFromEnv({ RESONANCE_WEBHOOK_URL: URL_OK }).reason).toBe("incomplete_configuration");
    expect(webhookAdapterFromEnv({ RESONANCE_WEBHOOK_SECRET: SECRET }).reason).toBe("incomplete_configuration");
    expect(webhookAdapterFromEnv({ RESONANCE_WEBHOOK_URL: "http://hooks.example.com", RESONANCE_WEBHOOK_SECRET: SECRET }).reason).toBe("https_required");
    expect(webhookAdapterFromEnv({ RESONANCE_WEBHOOK_URL: URL_OK, RESONANCE_WEBHOOK_SECRET: "short" }).reason).toBe("secret_too_short");
    const configured = webhookAdapterFromEnv({ RESONANCE_WEBHOOK_URL: URL_OK, RESONANCE_WEBHOOK_SECRET: SECRET });
    expect(configured.adapter).toBeInstanceOf(WebhookAdapter);
    expect(JSON.stringify(webhookAdapterFromEnv({ RESONANCE_WEBHOOK_URL: "https://user:pw@hooks.example.com", RESONANCE_WEBHOOK_SECRET: SECRET }))).not.toContain("pw");
  });

  it("constructor refuses misconfiguration without echoing the secret", () => {
    expect(() => new WebhookAdapter({ url: "https://127.0.0.1/x", secret: SECRET })).toThrow(/blocked_host/);
    expect(() => new WebhookAdapter({ url: URL_OK, secret: "tiny-secret" })).toThrow(/at least 32/);
    try { new WebhookAdapter({ url: URL_OK, secret: "tiny-secret" }); } catch (e) { expect(String(e)).not.toContain("tiny-secret"); }
  });

  it("describe() advertises one executable capability and never leaks the destination", async () => {
    const description = await adapter(okFetch()).describe();
    expect(description.capabilities).toEqual([webhookEventDeliverCapability]);
    expect(webhookEventDeliverCapability).toMatchObject({ id: WEBHOOK_CAPABILITY_ID, adapterId: "webhook", executable: true, risk: "medium", requiredPermissions: ["webhook.deliver"] });
    expect(JSON.stringify(description)).not.toContain("hooks.example.com");
  });
});

describe("webhook adapter: SSRF guard", () => {
  it.each([
    ["not a url"], ["ftp://hooks.example.com"], ["http://hooks.example.com"], ["https://localhost/x"], ["https://api.localhost/x"],
    ["https://printer.local/x"], ["https://db.internal/x"], ["https://intranet/x"], ["https://127.0.0.1/x"], ["https://10.1.2.3/x"],
    ["https://169.254.169.254/latest/meta-data"], ["https://[::1]/x"], ["https://[fd00::1]/x"], ["https://[::ffff:127.0.0.1]/x"],
    ["https://hooks.example.com:8443/x"], ["https://u:p@hooks.example.com/x"], ["https://0.0.0.0/x"],
  ])("rejects %s", (url) => { expect(webhookUrlProblem(url)).not.toBeNull(); });

  it("accepts a public https host on 443", () => {
    expect(webhookUrlProblem(URL_OK)).toBeNull();
    expect(webhookUrlProblem("https://hooks.example.com:443/x")).toBeNull();
    expect(webhookUrlProblem("https://93.184.216.34/x")).toBeNull();
  });

  it.each([
    "127.0.0.1", "10.0.0.1", "172.16.5.4", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "224.0.0.1", "255.255.255.255", "198.18.0.1", "192.0.2.1", "::", "::1", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1",
    "::ffff:10.0.0.1", "::ffff:7f00:1", "64:ff9b::a00:1", "2001:db8::1", "2002:0a00:0001::1", "2001:0:4136:e378::1", "garbage", "",
  ])("blocks address %s", (ip) => { expect(isBlockedAddress(ip)).toBe(true); });

  it.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8", "64:ff9b::808:808"])("allows public address %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it("refuses delivery when ANY resolved address is private, or resolution fails, without calling fetch", async () => {
    for (const resolve of [async () => ["93.184.216.34", "10.0.0.5"], async () => ["::1"], async () => [], async () => { throw new Error("ENOTFOUND hooks.example.com"); }]) {
      const fetchImpl = okFetch();
      const result = await adapter(fetchImpl, resolve).invoke(request(valid));
      expect(result).toMatchObject({ ok: false, evidence: { provider: "webhook", code: "blocked_destination" } });
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toMatch(/10\.0\.0\.5|ENOTFOUND|hooks\.example\.com/);
    }
  });
});

describe("webhook adapter: signed delivery", () => {
  it("POSTs signed JSON with deterministic delivery id, manual redirects and a verifiable signature", async () => {
    const fetchImpl = okFetch(202);
    const result = await adapter(fetchImpl).invoke(request(valid));
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(URL_OK);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("manual");
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-resonance-event"]).toBe("execution.completed");
    expect(headers["x-resonance-timestamp"]).toBe(String(NOW / 1000));
    expect(headers["idempotency-key"]).toBe(headers["x-resonance-delivery"]);
    expect(headers["x-resonance-signature"]).toBe(signWebhookBody(SECRET, NOW / 1000, body));
    expect(JSON.stringify(headers)).not.toContain(SECRET);
    expect(verifyWebhookSignature({ secret: SECRET, timestamp: headers["x-resonance-timestamp"], body, signature: headers["x-resonance-signature"], nowSeconds: NOW / 1000 + 10 })).toBe(true);
    expect(JSON.parse(body)).toEqual({ id: headers["x-resonance-delivery"], event: "execution.completed", occurredAt: new Date(NOW).toISOString(), correlationId: "corr-1", actorId: "actor-1", payload: valid.payload });
    expect(result).toMatchObject({ output: { delivered: true, deliveryId: headers["x-resonance-delivery"], status: 202 }, evidence: { provider: "webhook", status: 202 } });
    expect(JSON.stringify(result)).not.toContain("hooks.example.com");

    const again = okFetch();
    await adapter(again).invoke(request(valid));
    const otherCorrelation = okFetch();
    await adapter(otherCorrelation).invoke(request(valid, { correlationId: "corr-2" }));
    const id = (f: ReturnType<typeof okFetch>) => ((f.mock.calls[0] as [string, RequestInit])[1].headers as Record<string, string>)["x-resonance-delivery"];
    expect(id(again)).toBe(headers["x-resonance-delivery"]);
    expect(id(otherCorrelation)).not.toBe(headers["x-resonance-delivery"]);
  });

  it("verifyWebhookSignature rejects tampering, wrong secret, stale or malformed timestamps", () => {
    const ts = NOW / 1000;
    const body = "{\"a\":1}";
    const sig = signWebhookBody(SECRET, ts, body);
    const base = { secret: SECRET, timestamp: String(ts), body, signature: sig, nowSeconds: ts };
    expect(verifyWebhookSignature(base)).toBe(true);
    expect(verifyWebhookSignature({ ...base, body: "{\"a\":2}" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, secret: "x".repeat(40) })).toBe(false);
    expect(verifyWebhookSignature({ ...base, nowSeconds: ts + 301 })).toBe(false);
    expect(verifyWebhookSignature({ ...base, timestamp: "12abc" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, signature: null })).toBe(false);
    expect(verifyWebhookSignature({ ...base, signature: "v1=deadbeef" })).toBe(false);
  });
});

describe("webhook adapter: input and size bounds", () => {
  it.each([
    [null], ["string"], [[1]], [{ event: "Bad Event", payload: {} }], [{ event: "ok.event" }], [{ event: "ok.event", payload: [1] }],
    [{ event: "ok.event", payload: {}, url: "https://evil.example" }], [{ event: "x".repeat(65), payload: {} }],
  ])("rejects invalid input %#", async (input) => {
    const fetchImpl = okFetch();
    expect(await adapter(fetchImpl).invoke(request(input))).toMatchObject({ ok: false, evidence: { code: "invalid_input" } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects non-serialisable payloads and unsupported capabilities", async () => {
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect(await adapter(okFetch()).invoke(request({ event: "a.b", payload: circular }))).toMatchObject({ ok: false, evidence: { code: "invalid_input" } });
    expect(await adapter(okFetch()).invoke(request(valid, { capabilityId: "webhook.other" }))).toMatchObject({ ok: false, evidence: { code: "unsupported_capability" } });
  });

  it("caps the request body before any network activity", async () => {
    const fetchImpl = okFetch();
    const resolve = vi.fn(publicResolve);
    const result = await adapter(fetchImpl, resolve).invoke(request({ event: "big.event", payload: { blob: "x".repeat(WEBHOOK_MAX_BODY_BYTES) } }));
    expect(result).toMatchObject({ ok: false, evidence: { code: "payload_too_large" } });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });

  it("reads at most 8 KiB of the response and never echoes it", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { pulled++; controller.enqueue(new Uint8Array(4096).fill(65)); if (pulled > 100) controller.close(); } });
    const fetchImpl = vi.fn(async () => new Response(stream, { status: 200 })) as unknown as typeof fetch;
    const result = await adapter(fetchImpl).invoke(request(valid));
    expect(result.ok).toBe(true);
    expect(pulled).toBeLessThan(10);
    expect((result.evidence as { responseBytes: number }).responseBytes).toBeLessThanOrEqual(8 * 1024);
    expect(JSON.stringify(result)).not.toContain("AAAA");
  });
});

describe("webhook adapter: failure mapping is redacted", () => {
  it.each([
    [301, "redirect_refused"], [302, "redirect_refused"], [400, "rejected"], [401, "rejected"], [404, "rejected"],
    [429, "rate_limited"], [500, "unavailable"], [503, "unavailable"],
  ])("HTTP %i -> %s, without the receiver body", async (status, code) => {
    const fetchImpl = vi.fn(async () => new Response("internal stack trace secret=abc", { status, headers: status < 400 ? { location: "http://10.0.0.1/" } : {} })) as unknown as typeof fetch;
    const result = await adapter(fetchImpl).invoke(request(valid));
    expect(result).toMatchObject({ ok: false, evidence: { provider: "webhook", code, status } });
    expect(JSON.stringify(result)).not.toMatch(/stack trace|secret=abc|10\.0\.0\.1|hooks\.example\.com/);
  });

  it("network errors map to unavailable without leaking the error message", async () => {
    const fetchImpl = vi.fn(async () => { throw new Error(`connect ECONNREFUSED hooks.example.com ${SECRET}`); }) as unknown as typeof fetch;
    const result = await adapter(fetchImpl).invoke(request(valid));
    expect(result).toMatchObject({ ok: false, error: "Webhook delivery failed.", evidence: { code: "unavailable" } });
    expect(JSON.stringify(result)).not.toMatch(/ECONNREFUSED|hooks\.example\.com|sssss/);
  });

  it("times out (clamped minimum 500 ms) and aborts the request", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
        signal = init.signal ?? undefined;
        signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
      })) as unknown as typeof fetch;
      const pending = adapter(fetchImpl, publicResolve, 1).invoke(request(valid));
      await vi.advanceTimersByTimeAsync(499);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toMatchObject({ ok: false, error: "Webhook delivery timed out.", evidence: { code: "timeout" } });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("webhook adapter: runtime wiring", () => {
  it("is not registered without configuration, and is registered (executable) when configured", async () => {
    vi.resetModules();
    vi.stubEnv("RESONANCE_WEBHOOK_URL", "");
    vi.stubEnv("RESONANCE_WEBHOOK_SECRET", "");
    try {
      const off = await import("../runtime");
      expect(off.listRuntimeCapabilities().map((c) => c.id)).not.toContain(WEBHOOK_CAPABILITY_ID);
      expect(off.nexusAdapters.map((a) => a.id)).not.toContain("webhook");
      vi.resetModules();
      vi.stubEnv("RESONANCE_WEBHOOK_URL", URL_OK);
      vi.stubEnv("RESONANCE_WEBHOOK_SECRET", SECRET);
      const on = await import("../runtime");
      expect(on.listRuntimeCapabilities().map((c) => c.id)).toContain(WEBHOOK_CAPABILITY_ID);
      expect(on.nexusAdapters.map((a) => a.id)).toContain("webhook");
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
