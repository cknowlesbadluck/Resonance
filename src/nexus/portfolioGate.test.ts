import { describe, expect, it } from "vitest";
import { classifyPortfolio } from "./portfolioGate";

describe("classifyPortfolio", () => {
  it("keeps the live 503 on the owner, not the agent", () => {
    const card = classifyPortfolio({
      resonance: {
        httpStatus: 503,
        missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
        persistenceConfigured: false,
        githubAdapterConfigured: false,
        authModeOk: true,
      },
      quicksilver: { simulatorUiSmoke: "red", deviceHg: "open" },
      conduit: { ready: true, persistence: "postgres", frozenDrafts: ["#119", "#120", "#155"] },
    });

    expect(card.readyForRelease).toBe(false);
    expect(card.ownerBlocked).toEqual(["CHR-54", "CHR-55"]);
    expect(card.agentBlocked).toEqual(["QS-UI-SMOKE"]);
    expect(card.gates.find((gate) => gate.id === "CHR-54")?.reason).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("does not treat a green simulator as device acceptance", () => {
    const card = classifyPortfolio({
      resonance: { httpStatus: 200, missingRequired: [], persistenceConfigured: true },
      quicksilver: { simulatorUiSmoke: "green", deviceHg: "open" },
      conduit: { ready: true, persistence: "postgres", frozenDrafts: [] },
    });

    expect(card.ownerBlocked).toEqual(["CHR-55"]);
    expect(card.agentBlocked).toEqual([]);
    expect(card.readyForRelease).toBe(false);
  });

  it("flags a persistence lie when the service role is still missing", () => {
    const card = classifyPortfolio({
      resonance: {
        httpStatus: 503,
        missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
        persistenceConfigured: true,
      },
      quicksilver: { simulatorUiSmoke: "unknown", deviceHg: "unknown" },
      conduit: { ready: true, persistence: "postgres" },
    });

    expect(card.agentBlocked).toContain("READY-LIE");
  });
});
