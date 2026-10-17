import { capabilityLevelRank as rank, normalizeGrants } from "./grants";
import type { NexusPolicy } from "./policy";
import type { NexusCapability } from "./types";

/**
 * Policy dry-run: explain what the policy would decide for one capability, without executing anything.
 * The decision itself always comes from `policy.evaluate` (the single source of truth). The checks list
 * just shows which gates passed, so a client can see *why* before composing an intent.
 */
export type ExplainDecision = "allow" | "approval_required" | "deny";
export type ExplainCheck = { check: "actor" | "availability" | "not_blocked" | "adapter_bound" | "permissions_recognized" | "approval_threshold"; passed: boolean; detail?: string };
export type PolicyExplanation = {
  capabilityId: string;
  decision: ExplainDecision;
  reason: string | null;
  checks: ExplainCheck[];
  risk: NexusCapability["risk"] | null;
  requiredPermissions: string[];
  dryRun: true;
};

export const CAPABILITY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
/** Project ids are UUIDs in Supabase; accept any short id-shaped token so malformed input is rejected before auth. */
export const PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function explainCapability(policy: NexusPolicy, actorId: string, capability: NexusCapability, approvalThreshold: keyof typeof rank = "execute"): PolicyExplanation {
  const decision = policy.evaluate(actorId, capability);
  const { unrecognized, highest } = normalizeGrants(capability.requiredPermissions);
  const unavailable = capability.availability === "unavailable" || capability.availability === "planned";
  const checks: ExplainCheck[] = [
    { check: "actor", passed: Boolean(actorId?.trim()) },
    { check: "availability", passed: !unavailable, ...(unavailable ? { detail: capability.availability } : {}) },
    { check: "not_blocked", passed: !capability.tags?.includes("blocked") },
    { check: "adapter_bound", passed: capability.executable !== false, ...(capability.executable === false && capability.unexecutableReason ? { detail: capability.unexecutableReason } : {}) },
    { check: "permissions_recognized", passed: unrecognized.length === 0, ...(unrecognized.length ? { detail: unrecognized.slice(0, 5).join(",") } : {}) },
    // "passed" means "no approval needed". When the policy reached its approval step (allowed), the check is
    // taken from the policy's own result so it can never disagree with `decision`, whatever threshold the
    // policy was built with. When the policy denied earlier, it is a local estimate and is labelled as such.
    {
      check: "approval_threshold",
      passed: decision.allowed ? !decision.requiresApproval : !(capability.risk === "critical" || rank[highest] >= rank[approvalThreshold]),
      detail: `highest=${highest}${decision.allowed ? "" : ` estimated_threshold=${approvalThreshold}`}${capability.risk === "critical" ? " risk=critical" : ""}`,
    },
  ];
  return {
    capabilityId: capability.id,
    decision: !decision.allowed ? "deny" : decision.requiresApproval ? "approval_required" : "allow",
    reason: decision.reason ?? null,
    checks,
    risk: capability.risk ?? null,
    // Every declared permission (policy evaluates the full list, so the explanation must too).
    requiredPermissions: (capability.requiredPermissions ?? []).map(String),
    dryRun: true,
  };
}
