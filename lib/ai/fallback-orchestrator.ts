import type {
  FallbackPolicy,
  FallbackResult,
  ProviderAdapter,
  ProviderId,
  StreamChunk,
  StreamRequest,
} from "./types";
import { ProviderError } from "./types";

const DEFAULT_RETRYABLE = true;

/**
 * Deterministic multi-provider fallback cascade.
 *
 * Walks policy.order, invoking each adapter's stream until one succeeds.
 * Cascades only on retryable failures (429 / 5xx / network) unless
 * policy.onlyRetryable is false.
 *
 * No randomness, no jitter — order is strict so behavior is testable
 * and auditable.
 */
export class FallbackOrchestrator {
  private readonly adapters: Map<ProviderId, ProviderAdapter>;

  constructor(adapters: ProviderAdapter[]) {
    this.adapters = new Map(adapters.map((a) => [a.id, a]));
  }

  /**
   * Run the cascade and collect the full stream from the first success.
   * Prefer streamWithFallback when the caller wants to forward chunks live.
   */
  async completeWithFallback(
    request: StreamRequest,
    policy: FallbackPolicy
  ): Promise<FallbackResult> {
    const chunks: StreamChunk[] = [];
    const attempted: FallbackResult["attempted"] = [];
    const max = policy.maxAttempts ?? policy.order.length;
    const onlyRetryable = policy.onlyRetryable ?? DEFAULT_RETRYABLE;

    let lastError: ProviderError | undefined;

    for (let i = 0; i < Math.min(max, policy.order.length); i++) {
      const id = policy.order[i];
      const adapter = this.adapters.get(id);
      if (!adapter) {
        attempted.push({
          providerId: id,
          error: `adapter not registered: ${id}`,
        });
        continue;
      }

      try {
        const collected = await this.collectStream(
          adapter,
          request,
          policy.attemptTimeoutMs
        );
        return {
          providerId: adapter.id,
          chunks: collected,
          attempted,
        };
      } catch (err) {
        const pe = toProviderError(err, adapter.id);
        lastError = pe;
        attempted.push({
          providerId: adapter.id,
          error: pe.message,
          status: pe.status,
        });

        if (onlyRetryable && !pe.retryable) {
          throw pe;
        }
        // else cascade to next
      }
    }

    throw (
      lastError ??
      new ProviderError("no providers available in fallback policy", {
        providerId: policy.order[0] ?? "none",
        retryable: false,
      })
    );
  }

  /**
   * Yield chunks from the first successful provider, cascading on retryable failure.
   * If a stream fails mid-flight after yielding data, the error is rethrown
   * (partial success is not silently switched).
   */
  async *streamWithFallback(
    request: StreamRequest,
    policy: FallbackPolicy
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const max = policy.maxAttempts ?? policy.order.length;
    const onlyRetryable = policy.onlyRetryable ?? DEFAULT_RETRYABLE;
    let lastError: ProviderError | undefined;
    let yieldedAny = false;

    for (let i = 0; i < Math.min(max, policy.order.length); i++) {
      const id = policy.order[i];
      const adapter = this.adapters.get(id);
      if (!adapter) continue;

      try {
        for await (const chunk of adapter.stream(request)) {
          yieldedAny = true;
          yield chunk;
        }
        return;
      } catch (err) {
        const pe = toProviderError(err, adapter.id);
        lastError = pe;

        // Do not cascade after partial yield — caller already saw tokens.
        if (yieldedAny) throw pe;
        if (onlyRetryable && !pe.retryable) throw pe;
      }
    }

    throw (
      lastError ??
      new ProviderError("no providers available in fallback policy", {
        providerId: policy.order[0] ?? "none",
        retryable: false,
      })
    );
  }

  private async collectStream(
    adapter: ProviderAdapter,
    request: StreamRequest,
    timeoutMs?: number
  ): Promise<StreamChunk[]> {
    const chunks: StreamChunk[] = [];
    const run = async () => {
      for await (const chunk of adapter.stream(request)) {
        chunks.push(chunk);
      }
      return chunks;
    };

    if (timeoutMs === undefined || timeoutMs <= 0) {
      return run();
    }

    return Promise.race([
      run(),
      new Promise<StreamChunk[]>((_, reject) => {
        setTimeout(() => {
          reject(
            new ProviderError(`attempt timed out after ${timeoutMs}ms`, {
              providerId: adapter.id,
              status: 504,
              retryable: true,
            })
          );
        }, timeoutMs);
      }),
    ]);
  }
}

function toProviderError(err: unknown, providerId: ProviderId): ProviderError {
  if (err instanceof ProviderError) return err;
  if (err instanceof Error) {
    return new ProviderError(err.message, {
      providerId,
      retryable: true,
      cause: err,
    });
  }
  return new ProviderError(String(err), {
    providerId,
    retryable: true,
    cause: err,
  });
}
