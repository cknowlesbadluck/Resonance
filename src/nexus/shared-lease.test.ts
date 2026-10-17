import { describe, expect, it, vi } from "vitest";
import { FairShareGuard } from "./fair-share";
import { NexusExecutor } from "./executor";
import {
  FairShareSharedBusyError, SharedFairShareGuard, SharedLeaseStore, fairShareRunnerFromEnv, sharedLeasesConfigured,
  type LeaseRpcClient, type LeaseRpcError,
} from "./shared-lease";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

type Call = { fn: string; args: Record<string, unknown> };

/** In-memory model of nexus_lease_acquire / nexus_lease_release (same semantics as the migration). */
function fakeLeaseDb(opts: { now?: () => number } = {}) {
  const now = opts.now ?? Date.now;
  const leases = new Map<string, { scope: string; key: string; expiresAt: number }>();
  const calls: Call[] = [];
  let seq = 0;
  const client: LeaseRpcClient = {
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      if (fn === "nexus_lease_acquire") {
        const { p_scope, p_key, p_limit, p_ttl_seconds, p_lease_id } = args as { p_scope: string; p_key: string; p_limit: number; p_ttl_seconds: number; p_lease_id: string };
        for (const [id, l] of leases) if (l.scope === p_scope && l.key === p_key && l.expiresAt <= now()) leases.delete(id);
        const held = [...leases.values()].filter((l) => l.scope === p_scope && l.key === p_key).length;
        if (held >= p_limit) return { data: null, error: null };
        seq += 1;
        const id = p_lease_id;
        leases.set(id, { scope: p_scope, key: p_key, expiresAt: now() + p_ttl_seconds * 1000 });
        return { data: id, error: null };
      }
      if (fn === "nexus_lease_release") return { data: leases.delete(args.p_lease_id as string), error: null };
      if (fn === "nexus_lease_renew") {
        const l = leases.get(args.p_lease_id as string);
        if (!l || l.expiresAt <= now()) return { data: false, error: null };
        l.expiresAt = now() + (args.p_ttl_seconds as number) * 1000;
        return { data: true, error: null };
      }
      return { data: null, error: { code: "PGRST202", message: "unknown function" } };
    },
  };
  return { client, leases, calls };
}

const erroring = (error: LeaseRpcError): LeaseRpcClient => ({ rpc: async () => ({ data: null, error }) });
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>((r) => { resolve = r; }); return { promise, resolve }; };

describe("SharedLeaseStore", () => {
  it("acquires up to the limit per (scope, key), reports full, and frees on release", async () => {
    const db = fakeLeaseDb();
    const store = new SharedLeaseStore(db.client, { holder: "h1" });
    const a = await store.acquire("project", "p1", 2);
    const b = await store.acquire("project", "p1", 2);
    expect(a.status).toBe("acquired");
    expect(b.status).toBe("acquired");
    expect(await store.acquire("project", "p1", 2)).toEqual({ status: "full" });
    expect((await store.acquire("adapter", "p1", 2)).status).toBe("acquired");
    if (a.status === "acquired") await store.release(a.leaseId);
    expect((await store.acquire("project", "p1", 2)).status).toBe("acquired");
    expect(db.calls[0]).toMatchObject({ fn: "nexus_lease_acquire", args: { p_scope: "project", p_key: "p1", p_limit: 2, p_holder: "h1", p_ttl_seconds: 120 } });
    expect(db.calls[0].args.p_lease_id).toMatch(/^[0-9a-f-]{36}$/);
    if (a.status === "acquired") expect(a.leaseId).toBe(db.calls[0].args.p_lease_id);
    expect(store.status()).toMatchObject({ state: "available", acquired: 4, full: 1, errors: 0 });
  });

  it("lets expired leases lapse (TTL), so a crashed holder never blocks forever", async () => {
    let t = 1_000_000;
    const db = fakeLeaseDb({ now: () => t });
    const store = new SharedLeaseStore(db.client, { ttlSeconds: 10, now: () => t });
    expect((await store.acquire("adapter", "github", 1)).status).toBe("acquired");
    expect((await store.acquire("adapter", "github", 1)).status).toBe("full");
    t += 10_001;
    expect((await store.acquire("adapter", "github", 1)).status).toBe("acquired");
  });

  it("missing table/function -> unavailable and backs off for the recheck interval (no RPC storm)", async () => {
    let t = 0;
    const rpc = vi.fn(async () => ({ data: null, error: { code: "PGRST202", message: "Could not find the function" } }));
    const store = new SharedLeaseStore({ rpc }, { now: () => t, missingRecheckMs: 600_000 });
    expect(await store.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "missing" });
    expect(await store.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "missing" });
    expect(rpc).toHaveBeenCalledTimes(1);
    t += 600_001;
    await store.acquire("project", "p", 1);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(store.status()).toMatchObject({ state: "missing", lastErrorCode: "PGRST202" });
  });

  it("generic errors, thrown exceptions and timeouts -> unavailable + cooldown, never a throw", async () => {
    let t = 0;
    const store1 = new SharedLeaseStore(erroring({ code: "57014", message: "canceling statement" }), { now: () => t, cooldownMs: 30_000 });
    expect(await store1.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "error" });
    expect(await store1.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "cooldown" });
    const store2 = new SharedLeaseStore({ rpc: () => Promise.reject(new Error("fetch failed")) });
    expect(await store2.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "error" });
    const store3 = new SharedLeaseStore({ rpc: () => new Promise(() => { /* hangs forever */ }) }, { rpcTimeoutMs: 20 });
    expect(await store3.acquire("project", "p", 1)).toEqual({ status: "unavailable", reason: "timeout" });
    expect(store3.status().lastErrorCode).toBe("timeout");
  });

  it("a timed-out acquire that commits late is released once the original call settles (no leaked slot)", async () => {
    const db = fakeLeaseDb();
    let settle!: () => void;
    const slow: LeaseRpcClient = {
      rpc: (fn, args) => fn === "nexus_lease_acquire"
        ? new Promise((resolve) => { settle = () => resolve(db.client.rpc(fn, args) as Promise<{ data: unknown; error: LeaseRpcError }>); })
        : db.client.rpc(fn, args),
    };
    const store = new SharedLeaseStore(slow, { rpcTimeoutMs: 10 });
    expect(await store.acquire("adapter", "a", 1)).toEqual({ status: "unavailable", reason: "timeout" });
    expect(db.leases.size).toBe(0);
    settle(); // the server commits the insert after the client gave up
    await tick(); await tick(); await tick();
    expect(db.leases.size).toBe(0);
    expect(db.calls.map((c) => c.fn)).toEqual(["nexus_lease_acquire", "nexus_lease_release"]);
  });

  it("release never throws (errors and hangs are counted; TTL covers them)", async () => {
    const store = new SharedLeaseStore({ rpc: () => new Promise(() => { /* hang */ }) }, { rpcTimeoutMs: 10 });
    await expect(store.release("x")).resolves.toBeUndefined();
    const store2 = new SharedLeaseStore({ rpc: () => Promise.reject(new Error("boom")) });
    await expect(store2.release("x")).resolves.toBeUndefined();
    expect(store2.status().releaseErrors).toBe(1);
  });

  it("tryConsume is a shared rate-limit primitive (rate leases are never released)", async () => {
    const db = fakeLeaseDb();
    const store = new SharedLeaseStore(db.client);
    expect(await store.tryConsume("ip:1", 2, 60)).toBe("allowed");
    expect(await store.tryConsume("ip:1", 2, 60)).toBe("allowed");
    expect(await store.tryConsume("ip:1", 2, 60)).toBe("limited");
    expect(db.calls.at(-1)?.args).toMatchObject({ p_scope: "rate", p_ttl_seconds: 60 });
    expect(await new SharedLeaseStore(erroring({ code: "XX000" })).tryConsume("ip:1", 2, 60)).toBe("unavailable");
  });
});

describe("SharedFairShareGuard", () => {
  it("caps a project across two instances that share one lease table", async () => {
    const db = fakeLeaseDb();
    const instanceA = new SharedFairShareGuard(new FairShareGuard({ perProject: 1, perAdapter: 8 }), new SharedLeaseStore(db.client, { holder: "A" }), { maxWaitMs: 2000, sleep: () => tick() });
    const instanceB = new SharedFairShareGuard(new FairShareGuard({ perProject: 1, perAdapter: 8 }), new SharedLeaseStore(db.client, { holder: "B" }), { maxWaitMs: 2000, sleep: () => tick() });
    const gate = deferred();
    let running = 0; let peak = 0;
    const job = () => async () => { running += 1; peak = Math.max(peak, running); await gate.promise; running -= 1; return "ok"; };
    const a = instanceA.run("proj", "github", job());
    const b = instanceB.run("proj", "github", job());
    for (let i = 0; i < 10; i++) await tick();
    expect(running).toBe(1); // B waits on the shared project lease although its local guard is free
    gate.resolve();
    await expect(Promise.all([a, b])).resolves.toEqual(["ok", "ok"]);
    expect(peak).toBe(1);
    await tick();
    expect(db.leases.size).toBe(0); // all leases released
  });

  it("bounded wait: a slot full cluster-wide fails fast with fair_share_shared_busy after maxWaitMs", async () => {
    const db = fakeLeaseDb();
    await new SharedLeaseStore(db.client, { holder: "other" }).acquire("project", "proj", 1); // held elsewhere
    let t = 0;
    const guard = new SharedFairShareGuard(new FairShareGuard({ perProject: 1 }), new SharedLeaseStore(db.client), {
      maxWaitMs: 100, now: () => t, sleep: async (ms) => { t += ms; },
    });
    const fn = vi.fn(async () => "never");
    await expect(guard.run("proj", "github", fn)).rejects.toBeInstanceOf(FairShareSharedBusyError);
    expect(fn).not.toHaveBeenCalled();
    expect(t).toBeLessThanOrEqual(200);
    // local slot was released: a later run on a free project works
    await expect(guard.run("other-proj", "github", async () => "ok")).resolves.toBe("ok");
  });

  it("falls back to local limits when Supabase errors (execution proceeds, local cap still holds)", async () => {
    const local = new FairShareGuard({ perProject: 1, perAdapter: 8 });
    const guard = new SharedFairShareGuard(local, new SharedLeaseStore(erroring({ code: "08006", message: "connection failure" })));
    const gate = deferred();
    let running = 0; let peak = 0;
    const job = async () => { running += 1; peak = Math.max(peak, running); await gate.promise; running -= 1; return 1; };
    const runs = [guard.run("p", "a", job), guard.run("p", "a", job)];
    for (let i = 0; i < 5; i++) await tick();
    expect(running).toBe(1);
    gate.resolve();
    await expect(Promise.all(runs)).resolves.toEqual([1, 1]);
    expect(peak).toBe(1);
    expect(guard.store.status().fallbacks).toBeGreaterThan(0);
  });

  it("releases shared leases when the adapter throws", async () => {
    const db = fakeLeaseDb();
    const guard = new SharedFairShareGuard(new FairShareGuard(), new SharedLeaseStore(db.client));
    await expect(guard.run("p", "a", async () => { throw new Error("adapter down"); })).rejects.toThrow("adapter down");
    await tick();
    expect(db.leases.size).toBe(0);
  });

  it("clock skew: instance clocks never reach the lease table (expiry is DB now()), so skewed instances share one cap", async () => {
    let dbNow = 1_000_000;
    const db = fakeLeaseDb({ now: () => dbNow });
    const fast = new SharedLeaseStore(db.client, { holder: "fast", now: () => dbNow + 3_600_000 });
    const slow = new SharedLeaseStore(db.client, { holder: "slow", now: () => dbNow - 3_600_000 });
    expect((await fast.acquire("project", "p", 1, 60)).status).toBe("acquired");
    expect((await slow.acquire("project", "p", 1, 60)).status).toBe("full");
    // No RPC carries an instance timestamp: only a TTL in seconds.
    for (const call of db.calls) for (const v of Object.values(call.args)) expect(typeof v === "number" && v > 1e9).toBe(false);
    dbNow += 59_000;
    expect((await slow.acquire("project", "p", 1, 60)).status).toBe("full");
    const lease = [...db.leases.keys()][0];
    expect(await fast.renew(lease, 60)).toBe(true); // renewal is relative to DB now, not the skewed instance clock
    dbNow += 59_000;
    expect((await slow.acquire("project", "p", 1, 60)).status).toBe("full");
    dbNow += 61_000;
    expect((await slow.acquire("project", "p", 1, 60)).status).toBe("acquired");
  });

  it("busy on the adapter lease releases the project lease and both local slots (no leak on a thrown acquire)", async () => {
    const db = fakeLeaseDb();
    await new SharedLeaseStore(db.client, { holder: "other" }).acquire("adapter", "github", 1);
    let t = 0;
    const local = new FairShareGuard({ perProject: 1, perAdapter: 1 });
    const guard = new SharedFairShareGuard(local, new SharedLeaseStore(db.client), { maxWaitMs: 50, now: () => t, sleep: async (ms) => { t += ms; } });
    await expect(guard.run("p", "github", async () => "never")).rejects.toBeInstanceOf(FairShareSharedBusyError);
    await tick();
    expect([...db.leases.values()].filter((l) => l.scope === "project")).toHaveLength(0);
    // Both local slots are free again: the same project and adapter can run once the other holder is gone.
    db.leases.clear();
    await expect(guard.run("p", "github", async () => "ok")).resolves.toBe("ok");
  });

  it("a hung acquire times out, the step runs on local limits, and the late-committing lease is released (no leak)", async () => {
    const db = fakeLeaseDb();
    let commitLate!: () => void;
    const hanging: LeaseRpcClient = {
      rpc: (fn, args) => fn === "nexus_lease_acquire"
        ? new Promise((resolve) => { commitLate = () => { void db.client.rpc(fn, args).then(resolve); }; })
        : db.client.rpc(fn, args),
    };
    const guard = new SharedFairShareGuard(new FairShareGuard(), new SharedLeaseStore(hanging, { rpcTimeoutMs: 10 }));
    await expect(guard.run("p", "a", async () => "ran")).resolves.toBe("ran");
    expect(guard.store.status().state).toBe("cooldown");
    commitLate();
    for (let i = 0; i < 5; i++) await tick();
    expect(db.leases.size).toBe(0);
  });

  it("plugs into NexusExecutor through the existing fairShare option", async () => {
    const db = fakeLeaseDb();
    const guard = new SharedFairShareGuard(new FairShareGuard(), new SharedLeaseStore(db.client));
    const adapter: NexusAdapter = {
      id: "http", provider: "http", capabilities: ["cap.read"],
      invoke: async () => ({ ok: true, output: { ok: 1 } }),
    } as unknown as NexusAdapter;
    const plan = {
      id: "plan-1", intentId: "intent-1", projectId: "proj-1", actorId: "actor-1", createdAt: new Date().toISOString(),
      steps: [{ id: "s1", capabilityId: "cap.read", adapterId: "http", input: {}, dependsOn: [] }],
    } as unknown as NexusExecutionPlan;
    const sink = { recordEvidence: async () => {}, recordExecution: async () => {}, recordEvent: async () => {} };
    const result = await new NexusExecutor([adapter], sink as never, { fairShare: guard }).execute(plan);
    expect(result.execution.status).toBe("completed");
    const scopes = db.calls.filter((c) => c.fn === "nexus_lease_acquire").map((c) => `${c.args.p_scope}:${c.args.p_key}`);
    expect(scopes).toEqual(["project:proj-1", "adapter:http"]);
  });
});

describe("lease renewal and slot order (CodeRabbit #214)", () => {
  it("renew extends a live lease, reports a lost one, and never throws", async () => {
    let t = 0;
    const db = fakeLeaseDb({ now: () => t });
    const store = new SharedLeaseStore(db.client, { ttlSeconds: 10, now: () => t });
    const r = await store.acquire("adapter", "a", 1);
    if (r.status !== "acquired") throw new Error("expected acquired");
    t += 9_000;
    expect(await store.renew(r.leaseId)).toBe(true);
    t += 9_000; // 18 s after acquire: alive only because of the renewal
    expect((await store.acquire("adapter", "a", 1)).status).toBe("full");
    t += 20_000;
    expect(await store.renew(r.leaseId)).toBe(false);
    expect(await new SharedLeaseStore({ rpc: () => Promise.reject(new Error("x")) }).renew("x")).toBe(false);
    expect(store.status()).toMatchObject({ renewals: 1, renewErrors: 1 });
  });

  it("heartbeats leases while a long invocation runs, so it never outlives its TTL", async () => {
    vi.useFakeTimers();
    try {
      const db = fakeLeaseDb();
      const store = new SharedLeaseStore(db.client, { ttlSeconds: 3 });
      const guard = new SharedFairShareGuard(new FairShareGuard({ perProject: 1, perAdapter: 1 }), store);
      const gate = deferred();
      const run = guard.run("p", "a", async () => { await gate.promise; return "done"; });
      await vi.advanceTimersByTimeAsync(10_000); // > 3x the TTL
      expect(db.leases.size).toBe(2);
      // another instance still sees the slot as held
      expect((await new SharedLeaseStore(db.client, { holder: "B" }).acquire("project", "p", 1)).status).toBe("full");
      expect(store.status().renewals).toBeGreaterThanOrEqual(6);
      gate.resolve();
      await expect(run).resolves.toBe("done");
      await vi.advanceTimersByTimeAsync(0);
      expect(db.leases.size).toBe(0);
      const renewalsAfter = store.status().renewals;
      await vi.advanceTimersByTimeAsync(10_000);
      expect(store.status().renewals).toBe(renewalsAfter); // heartbeat stopped
    } finally {
      vi.useRealTimers();
    }
  });

  it("a project waiting on its shared cap does not hold this instance's local adapter slot", async () => {
    const db = fakeLeaseDb();
    await new SharedLeaseStore(db.client, { holder: "elsewhere" }).acquire("project", "busy", 1); // busy is at its cluster cap
    const local = new FairShareGuard({ perProject: 1, perAdapter: 1 });
    let release!: () => void;
    const guard = new SharedFairShareGuard(local, new SharedLeaseStore(db.client), {
      maxWaitMs: 60_000, sleep: () => new Promise<void>((r) => { release = r; }),
    });
    const waiting = guard.run("busy", "github", async () => "busy-ran");
    await tick(); await tick();
    expect(local.adapters.inFlight("github")).toBe(0); // not held while waiting on the shared project lease
    await expect(guard.run("free", "github", async () => "free-ran")).resolves.toBe("free-ran");
    // free the cluster slot and let the waiter proceed
    for (const [id, l] of db.leases) if (l.key === "busy") db.leases.delete(id);
    release();
    await expect(waiting).resolves.toBe("busy-ran");
  });
});

describe("fairShareRunnerFromEnv", () => {
  const local = new FairShareGuard();
  const factory = vi.fn(() => fakeLeaseDb().client);
  const full = { RESONANCE_SHARED_LEASES: "supabase", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-key" } as unknown as NodeJS.ProcessEnv;

  it("returns the in-memory guard unless explicitly configured with URL and service key", () => {
    expect(fairShareRunnerFromEnv(local, factory, {} as NodeJS.ProcessEnv)).toBe(local);
    expect(fairShareRunnerFromEnv(local, factory, { ...full, RESONANCE_SHARED_LEASES: "yes" })).toBe(local);
    expect(fairShareRunnerFromEnv(local, factory, { ...full, SUPABASE_SERVICE_ROLE_KEY: " " })).toBe(local);
    expect(factory).not.toHaveBeenCalled();
    expect(sharedLeasesConfigured(full)).toBe(true);
  });

  it("wraps the local guard when configured, and falls back if client creation throws", () => {
    const runner = fairShareRunnerFromEnv(local, factory, full);
    expect(runner).toBeInstanceOf(SharedFairShareGuard);
    expect((runner as SharedFairShareGuard).local).toBe(local);
    expect(fairShareRunnerFromEnv(local, () => { throw new Error("bad url"); }, full)).toBe(local);
  });
});
