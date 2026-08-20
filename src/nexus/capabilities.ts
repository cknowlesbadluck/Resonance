import type { CapabilityRequirement, CapabilityRisk, NexusCapability } from "./types";

const riskRank: Record<CapabilityRisk, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const availabilityRank: Record<NonNullable<NexusCapability["availability"]>, number> = {
  available: 0,
  degraded: 1,
  unavailable: 2,
  planned: 3,
};

export function capabilityMatches(capability: NexusCapability, requirement: CapabilityRequirement): boolean {
  if (capability.key !== requirement.key) return false;
  if (requirement.resourceType && capability.resourceType !== requirement.resourceType) return false;
  if (requirement.preferredProviderIds?.length && !requirement.preferredProviderIds.includes(capability.providerId ?? "")) return false;
  if (requirement.maxRisk && riskRank[capability.risk] > riskRank[requirement.maxRisk]) return false;
  if (requirement.requiredPermissions?.some((p) => !capability.requiredPermissions.includes(p))) return false;
  if (requirement.tags?.some((tag) => !capability.tags?.includes(tag))) return false;
  return capability.availability !== "unavailable" && capability.availability !== "planned";
}

export function sortCapabilities(candidates: NexusCapability[]): NexusCapability[] {
  return [...candidates].sort((a, b) => {
    const availability = availabilityRank[a.availability ?? "available"] - availabilityRank[b.availability ?? "available"];
    if (availability) return availability;
    const risk = riskRank[a.risk] - riskRank[b.risk];
    if (risk) return risk;
    const cost = (a.cost ?? Number.POSITIVE_INFINITY) - (b.cost ?? Number.POSITIVE_INFINITY);
    if (cost) return cost;
    const latency = (a.latencyMs ?? Number.POSITIVE_INFINITY) - (b.latencyMs ?? Number.POSITIVE_INFINITY);
    if (latency) return latency;
    return (a.providerId ?? "").localeCompare(b.providerId ?? "");
  });
}
