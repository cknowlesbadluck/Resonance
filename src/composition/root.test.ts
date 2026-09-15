import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regression guard for the P2 capability-plane gap.
 *
 * Before this slice, `GET /api/nexus/capabilities` advertised 14 catalog capabilities
 * and every single one failed at compose time with the opaque error
 * "No compatible capability for <key>", while `DefaultNexusPolicy` denied all of them
 * with "unsupported permission". Discovery and execution were two disconnected planes.
 */

async function freshRoot(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./root");
}

const intentFor = (key: string) => ({
  id: "intent-1",
  projectId: "00000000-0000-4000-8000-000000000001",
  objective: "regression probe",
  requestedBy: "actor-1",
  requirements: [{ key }],
  contextRefs: [],
  metadata: {},
});

beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe("capability plane convergence", () => {
  it("every advertised capability is resolvable by the composer", async () => {
    const root = await freshRoot({ GITHUB_TOKEN: undefined });
    const advertised = root.listAdvertisedCapabilities();
    expect(advertised.length).toBeGreaterThan(10);

    const unresolvable: string[] = [];
    for (const capability of advertised) {
      try {
        root.composeIntentWithCatalog(intentFor(capability.key));
      } catch (error) {
        const message = (error as Error).message;
        // The composer must never fail to *find* an advertised capability.
        // Failing on policy or executability is legitimate; failing on lookup is the bug.
        if (message.startsWith("No compatible capability")) unresolvable.push(capability.key);
      }
    }
    expect(unresolvable).toEqual([]);
  });

  it("refuses unbound capabilities with an actionable reason, not an opaque lookup miss", async () => {
    const root = await freshRoot({ GITHUB_TOKEN: undefined });
    expect(() => root.composeIntentWithCatalog(intentFor("tool.linear")))
      .toThrowError(/no adapter is bound to provider "linear"/i);
  });

  it("composes and binds a catalog capability once its adapter is configured", async () => {
    const root = await freshRoot({ GITHUB_TOKEN: "ghp_test_token" });
    const github = root.listAdvertisedCapabilities().find((c) => c.id === "tool.github");
    expect(github?.executable).toBe(true);
    expect(github?.adapterId).toBe("github");

    const plan = root.composeIntentWithCatalog(intentFor("tool.github"));
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].adapterId).toBe("github");
    // repo.write + pr.write ⇒ high risk ⇒ above the "execute" approval threshold.
    expect(plan.approvalRequired).toBe(true);
  });

  it("advertises executability honestly per deployment", async () => {
    const root = await freshRoot({ GITHUB_TOKEN: undefined });
    const advertised = root.listAdvertisedCapabilities();
    const catalogEntries = advertised.filter((c) => c.provenance === "catalog");
    expect(catalogEntries.length).toBeGreaterThan(0);
    for (const capability of catalogEntries) {
      expect(capability.executable).toBe(false);
      expect(capability.unexecutableReason).toBeTruthy();
    }
    // Runtime-native fixtures remain executable.
    expect(advertised.find((c) => c.id === "http.demo.read")?.adapterId).toBe("http-demo");
  });
});
