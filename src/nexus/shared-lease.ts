/**
 * Shared leases: make fair share (and, optionally, rate limits) hold across server instances.
 *
 * Backed by `public.nexus_fair_share_leases` and the `nexus_lease_acquire` / `nexus_lease_release`
 * functions (supabase/migrations/20261017090000_nexus_shared_leases.sql, which the OWNER APPLIES).
 *
 * Used only when configured (`RESONANCE_SHARED_LEASES=supabase` plus the Supabase URL and service role
 * key) and only once the functions exist. Otherwise the in-memory `FairShareGuard` alone applies.
 *
 * Fail-safe rules:
 *   - The local (per-instance) guard always applies first, so local limits hold even when shared leases fail.
 *   - Any Supabase error or timeout (default 1.5 s per call) puts the store in a cooldown (30 s).
 *     During cooldown, steps run on local limits only. Missing table or functions are re-checked every 10 minutes.
 *   - A slot that is full cluster-wide is retried with backoff for at most `maxWaitMs` (default 5 s).
 *     After that the step fails fast with `fair_share_shared_busy`, which is retryable and never waits indefinitely.
 *   - Leases carry a TTL (default 120 s). A crashed instance's slots expire on their own. While an invocation
 *     runs, its leases are renewed every TTL/3 (heartbeat), so a long call never outlives its lease. Release
 *     and renew are best-effort and never throw.
 *   - Order: local project slot, then shared project lease, then local adapter slot, then shared adapter lease.
 *     A project waiting on its cluster-wide cap therefore never holds this instance's adapter slots.
 */
import type { FairShareGuard, FairShareRunner } from "./fair-share";
import { parseCap } from "./fair-share";

export type LeaseScope = "project" | "adapter" | "rate";
export type LeaseRpcError = { code?: string; message?: string } | null;
/** The subset of SupabaseClient this module uses (so tests can pass a mock). */
export interface LeaseRpcClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: LeaseRpcError }>;
}

export type LeaseAcquireResult =
  | { status: "acquired"; leaseId: string }
  | { status: "full" }
  | { status: "unavailable"; reason: "missing" | "cooldown" | "error" | "timeout" };

export type SharedLeaseState = "unknown" | "available" | "missing" | "cooldown";

export const SHARED_LEASE_DEFAULTS = { ttlSeconds: 120, rpcTimeoutMs: 1500, cooldownMs: 30_000, missingRecheckMs: 600_000, maxWaitMs: 5000 } as const;
const MISSING_CODES = new Set(["PGRST202", "42883", "42P01", "PGRST205"]);

export class FairShareSharedBusyError extends Error {
  constructor(readonly scope: LeaseScope, readonly key: string) {
    super(`fair_share_shared_busy: ${scope} ${key} is at its shared limit across instances`);
    this.name = "FairShareSharedBusyError";
  }
}

class RpcTimeout extends Error {}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new RpcTimeout("timeout")), ms); }),
  ]).finally(() => { if (timer) clearTimeout(timer); });
}

export class SharedLeaseStore {
  private state: SharedLeaseState = "unknown";
  private retryAt = 0;
  private counters = { acquired: 0, full: 0, fallbacks: 0, errors: 0, releaseErrors: 0, renewals: 0, renewErrors: 0 };
  private lastErrorCode: string | null = null;
  readonly holder: string;
  readonly ttlSeconds: number;
  private readonly rpcTimeoutMs: number;
  private readonly cooldownMs: number;
  private readonly missingRecheckMs: number;
  private readonly now: () => number;

  constructor(private readonly client: LeaseRpcClient, options: {
    holder?: string; ttlSeconds?: number; rpcTimeoutMs?: number; cooldownMs?: number; missingRecheckMs?: number; now?: () => number;
  } = {}) {
    this.holder = (options.holder ?? `instance-${globalThis.crypto.randomUUID()}`).slice(0, 200);
    this.ttlSeconds = options.ttlSeconds ?? SHARED_LEASE_DEFAULTS.ttlSeconds;
    this.rpcTimeoutMs = options.rpcTimeoutMs ?? SHARED_LEASE_DEFAULTS.rpcTimeoutMs;
    this.cooldownMs = options.cooldownMs ?? SHARED_LEASE_DEFAULTS.cooldownMs;
    this.missingRecheckMs = options.missingRecheckMs ?? SHARED_LEASE_DEFAULTS.missingRecheckMs;
    this.now = options.now ?? Date.now;
  }

  status() {
    return { state: this.state, holder: this.holder, ttlSeconds: this.ttlSeconds, lastErrorCode: this.lastErrorCode, ...this.counters };
  }

  private markUnavailable(reason: "missing" | "error" | "timeout", code: string | null): LeaseAcquireResult {
    this.counters.errors += 1;
    this.counters.fallbacks += 1;
    this.lastErrorCode = code;
    if (reason === "missing") { this.state = "missing"; this.retryAt = this.now() + this.missingRecheckMs; }
    else { this.state = "cooldown"; this.retryAt = this.now() + this.cooldownMs; }
    return { status: "unavailable", reason };
  }

  /** Try once to take a slot. Never waits on capacity; never throws. */
  async acquire(scope: LeaseScope, key: string, limit: number, ttlSeconds = this.ttlSeconds): Promise<LeaseAcquireResult> {
    if ((this.state === "missing" || this.state === "cooldown") && this.now() < this.retryAt) {
      this.counters.fallbacks += 1;
      return { status: "unavailable", reason: this.state === "missing" ? "missing" : "cooldown" };
    }
    // Client-generated id: if the RPC times out but later commits, we can still release that exact lease.
    const leaseId = globalThis.crypto.randomUUID();
    let response: { data: unknown; error: LeaseRpcError };
    let pending: Promise<{ data: unknown; error: LeaseRpcError }> | undefined;
    try {
      pending = Promise.resolve(this.client.rpc("nexus_lease_acquire", {
        p_scope: scope, p_key: key.slice(0, 200), p_limit: limit, p_holder: this.holder, p_ttl_seconds: ttlSeconds, p_lease_id: leaseId,
      }));
      response = await withTimeout(pending, this.rpcTimeoutMs);
    } catch (error) {
      // Release only after the original call settles, so the release can't run before a late insert.
      if (pending) void pending.then((late) => { if (!late.error && late.data) void this.release(leaseId); }, () => {});
      return this.markUnavailable(error instanceof RpcTimeout ? "timeout" : "error", error instanceof RpcTimeout ? "timeout" : "exception");
    }
    if (response.error) {
      const code = response.error.code ?? "unknown";
      return this.markUnavailable(MISSING_CODES.has(code) ? "missing" : "error", code);
    }
    this.state = "available";
    if (typeof response.data === "string" && response.data) {
      this.counters.acquired += 1;
      return { status: "acquired", leaseId };
    }
    this.counters.full += 1;
    return { status: "full" };
  }

  /** Best-effort release; the TTL covers anything that fails here. Never throws. */
  async release(leaseId: string): Promise<void> {
    try {
      const { error } = await withTimeout(this.client.rpc("nexus_lease_release", { p_lease_id: leaseId }), this.rpcTimeoutMs);
      if (error) this.counters.releaseErrors += 1;
    } catch {
      this.counters.releaseErrors += 1;
    }
  }

  /** Heartbeat a live lease. Returns false if the lease was lost (expired or unknown) or the call failed. Never throws. */
  async renew(leaseId: string, ttlSeconds = this.ttlSeconds): Promise<boolean> {
    try {
      const { data, error } = await withTimeout(this.client.rpc("nexus_lease_renew", { p_lease_id: leaseId, p_ttl_seconds: ttlSeconds }), this.rpcTimeoutMs);
      if (error || data !== true) { this.counters.renewErrors += 1; return false; }
      this.counters.renewals += 1;
      return true;
    } catch {
      this.counters.renewErrors += 1;
      return false;
    }
  }

  /**
   * Fixed-window-ish rate limit primitive shared across instances: each allowed call holds a `rate`
   * lease for `windowSeconds` and is never released, so at most `limit` calls per key per window.
   * `unavailable` means: apply the local in-memory limiter instead.
   */
  async tryConsume(key: string, limit: number, windowSeconds: number): Promise<"allowed" | "limited" | "unavailable"> {
    const result = await this.acquire("rate", key, limit, windowSeconds);
    return result.status === "acquired" ? "allowed" : result.status === "full" ? "limited" : "unavailable";
  }
}

const sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fair share across instances: the local guard first (always), then a shared project lease, then a shared
 * adapter lease, with the same caps as the local guard. Those caps then hold cluster-wide.
 */
export class SharedFairShareGuard implements FairShareRunner {
  private readonly maxWaitMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;

  constructor(readonly local: FairShareGuard, readonly store: SharedLeaseStore, options: {
    maxWaitMs?: number; sleep?: (ms: number) => Promise<void>; now?: () => number;
  } = {}) {
    this.maxWaitMs = options.maxWaitMs ?? SHARED_LEASE_DEFAULTS.maxWaitMs;
    this.sleep = options.sleep ?? sleepMs;
    this.now = options.now ?? Date.now;
  }

  /** Lease id, or null when shared leases are unavailable (run on local limits only). Throws only on a bounded busy timeout. */
  private async acquireShared(scope: LeaseScope, key: string, limit: number): Promise<string | null> {
    const deadline = this.now() + this.maxWaitMs;
    let backoff = 25;
    for (;;) {
      const result = await this.store.acquire(scope, key, limit);
      if (result.status === "acquired") return result.leaseId;
      if (result.status === "unavailable") return null;
      if (this.now() >= deadline) throw new FairShareSharedBusyError(scope, key);
      const wait = Math.min(backoff, Math.max(0, deadline - this.now()));
      await this.sleep(wait + Math.floor(Math.random() * Math.min(25, backoff)));
      backoff = Math.min(backoff * 2, 500);
    }
  }

  /** Renew `leases` every TTL/3 until the returned stop function is called. */
  private heartbeat(leases: string[]): () => void {
    const everyMs = Math.max(1000, Math.floor((this.store.ttlSeconds * 1000) / 3));
    const timer = setInterval(() => { for (const lease of leases) void this.store.renew(lease); }, everyMs);
    (timer as { unref?: () => void }).unref?.();
    return () => clearInterval(timer);
  }

  async run<T>(projectId: string, adapterId: string, fn: () => Promise<T>): Promise<T> {
    const leases: string[] = [];
    const releaseLocalProject = await this.local.projects.acquire(projectId);
    try {
      const projectLease = await this.acquireShared("project", projectId, this.local.projects.limit);
      if (projectLease) leases.push(projectLease);
      // Only now take the local adapter slot, so a project waiting on its shared cap never holds adapter slots.
      const releaseLocalAdapter = await this.local.adapters.acquire(adapterId);
      try {
        const adapterLease = await this.acquireShared("adapter", adapterId, this.local.adapters.limit);
        if (adapterLease) leases.push(adapterLease);
        const stopHeartbeat = leases.length ? this.heartbeat(leases) : () => {};
        try { return await fn(); } finally { stopHeartbeat(); }
      } finally { releaseLocalAdapter(); }
    } finally {
      releaseLocalProject();
      for (const lease of leases) void this.store.release(lease);
    }
  }
}

/** True when the environment opts into shared leases and has what it needs to reach Supabase. */
export function sharedLeasesConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.RESONANCE_SHARED_LEASES?.trim().toLowerCase() === "supabase"
    && Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim())
    && Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Wrap the local guard with shared leases when configured; otherwise return the local guard unchanged.
 * `createClient` is injected so this module never imports supabase-js itself (and tests can mock it).
 */
export function fairShareRunnerFromEnv(
  local: FairShareGuard,
  createClient: (url: string, key: string) => LeaseRpcClient,
  env: NodeJS.ProcessEnv = process.env,
): FairShareRunner {
  if (!sharedLeasesConfigured(env)) return local;
  try {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!.trim(), env.SUPABASE_SERVICE_ROLE_KEY!.trim());
    const store = new SharedLeaseStore(client, { ttlSeconds: parseCap(env.RESONANCE_SHARED_LEASE_TTL_SECONDS, SHARED_LEASE_DEFAULTS.ttlSeconds, 3600) });
    return new SharedFairShareGuard(local, store, { maxWaitMs: parseCap(env.RESONANCE_SHARED_LEASE_MAX_WAIT_MS, SHARED_LEASE_DEFAULTS.maxWaitMs, 30_000) });
  } catch {
    return local;
  }
}
