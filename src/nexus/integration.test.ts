import { describe, expect, it } from "vitest";
import { HttpAdapter } from "./adapters/http";
import { McpAdapter } from "./adapters/mcp";
import { composeIntent } from "./composer";
import { NexusExecutor } from "./executor";
import { DefaultNexusPolicy } from "./policy";
import { InMemoryCapabilityRegistry } from "./registry";
import { listRuntimeCapabilities } from "./runtime";
import type { NexusCapability } from "./types";

const read: NexusCapability = {
  id: "http.demo.read",
  key: "demo.read",
  name: "HTTP Demo Read",
  adapterId: "http-demo",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
  provenance: "test-fixture",
};
const write: NexusCapability = {
  id: "mcp.demo.write",
  key: "demo.write",
  name: "MCP Demo Write",
  adapterId: "mcp-demo",
  requiredPermissions: ["execute"],
  risk: "high",
  availability: "available",
  provenance: "test-fixture",
};

describe("Nexus heterogeneous bridge proof", () => {
  it("publishes fixtures and unconfigured providers as unavailable", () => {
    const capabilities = listRuntimeCapabilities();
    expect(capabilities.filter((capability) => capability.provenance === "fixture").every((capability) => capability.availability === "unavailable")).toBe(true);
    const github = capabilities.find((capability) => capability.id === "github.repository.read");
    if (process.env.GITHUB_TOKEN?.trim()) {
      expect(github).toBeTruthy();
      expect(github?.availability).toBe("available");
      expect(github?.provenance).not.toBe("fixture");
    } else {
      // Unconfigured providers are absent, not advertised-and-broken.
      expect(github).toBeUndefined();
    }
  });

  it("composes one intent across HTTP and MCP without provider-specific core logic", () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(read);
    registry.register(write);
    const httpAdapter = new HttpAdapter("http-demo", {
      async describe() { return { identity: { id: "http-demo", type: "connector", name: "HTTP Demo Bridge" }, capabilities: [read] }; },
      async invoke(capabilityId, input) { return { bridge: "http", capabilityId, input, result: "ok" }; },
    });
    const mcpAdapter = new McpAdapter("mcp-demo", {
      async describe() { return { identity: { id: "mcp-demo", type: "connector", name: "MCP Demo Bridge" }, capabilities: [write] }; },
      async callTool(capabilityId, input) { return { bridge: "mcp", capabilityId, input, result: "ok" }; },
    });
    const plan = composeIntent(
      { id: "proof", projectId: "independent", objective: "perform two independent capability operations", requestedBy: "tester", requirements: [{ key: "demo.read" }, { key: "demo.write" }] },
      registry,
      new DefaultNexusPolicy(),
      [httpAdapter, mcpAdapter],
    );
    expect(plan.mode).toBe("chamber");
    expect(new Set(plan.steps.map((step) => step.adapterId))).toEqual(new Set(["http-demo", "mcp-demo"]));
    expect(read.provenance).toBe("test-fixture");
  });

  it("executes the low-risk direct path and records evidence", async () => {
    const registry = new InMemoryCapabilityRegistry();
    registry.register(read);
    const httpAdapter = new HttpAdapter("http-demo", {
      async describe() { return { identity: { id: "http-demo", type: "connector", name: "HTTP Demo Bridge" }, capabilities: [read] }; },
      async invoke() { return { result: "ok" }; },
    });
    const plan = composeIntent(
      { id: "direct", projectId: "independent", objective: "read demo", requestedBy: "tester", requirements: [{ key: "demo.read" }] },
      registry,
      new DefaultNexusPolicy(),
      [httpAdapter],
    );
    const evidence: unknown[] = [];
    const result = await new NexusExecutor([httpAdapter], { recordEvidence: async (item) => { evidence.push(item); } }).execute(plan);
    expect(result.execution.status).toBe("completed");
    expect(evidence.length).toBe(1);
  });
});
