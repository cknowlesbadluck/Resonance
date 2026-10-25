import { ProviderError, type ProviderId } from "../types";

/** Default bound on time-to-response-headers for provider calls (ms). */
export const DEFAULT_PROVIDER_TIMEOUT_MS = 60_000;

/**
 * fetch() with a bounded wait for response headers.
 *
 * - The timer is cleared once headers arrive, so long-running SSE streams are
 *   not truncated (mid-stream stalls are NOT bounded here).
 * - A caller-supplied signal still aborts the request and its error is
 *   rethrown unchanged.
 * - A timeout becomes a retryable ProviderError (status 504) so the fallback
 *   orchestrator can cascade instead of hanging forever.
 * - Network errors become a retryable ProviderError (status 502) without
 *   echoing the underlying message (may contain URLs/hosts).
 */
export async function fetchWithTimeout(
  providerId: ProviderId,
  url: string,
  init: RequestInit & { signal?: AbortSignal },
  timeoutMs: number = DEFAULT_PROVIDER_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const ms =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.min(timeoutMs, 10 * 60_000)
      : DEFAULT_PROVIDER_TIMEOUT_MS;
  const controller = new AbortController();
  const caller = init.signal;
  let timedOut = false;

  const onCallerAbort = () => controller.abort(caller?.reason);
  if (caller) {
    if (caller.aborted) controller.abort(caller.reason);
    else caller.addEventListener("abort", onCallerAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error("provider timeout"));
  }, ms);

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (caller?.aborted) throw err;
    if (timedOut) {
      throw new ProviderError(`${providerId} request timed out after ${ms}ms`, {
        providerId,
        status: 504,
        retryable: true,
      });
    }
    throw new ProviderError(`${providerId} network error`, {
      providerId,
      status: 502,
      retryable: true,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener("abort", onCallerAbort);
  }
}
