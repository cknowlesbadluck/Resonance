import type {
  ProviderAdapter,
  StreamChunk,
  StreamRequest,
} from "../types";
import { ProviderError } from "../types";

/**
 * OpenAI-compatible streaming adapter.
 * Uses the public Chat Completions SSE API. API key is read from env at
 * call time — never baked into source.
 */
export function createOpenAIAdapter(opts?: {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}): ProviderAdapter {
  const apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const baseUrl = (opts?.baseUrl ?? "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );

  return {
    id: "openai",
    displayName: "OpenAI",

    async *stream(request: StreamRequest): AsyncIterable<StreamChunk> {
      if (!apiKey) {
        throw new ProviderError("OPENAI_API_KEY is not configured", {
          providerId: "openai",
          retryable: false,
        });
      }

      const model = request.model || opts?.defaultModel || "gpt-4o-mini";
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: true,
        }),
        signal: request.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`,
          {
            providerId: "openai",
            status: res.status,
          }
        );
      }

      if (!res.body) {
        throw new ProviderError("OpenAI response body is empty", {
          providerId: "openai",
          status: 502,
          retryable: true,
        });
      }

      yield* parseOpenAISSE(res.body);
    },
  };
}

async function* parseOpenAISSE(
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
        if (payload === "[DONE]") {
          yield { done: true };
          return;
        }
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          const finish = json.choices?.[0]?.finish_reason;
          if (delta || finish) {
            yield {
              text: delta,
              finishReason: finish ?? undefined,
              done: Boolean(finish),
            };
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
