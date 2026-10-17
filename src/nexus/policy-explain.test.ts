import { afterEach, describe, expect, it, vi } from "vitest";
import { DefaultNexusPolicy } from "./policy";
import { explainCapability } from "./policy-explain";
import type { NexusCapability } from "./types";

const base = (over: Partial<NexusCapability> = {}): NexusCapability => ({ id: "github.repo.read", requiredPermissions: ["read"], risk: "low", availability: "available", ...over } as NexusCapability);
const policy = new DefaultNexusPolicy();

describe("explainCapability (policy dry-run)", () => {
  it("allow: every check passes", () => {
    const e = explainCapability(policy, "u1", base());
    expect(e.decision).toBe("allow");
    expect(e.dryRun).toBe(true);
    expect(e.checks.every((c) => c.passed)).toBe(true);
  });

  it("approval_required for execute-level grants and critical risk", () => {
    expect(explainCapability(policy, "u1", base({ requiredPermissions: ["execute"] })).decision).toBe("approval_required");
    const critical = explainCapability(policy, "u1", base({ risk: "critical" }));
    expect(critical.decision).toBe("approval_required");
    expect(critical.checks.find((c) => c.check === "approval_threshold")).toMatchObject({ passed: false });
  });

  it("deny with the failing check named", () => {
    const planned = explainCapability(policy, "u1", base({ availability: "planned" }));
    expect(planned.decision).toBe("deny");
    expect(planned.checks.find((c) => c.check === "availability")).toMatchObject({ passed: false, detail: "planned" });
    const unbound = explainCapability(policy, "u1", base({ executable: false, unexecutableReason: "no adapter" }));
    expect(unbound.decision).toBe("deny");
    expect(unbound.checks.find((c) => c.check === "adapter_bound")).toMatchObject({ passed: false, detail: "no adapter" });
    expect(explainCapability(policy, "u1", base({ tags: ["blocked"] })).decision).toBe("deny");
    expect(explainCapability(policy, "", base()).decision).toBe("deny");
    const weird = explainCapability(policy, "u1", base({ requiredPermissions: ["teleport"] }));
    expect(weird.decision).toBe("deny");
    expect(weird.checks.find((c) => c.check === "permissions_recognized")).toMatchObject({ passed: false });
  });

  it("approval_threshold check follows the policy's own threshold (never disagrees with decision)", () => {
    const strict = new DefaultNexusPolicy("modify");
    const e = explainCapability(strict, "u1", base({ requiredPermissions: ["modify"] }));
    expect(e.decision).toBe("approval_required");
    expect(e.checks.find((c) => c.check === "approval_threshold")).toMatchObject({ passed: false });
    for (const p of [new DefaultNexusPolicy("read"), new DefaultNexusPolicy("modify"), new DefaultNexusPolicy("execute")]) {
      for (const perms of [["read"], ["write"], ["modify"], ["execute"]]) {
        const x = explainCapability(p, "u1", base({ requiredPermissions: perms }));
        if (x.decision !== "deny") expect(x.checks.find((c) => c.check === "approval_threshold")!.passed).toBe(x.decision === "allow");
      }
    }
  });

  it("returns every required permission (no silent truncation)", () => {
    const perms = Array.from({ length: 30 }, (_, i) => (i % 2 ? "read" : "write"));
    expect(explainCapability(policy, "u1", base({ requiredPermissions: perms })).requiredPermissions).toHaveLength(30);
  });

  it("the decision always matches policy.evaluate", () => {
    for (const cap of [base(), base({ risk: "critical" }), base({ availability: "unavailable" }), base({ requiredPermissions: ["write"] })]) {
      const d = policy.evaluate("u1", cap);
      const expected = !d.allowed ? "deny" : d.requiresApproval ? "approval_required" : "allow";
      expect(explainCapability(policy, "u1", cap).decision).toBe(expected);
    }
  });
});

describe("GET /api/nexus/capabilities/explain", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
  const load = async () => (await import("../../app/api/nexus/capabilities/explain/route")).GET;

  it("400 on a missing or malformed capabilityId", async () => {
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
    const GET = await load();
    expect((await GET(new Request("http://x/api/nexus/capabilities/explain"))).status).toBe(400);
    expect((await GET(new Request(`http://x/api/nexus/capabilities/explain?capabilityId=${"a".repeat(201)}`))).status).toBe(400);
    expect((await GET(new Request("http://x/api/nexus/capabilities/explain?capabilityId=a%20b"))).status).toBe(400);
    expect((await GET(new Request(`http://x/api/nexus/capabilities/explain?capabilityId=ok&projectId=${"p".repeat(65)}`))).status).toBe(400);
    expect((await GET(new Request("http://x/api/nexus/capabilities/explain?capabilityId=ok&projectId=..%2Fother"))).status).toBe(400);
  });

  it("401 without credentials when auth is required, and in production when auth is not configured", async () => {
    vi.stubEnv("RESONANCE_AUTH_MODE", "required");
    let GET = await load();
    expect((await GET(new Request("http://x/api/nexus/capabilities/explain?capabilityId=github.repo.read&projectId=00000000-0000-4000-8000-000000000001"))).status).toBe(401);
    vi.resetModules();
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
    vi.stubEnv("NODE_ENV", "production");
    GET = await load();
    expect((await GET(new Request("http://x/api/nexus/capabilities/explain?capabilityId=github.repo.read"))).status).toBe(401);
  });

  it("dev: explains an advertised capability and 404s an unknown one, without executing", async () => {
    vi.stubEnv("RESONANCE_AUTH_MODE", "optional");
    const GET = await load();
    const { listAdvertisedCapabilities } = await import("../composition/root");
    const [first] = await listAdvertisedCapabilities();
    expect(first).toBeTruthy();
    const ok = await GET(new Request(`http://x/api/nexus/capabilities/explain?capabilityId=${encodeURIComponent(first.id)}`));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.explanation.capabilityId).toBe(first.id);
    expect(["allow", "approval_required", "deny"]).toContain(body.explanation.decision);
    expect(body.explanation.dryRun).toBe(true);
    expect(ok.headers.get("cache-control")).toBe("no-store");
    const missing = await GET(new Request("http://x/api/nexus/capabilities/explain?capabilityId=does.not.exist.anywhere"));
    expect(missing.status).toBe(404);
    // The 404 carries only the validated id: no catalog listing, no other project's data.
    expect(Object.keys(await missing.json()).sort()).toEqual(["capabilityId", "error"]);
  });
});
