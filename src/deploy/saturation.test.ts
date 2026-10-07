import { describe, expect, it } from "vitest";
import { governSaturation } from "./saturation";

describe("saturation governor", () => {
  it("closes bolt noise and refuses a new pull request on the 05:00 EDT probe", () => {
    const decision = governSaturation({
      product: {
        httpStatus: 503,
        body: {
          status: "not_ready",
          missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
        },
      },
      alias: { httpStatus: 404, body: "DEPLOYMENT_NOT_FOUND" },
      roadmapAlreadyOpen: true,
      keepRedNumbers: [119, 120, 155, 162],
      openRecords: [
        { number: 184, title: "⚡ Bolt: optimize listCapabilityGrants in-memory sorting" },
        { number: 152, title: "docs: refresh 10-phase portfolio roadmap" },
      ],
    });
    expect(decision.mutation).toBe("close_noise");
    expect(decision.openNewPullRequest).toBe(false);
    expect(decision.closeNumbers).toEqual([184]);
    expect(decision.reason).toContain("alias 404");
    expect(JSON.stringify(decision).includes("SUPABASE_SERVICE_ROLE_KEY=")).toBe(false);
  });

  it("does not invent a secret when no roadmap is open", () => {
    const decision = governSaturation({
      product: { httpStatus: 503, body: { missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"] } },
      openRecords: [],
    });
    expect(decision.mutation).toBe("owner_only");
    expect(decision.openNewPullRequest).toBe(false);
  });
});
