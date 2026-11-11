import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnthropicAdapter, createGeminiAdapter, createOpenAIAdapter } from "../providers";
import { ProviderError, type ProviderAdapter } from "../types";

/**
 * Adapter contract: every provider adapter exposes the same neutral surface,
 * fails closed (ProviderError, not retryable, no network) when unconfigured,
 * and never leaks its credential into the request URL or an error message.
 */
const SECRET = "sk-test-DO-NOT-LEAK-123";
const FACTORIES: Array<[string, (o?: { apiKey?: string }) => ProviderAdapter, string]> = [
  ["openai", createOpenAIAdapter, "OPENAI_API_KEY"],
  ["anthropic", createAnthropicAdapter, "ANTHROPIC_API_KEY"],
  ["gemini", createGeminiAdapter, "GEMINI_API_KEY"],
];
const req = { messages: [{ role: "user" as const, content: "hi" }], model: "m" };

async function drain(a: ProviderAdapter): Promise<unknown> {
  try {
    for await (const _ of a.stream(req)) void _;
    return null;
  } catch (e) {
    return e;
  }
}

describe.each(FACTORIES)("adapter contract: %s", (id, factory, envKey) => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env[envKey];
    delete process.env[envKey];
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[envKey];
    else process.env[envKey] = saved;
    vi.unstubAllGlobals();
  });

  it("exposes only the neutral ProviderAdapter surface", () => {
    const a = factory({ apiKey: SECRET });
    expect(a.id).toBe(id);
    expect(typeof a.displayName).toBe("string");
    expect(typeof a.stream).toBe("function");
    expect(Object.keys(a).every((k) => ["id", "displayName", "stream", "complete"].includes(k))).toBe(true);
  });

  it("fails closed without a key: non-retryable ProviderError and no network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const e = await drain(factory());
    expect(e).toBeInstanceOf(ProviderError);
    expect((e as ProviderError).providerId).toBe(id);
    expect((e as ProviderError).retryable).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never puts the key in the URL or in an error message", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string | URL) => {
      urls.push(String(u));
      return new Response(`upstream says ${"x".repeat(10)}`, { status: 500 });
    }));
    const e = await drain(factory({ apiKey: SECRET }));
    expect(e).toBeInstanceOf(ProviderError);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u).not.toContain(SECRET);
    expect(String((e as Error).message)).not.toContain(SECRET);
  });
});
