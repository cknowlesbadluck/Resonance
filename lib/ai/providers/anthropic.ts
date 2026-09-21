import type {
  ProviderAdapter,
  StreamChunk,
  StreamRequest,
} from "../types";
import { ProviderError } from "../types";

/**
 * Anthropic Messages API streaming adapter (SSE).
 */
export function createAnthropicAdapter(opts?: {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}): ProviderAdapter {
  const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
  const baseUrl = (opts?.baseUrl ?? "https://api.anthropic.com").replace(
    /\/$/,
    ""
  );

  return {
    id: "anthropic",
    displayName: "Anthropic",

    async *stream(request: StreamRequest): AsyncIterable<StreamChunk> {
      if (!apiKey) {
        throw new ProviderError("ANTHROPIC_API_KEY is not configured", {
          providerId: "anthropic",
          retryable: false,
        });
      }

      const model =
        request.model || opts?.defaultModel || "claude-3-5-haiku-latest";

      // Anthropic expects system as a top-level field.
      const system = request.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const messages = request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          system: system || undefined,
          messages,
          max_tokens: request.maxTokens ?? 1024,
          temperature: request.temperature,
          stream: true,
        }),
        signal: request.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Anthropic HTTP ${res.status}: ${body.slice(0, 200)}`,
          {
            providerId: "anthropic",
            status: res.status,
          }
        );
      }

      if (!res.body) {
        throw new ProviderError("Anthropic response body is empty", {
          providerId: "anthropic",
          status: 502,
          retryable: true,
        });
      }

      yield* parseAnthropicSSE(res.body);
    },
  };
}

async function* parseAnthropicSSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<StreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload) as {
            type?: string;
            delta?: { type?: string; text?: string };
            message?: { stop_reason?: string };
          };
          if (
            json.type === "content_block_delta" &&
            json.delta?.type === "text_delta" &&
            json.delta.text
          ) {
            yield { text: json.delta.text };
          }
          if (json.type === "message_stop") {
            yield { done: true, finishReason: "stop" };
            return;
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
