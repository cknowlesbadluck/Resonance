import { evaluateDeployContract, readinessPosture, type DeployContract, type ReadinessPosture } from "./contract";
import { EXPECTED_CONTRACT_REVISION } from "./deployLag";

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
  /** Deployed commit (40-hex) from the host's build env, or null. Additive; used by scripts/deploy-parity.mjs. */
  commitSha: string | null;
  ownerKeys: string[];
  agentActionRequired: boolean;
  posture: ReadinessPosture["note"];
  timestamp: string;
};

const SHA_RE = /^[0-9a-f]{40}$/i;

/** Commit SHA injected by common free hosts/CI at build time. Never a secret; validated as 40-hex. */
export function deployedCommitSha(env: NodeJS.Dict<string> = process.env): string | null {
  for (const key of ["RESONANCE_COMMIT_SHA", "COMMIT_REF", "VERCEL_GIT_COMMIT_SHA", "GITHUB_SHA"]) {
    const value = env[key]?.trim();
    if (value && SHA_RE.test(value)) return value.toLowerCase();
  }
  return null;
}

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
    contractRevision: EXPECTED_CONTRACT_REVISION,
    commitSha: deployedCommitSha(),
    ownerKeys: posture.ownerKeys,
    agentActionRequired: posture.agentActionRequired,
    posture: posture.note,
    timestamp: now.toISOString(),
  };
}

export function readinessStatus(body: Readiness): number {
  return body.status === "ready" ? 200 : 503;
}
