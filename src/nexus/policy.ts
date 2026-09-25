import type { CapabilityLevel } from "../domain/types";
import { capabilityLevelRank as rank, normalizeGrants } from "./grants";
import type { NexusCapability } from "./types";

export interface NexusPolicyDecision { allowed: boolean; requiresApproval: boolean; reason?: string; }
export interface NexusPolicy { evaluate(actorId: string, capability: NexusCapability): NexusPolicyDecision; }

export class DefaultNexusPolicy implements NexusPolicy {
  constructor(private readonly approvalThreshold: CapabilityLevel = "execute") {}

  evaluate(actorId: string, capability: NexusCapability): NexusPolicyDecision {
    if (!actorId?.trim()) return { allowed: false, requiresApproval: false, reason: "Missing actor." };
    if (capability.availability === "unavailable" || capability.availability === "planned") {
      return { allowed: false, requiresApproval: false, reason: `Capability ${capability.id} is ${capability.availability}.` };
    }
    if (capability.tags?.includes("blocked")) {
      return { allowed: false, requiresApproval: false, reason: "Capability is blocked by policy." };
    }
    // A capability this deployment has no adapter for must never reach an executor.
    if (capability.executable === false) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: capability.unexecutableReason ?? `Capability ${capability.id} has no bound adapter in this deployment.`,
      };
    }

    // Fail closed on grants the policy cannot interpret — normalization widens
    // understanding, not permission.
    const { unrecognized, highest } = normalizeGrants(capability.requiredPermissions);
    if (unrecognized.length > 0) {
      return { allowed: false, requiresApproval: false, reason: `Capability declares unsupported permission: ${unrecognized[0]}.` };
    }

    if (capability.risk === "critical" || rank[highest] >= rank[this.approvalThreshold]) {
      return { allowed: true, requiresApproval: true, reason: "Capability requires explicit approval." };
    }
    return { allowed: true, requiresApproval: false };
  }
}
