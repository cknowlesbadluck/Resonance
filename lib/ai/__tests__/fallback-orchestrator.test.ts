import { describe, it, expect } from "vitest";
import { FallbackOrchestrator } from "../fallback-orchestrator";
import {
  ProviderError,
  type ProviderAdapter,
  type StreamChunk,
  type StreamRequest,
} from "../types";

function mockAdapter(
  id: string,
  behavior: "ok" | "retryable" | "fatal" | "partial-then-fail",
  text = `from-${id}`
): ProviderAdapter {
  return {
    id,
    displayName: id,
    async *stream(_req: StreamRequest): AsyncIterable<StreamChunk> {
      if (behavior === "ok") {
        yield { text };
        yield { done: true, finishReason: "stop" };
        return;
      }
      if (behavior === "retryable") {
        throw new ProviderError(`${id} rate limited`, {
          providerId: id,
          status: 429,
          retryable: true,
        });
      }
      if (behavior === "fatal") {
        throw new ProviderError(`${id} auth failed`, {
          providerId: id,
          status: 401,
          retryable: false,
        });
      }
      // partial-then-fail
      yield { text: "partial" };
      throw new ProviderError(`${id} mid-stream failure`, {
        providerId: id,
        status: 503,
        retryable: true,
      });
    },
  };
}

const baseRequest: StreamRequest = {
  model: "test-model",
  messages: [{ role: "user", content: "hi" }],
};

describe("FallbackOrchestrator", () => {
  it("returns the first successful provider", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "ok"),
      mockAdapter("anthropic", "ok"),
    ]);
    const result = await orch.completeWithFallback(baseRequest, {
      order: ["openai", "anthropic"],
    });
    expect(result.providerId).toBe("openai");
    expect(result.chunks.some((c) => c.text === "from-openai")).toBe(true);
    expect(result.attempted).toHaveLength(0);
  });

  it("cascades on 429 to the next provider", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "retryable"),
      mockAdapter("anthropic", "ok", "recovered"),
    ]);
    const result = await orch.completeWithFallback(baseRequest, {
      order: ["openai", "anthropic"],
    });
    expect(result.providerId).toBe("anthropic");
    expect(result.chunks.some((c) => c.text === "recovered")).toBe(true);
    expect(result.attempted).toHaveLength(1);
    expect(result.attempted[0].status).toBe(429);
  });

  it("does not cascade on non-retryable errors by default", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "fatal"),
      mockAdapter("anthropic", "ok"),
    ]);
    await expect(
      orch.completeWithFallback(baseRequest, {
        order: ["openai", "anthropic"],
      })
    ).rejects.toMatchObject({ status: 401, retryable: false });
  });

  it("cascades non-retryable when onlyRetryable is false", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "fatal"),
      mockAdapter("gemini", "ok", "gemini-ok"),
    ]);
    const result = await orch.completeWithFallback(baseRequest, {
      order: ["openai", "gemini"],
      onlyRetryable: false,
    });
    expect(result.providerId).toBe("gemini");
  });

  it("respects maxAttempts", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "retryable"),
      mockAdapter("anthropic", "retryable"),
      mockAdapter("gemini", "ok"),
    ]);
    await expect(
      orch.completeWithFallback(baseRequest, {
        order: ["openai", "anthropic", "gemini"],
        maxAttempts: 2,
      })
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it("streamWithFallback yields from the winning provider", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "retryable"),
      mockAdapter("anthropic", "ok", "streamed"),
    ]);
    const texts: string[] = [];
    for await (const chunk of orch.streamWithFallback(baseRequest, {
      order: ["openai", "anthropic"],
    })) {
      if (chunk.text) texts.push(chunk.text);
    }
    expect(texts).toContain("streamed");
  });

  it("does not cascade after partial yield", async () => {
    const orch = new FallbackOrchestrator([
      mockAdapter("openai", "partial-then-fail"),
      mockAdapter("anthropic", "ok"),
    ]);
    const texts: string[] = [];
    await expect(async () => {
      for await (const chunk of orch.streamWithFallback(baseRequest, {
        order: ["openai", "anthropic"],
      })) {
        if (chunk.text) texts.push(chunk.text);
      }
    }).rejects.toMatchObject({ status: 503 });
    expect(texts).toEqual(["partial"]);
  });

  it("throws when no adapters match the policy order", async () => {
    const orch = new FallbackOrchestrator([mockAdapter("openai", "ok")]);
    await expect(
      orch.completeWithFallback(baseRequest, {
        order: ["missing-provider"],
      })
    ).rejects.toBeInstanceOf(ProviderError);
  });
});
