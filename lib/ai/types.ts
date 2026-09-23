/**
 * Provider-neutral AI contracts for Resonance.
 * Adapters translate provider SDKs into these shapes; the orchestrator
 * never imports a concrete vendor client.
 */

export type ProviderId = "openai" | "anthropic" | "gemini" | string;

export interface StreamChunk {
  /** Incremental text delta (may be empty for control events). */
  text?: string;
  /** Provider-native finish reason when the stream ends. */
  finishReason?: string;
  /** True on the final chunk of a successful stream. */
  done?: boolean;
  /** Optional token usage reported by the provider. */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Opaque provider metadata (model id, request id, etc.). */
  meta?: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface StreamRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** AbortSignal for cooperative cancellation. */
  signal?: AbortSignal;
}

/**
 * Thin adapter surface. Implementations must map vendor streams into
 * AsyncIterable<StreamChunk> and throw ProviderError on failure.
 */
export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly displayName: string;
  /**
   * Stream a completion. Must not swallow retryable errors — throw
   * ProviderError so the orchestrator can cascade.
   */
  stream(request: StreamRequest): AsyncIterable<StreamChunk>;
  /** Optional non-streaming path. */
  complete?(request: StreamRequest): Promise<StreamChunk>;
}

export type RetryableStatus = 429 | 502 | 503 | 504;

export class ProviderError extends Error {
  readonly providerId: ProviderId;
  readonly status?: number;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(
    message: string,
    opts: {
      providerId: ProviderId;
      status?: number;
      retryable?: boolean;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "ProviderError";
    this.providerId = opts.providerId;
    this.status = opts.status;
    this.retryable =
      opts.retryable ??
      (opts.status !== undefined &&
        ([429, 502, 503, 504] as number[]).includes(opts.status));
    this.cause = opts.cause;
  }
}

export interface FallbackPolicy {
  /** Ordered provider preference. First healthy adapter wins. */
  order: ProviderId[];
  /** Max adapters to try (including the first). Default: order.length. */
  maxAttempts?: number;
  /** Only cascade when error.retryable is true. Default: true. */
  onlyRetryable?: boolean;
  /** Optional per-attempt timeout in ms. */
  attemptTimeoutMs?: number;
}

export interface FallbackResult {
  providerId: ProviderId;
  chunks: StreamChunk[];
  /** Providers that failed before the winner. */
  attempted: Array<{ providerId: ProviderId; error: string; status?: number }>;
}
