import type { NexusSkill } from "../nexus/types";

/**
 * Built-in skills are planning inputs, not executable code and not authority.
 * Each one names capability requirements the graph already understands.
 * A skill stays non-composable until those requirements resolve to a capability
 * this deployment can actually run.
 */
export const BUILTIN_SKILLS: readonly NexusSkill[] = [
  {
    id: "resonance.observe.repository",
    name: "Observe repository",
    namespace: "resonance.observe",
    version: "1.0.0",
    description: "Read repository metadata through a forge adapter that is actually bound. Registration is not authorization.",
    tags: ["observe", "repository"],
    requirements: [{ key: "github.repository.read", requiredPermissions: ["read"], maxRisk: "low" }],
    compositionHints: ["Direct execution when the bound capability is low risk and does not require approval."],
    trust: { source: "builtin", publisher: "resonance", validation: "verified", policyStatus: "pending" },
  },
  {
    id: "resonance.observe.issue",
    name: "Observe issue",
    namespace: "resonance.observe",
    version: "1.0.0",
    description: "Read one issue through a tracker adapter that is actually bound.",
    tags: ["observe", "issues"],
    requirements: [{ key: "linear.issue.read", requiredPermissions: ["read"], maxRisk: "low" }],
    compositionHints: ["Direct execution when the bound capability is low risk and does not require approval."],
    trust: { source: "builtin", publisher: "resonance", validation: "verified", policyStatus: "pending" },
  },
  {
    id: "resonance.govern.review",
    name: "Governed review",
    namespace: "resonance.govern",
    version: "1.0.0",
    description: "Plans a review only when a review capability is registered and executable. It does not invent an adapter.",
    tags: ["govern", "review"],
    requirements: [{ key: "skill.code-review" }],
    compositionHints: ["Non-composable while the review capability is only a catalog descriptor."],
    trust: { source: "builtin", publisher: "resonance", validation: "unverified", policyStatus: "pending" },
  },
];
