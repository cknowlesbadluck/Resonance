/**
 * Best-effort, free, in-memory fixed-window rate limiter for public API routes.
 * Per server instance only (serverless instances do not share state), so it blunts
 * floods and scripted abuse; it is not a global quota. Durable per-project limits
 * remain in POST /api/nexus/executions (database-backed).
 */
export type RateDecision = { allowed: boolean; limit: number; remaining: number; resetSeconds: number };

export class FixedWindowLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();
  constructor(private readonly limit: number, private readonly windowMs = 60_000, private readonly maxKeys = 10_000) {}

  check(key: string, now = Date.now()): RateDecision {
    let entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      if (!entry && this.hits.size >= this.maxKeys) this.evict(now);
      entry = { count: 0, windowStart: now };
      this.hits.set(key, entry);
    }
    entry.count += 1;
    const resetSeconds = Math.max(1, Math.ceil((entry.windowStart + this.windowMs - now) / 1000));
    return { allowed: entry.count <= this.limit, limit: this.limit, remaining: Math.max(0, this.limit - entry.count), resetSeconds };
  }

  private evict(now: number) {
    for (const [k, v] of this.hits) if (now - v.windowStart >= this.windowMs) this.hits.delete(k);
    if (this.hits.size >= this.maxKeys) this.hits.clear();
  }
}

/** First hop of x-forwarded-for, else x-real-ip, else "unknown" (all unknowns share one bucket). */
export function clientKey(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Routes never limited here: liveness/readiness probes and signed GitHub webhooks. */
export function isExempt(pathname: string): boolean {
  return pathname === "/api/health" || pathname === "/api/ready" || pathname.startsWith("/api/webhooks/");
}

export function limitFromEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
