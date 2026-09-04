/**
 * Capability Policy Gate
 * Every Chamber mutation and provider execution must pass through here.
 *
 * Fail-closed by default: only explicitly safe low-risk levels pass without
 * approval. Privileged / unknown actions require human approval. Missing
 * actor or project is always denied.
 */

import type { CapabilityLevel } from "../domain/types";
import type { PolicyGate } from "../chambers/runtime";

export type PolicyDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
  evaluatedLevel?: CapabilityLevel;
};

/** Levels that may proceed without human approval when actor+project are present. */
const AUTO_ALLOW_LEVELS = new Set<CapabilityLevel>(["read", "analyze"]);

const PRIVILEGED_ACTIONS = new Set([
  "deploy",
  "merge",
  "commit",
  "create_pr",
  "admin",
  "chamber.dissolve.force",
  "execute",
  "modify",
]);

export class DefaultPolicyGate implements PolicyGate {
  async evaluate(params: {
    actorId: string;
    projectId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requiredLevel: CapabilityLevel;
    context?: Record<string, unknown>;
  }): Promise<PolicyDecision> {
    // Fail closed: identity is mandatory.
    if (!params.actorId?.trim() || !params.projectId?.trim()) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "Missing actor or project",
      };
    }

    const level = params.requiredLevel;
    const action = params.action;

    // Privileged actions and high capability levels always need explicit approval.
    if (
      PRIVILEGED_ACTIONS.has(action) ||
      level === "admin" ||
      level === "deploy" ||
      level === "merge" ||
      level === "commit" ||
      level === "create_pr" ||
      level === "execute" ||
      level === "modify"
    ) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: "Privileged action requires human approval",
        evaluatedLevel: level,
      };
    }

    // Only the narrow auto-allow set proceeds without approval.
    if (AUTO_ALLOW_LEVELS.has(level)) {
      return {
        allowed: true,
        requiresApproval: false,
        evaluatedLevel: level,
      };
    }

    // Unknown or unlisted levels: fail closed with approval required so a
    // human can still green-light if intentional.
    return {
      allowed: true,
      requiresApproval: true,
      reason: "Capability level requires explicit approval (fail-closed default)",
      evaluatedLevel: level,
    };
  }
}

export async function requirePolicy(
  gate: PolicyGate,
  params: Parameters<PolicyGate["evaluate"]>[0]
): Promise<PolicyDecision> {
  const decision = await gate.evaluate(params);
  if (!decision.allowed) {
    throw new Error(`Policy denied: ${decision.reason ?? "access denied"}`);
  }
  return decision;
}
