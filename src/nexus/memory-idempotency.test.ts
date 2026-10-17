import { describe, expect, it } from "vitest";
import { MemoryIdempotencyStore } from "./memory-idempotency";

describe("memory idempotency store", () => {
  it("lets only the first caller start, then replays the recorded response", () => {
    const store = new MemoryIdempotencyStore();
    const first = store.begin("project", "key", "hash", 1_000);
    const second = store.begin("project", "key", "hash", 1_001);
    expect(first.kind).toBe("start");
    expect(second).toEqual({ kind: "in_progress" });
    if (first.kind !== "start") throw new Error("expected start");
    expect(store.finish("project", "key", first.claimToken, { ok: true }, 201, "completed", 1_002)).toBe(true);
    expect(store.begin("project", "key", "hash", 1_003)).toEqual({ kind: "replay", body: { ok: true }, httpStatus: 201 });
  });

  it("rejects a reused key whose request hash differs", () => {
    const store = new MemoryIdempotencyStore();
    store.begin("project", "key", "hash-a", 1_000);
    expect(store.begin("project", "key", "hash-b", 1_001)).toEqual({ kind: "conflict" });
  });

  it("reclaims a stale accepted claim only once", () => {
    const store = new MemoryIdempotencyStore();
    const first = store.begin("project", "key", "hash", 0);
    expect(first.kind).toBe("start");
    const reclaimed = store.begin("project", "key", "hash", 300_000, 300_000);
    const loser = store.begin("project", "key", "hash", 300_001, 300_000);
    expect(reclaimed.kind).toBe("start");
    expect(loser).toEqual({ kind: "in_progress" });
    if (first.kind !== "start" || reclaimed.kind !== "start") throw new Error("expected claims");
    expect(store.finish("project", "key", first.claimToken, { stale: true }, 201, "completed", 300_002)).toBe(false);
    expect(store.finish("project", "key", reclaimed.claimToken, { fresh: true }, 201, "completed", 300_002)).toBe(true);
  });
});

describe("MemoryIdempotencyStore bounds", () => {
  it("never grows past maxRecords", () => {
    const store = new MemoryIdempotencyStore(3);
    for (let i = 0; i < 50; i++) store.begin("p", `k${i}`, "h");
    expect(store.size()).toBe(3);
  });

  it("evicts finished records before in-flight claims", () => {
    const store = new MemoryIdempotencyStore(2);
    const a = store.begin("p", "inflight", "h");
    const b = store.begin("p", "done", "h");
    if (b.kind !== "start" || a.kind !== "start") throw new Error("expected start");
    store.finish("p", "done", b.claimToken, { ok: true }, 200, "completed");
    store.begin("p", "new", "h");
    expect(store.begin("p", "inflight", "h").kind).toBe("in_progress");
    expect(store.begin("p", "done", "h").kind).toBe("start");
  });

  it("rejects a non-positive bound", () => {
    expect(() => new MemoryIdempotencyStore(0)).toThrow();
  });
});
