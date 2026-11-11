/**
 * Server-log-safe summary of a DB/unknown error. Raw Postgres/PostgREST
 * messages and details can echo row values or payload fragments, so only a
 * short, character-limited error code and class name are kept.
 */
export function safeErrorSummary(error: unknown): { code: string; kind: string } {
  let rawCode: unknown;
  try {
    rawCode = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  } catch {
    rawCode = undefined; // throwing getter: never let logging break the 500 path
  }
  // Primitives only: String() on an arbitrary object can throw or run user code.
  const raw = typeof rawCode === "string" || typeof rawCode === "number" ? String(rawCode) : "";
  const code = /^[A-Za-z0-9_]{1,16}$/.test(raw) ? raw : "unknown";
  const kind =
    error instanceof Error && /^[A-Za-z]{1,40}$/.test(error.name) ? error.name : typeof error;
  return { code, kind };
}
