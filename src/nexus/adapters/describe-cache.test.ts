import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NexusAdapter, AdapterDescription } from "./types";
import { describeAdapter, describeAdapters, clearAdapterDescriptionCache } from "./describe-cache";

class TestAdapter implements NexusAdapter {
  readonly kind = "test";
  public describeCalls = 0;

  constructor(public readonly id: string) {}

  async describe(): Promise<AdapterDescription> {
    this.describeCalls++;
    return {
      identity: { id: this.id, type: "connector", name: `Test ${this.id}` },
      capabilities: [],
    };
  }

  async invoke() {
    return { ok: true };
  }
}

describe("describeCache", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("caches adapter description for subsequent calls", async () => {
    const adapter = new TestAdapter("a1");
    const d1 = await describeAdapter(adapter);
    const d2 = await describeAdapter(adapter);

    expect(adapter.describeCalls).toBe(1);
    expect(d1).toBe(d2);
  });

  it("deduplicates concurrent in-flight requests (thundering herd protection)", async () => {
    const adapter = new TestAdapter("a2");
    const [d1, d2, d3] = await Promise.all([
      describeAdapter(adapter),
      describeAdapter(adapter),
      describeAdapter(adapter),
    ]);

    expect(adapter.describeCalls).toBe(1);
    expect(d1).toBe(d2);
    expect(d2).toBe(d3);
  });

  it("evicts cache after TTL expires", async () => {
    vi.useFakeTimers();
    const adapter = new TestAdapter("a3");

    await describeAdapter(adapter, { ttlMs: 1000 });
    expect(adapter.describeCalls).toBe(1);

    vi.advanceTimersByTime(500);
    await describeAdapter(adapter, { ttlMs: 1000 });
    expect(adapter.describeCalls).toBe(1);

    vi.advanceTimersByTime(600); // 1100ms total > 1000ms TTL
    await describeAdapter(adapter, { ttlMs: 1000 });
    expect(adapter.describeCalls).toBe(2);
  });

  it("supports clearing cache explicitly for an adapter", async () => {
    const adapter = new TestAdapter("a4");
    await describeAdapter(adapter);
    expect(adapter.describeCalls).toBe(1);

    clearAdapterDescriptionCache(adapter);

    await describeAdapter(adapter);
    expect(adapter.describeCalls).toBe(2);
  });

  it("describeAdapters describes multiple adapters concurrently with caching", async () => {
    const a1 = new TestAdapter("m1");
    const a2 = new TestAdapter("m2");

    const res1 = await describeAdapters([a1, a2]);
    const res2 = await describeAdapters([a1, a2]);

    expect(res1).toHaveLength(2);
    expect(res2).toHaveLength(2);
    expect(a1.describeCalls).toBe(1);
    expect(a2.describeCalls).toBe(1);
  });
});
