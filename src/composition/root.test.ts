import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regression guard for the P2 capability-plane gap.
 *
 * Before this work, `GET /api/nexus/capabilities` advertised 14 catalog capabilities and
 * every one failed at compose time with the opaque "No compatible capability for <key>",
 * while `DefaultNexusPolicy` denied all of them for declaring an "unsupported permission".
 * Discovery and execution were two disconnected planes.
 *
 * The second guard here is subtler and was a defect in the first fix: binding a catalog
 * entry to an adapter because their provider names matched made the capability
 * *composable* while still guaranteeing `unsupported_capability` at invoke. Executability
 * must follow what an adapter actually declares.
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
  delete process.env.LINEAR_API_KEY;
});

describe("capability plane convergence", () => {
  it("every advertised capability is resolvable by the composer", async () => {
    const root = await freshRoot();
    const advertised = await root.listAdvertisedCapabilities();
    expect(advertised.length).toBeGreaterThan(10);

    const unresolvable: string[] = [];
    for (const capability of advertised) {
      try {
        await root.composeIntentWithCatalog(intentFor(capability.key));
      } catch (error) {
        // Failing on policy or executability is legitimate. Failing to *find* an
        // advertised capability is the bug.
        if ((error as Error).message.startsWith("No capability is registered")) {
          unresolvable.push(capability.key);
        }
      }
    }
    expect(unresolvable).toEqual([]);
  });

  it("refuses unbound capabilities with an actionable reason", async () => {
    const root = await freshRoot();
    await expect(root.composeIntentWithCatalog(intentFor("tool.figma")))
      .rejects.toThrowError(/no adapter is bound to provider "figma"/i);
  });

  it("treats provider-level catalog entries as descriptors, not invocable operations", async () => {
    // The GitHub adapter declares `github.repository.read`, never `tool.github`.
    // Binding them by provider name would compose a plan that always fails at invoke.
    const root = await freshRoot({ GITHUB_TOKEN: "ghp_test_token" });
    const advertised = await root.listAdvertisedCapabilities();

    const descriptor = advertised.find((c) => c.id === "tool.github");
    expect(descriptor?.executable).toBe(false);
    expect(descriptor?.unexecutableReason).toContain("github.repository.read");

    const invocable = advertised.find((c) => c.id === "github.repository.read");
    expect(invocable?.executable).toBe(true);
    expect(invocable?.adapterId).toBe("github");
  });

  it("composes and executes against a capability an adapter actually declares", async () => {
    const root = await freshRoot({ GITHUB_TOKEN: "ghp_test_token" });
    const plan = await root.composeIntentWithCatalog(intentFor("github.repository.read"));
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].adapterId).toBe("github");
    expect(plan.steps[0].capabilityId).toBe("github.repository.read");
    expect(plan.approvalRequired).toBe(false);
  });

  it("binds a second provider without any change to the core", async () => {
    // The whole point of the composition root: adding a provider is a wiring act.
    const root = await freshRoot({ LINEAR_API_KEY: "lin_api_test" });
    const advertised = await root.listAdvertisedCapabilities();

    const linear = advertised.find((c) => c.id === "linear.issue.read");
    expect(linear?.executable).toBe(true);

    const plan = await root.composeIntentWithCatalog(intentFor("linear.issue.read"));
    expect(plan.steps[0].adapterId).toBe("linear");

    const descriptor = advertised.find((c) => c.id === "tool.linear");
    expect(descriptor?.executable).toBe(false);
    expect(descriptor?.unexecutableReason).toContain("linear.issue.read");
  });

  it("reports a provider as absent when its credential is not configured", async () => {
    const root = await freshRoot();
    const advertised = await root.listAdvertisedCapabilities();
    expect(advertised.find((c) => c.id === "linear.issue.read")).toBeUndefined();
    expect(advertised.find((c) => c.id === "github.repository.read")).toBeUndefined();

    const descriptor = advertised.find((c) => c.id === "tool.linear");
    expect(descriptor?.executable).toBe(false);
    expect(descriptor?.unexecutableReason).toMatch(/no adapter is bound/i);
  });

  it("advertises executability honestly for every catalog entry", async () => {
    const root = await freshRoot();
    const catalogEntries = (await root.listAdvertisedCapabilities()).filter((c) => c.provenance === "catalog");
    expect(catalogEntries.length).toBeGreaterThan(0);
    for (const capability of catalogEntries) {
      expect(capability.executable).toBe(false);
      expect(capability.unexecutableReason).toBeTruthy();
    }
  });
});
