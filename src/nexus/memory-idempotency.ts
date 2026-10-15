export type MemoryIdempotencyDecision =
  | { kind: "start"; claimToken: string }
  | { kind: "replay"; body: unknown; httpStatus: number }
  | { kind: "conflict" }
  | { kind: "in_progress" };

interface MemoryIdempotencyRecord {
  hash: string;
  status: string;
  body?: unknown;
  httpStatus?: number;
  claimToken: string;
  updatedAt: number;
}

/**
 * Single-threaded compare-and-set for non-production fallback.
 * Production must use the database unique index instead of this store.
 */
export const DEFAULT_MEMORY_IDEMPOTENCY_MAX = 1000;

export class MemoryIdempotencyStore {
  private readonly records = new Map<string, MemoryIdempotencyRecord>();

  /** Bounded: beyond maxRecords, the oldest *finished* record is evicted first; in-flight claims last. */
  constructor(private readonly maxRecords = DEFAULT_MEMORY_IDEMPOTENCY_MAX) {
    if (!(maxRecords >= 1)) throw new Error("maxRecords must be >= 1");
  }

  size() { return this.records.size; }

  private evict() {
    while (this.records.size > this.maxRecords) {
      let victim: string | undefined;
      for (const [id, record] of this.records) { if (record.status !== "accepted") { victim = id; break; } }
      this.records.delete(victim ?? this.records.keys().next().value as string);
    }
  }

  begin(projectId: string, key: string, hash: string, now = Date.now(), staleMs = 5 * 60 * 1000): MemoryIdempotencyDecision {
    const id = `${projectId}\n${key}`;
    const existing = this.records.get(id);
    if (!existing) {
      const claimToken = crypto.randomUUID();
      this.records.set(id, { hash, status: "accepted", claimToken, updatedAt: now });
      this.evict();
      return { kind: "start", claimToken };
    }
    if (existing.hash !== hash) return { kind: "conflict" };
    if (existing.body !== undefined && existing.status !== "accepted") {
      return { kind: "replay", body: existing.body, httpStatus: existing.httpStatus ?? 200 };
    }
    if (existing.status === "accepted" && now - existing.updatedAt >= staleMs) {
      const claimToken = crypto.randomUUID();
      existing.claimToken = claimToken;
      existing.updatedAt = now;
      return { kind: "start", claimToken };
    }
    return { kind: "in_progress" };
  }

  finish(projectId: string, key: string, claimToken: string, body: unknown, httpStatus: number, status: string, now = Date.now()): boolean {
    const existing = this.records.get(`${projectId}\n${key}`);
    if (!existing || existing.claimToken !== claimToken) return false;
    existing.body = body;
    existing.httpStatus = httpStatus;
    existing.status = status;
    existing.updatedAt = now;
    return true;
  }
}
