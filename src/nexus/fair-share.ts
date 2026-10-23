/**
 * Fair-share guard for adapter invocations: composition without one party dominating.
 *
 * Every step the executor runs takes two slots, in a fixed order (project, then adapter):
 *   1. a per-project slot, so one project cannot occupy every adapter slot, and
 *   2. a per-adapter slot, so one slow or busy provider cannot take unbounded concurrency.
 * Waiters queue FIFO per key, so other projects interleave instead of starving. Queues are bounded:
 * past `maxQueue` waiters on a key, the step fails fast with `fair_share_queue_full` instead of
 * piling up memory. Acquisition order is fixed and both slots are always released, so there is no deadlock.
 *
 * Configuration (fail-safe: a missing, non-numeric, zero or negative value falls back to the default,
 * so a typo can never switch the guard off; values are clamped to a hard maximum):
 *   RESONANCE_MAX_INFLIGHT_PER_PROJECT    default 4, max 64
 *   RESONANCE_MAX_CONCURRENT_PER_ADAPTER  default 8, max 128
 *
 * Scope: per server instance (in-memory), like the existing rate-limit and idempotency stores.
 * A cross-instance cap needs a shared store; see the roadmap.
 */

export const FAIR_SHARE_DEFAULTS = { perProject: 4, perAdapter: 8, maxQueue: 256 } as const;
const HARD_MAX = { perProject: 64, perAdapter: 128 } as const;

export function parseCap(raw: string | undefined, fallback: number, max: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
}

export class FairShareQueueFullError extends Error {
  constructor(readonly scope: string, readonly key: string) {
    super(`fair_share_queue_full: too many queued invocations for ${scope} ${key}`);
    this.name = "FairShareQueueFullError";
  }
}

/** A counting semaphore per key with a bounded FIFO wait queue. */
export class KeyedSemaphore {
  private readonly active = new Map<string, number>();
  private readonly waiters = new Map<string, Array<() => void>>();

  constructor(readonly limit: number, readonly scope: string, readonly maxQueue: number = FAIR_SHARE_DEFAULTS.maxQueue) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit must be a positive integer");
  }

  inFlight(key: string): number { return this.active.get(key) ?? 0; }
  queued(key: string): number { return this.waiters.get(key)?.length ?? 0; }

  async acquire(key: string): Promise<() => void> {
    if (this.inFlight(key) < this.limit) {
      this.active.set(key, this.inFlight(key) + 1);
      return this.releaser(key);
    }
    const queue = this.waiters.get(key) ?? [];
    if (queue.length >= this.maxQueue) throw new FairShareQueueFullError(this.scope, key);
    this.waiters.set(key, queue);
    // The releasing holder hands its slot straight to the next waiter (active count unchanged).
    await new Promise<void>((resolve) => queue.push(resolve));
    return this.releaser(key);
  }

  private releaser(key: string): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const queue = this.waiters.get(key);
      const next = queue?.shift();
      if (queue && queue.length === 0) this.waiters.delete(key);
      if (next) { next(); return; }
      const remaining = this.inFlight(key) - 1;
      if (remaining > 0) this.active.set(key, remaining); else this.active.delete(key);
    };
  }
}

export class FairShareGuard {
  readonly projects: KeyedSemaphore;
  readonly adapters: KeyedSemaphore;

  constructor(limits: { perProject?: number; perAdapter?: number; maxQueue?: number } = {}) {
    const maxQueue = limits.maxQueue ?? FAIR_SHARE_DEFAULTS.maxQueue;
    this.projects = new KeyedSemaphore(limits.perProject ?? FAIR_SHARE_DEFAULTS.perProject, "project", maxQueue);
    this.adapters = new KeyedSemaphore(limits.perAdapter ?? FAIR_SHARE_DEFAULTS.perAdapter, "adapter", maxQueue);
  }

  /** Run `fn` holding a project slot and then an adapter slot. Both are released however `fn` ends. */
  async run<T>(projectId: string, adapterId: string, fn: () => Promise<T>): Promise<T> {
    const releaseProject = await this.projects.acquire(projectId);
    try {
      const releaseAdapter = await this.adapters.acquire(adapterId);
      try { return await fn(); } finally { releaseAdapter(); }
    } finally { releaseProject(); }
  }
}

export function fairShareFromEnv(env: NodeJS.ProcessEnv = process.env): FairShareGuard {
  return new FairShareGuard({
    perProject: parseCap(env.RESONANCE_MAX_INFLIGHT_PER_PROJECT, FAIR_SHARE_DEFAULTS.perProject, HARD_MAX.perProject),
    perAdapter: parseCap(env.RESONANCE_MAX_CONCURRENT_PER_ADAPTER, FAIR_SHARE_DEFAULTS.perAdapter, HARD_MAX.perAdapter),
  });
}
