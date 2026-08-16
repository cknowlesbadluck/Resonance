import type { CapabilityLevel } from "../domain/types";
import type { NexusCapability } from "./types";

const rank: Record<CapabilityLevel, number> = { read: 0, analyze: 1, modify: 2, execute: 3, commit: 4, create_pr: 5, merge: 6, deploy: 7, admin: 8 };

export interface NexusPolicyDecision { allowed: boolean; requiresApproval: boolean; reason?: string; }
export interface NexusPolicy { evaluate(actorId: string, capability: NexusCapability): NexusPolicyDecision; }

export class DefaultNexusPolicy implements NexusPolicy {
  constructor(private readonly approvalThreshold: CapabilityLevel = "execute") {}
  evaluate(_actorId: string, capability: NexusCapability): NexusPolicyDecision {
    const highest = capability.requiredPermissions.reduce<CapabilityLevel>((max, permission) => rank[permission as CapabilityLevel] > rank[max] ? permission as CapabilityLevel : max, "read");
    if (capability.risk === "critical" || rank[highest] >= rank[this.approvalThreshold]) return { allowed: true, requiresApproval: true, reason: "Capability requires explicit approval." };
    return { allowed: true, requiresApproval: false };
  }
}
