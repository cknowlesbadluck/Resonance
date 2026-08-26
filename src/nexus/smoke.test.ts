import { describe, expect, it } from "vitest";
import { HttpAdapter } from "./adapters/http";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import { NexusExecutor } from "./executor";
import type { NexusEvent, NexusExecution, NexusIntent, NexusCapability } from "./types";

const mockCapability: NexusCapability = {
  id: "smoke.test.capability",
  key: "smoke.test",
  name: "Smoke Test Capability",
  providerId: "smoke",
  adapterId: "smoke-http",
  kind: "integration",
  // Using "read" so it doesn't trigger the DefaultNexusPolicy's "execute" threshold for requiresApproval
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
  provenance: "smoke-test"
};

describe("End-to-end Smoke Test", () => {
  it("verifies the full flow: Discovery -> Compose -> Execute -> Evidence", async () => {
    // 1. Setup Adapter & Registry
    const adapter = new HttpAdapter("smoke-http", {
      describe: async () => ({ identity: { id: "smoke", type: "connector", name: "smoke" }, capabilities: [mockCapability] }),
      invoke: async (capId, input) => {
        return { success: true, echoed: input };
      }
    });

    const registry = new InMemoryCapabilityRegistry();
    registry.register(mockCapability);
    const policy = new DefaultNexusPolicy();

    // 2. Propose Intent
    const intent: NexusIntent = {
      id: "smoke-intent-1",
      projectId: "proj-1",
      objective: "Run smoke test",
      requestedBy: "smoke-actor",
      requirements: [{ key: mockCapability.key, requiredPermissions: ["read"] }],
      metadata: { input: { testVal: 123 } },
    };

    // 3. Compose Plan
    const plan = composeIntent(intent, registry, policy, [adapter]);
    expect(plan.approvalRequired).toBe(false);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].capabilityId).toBe(mockCapability.id);

    // 4. Execute Plan & Collect Evidence
    const executions: NexusExecution[] = [];
    const events: NexusEvent[] = [];

    const result = await new NexusExecutor([adapter], {
      recordEvidence: async () => {},
      recordExecution: async (item) => { executions.push({ ...item }); },
      recordEvent: async (item) => { events.push(item); },
    }).execute(plan);

    // 5. Verification
    expect(result.execution.status).toBe("completed");
    expect(result.execution.output).toEqual([{ success: true, echoed: { testVal: 123 } }]);

    // Verify execution lifecycle events
    expect(events.map(e => e.type)).toEqual(["execution.started", "execution.step.completed", "execution.completed"]);

    // Verify persistence checks
    expect(executions.map(e => e.status)).toEqual(["running", "completed"]);

    // Verify evidence output
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].type).toBe("event");
    expect(result.evidence[0].payload).toEqual({ success: true, echoed: { testVal: 123 } });
  });
});
