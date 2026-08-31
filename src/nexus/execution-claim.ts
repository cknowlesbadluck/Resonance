/**
 * Exclusive claim for nexus_execution_requests (CHR-51 Option A).
 *
 * Request lifecycle:
 *   accepted  → executing  → waiting | completed | failed | cancelled
 *
 * `accepted` means the idempotency row exists but the handler has not started.
 * The unique transition `accepted|waiting → executing` is the compare-and-swap
 * that only one caller can win. Stale recovery reclaims `accepted` rows that
 * never made that transition; it never reclaims `executing`.
 */

export const STALE_ACCEPTED_MS = 5 * 60 * 1000;
export const EXECUTING_STATUS = "executing" as const;

export function staleAcceptedCutoff(now = Date.now()): string {
  return new Date(now - STALE_ACCEPTED_MS).toISOString();
}

export function isStaleAccepted(
  status: string,
  updatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (status !== "accepted" || !updatedAt) return false;
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return false;
  return now - ts > STALE_ACCEPTED_MS;
}

export type ResumeClaim =
  | { ok: true; from: "waiting" | "accepted"; requireStale: boolean }
  | { ok: false; status: number; error: string };

export function decideResumeClaim(
  status: string,
  updatedAt: string | null | undefined,
  now = Date.now(),
): ResumeClaim {
  if (status === "waiting") {
    return { ok: true, from: "waiting", requireStale: false };
  }
  if (isStaleAccepted(status, updatedAt, now)) {
    return { ok: true, from: "accepted", requireStale: true };
  }
  if (status === EXECUTING_STATUS) {
    return { ok: false, status: 409, error: "Execution request is already executing." };
  }
  return {
    ok: false,
    status: 409,
    error: `Execution request is not awaiting approval (status: ${status}).`,
  };
}

export function decideInitiationReclaim(
  status: string,
  updatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  return isStaleAccepted(status, updatedAt, now);
}

/**
 * In-memory stand-in for the PostgREST conditional update
 * `.eq(status, from).lt(updated_at, cutoff)` used by the resume and
 * initiation routes. The compare-and-swap itself is synchronous so two
 * overlapping callers in the same event-loop turn cannot both win.
 */
export class InMemoryRequestRow {
  constructor(
    public status: string,
    public updatedAt: number,
  ) {}

  compareAndSwapToExecuting(from: string, staleBefore?: number): boolean {
    if (this.status !== from) return false;
    if (staleBefore !== undefined && this.updatedAt >= staleBefore) return false;
    this.status = EXECUTING_STATUS;
    this.updatedAt = Date.now();
    return true;
  }
}

export async function exclusiveResume(
  row: InMemoryRequestRow,
  execute: () => Promise<void> | void,
  now = Date.now(),
): Promise<boolean> {
  const decision = decideResumeClaim(row.status, new Date(row.updatedAt).toISOString(), now);
  if (!decision.ok) return false;
  const won = row.compareAndSwapToExecuting(
    decision.from,
    decision.requireStale ? now - STALE_ACCEPTED_MS : undefined,
  );
  if (!won) return false;
  await execute();
  return true;
}
