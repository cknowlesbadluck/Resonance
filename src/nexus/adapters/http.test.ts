import { describe, expect, it } from "vitest";
import { HttpAdapter } from "./http";
import type { AdapterDescription, InvocationRequest } from "./types";

const description: AdapterDescription = {
  identity: { id: "http-demo", type: "connector", name: "HTTP demo" },
  capabilities: [],
};

describe("HttpAdapter invocation contract", () => {
  it("forwards capability, input, and request to the bridge and returns output", async () => {
    const forwarded: Array<{ capabilityId: string; input: unknown; request: InvocationRequest }> = [];
    const adapter = new HttpAdapter("http-demo", {
      describe: async () => description,
      invoke: async (capabilityId, input, request) => {
        forwarded.push({ capabilityId, input, request });
        return { echoed: input };
      },
    });

    const request: InvocationRequest = {
      capabilityId: "demo.read",
      input: { path: "/status" },
      actorId: "actor-1",
      correlationId: "corr-1",
    };
    const result = await adapter.invoke(request);

    expect(result).toEqual({ ok: true, output: { echoed: { path: "/status" } } });
    expect(forwarded).toEqual([{ capabilityId: "demo.read", input: { path: "/status" }, request }]);
  });

  it("normalizes thrown bridge errors into a failed invocation result", async () => {
    const adapter = new HttpAdapter("http-demo", {
      describe: async () => description,
      invoke: async () => {
        throw new Error("upstream timeout");
      },
    });

    const result = await adapter.invoke({
      capabilityId: "demo.read",
      input: {},
      actorId: "actor-1",
      correlationId: "corr-1",
    });

    expect(result).toEqual({ ok: false, error: "upstream timeout" });
  });
});
