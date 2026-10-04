export type DeployEnvRole = "persistence" | "auth" | "adapter" | "ops";

export type DeployEnvKeySpec = {
  key: string;
  requiredInProduction: boolean;
  role: DeployEnvRole;
};

/**
 * Host-neutral production env contract.
 * Presence only — never return secret values.
 * The host (Netlify today, Render/Vercel later) is not a Nexus domain object.
 */
export const DEPLOY_ENV_KEYS: readonly DeployEnvKeySpec[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", requiredInProduction: true, role: "persistence" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", requiredInProduction: true, role: "persistence" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", requiredInProduction: true, role: "persistence" },
  { key: "RESONANCE_PROJECT_ID", requiredInProduction: true, role: "auth" },
  { key: "RESONANCE_AUTH_MODE", requiredInProduction: true, role: "auth" },
  { key: "GITHUB_TOKEN", requiredInProduction: false, role: "adapter" },
  { key: "GITHUB_WEBHOOK_SECRET", requiredInProduction: false, role: "adapter" },
  { key: "LINEAR_API_KEY", requiredInProduction: false, role: "ops" },
];

export type EnvKeyPresence = {
  key: string;
  role: DeployEnvRole;
  requiredInProduction: boolean;
  present: boolean;
};

export type DeployContract = {
  production: boolean;
  authMode: string;
  authModeOk: boolean;
  keys: EnvKeyPresence[];
  missingRequired: string[];
  githubAdapterConfigured: boolean;
  ready: boolean;
};

export type ReadinessPosture = {
  ready: boolean;
  ownerActionRequired: boolean;
  ownerKeys: string[];
  agentActionRequired: boolean;
  note: string;
};

const OWNER_SECRET_KEYS = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "GITHUB_TOKEN",
  "GITHUB_WEBHOOK_SECRET",
  "LINEAR_API_KEY",
]);

export function envPresent(env: NodeJS.Dict<string>, key: string): boolean {
  return Boolean(env[key]?.trim());
}

export function isProductionRuntime(env: NodeJS.Dict<string> = process.env): boolean {
  return env.NODE_ENV === "production" || env.RESONANCE_DEPLOY_STAGE === "production";
}

export function evaluateDeployContract(env: NodeJS.Dict<string> = process.env): DeployContract {
  const production = isProductionRuntime(env);
  const authMode = (env.RESONANCE_AUTH_MODE ?? "auto").trim().toLowerCase() || "auto";
  const keys = DEPLOY_ENV_KEYS.map((spec) => ({
    key: spec.key,
    role: spec.role,
    requiredInProduction: spec.requiredInProduction,
    present: envPresent(env, spec.key),
  }));
  const missingRequired = production
    ? keys.filter((item) => item.requiredInProduction && !item.present).map((item) => item.key)
    : [];
  const authModeOk = !production || authMode === "required";
  return {
    production,
    authMode,
    authModeOk,
    keys,
    missingRequired,
    githubAdapterConfigured: envPresent(env, "GITHUB_TOKEN"),
    ready: missingRequired.length === 0 && authModeOk,
  };
}

/**
 * Split a failed contract into owner work and agent work.
 * Missing secrets are never an agent defect. Do not invent them.
 */
export function readinessPosture(contract: DeployContract): ReadinessPosture {
  if (contract.ready) {
    return {
      ready: true,
      ownerActionRequired: false,
      ownerKeys: [],
      agentActionRequired: false,
      note: "contract_passed",
    };
  }
  const ownerKeys = contract.missingRequired.filter((key) => OWNER_SECRET_KEYS.has(key));
  const agentKeys = contract.missingRequired.filter((key) => !OWNER_SECRET_KEYS.has(key));
  const authBlocked = !contract.authModeOk;
  const ownerActionRequired = ownerKeys.length > 0 || authBlocked;
  const agentActionRequired = agentKeys.length > 0;
  let note = "not_ready";
  if (ownerKeys.length === 1 && ownerKeys[0] === "SUPABASE_SERVICE_ROLE_KEY" && !agentActionRequired && !authBlocked) {
    note = "owner_must_set_service_role_on_production_host";
  } else if (ownerActionRequired && !agentActionRequired) {
    note = "owner_must_set_production_secret_or_auth_mode";
  } else if (ownerActionRequired && agentActionRequired) {
    note = "owner_and_agent_must_both_act";
  } else if (agentActionRequired) {
    note = "agent_must_fix_non_secret_contract_gap";
  }
  return {
    ready: false,
    ownerActionRequired,
    ownerKeys,
    agentActionRequired,
    note,
  };
}
