/**
 * Capability Policy Gate
 * Every Chamber mutation and provider execution must pass through here.
 */

import type { CapabilityLevel } from "../domain/types";
import type { PolicyGate } from "../chambers/runtime";

export type PolicyDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
  evaluatedLevel?: CapabilityLevel;
};

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
    if (!params.actorId || !params.projectId) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "Missing actor or project",
      };
    }

    const criticalActions = new Set([
      "deploy",
      "merge",
      "commit",
      "create_pr",
      "admin",
      "chamber.dissolve.force",
    ]);

    if (criticalActions.has(params.action) || params.requiredLevel === "admin") {
      return {
        allowed: true,
        requiresApproval: true,
        reason: "Privileged action requires human approval",
        evaluatedLevel: params.requiredLevel,
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      evaluatedLevel: params.requiredLevel,
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
