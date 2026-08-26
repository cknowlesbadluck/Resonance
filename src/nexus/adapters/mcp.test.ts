import { describe, expect, it } from "vitest";
import { McpAdapter } from "./mcp";
import type { AdapterDescription } from "./types";

const description: AdapterDescription = {
  identity: { id: "mcp-demo", type: "connector", name: "MCP demo" },
  capabilities: [],
};

describe("McpAdapter invocation contract", () => {
  it("forwards capability and input to callTool and returns output", async () => {
    const forwarded: Array<{ capabilityId: string; input: unknown }> = [];
    const adapter = new McpAdapter("mcp-demo", {
      describe: async () => description,
      callTool: async (capabilityId, input) => {
        forwarded.push({ capabilityId, input });
        return { tool: capabilityId, input };
      },
    });

    const result = await adapter.invoke({
      capabilityId: "mcp.list",
      input: { limit: 3 },
      actorId: "actor-1",
      correlationId: "corr-1",
    });

    expect(result).toEqual({ ok: true, output: { tool: "mcp.list", input: { limit: 3 } } });
    expect(forwarded).toEqual([{ capabilityId: "mcp.list", input: { limit: 3 } }]);
  });

  it("normalizes thrown tool errors into a failed invocation result", async () => {
    const adapter = new McpAdapter("mcp-demo", {
      describe: async () => description,
      callTool: async () => {
        throw new Error("tool not found");
      },
    });

    const result = await adapter.invoke({
      capabilityId: "mcp.missing",
      input: {},
      actorId: "actor-1",
      correlationId: "corr-1",
    });

    expect(result).toEqual({ ok: false, error: "tool not found", evidence: { error: "Error: tool not found" } });
  });

  it("times out if the bridge takes too long", async () => {
    const adapter = new McpAdapter("mcp-demo", {
      describe: async () => description,
      callTool: async () => new Promise((resolve) => setTimeout(() => resolve("done"), 100)),
    }, 10); // 10ms timeout

    const result = await adapter.invoke({
      capabilityId: "demo.read",
      input: {},
      actorId: "actor-1",
      correlationId: "corr-1",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("timed out");
  });
});
