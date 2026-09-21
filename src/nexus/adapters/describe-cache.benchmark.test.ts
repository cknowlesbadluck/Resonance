import { describe, expect, it } from "vitest";
import type { NexusAdapter, AdapterDescription } from "./types";
import { describeAdapters } from "./describe-cache";

class MockRemoteAdapter implements NexusAdapter {
  readonly kind = "mock";
  public describeCallCount = 0;

  constructor(public readonly id: string, private readonly latencyMs: number = 10) {}

  async describe(): Promise<AdapterDescription> {
    this.describeCallCount++;
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
    return {
      identity: { id: this.id, type: "connector", name: `Mock ${this.id}` },
      capabilities: [],
      resources: [],
    };
  }

  async invoke() {
    return { ok: true };
  }
}

describe("Adapter Describe Cache Benchmark", () => {
  it("compares un-cached sequential/parallel describe calls vs cached describe calls", async () => {
    const NUM_ADAPTERS = 10;
    const LATENCY_MS = 10; // Simulated network roundtrip per describe()
    const REQUEST_COUNT = 50;

    const adaptersBaseline = Array.from({ length: NUM_ADAPTERS }, (_, i) => new MockRemoteAdapter(`adapter-${i}`, LATENCY_MS));
    const adaptersCached = Array.from({ length: NUM_ADAPTERS }, (_, i) => new MockRemoteAdapter(`adapter-${i}`, LATENCY_MS));

    // Baseline: uncached Promise.all(adapters.map(a => a.describe()))
    const startBaseline = performance.now();
    for (let r = 0; r < REQUEST_COUNT; r++) {
      await Promise.all(adaptersBaseline.map((a) => a.describe()));
    }
    const endBaseline = performance.now();
    const durationBaseline = endBaseline - startBaseline;

    // Optimized: describeAdapters(adapters) with caching
    const startCached = performance.now();
    for (let r = 0; r < REQUEST_COUNT; r++) {
      await describeAdapters(adaptersCached);
    }
    const endCached = performance.now();
    const durationCached = endCached - startCached;

    const speedup = (durationBaseline / durationCached).toFixed(2);
    console.log(`[BENCHMARK] Baseline duration (${REQUEST_COUNT} requests x ${NUM_ADAPTERS} adapters @ ${LATENCY_MS}ms latency): ${durationBaseline.toFixed(2)}ms`);
    console.log(`[BENCHMARK] Cached duration   (${REQUEST_COUNT} requests x ${NUM_ADAPTERS} adapters @ ${LATENCY_MS}ms latency): ${durationCached.toFixed(2)}ms`);
    console.log(`[BENCHMARK] Speedup factor: ${speedup}x`);

    expect(durationCached).toBeLessThan(durationBaseline);
    expect(adaptersCached.reduce((sum, a) => sum + a.describeCallCount, 0)).toBe(NUM_ADAPTERS);
    expect(adaptersBaseline.reduce((sum, a) => sum + a.describeCallCount, 0)).toBe(NUM_ADAPTERS * REQUEST_COUNT);
  });
});
