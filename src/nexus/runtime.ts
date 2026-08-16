import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { HttpAdapter } from "./adapters/http";
import { McpAdapter } from "./adapters/mcp";
import { LemonadeAdapter } from "./adapters/lemonade";
import { composeIntent } from "./composer";
import type { NexusAdapter } from "./adapters/types";
import type { NexusCapability, NexusIntent } from "./types";

const capabilities: NexusCapability[] = [
  { id: "http.demo.read", key: "demo.read", name: "HTTP Demo Read", adapterId: "http-demo", requiredPermissions: ["read"], risk: "low", availability: "available", provenance: "nexus-fixture" },
  { id: "mcp.demo.write", key: "demo.write", name: "MCP Demo Write", adapterId: "mcp-demo", requiredPermissions: ["execute"], risk: "high", availability: "available", provenance: "nexus-fixture" },
];

const httpAdapter = new HttpAdapter("http-demo", {
  async describe() { return { identity: { id: "http-demo", type: "connector", name: "HTTP Demo Bridge" }, capabilities: [capabilities[0]] }; },
  async invoke(capabilityId, input) { return { bridge: "http", capabilityId, input, result: "ok" }; },
});
const mcpAdapter = new McpAdapter("mcp-demo", {
  async describe() { return { identity: { id: "mcp-demo", type: "connector", name: "MCP Demo Bridge" }, capabilities: [capabilities[1]] }; },
  async callTool(capabilityId, input) { return { bridge: "mcp", capabilityId, input, result: "ok" }; },
});

const adapters: NexusAdapter[] = [httpAdapter, mcpAdapter];
const lemonadeURL = process.env.LEMONADE_BASE_URL;
const lemonadeModel = process.env.LEMONADE_MODEL;
if (lemonadeURL && lemonadeModel) {
  try {
    const baseURL = new URL(lemonadeURL.endsWith("/") ? lemonadeURL : `${lemonadeURL}/`);
    adapters.push(new LemonadeAdapter("lemonade-local", baseURL, lemonadeModel, process.env.LEMONADE_API_KEY));
  } catch {
    // Invalid optional Lemonade configuration leaves the core runtime unchanged.
  }
}

export const nexusAdapters: NexusAdapter[] = adapters;
export const nexusRegistry = new InMemoryCapabilityRegistry();
capabilities.forEach((capability) => nexusRegistry.register(capability));
if (lemonadeURL && lemonadeModel) {
  nexusRegistry.register({ id: "lemonade-local.chat", key: "local.ai.chat", name: "Lemonade Local Chat", adapterId: "lemonade-local", requiredPermissions: ["execute"], risk: "low", availability: "available", provenance: "amd-lemonade", compatibility: ["desktop", "local-ai"] });
}
export const nexusPolicy = new DefaultNexusPolicy();

export function composeDemoIntent(intent: NexusIntent) { return composeIntent(intent, nexusRegistry, nexusPolicy, nexusAdapters); }
