import type {
  ProviderAdapter,
  StreamChunk,
  StreamRequest,
} from "../types";
import { ProviderError } from "../types";

/**
 * Google Gemini streaming adapter (streamGenerateContent SSE).
 */
export function createGeminiAdapter(opts?: {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}): ProviderAdapter {
  const apiKey = opts?.apiKey ?? process.env.GEMINI_API_KEY ?? "";
  const baseUrl = (
    opts?.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, "");

  return {
    id: "gemini",
    displayName: "Gemini",

    async *stream(request: StreamRequest): AsyncIterable<StreamChunk> {
      if (!apiKey) {
        throw new ProviderError("GEMINI_API_KEY is not configured", {
          providerId: "gemini",
          retryable: false,
        });
      }

      const model =
        request.model || opts?.defaultModel || "gemini-2.0-flash";

      // Gemini uses a single contents array; fold system into first user turn.
      const system = request.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const contents = request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      if (system && contents.length > 0 && contents[0].role === "user") {
        contents[0] = {
          ...contents[0],
          parts: [{ text: `${system}\n\n${contents[0].parts[0].text}` }],
        };
      }

      const url = `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
          },
        }),
        signal: request.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Gemini HTTP ${res.status}: ${body.slice(0, 200)}`,
          {
            providerId: "gemini",
            status: res.status,
          }
        );
      }

      if (!res.body) {
        throw new ProviderError("Gemini response body is empty", {
          providerId: "gemini",
          status: 502,
          retryable: true,
        });
      }

      yield* parseGeminiSSE(res.body);
    },
  };
}

async function* parseGeminiSSE(
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
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
              finishReason?: string;
            }>;
          };
          const text = json.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("");
          const finish = json.candidates?.[0]?.finishReason;
          if (text || finish) {
            yield {
              text: text || undefined,
              finishReason: finish,
              done: Boolean(finish && finish !== "FINISH_REASON_UNSPECIFIED"),
            };
          }
        } catch {
          // ignore
        }
      }
    }
    yield { done: true };
  } finally {
    reader.releaseLock();
  }
}
