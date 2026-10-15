import { describe, expect, it } from "vitest";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy, type NexusPolicy } from "./policy";
import { CompositionError, composeIntent } from "./composer";
import type { NexusAdapter } from "./adapters/types";
import type { NexusCapability, NexusIntent } from "./types";

const cap = (id: string, adapterId: string, risk: NexusCapability["risk"]): NexusCapability => ({ id, key: "repo.read", name: id, adapterId, requiredPermissions: ["read"], risk });
const adapter = (id: string): NexusAdapter => ({ id, kind: id, describe: async () => ({ identity: { id, type: "connector", name: id }, capabilities: [] }), invoke: async () => ({ ok: true }) });
const intent: NexusIntent = { id: "i1", projectId: "p1", objective: "read", requestedBy: "actor", requirements: [{ key: "repo.read" }] };

function registry(...caps: NexusCapability[]) { const r = new InMemoryCapabilityRegistry(); caps.forEach((c) => r.register(c)); return r; }

describe("provider-neutral failover in composition", () => {
  it("falls back to the next-ranked provider when the best one has no adapter deployed", () => {
    const plan = composeIntent(intent, registry(cap("github.repo.read", "github", "low"), cap("gitlab.repo.read", "gitlab", "medium")), new DefaultNexusPolicy(), [adapter("gitlab")]);
    expect(plan.steps[0]).toMatchObject({ capabilityId: "gitlab.repo.read", adapterId: "gitlab" });
    expect(plan.rationale.join(" ")).toMatch(/used gitlab\.repo\.read after skipping github\.repo\.read \(adapter_unbound\)/);
  });

  it("falls back past a policy denial, and still prefers the best-ranked usable candidate", () => {
    const denyGithub: NexusPolicy = { evaluate: (_a, c) => (c.adapterId === "github" ? { allowed: false, requiresApproval: false, reason: "github denied" } : { allowed: true, requiresApproval: false }) } as NexusPolicy;
    const plan = composeIntent(intent, registry(cap("github.repo.read", "github", "low"), cap("gitlab.repo.read", "gitlab", "medium"), cap("gitea.repo.read", "gitea", "high")), denyGithub, [adapter("github"), adapter("gitlab"), adapter("gitea")]);
    expect(plan.steps[0].capabilityId).toBe("gitlab.repo.read");
  });

  it("no rationale noise when the first candidate is used", () => {
    const plan = composeIntent(intent, registry(cap("github.repo.read", "github", "low")), new DefaultNexusPolicy(), [adapter("github")]);
    expect(plan.rationale.some((r) => r.includes("after skipping"))).toBe(false);
  });

  it("fails closed when no candidate is usable; denial outranks unbound", () => {
    const deny: NexusPolicy = { evaluate: () => ({ allowed: false, requiresApproval: false, reason: "nope" }) } as NexusPolicy;
    try {
      composeIntent(intent, registry(cap("a.repo.read", "a", "low"), cap("b.repo.read", "b", "low")), deny, []);
      throw new Error("expected CompositionError");
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionError);
      expect((error as CompositionError).code).toBe("capability_denied");
    }
    try {
      composeIntent(intent, registry(cap("a.repo.read", "a", "low"), cap("b.repo.read", "b", "low")), new DefaultNexusPolicy(), []);
      throw new Error("expected CompositionError");
    } catch (error) {
      expect((error as CompositionError).code).toBe("adapter_unbound");
      expect((error as Error).message).toMatch(/No usable candidate for "repo.read"/);
    }
  });
});
