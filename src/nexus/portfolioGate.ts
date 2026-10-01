export type GateOwner = "owner" | "agent" | "none";

export interface ReadinessProbe {
  httpStatus: number;
  missingRequired?: string[];
  persistenceConfigured?: boolean;
  githubAdapterConfigured?: boolean;
  authModeOk?: boolean;
}

export interface DeviceProbe {
  simulatorUiSmoke?: "green" | "red" | "unknown";
  deviceHg?: "passed" | "open" | "unknown";
}

export interface ConduitProbe {
  ready?: boolean;
  persistence?: string;
  frozenDrafts?: string[];
}

export interface PortfolioProbe {
  resonance: ReadinessProbe;
  quicksilver: DeviceProbe;
  conduit: ConduitProbe;
}

export interface PortfolioGate {
  id: string;
  owner: GateOwner;
  blocking: boolean;
  reason: string;
}

export interface PortfolioGateCard {
  readyForRelease: boolean;
  ownerBlocked: string[];
  agentBlocked: string[];
  gates: PortfolioGate[];
}

const SERVICE_ROLE = "SUPABASE_SERVICE_ROLE_KEY";

export function classifyPortfolio(probe: PortfolioProbe): PortfolioGateCard {
  const gates: PortfolioGate[] = [];
  const missing = probe.resonance.missingRequired ?? [];
  const serviceRoleMissing = missing.includes(SERVICE_ROLE) || probe.resonance.httpStatus === 503 && missing.length > 0;

  gates.push({
    id: "CHR-54",
    owner: "owner",
    blocking: probe.resonance.httpStatus !== 200 || missing.length > 0,
    reason: missing.length
      ? `Live ready is ${probe.resonance.httpStatus}; missing ${missing.join(", ")}. Do not invent the secret.`
      : probe.resonance.httpStatus === 200
        ? "Live ready is 200."
        : `Live ready is ${probe.resonance.httpStatus} with no named missing key.`,
  });

  gates.push({
    id: "CHR-55",
    owner: "owner",
    blocking: probe.quicksilver.deviceHg !== "passed",
    reason: probe.quicksilver.deviceHg === "passed"
      ? "Device HG passed. Simulator is not the acceptance bar."
      : "Device HG on iPhone 16e is still open. Simulator CI is not acceptance.",
  });

  gates.push({
    id: "QS-UI-SMOKE",
    owner: "agent",
    blocking: probe.quicksilver.simulatorUiSmoke === "red",
    reason: probe.quicksilver.simulatorUiSmoke === "red"
      ? "Simulator UI smoke is red. Do not merge that PR."
      : probe.quicksilver.simulatorUiSmoke === "green"
        ? "Simulator UI smoke is green. Still not device acceptance."
        : "Simulator UI smoke was not probed.",
  });

  gates.push({
    id: "CONDUIT-FREEZE",
    owner: "agent",
    blocking: (probe.conduit.frozenDrafts ?? []).length > 0 && probe.conduit.ready !== true,
    reason: probe.conduit.ready
      ? `Conduit ready on ${probe.conduit.persistence ?? "unknown"}. Frozen drafts stay unmerged: ${(probe.conduit.frozenDrafts ?? []).join(", ") || "none"}.`
      : "Conduit ready probe failed.",
  });

  if (serviceRoleMissing && probe.resonance.persistenceConfigured) {
    gates.push({
      id: "READY-LIE",
      owner: "agent",
      blocking: true,
      reason: "Persistence is marked configured while SERVICE_ROLE is missing. That probe is inconsistent.",
    });
  }

  const ownerBlocked = gates.filter((gate) => gate.blocking && gate.owner === "owner").map((gate) => gate.id);
  const agentBlocked = gates.filter((gate) => gate.blocking && gate.owner === "agent").map((gate) => gate.id);

  return {
    readyForRelease: ownerBlocked.length === 0 && agentBlocked.length === 0,
    ownerBlocked,
    agentBlocked,
    gates,
  };
}
