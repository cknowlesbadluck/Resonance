import { describe, expect, it } from "vitest";
import { classifyReadiness } from "./advisory";

describe("classifyReadiness", () => {
  it("keeps the service-role key as the only owner blocker", () => {
    const result = classifyReadiness({
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      githubAdapterConfigured: false,
    });
    expect(result.blocking).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
    expect(result.ownerBlocked).toBe(true);
    expect(result.agentBlocked).toBe(false);
    expect(result.advisory.map((gap) => gap.key)).toEqual(["GITHUB_TOKEN"]);
    expect(result.advisory.every((gap) => gap.required === false)).toBe(true);
  });

  it("does not invent a blocker when the adapter is absent and ready keys are present", () => {
    const result = classifyReadiness({
      missingRequired: [],
      githubAdapterConfigured: false,
    });
    expect(result.blocking).toEqual([]);
    expect(result.ownerBlocked).toBe(false);
    expect(result.agentBlocked).toBe(false);
    expect(result.advisory).toHaveLength(1);
  });

  it("does not duplicate GITHUB_TOKEN if a future contract marks it required", () => {
    const result = classifyReadiness({
      missingRequired: ["GITHUB_TOKEN"],
      githubAdapterConfigured: false,
    });
    expect(result.blocking).toEqual(["GITHUB_TOKEN"]);
    expect(result.advisory).toEqual([]);
    expect(result.agentBlocked).toBe(true);
    expect(result.ownerBlocked).toBe(false);
  });
});
