import type { CapabilityRequirement, CapabilityRisk, NexusCapability } from "./types";

const riskRank: Record<CapabilityRisk, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function capabilityMatches(capability: NexusCapability, requirement: CapabilityRequirement): boolean {
  if (capability.key !== requirement.key) return false;
  if (requirement.resourceType && capability.resourceType !== requirement.resourceType) return false;
  if (requirement.preferredProviderIds?.length && !requirement.preferredProviderIds.includes(capability.providerId ?? "")) return false;
  if (requirement.maxRisk && riskRank[capability.risk] > riskRank[requirement.maxRisk]) return false;
  if (requirement.requiredPermissions?.some((p) => !capability.requiredPermissions.includes(p))) return false;
  if (requirement.tags?.some((tag) => !capability.tags?.includes(tag))) return false;
  return capability.availability !== "unavailable";
}

export function sortCapabilities(candidates: NexusCapability[]): NexusCapability[] {
  return [...candidates].sort((a, b) => riskRank[a.risk] - riskRank[b.risk] || (a.providerId ?? "").localeCompare(b.providerId ?? ""));
}
