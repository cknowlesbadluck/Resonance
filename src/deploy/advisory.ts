/**
 * Separates production ready blockers from optional adapter gaps.
 * Presence names only. Never accept or return secret values.
 */
export type AdvisoryGap = {
  key: string;
  required: false;
  reason: string;
};

export type ReadinessClass = {
  blocking: string[];
  advisory: AdvisoryGap[];
  ownerBlocked: boolean;
  agentBlocked: boolean;
};

const OWNER_ONLY_KEYS = new Set(["SUPABASE_SERVICE_ROLE_KEY"]);

export function classifyReadiness(input: {
  missingRequired: readonly string[];
  githubAdapterConfigured: boolean;
}): ReadinessClass {
  const blocking = [...input.missingRequired];
  const advisory: AdvisoryGap[] = [];
  if (!input.githubAdapterConfigured && !blocking.includes("GITHUB_TOKEN")) {
    advisory.push({
      key: "GITHUB_TOKEN",
      required: false,
      reason: "GitHub adapter is optional. Absence is not a ready blocker.",
    });
  }
  return {
    blocking,
    advisory,
    ownerBlocked: blocking.some((key) => OWNER_ONLY_KEYS.has(key)),
    agentBlocked: blocking.some((key) => !OWNER_ONLY_KEYS.has(key)),
  };
}
