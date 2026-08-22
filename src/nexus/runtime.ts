import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { HttpAdapter } from "./adapters/http";
import { McpAdapter } from "./adapters/mcp";
import { GitHubAdapter, githubRepositoryReadCapability } from "./adapters/github";
import { composeIntent } from "./composer";
import type { NexusAdapter } from "./adapters/types";
import type { NexusCapability, NexusIntent } from "./types";

const demoCapabilities: NexusCapability[] = [
  { id: "http.demo.read", key: "demo.read", name: "HTTP Demo Read", adapterId: "http-demo", requiredPermissions: ["read"], risk: "low", availability: "available", provenance: "nexus-fixture" },
  { id: "mcp.demo.write", key: "demo.write", name: "MCP Demo Write", adapterId: "mcp-demo", requiredPermissions: ["execute"], risk: "high", availability: "available", provenance: "nexus-fixture" },
];

const httpAdapter = new HttpAdapter("http-demo", {
  async describe() { return { identity: { id: "http-demo", type: "connector", name: "HTTP Demo Bridge" }, capabilities: [demoCapabilities[0]] }; },
  async invoke(capabilityId, input) { return { bridge: "http", capabilityId, input, result: "ok" }; },
});
const mcpAdapter = new McpAdapter("mcp-demo", {
  async describe() { return { identity: { id: "mcp-demo", type: "connector", name: "MCP Demo Bridge" }, capabilities: [demoCapabilities[1]] }; },
  async callTool(capabilityId, input) { return { bridge: "mcp", capabilityId, input, result: "ok" }; },
});

const githubAdapter = process.env.GITHUB_TOKEN?.trim() ? new GitHubAdapter(process.env.GITHUB_TOKEN) : null;
export const nexusAdapters: NexusAdapter[] = githubAdapter
  ? [httpAdapter, mcpAdapter, githubAdapter]
  : [httpAdapter, mcpAdapter];

export const nexusRegistry = new InMemoryCapabilityRegistry();
demoCapabilities.forEach((capability) => nexusRegistry.register(capability));
if (githubAdapter) nexusRegistry.register(githubRepositoryReadCapability);
export const nexusPolicy = new DefaultNexusPolicy();

export function composeNexusIntent(intent: NexusIntent) { return composeIntent(intent, nexusRegistry, nexusPolicy, nexusAdapters); }
/** @deprecated Compatibility alias; runtime is no longer demo-only. */
export const composeDemoIntent = composeNexusIntent;
export function listRuntimeCapabilities() { return nexusRegistry.list(); }
