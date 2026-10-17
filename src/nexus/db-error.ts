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
