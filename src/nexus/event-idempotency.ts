export const MAX_EVENT_EXTERNAL_ID_LENGTH = 256;

/**
 * Resolve the idempotency identity for POST /api/events.
 * `external_id` and `Idempotency-Key` represent the same stable event identity.
 * Either may be supplied; if both are present they must agree.
 */
export function resolveEventExternalId(
  header: string | null | undefined,
  bodyValue: unknown,
): { ok: true; externalId: string | null } | { ok: false; error: string } {
  const fromHeader = header?.trim() || null;
  if (bodyValue !== undefined && bodyValue !== null && (typeof bodyValue !== "string" || !bodyValue.trim())) {
    return { ok: false, error: "external_id is invalid." };
  }
  const fromBody = typeof bodyValue === "string" ? bodyValue : null;
  for (const value of [fromHeader, fromBody]) {
    if (value !== null && value.length > MAX_EVENT_EXTERNAL_ID_LENGTH) {
      return { ok: false, error: "external_id is invalid." };
    }
  }
  if (fromHeader !== null && fromBody !== null && fromHeader !== fromBody) {
    return { ok: false, error: "Idempotency-Key header and external_id must match when both are provided." };
  }
  return { ok: true, externalId: fromBody ?? fromHeader };
}
