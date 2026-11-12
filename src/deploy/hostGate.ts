/**
 * Only the canonical public host can be used for production readiness evidence.
 * Preview and unknown hosts are never treated as production proof.
 */
export const CANONICAL_PUBLIC_HOST = "resonancenexus.netlify.app";

export type HostGate = {
  publicHost: boolean;
  countsAsProductionProof: false;
  note: "canonical_public_host" | "unknown_host";
};

export function classifyDeploymentTarget(url: string): HostGate {
  const host = hostname(url);
  const publicHost = host === CANONICAL_PUBLIC_HOST;
  return {
    publicHost,
    countsAsProductionProof: false,
    note: publicHost ? "canonical_public_host" : "unknown_host",
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
