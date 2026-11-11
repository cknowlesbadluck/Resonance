import { capabilityLevelRank, normalizeGrants } from "./grants";
import type { ExecutionRetryPolicy, ExecutionStep } from "./types";

/**
 * Retry classification for NexusExecutor steps.
 *
 * Adapters normalize provider failures into a shared failure-code vocabulary (see
 * adapters/github.ts and adapters/linear.ts: invalid_input, unsupported_capability,
 * unauthorized, forbidden, not_found, rate_limited, unavailable, timeout,
 * malformed_response). Before this module the executor retried every failure the same
 * way, so a `forbidden` or `invalid_input` burned all attempts, and an ambiguous
 * `timeout` on a side-effecting step could execute a write twice.
 *
 * Rules (single place, provider-neutral):
 * - permanent codes never retry: the same request will fail the same way.
 * - rate_limited always may retry: the provider rejected the request before acting.
 * - ambiguous codes (timeout, unavailable) retry only for steps not marked
 *   `sideEffect: true`. For a write, the side effect may already have happened; re-running
 *   it needs an idempotency key, not a blind retry. (`requiresApproval` is not usable as
 *   the signal: the executor never runs a step while it still requires approval.)
 * - failures without a code keep the previous behavior (retry), so third-party
 *   adapters that do not classify yet are unaffected.
 */

const PERMANENT_FAILURE_CODES: ReadonlySet<string> = new Set([
  "invalid_input", "unsupported_capability", "unauthorized", "forbidden", "not_found", "malformed_response",
]);
const AMBIGUOUS_FAILURE_CODES: ReadonlySet<string> = new Set(["timeout", "unavailable"]);

export const MAX_RETRY_ATTEMPTS = 5;
export const MAX_RETRY_DELAY_MS = 30_000;

export type RetryDecision =
  | { retry: true; reason: "transient" | "unclassified" }
  | { retry: false; reason: "permanent" | "ambiguous_side_effect" | "attempts_exhausted" };

export function failureCodeOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const code = (value as { code?: unknown }).code;
  return typeof code === "string" && code.length > 0 && code.length <= 64 ? code : undefined;
}

export function retryAfterMsOf(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = (value as { retryAfterMs?: unknown }).retryAfterMs;
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : undefined;
}

export function effectiveMaxAttempts(policy: ExecutionRetryPolicy): number {
  const requested = Number.isFinite(policy.maxAttempts) ? Math.floor(policy.maxAttempts) : 1;
  return Math.min(MAX_RETRY_ATTEMPTS, Math.max(1, requested));
}

export function classifyRetry(code: string | undefined, step: Pick<ExecutionStep, "sideEffect">, attempt: number, maxAttempts: number): RetryDecision {
  if (attempt >= maxAttempts) return { retry: false, reason: "attempts_exhausted" };
  if (code === undefined) return { retry: true, reason: "unclassified" };
  if (PERMANENT_FAILURE_CODES.has(code)) return { retry: false, reason: "permanent" };
  if (AMBIGUOUS_FAILURE_CODES.has(code) && step.sideEffect === true) return { retry: false, reason: "ambiguous_side_effect" };
  return { retry: true, reason: "transient" };
}

/** Linear backoff (previous behavior) capped at MAX_RETRY_DELAY_MS; a provider Retry-After wins when larger. */
export function retryDelayMs(policy: ExecutionRetryPolicy, attempt: number, retryAfterMs?: number): number {
  const base = Number.isFinite(policy.backoffMs) && policy.backoffMs > 0 ? policy.backoffMs * attempt : 0;
  return Math.min(MAX_RETRY_DELAY_MS, Math.max(base, retryAfterMs ?? 0));
}

/**
 * Side-effect classification from the single capability model (grants.ts): any declared
 * authority at or above `modify`, or any grant that cannot be normalized (fail closed),
 * marks the step as mutating external state. read/analyze-only capabilities are safe to
 * re-run after an ambiguous failure.
 */
export function sideEffectForGrants(grants: readonly string[]): boolean {
  const { unrecognized, highest } = normalizeGrants(grants);
  if (unrecognized.length > 0) return true;
  return capabilityLevelRank[highest] >= capabilityLevelRank.modify;
}
