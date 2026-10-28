import { NextResponse } from "next/server";

/**
 * Uniform 500 envelope for persistence failures. Raw Postgres/PostgREST messages
 * (table, column, constraint, policy names) are logged server-side only and never
 * returned to the caller.
 */
export const PERSISTENCE_ERROR_MESSAGE = "Persistence error. Retry later or contact the operator.";

export type PersistenceErrorBody = { error: string; code: "persistence_error"; context: string };

export function persistenceErrorBody(context: string): PersistenceErrorBody {
  return { error: PERSISTENCE_ERROR_MESSAGE, code: "persistence_error", context };
}

export function persistenceErrorResponse(context: string, cause: unknown) {
  const code = typeof cause === "object" && cause !== null && "code" in cause ? String((cause as { code: unknown }).code) : undefined;
  console.error(`[resonance] persistence error in ${context}`, code ?? "", cause instanceof Error ? cause.message : cause);
  return NextResponse.json(persistenceErrorBody(context), { status: 500 });
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
