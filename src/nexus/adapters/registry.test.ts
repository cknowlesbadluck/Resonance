import { describe, expect, it } from "vitest";
import { AdapterRegistry } from "./types";
import type { NexusAdapter } from "./types";

const makeAdapter = (id: string): NexusAdapter => ({
  id,
  kind: "test",
  async describe() {
    return { identity: { id, type: "connector", name: id }, capabilities: [] };
  },
  async invoke() {
    return { ok: true, output: id };
  },
});

describe("AdapterRegistry", () => {
  it("registers and resolves adapters by id", () => {
    const registry = new AdapterRegistry();
    const adapter = makeAdapter("test");

    registry.register(adapter);

    expect(registry.resolve("test")).toBe(adapter);
    expect(registry.resolve("missing")).toBeUndefined();
  });

  it("replaces an adapter registered with the same id", () => {
    const registry = new AdapterRegistry();
    const first = makeAdapter("test");
    const second = makeAdapter("test");

    registry.register(first);
    registry.register(second);

    expect(registry.resolve("test")).toBe(second);
    expect(registry.list()).toEqual([second]);
  });

  it("lists registered adapters without exposing the internal map", () => {
    const registry = new AdapterRegistry();
    const first = makeAdapter("first");
    const second = makeAdapter("second");

    registry.register(first);
    registry.register(second);
    const listed = registry.list();
    listed.pop();

    expect(registry.list()).toEqual([first, second]);
  });
});
