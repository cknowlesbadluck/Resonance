import { NextResponse } from "next/server";

/**
 * Uniform 500 envelope for persistence failures. Raw Postgres/PostgREST messages
 * (table, column, constraint, policy names) are logged server-side only and never
 * returned to the caller.
 */
export const PERSISTENCE_ERROR_MESSAGE = "Persistence error. Retry later or contact the operator.";

export type PersistenceErrorBody = { error: string; code: "persistence_error"; context: string; requestId?: string };

export function persistenceErrorBody(context: string, requestId?: string): PersistenceErrorBody {
  return requestId ? { error: PERSISTENCE_ERROR_MESSAGE, code: "persistence_error", context, requestId } : { error: PERSISTENCE_ERROR_MESSAGE, code: "persistence_error", context };
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Correlation id for an error envelope: reuse a well-formed inbound X-Request-Id
 * (e.g. from Vercel/proxy) or mint one. Malformed inbound values are ignored so
 * callers cannot inject arbitrary text into logs or responses.
 */
export function resolveRequestId(request?: { headers: Headers }): string {
  const inbound = request?.headers.get("x-request-id")?.trim();
  return inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : crypto.randomUUID();
}

export function persistenceErrorResponse(context: string, cause: unknown, request?: { headers: Headers }) {
  const requestId = resolveRequestId(request);
  const code = typeof cause === "object" && cause !== null && "code" in cause ? String((cause as { code: unknown }).code) : undefined;
  console.error(`[resonance] persistence error in ${context} requestId=${requestId}`, code ?? "", cause instanceof Error ? cause.message : cause);
  return NextResponse.json(persistenceErrorBody(context, requestId), { status: 500, headers: { "X-Request-Id": requestId } });
}

/**
 * 422 envelope for composition/execution failures. CompositionError messages are
 * domain-level and actionable, so they pass through; anything else (adapter, network,
 * provider, database) is logged server-side and replaced with a generic message.
 */
export function publicFailure(error: unknown): { error: string; code: "composition_error" | "executor_failed" } {
  if (error instanceof Error && error.name === "CompositionError") return { error: error.message, code: "composition_error" };
  console.error("[resonance] execution failure", error instanceof Error ? error.message : error);
  return { error: "Execution failed. Retry later or contact the operator.", code: "executor_failed" };
}

const BODY_LIMIT_RE = /^Request body exceeds the \d+ KiB limit\.$/;

/** Keep size-limit messages; never echo JSON parser details (they can quote input). */
export function bodyErrorMessage(error: unknown): string {
  return error instanceof Error && BODY_LIMIT_RE.test(error.message) ? error.message : "Invalid JSON body.";
}
