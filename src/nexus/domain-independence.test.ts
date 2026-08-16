import { describe, expect, it } from "vitest";
import { initialAgents, initialSkills, resonanceIntegrations } from "../../lib/domain";

describe("Resonance domain independence", () => {
  it("does not encode an application-specific product as a core dependency", () => {
    const coreText = JSON.stringify({ initialAgents, initialSkills, resonanceIntegrations }).toLowerCase();
    expect(coreText).not.toContain("quicksilver");
  });

  it("treats MCP as an interoperability mechanism, not the Nexus itself", () => {
    const mcp = resonanceIntegrations.find((integration) => integration.key === "mcp");
    expect(mcp?.category).toBe("Interoperability");
    expect(mcp?.description.toLowerCase()).toContain("bridge");
  });
});
