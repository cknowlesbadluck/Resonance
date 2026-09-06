import { evaluateDeployContract, type DeployContract } from "./contract";

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
    timestamp: now.toISOString(),
  };
}

export function readinessStatus(body: Readiness): number {
  return body.status === "ready" ? 200 : 503;
}
