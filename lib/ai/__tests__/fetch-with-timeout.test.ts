import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PROVIDER_TIMEOUT_MS, fetchWithTimeout } from "../providers/fetch-with-timeout";
import { ProviderError } from "../types";

const hang: typeof fetch = (_u, init) =>
  new Promise((_r, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
    );
  });

describe("fetchWithTimeout", () => {
  it("returns the response when headers arrive in time", async () => {
    const ok: typeof fetch = async () => new Response("hi", { status: 200 });
    const res = await fetchWithTimeout("openai", "https://x", {}, 1000, ok);
    expect(res.status).toBe(200);
  });

  it("fails closed with a retryable 504 ProviderError on timeout", async () => {
    const err = await fetchWithTimeout("openai", "https://x", {}, 20, hang).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.status).toBe(504);
    expect(err.retryable).toBe(true);
  });

  it("rethrows caller aborts unchanged (not a timeout)", async () => {
    const ac = new AbortController();
    const p = fetchWithTimeout("anthropic", "https://x", { signal: ac.signal }, 5000, hang);
    ac.abort();
    const err = await p.catch((e) => e);
    expect(err).not.toBeInstanceOf(ProviderError);
    expect(err.name).toBe("AbortError");
  });

  it("maps network errors to a sanitized retryable 502", async () => {
    const boom: typeof fetch = async () => {
      throw new Error("getaddrinfo ENOTFOUND secret-internal-host");
    };
    const err = await fetchWithTimeout("gemini", "https://x", {}, 1000, boom).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.status).toBe(502);
    expect(String(err.message)).not.toContain("secret-internal-host");
  });

  it("clamps invalid timeouts to the default instead of disabling it", async () => {
    vi.useFakeTimers();
    try {
      const hang: typeof fetch = (_u, init) =>
        new Promise((_r, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
      const p = fetchWithTimeout("openai", "https://x", {}, Number.NaN, hang).catch((e) => e);
      await vi.advanceTimersByTimeAsync(DEFAULT_PROVIDER_TIMEOUT_MS);
      const err = await p;
      expect(err).toBeInstanceOf(ProviderError);
      expect(err.status).toBe(504);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still forwards caller aborts after headers arrive (body stream cancellable)", async () => {
    let inner: AbortSignal | undefined;
    const ok: typeof fetch = async (_u, init) => {
      inner = init?.signal ?? undefined;
      return new Response(null, { status: 200 });
    };
    const caller = new AbortController();
    await fetchWithTimeout("anthropic", "https://x", { signal: caller.signal }, 1000, ok);
    expect(inner?.aborted).toBe(false);
    caller.abort();
    expect(inner?.aborted).toBe(true);
  });
});
