import { describe, expect, it, vi } from "vitest";
import { GitHubAdapter } from "./github";
import { LinearAdapter } from "./linear";
import { McpAdapter } from "./mcp";
import { HttpAdapter } from "./http";
import type { NexusAdapter } from "./types";

/**
 * Provider-neutral adapter contract. Every NexusAdapter, whatever the provider, must:
 * describe itself with an identity and unique capability ids, never throw from invoke(),
 * refuse unknown capabilities without touching the network, and never echo credentials.
 */
const SECRET = "contract_secret_token_value";
const boom = () => { throw new Error("network down"); };

type Case = { name: string; make: (fetchImpl: typeof fetch) => NexusAdapter; validInput?: { capabilityId: string; input: unknown } };
const desc = (id: string) => async () => ({ identity: { id, type: "connector" as const, name: id }, capabilities: [{ id: `${id}.cap`, key: `${id}.cap`, name: "cap", requiredPermissions: [], risk: "low" as const }] });

const cases: Case[] = [
  { name: "github", make: (f) => new GitHubAdapter(SECRET, { fetchImpl: f }) },
  { name: "linear", make: (f) => new LinearAdapter(SECRET, { fetchImpl: f }) },
  { name: "mcp", make: () => new McpAdapter("mcp-c", { describe: desc("mcp-c"), callTool: async () => boom() }) },
  { name: "http", make: () => new HttpAdapter("http-c", { describe: desc("http-c"), invoke: async () => boom() }) },
];

describe.each(cases)("adapter contract: $name", ({ make }) => {
  it("describes an identity and unique capability ids", async () => {
    const d = await make(vi.fn() as unknown as typeof fetch).describe();
    expect(d.identity.id).toBeTruthy();
    expect(d.capabilities.length).toBeGreaterThan(0);
    const ids = d.capabilities.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of d.capabilities) { expect(c.key).toBeTruthy(); expect(Array.isArray(c.requiredPermissions)).toBe(true); }
  });

  it("never throws from invoke; failures are { ok:false, error } without credentials", async () => {
    const fetchImpl = vi.fn(async () => boom()) as unknown as typeof fetch;
    const adapter = make(fetchImpl);
    const [cap] = (await adapter.describe()).capabilities;
    for (const capabilityId of ["unknown.capability", cap.id]) {
      const result = await adapter.invoke({ capabilityId, input: { owner: "o", repo: "r", query: "q" }, actorId: "a", correlationId: "c" });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(JSON.stringify(result)).not.toContain(SECRET);
    }
  });

  it("refuses an unknown capability without any network call", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const result = await make(fetchImpl).invoke({ capabilityId: "unknown.capability", input: {}, actorId: "a", correlationId: "c" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});
