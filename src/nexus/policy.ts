import type { CapabilityLevel } from "../domain/types";
import type { NexusCapability } from "./types";

const rank: Record<CapabilityLevel, number> = { read: 0, analyze: 1, modify: 2, execute: 3, commit: 4, create_pr: 5, merge: 6, deploy: 7, admin: 8 };

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
    let highest: CapabilityLevel = "read";
    for (const permission of capability.requiredPermissions) {
      if (!Object.prototype.hasOwnProperty.call(rank, permission)) {
        return { allowed: false, requiresApproval: false, reason: `Capability declares unsupported permission: ${permission}.` };
      }
      const current = rank[permission as CapabilityLevel];
      if (current > rank[highest]) highest = permission as CapabilityLevel;
    }
    if (capability.risk === "critical" || rank[highest] >= rank[this.approvalThreshold]) {
      return { allowed: true, requiresApproval: true, reason: "Capability requires explicit approval." };
    }
    return { allowed: true, requiresApproval: false };
  }
}
