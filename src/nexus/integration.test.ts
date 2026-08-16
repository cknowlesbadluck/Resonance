import { describe, expect, it } from "vitest";
import { composeDemoIntent, nexusAdapters } from "./runtime";
import { NexusExecutor } from "./executor";

describe("Nexus heterogeneous bridge proof", () => {
  it("composes one intent across HTTP and MCP without provider-specific core logic", () => {
    const plan = composeDemoIntent({ id: "proof", projectId: "independent", objective: "perform two independent capability operations", requestedBy: "tester", requirements: [{ key: "demo.read" }, { key: "demo.write" }] });
    expect(plan.mode).toBe("chamber");
    expect(new Set(plan.steps.map((step) => step.adapterId))).toEqual(new Set(["http-demo", "mcp-demo"]));
  });

  it("executes the low-risk direct path and records evidence", async () => {
    const plan = composeDemoIntent({ id: "direct", projectId: "independent", objective: "read demo", requestedBy: "tester", requirements: [{ key: "demo.read" }] });
    const evidence: unknown[] = [];
    const result = await new NexusExecutor(nexusAdapters, { recordEvidence: async (item) => { evidence.push(item); } }).execute(plan);
    expect(result.execution.status).toBe("completed");
    expect(evidence.length).toBe(1);
  });
});
