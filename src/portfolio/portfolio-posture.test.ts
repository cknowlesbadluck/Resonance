import { describe, expect, it } from "vitest";
import { classifyConduitReady, classifyDevice, classifyResonanceReady, isColdStart } from "../../scripts/portfolio-posture.mjs";

describe("PortfolioPosture cold_start", () => {
  it.each([0, undefined, null, Number.NaN, 504])("treats status %s as cold_start", (status) => {
    expect(isColdStart(status)).toBe(true);
    const r = classifyResonanceReady(null, status);
    expect(r.posture).toBe("cold_start");
    expect(r.retryable).toBe(true);
    expect(classifyConduitReady(null, status).posture).toBe("cold_start");
  });

  it("never reports cold_start for real responses", () => {
    for (const s of [200, 404, 500, 502, 503]) expect(isColdStart(s)).toBe(false);
  });

  it("cold_start beats a stale body claiming ready", () => {
    expect(classifyResonanceReady({ status: "ready" }, 0).posture).toBe("cold_start");
  });
});

describe("PortfolioPosture fail-closed", () => {
  it("200 without a ready body is incomplete, not ready", () => {
    expect(classifyResonanceReady({ status: "not_ready" }, 200).posture).toBe("incomplete_ready");
    expect(classifyResonanceReady(null, 200).posture).toBe("incomplete_ready");
    expect(classifyResonanceReady({ status: "ready" }, 200).posture).toBe("ready");
  });

  it("classifies today's live 503 shape as owner_gate", () => {
    const live = { status: "not_ready", stage: "deployment", missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"] };
    expect(classifyResonanceReady(live, 503)).toMatchObject({ posture: "owner_gate", ownerActionRequired: true });
  });

  it("does not claim device acceptance without an explicit record (CHR-55)", () => {
    expect(classifyDevice({}).posture).toBe("unknown");
    expect(classifyDevice({ acceptanceGate: "CHR-55" }).posture).toBe("device_not_recorded");
  });
});
