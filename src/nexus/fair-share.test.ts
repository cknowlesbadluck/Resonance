import { describe, expect, it } from "vitest";
import { FAIR_SHARE_DEFAULTS, FairShareGuard, FairShareQueueFullError, KeyedSemaphore, fairShareFromEnv, parseCap } from "./fair-share";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusExecutionPlan } from "./types";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function deferred() { let resolve!: () => void; const promise = new Promise<void>((r) => { resolve = r; }); return { promise, resolve }; }

describe("parseCap (fail-safe config)", () => {
  it("uses the default for missing, blank, non-numeric, fractional, zero and negative values", () => {
    for (const raw of [undefined, "", "  ", "abc", "2.5", "0", "-3", "NaN", "Infinity"]) expect(parseCap(raw, 4, 64)).toBe(4);
  });
  it("accepts positive integers and clamps to the hard maximum", () => {
    expect(parseCap("1", 4, 64)).toBe(1);
    expect(parseCap("10", 4, 64)).toBe(10);
    expect(parseCap("100000", 4, 64)).toBe(64);
  });
  it("fairShareFromEnv applies defaults and env overrides", () => {
    const d = fairShareFromEnv({} as unknown as NodeJS.ProcessEnv);
    expect(d.projects.limit).toBe(FAIR_SHARE_DEFAULTS.perProject);
    expect(d.adapters.limit).toBe(FAIR_SHARE_DEFAULTS.perAdapter);
    const o = fairShareFromEnv({ RESONANCE_MAX_INFLIGHT_PER_PROJECT: "2", RESONANCE_MAX_CONCURRENT_PER_ADAPTER: "zero" } as unknown as NodeJS.ProcessEnv);
    expect(o.projects.limit).toBe(2);
    expect(o.adapters.limit).toBe(FAIR_SHARE_DEFAULTS.perAdapter);
  });
});

describe("KeyedSemaphore", () => {
  it("rejects a non-positive limit", () => {
    expect(() => new KeyedSemaphore(0, "x")).toThrow(RangeError);
  });

  it("bounds in-flight per key, queues FIFO, and keys are independent", async () => {
    const sem = new KeyedSemaphore(2, "project");
    const r1 = await sem.acquire("a");
    const r2 = await sem.acquire("a");
    const order: string[] = [];
    const w3 = sem.acquire("a").then((r) => { order.push("3"); return r; });
    const w4 = sem.acquire("a").then((r) => { order.push("4"); return r; });
    const other = await sem.acquire("b");
    expect(sem.inFlight("a")).toBe(2);
    expect(sem.queued("a")).toBe(2);
    expect(sem.inFlight("b")).toBe(1);
    r1();
    const r3 = await w3;
    expect(order).toEqual(["3"]);
    expect(sem.inFlight("a")).toBe(2);
    r2(); r2(); // double release is a no-op
    const r4 = await w4;
    expect(order).toEqual(["3", "4"]);
    r3(); r4(); other();
    expect(sem.inFlight("a")).toBe(0);
    expect(sem.queued("a")).toBe(0);
    expect(sem.inFlight("b")).toBe(0);
  });

  it("fails fast once the wait queue is full (bounded memory)", async () => {
    const sem = new KeyedSemaphore(1, "adapter", 1);
    const hold = await sem.acquire("slow");
    const queued = sem.acquire("slow");
    await expect(sem.acquire("slow")).rejects.toBeInstanceOf(FairShareQueueFullError);
    hold();
    (await queued)();
    expect(sem.inFlight("slow")).toBe(0);
  });
});

describe("FairShareGuard", () => {
  it("releases both slots when the wrapped call throws", async () => {
    const guard = new FairShareGuard({ perProject: 1, perAdapter: 1 });
    await expect(guard.run("p", "a", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(guard.projects.inFlight("p")).toBe(0);
    expect(guard.adapters.inFlight("a")).toBe(0);
    await expect(guard.run("p", "a", async () => 42)).resolves.toBe(42);
  });

  it("a flooding project cannot starve another project on the same adapter", async () => {
    const guard = new FairShareGuard({ perProject: 2, perAdapter: 3 });
    const gates: Array<ReturnType<typeof deferred>> = [];
    const started: string[] = [];
    const call = (project: string) => guard.run(project, "shared", async () => {
      started.push(project);
      const gate = deferred(); gates.push(gate); await gate.promise;
    });
    const flood = Array.from({ length: 10 }, () => call("hog"));
    await tick();
    const victim = call("victim");
    await tick();
    // hog is capped at 2 in flight, so the victim gets the third adapter slot immediately.
    expect(started.filter((p) => p === "hog")).toHaveLength(2);
    expect(started).toContain("victim");
    expect(guard.adapters.inFlight("shared")).toBe(3);
    while (gates.length) { gates.shift()!.resolve(); await tick(); await tick(); }
    await Promise.all([...flood, victim]);
    expect(started.filter((p) => p === "hog")).toHaveLength(10);
    expect(guard.adapters.inFlight("shared")).toBe(0);
    expect(guard.projects.inFlight("hog")).toBe(0);
  });
});

describe("NexusExecutor with a fair-share guard", () => {
  const plan = (projectId: string, steps: number): NexusExecutionPlan => ({
    id: `plan-${projectId}`, intentId: "i", projectId, actorId: "actor", mode: "direct", approvalRequired: false, rationale: [], contextRefs: [],
    steps: Array.from({ length: steps }, (_, i) => ({ id: `s${i}`, capabilityId: "cap", adapterId: "slow", input: i, requiresApproval: false })),
  });
  const sink = { recordEvidence: async () => {} };

  it("caps concurrent adapter invocations of one wide wave at the per-project limit, and still completes", async () => {
    let active = 0; let peak = 0;
    const adapter: NexusAdapter = {
      id: "slow", kind: "tool", describe: async () => ({ identity: { id: "slow", type: "connector", name: "slow" }, capabilities: [] }),
      invoke: async ({ input }) => { active++; peak = Math.max(peak, active); await new Promise((r) => setTimeout(r, 5)); active--; return { ok: true, output: input }; },
    };
    const guard = new FairShareGuard({ perProject: 3, perAdapter: 8 });
    const result = await new NexusExecutor([adapter], sink, { fairShare: guard }).execute(plan("p1", 12));
    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual(Array.from({ length: 12 }, (_, i) => i));
    expect(peak).toBe(3);
  });

  it("without a guard the executor behaves exactly as before (whole wave in parallel)", async () => {
    let active = 0; let peak = 0;
    const adapter: NexusAdapter = {
      id: "slow", kind: "tool", describe: async () => ({ identity: { id: "slow", type: "connector", name: "slow" }, capabilities: [] }),
      invoke: async () => { active++; peak = Math.max(peak, active); await new Promise((r) => setTimeout(r, 5)); active--; return { ok: true }; },
    };
    const result = await new NexusExecutor([adapter], sink).execute(plan("p1", 6));
    expect(result.execution.status).toBe("completed");
    expect(peak).toBe(6);
  });

  it("a full queue surfaces as a failed step (fail closed), not a hang", async () => {
    const adapter: NexusAdapter = {
      id: "slow", kind: "tool", describe: async () => ({ identity: { id: "slow", type: "connector", name: "slow" }, capabilities: [] }),
      invoke: async () => { await new Promise((r) => setTimeout(r, 5)); return { ok: true }; },
    };
    const guard = new FairShareGuard({ perProject: 1, perAdapter: 1, maxQueue: 1 });
    const result = await new NexusExecutor([adapter], sink, { fairShare: guard }).execute(plan("p1", 4));
    expect(result.execution.status).toBe("partial");
    expect(result.execution.error).toMatch(/fair_share_queue_full/);
    expect(guard.projects.inFlight("p1")).toBe(0);
  });
});
