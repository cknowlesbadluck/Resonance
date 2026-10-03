import { evaluateDeployContract, readinessPosture, type DeployContract, type ReadinessPosture } from "./contract";

export type Liveness = {
  status: "ok";
  service: "resonance-nexus";
  stage: "deployment";
  timestamp: string;
};

export type Readiness = {
  status: "ready" | "not_ready";
  service: "resonance-nexus";
  stage: "deployment";
  production: boolean;
  authMode: string;
  authModeOk: boolean;
  persistenceConfigured: boolean;
  githubAdapterConfigured: boolean;
  missingRequired: string[];
  ownerActionRequired: boolean;
  contractRevision: string;
  ownerKeys: string[];
  agentActionRequired: boolean;
  posture: ReadinessPosture["note"];
  timestamp: string;
};

export function liveness(now = new Date()): Liveness {
  return {
    status: "ok",
    service: "resonance-nexus",
    stage: "deployment",
    timestamp: now.toISOString(),
  };
}

export function readiness(contract: DeployContract = evaluateDeployContract(), now = new Date()): Readiness {
  const persistenceConfigured = contract.keys
    .filter((item) => item.role === "persistence")
    .every((item) => item.present);
  const posture = readinessPosture(contract);
  return {
    status: contract.ready ? "ready" : "not_ready",
    service: "resonance-nexus",
    stage: "deployment",
    production: contract.production,
    authMode: contract.authMode,
    authModeOk: contract.authModeOk,
    persistenceConfigured,
    githubAdapterConfigured: contract.githubAdapterConfigured,
    missingRequired: contract.missingRequired,
    ownerActionRequired: posture.ownerActionRequired,
    contractRevision: "2026-10-03-owner-gate",
    ownerKeys: posture.ownerKeys,
    agentActionRequired: posture.agentActionRequired,
    posture: posture.note,
    timestamp: now.toISOString(),
  };
}

export function readinessStatus(body: Readiness): number {
  return body.status === "ready" ? 200 : 503;
}
