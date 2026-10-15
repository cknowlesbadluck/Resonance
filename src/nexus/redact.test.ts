import { describe, expect, it } from "vitest";
import { REDACTED, redactSecrets, redactString } from "./redact";
import { NexusExecutor } from "./executor";
import type { NexusAdapter } from "./adapters/types";
import type { NexusEvidence, NexusExecutionPlan } from "./types";

const GH = "ghp_" + "a".repeat(36);
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlLXNpZ25hdHVyZQ";

describe("redaction privacy floor", () => {
  it("masks well-known credential shapes inside free text", () => {
    const s = redactString(`GitHub 401 for ${GH}; auth: Bearer abcdef1234567890; jwt ${JWT}; sk-${"x".repeat(24)}; AKIAABCDEFGHIJKLMNOP`);
    for (const leak of [GH, "abcdef1234567890", JWT, "sk-x", "AKIAABCDEFGHIJKLMNOP"]) expect(s).not.toContain(leak);
    expect(s).toContain("Bearer [REDACTED]");
  });
  it("masks sensitive keys structurally and recurses; leaves ordinary data intact", () => {
    const out = redactSecrets({ repo: "octo/repo", stars: 3, headers: { Authorization: "x", accept: "json" }, nested: [{ api_key: "k", note: `t=${GH}` }] }) as Record<string, any>;
    expect(out).toEqual({ repo: "octo/repo", stars: 3, headers: { Authorization: REDACTED, accept: "json" }, nested: [{ api_key: REDACTED, note: `t=${REDACTED}` }] });
  });
  it("fails closed on pathological nesting", () => {
    let deep: any = "leaf"; for (let i = 0; i < 20; i++) deep = { d: deep };
    expect(JSON.stringify(redactSecrets(deep))).toContain(REDACTED);
  });
});

describe("executor applies the privacy floor before persisting evidence", () => {
  const plan: NexusExecutionPlan = { id: "p", intentId: "i", projectId: "proj", actorId: "a", mode: "direct", steps: [{ id: "s", capabilityId: "c", adapterId: "ad", input: {}, requiresApproval: false }], contextRefs: [], approvalRequired: false, rationale: [], retry: { maxAttempts: 1, backoffMs: 0 } };
  const run = async (invoke: NexusAdapter["invoke"]) => {
    const recorded: NexusEvidence[] = [];
    const adapter: NexusAdapter = { id: "ad", kind: "t", describe: async () => ({ identity: { id: "ad", type: "connector", name: "ad" }, capabilities: [] }), invoke };
    const executor = new NexusExecutor([adapter], { saveExecution: async () => {}, recordEvidence: async (e: NexusEvidence) => { recorded.push(e); } } as never);
    const result = await executor.execute(plan);
    return { result, recorded };
  };
  it("redacts tokens in failed-step errors and evidence", async () => {
    const { result, recorded } = await run(async () => { throw new Error(`Bad credentials for ${GH}`); });
    expect(JSON.stringify(recorded)).not.toContain(GH);
    expect(JSON.stringify(result)).not.toContain(GH);
  });
  it("redacts sensitive keys in successful output", async () => {
    const { result, recorded } = await run(async () => ({ ok: true, output: { name: "repo", token: "secret-value" } }));
    expect(JSON.stringify(recorded)).not.toContain("secret-value");
    expect(JSON.stringify(result)).not.toContain("secret-value");
    expect(JSON.stringify(result)).toContain("repo");
  });
});
