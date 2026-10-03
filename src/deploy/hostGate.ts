/**
 * GitHub "Production" is not the public gate.
 * A Vercel alias can report success while resonancenexus.netlify.app
 * still serves the previous contract. That status is never proof.
 * Do not invent secrets. Do not treat this classifier as a deploy.
 */

export const CANONICAL_PUBLIC_HOST = "resonancenexus.netlify.app";

export type HostGate = {
  publicHost: boolean;
  vercelAlias: boolean;
  countsAsProductionProof: false;
  note: "canonical_public_host" | "vercel_alias_is_not_the_public_gate" | "unknown_host";
};

export function classifyDeploymentTarget(url: string): HostGate {
  const host = hostname(url);
  const publicHost = host === CANONICAL_PUBLIC_HOST;
  const vercelAlias = host.endsWith(".vercel.app");
  return {
    publicHost,
    vercelAlias,
    countsAsProductionProof: false,
    note: publicHost
      ? "canonical_public_host"
      : vercelAlias
        ? "vercel_alias_is_not_the_public_gate"
        : "unknown_host",
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
