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
