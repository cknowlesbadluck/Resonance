import { capabilityMatches, sortCapabilities } from "./capabilities";
import type { CapabilityRequirement, NexusCapability } from "./types";

export interface CapabilityRegistry {
  register(capability: NexusCapability): void;
  list(): NexusCapability[];
  findByCapability(requirement: CapabilityRequirement): NexusCapability[];
  findCompatible(requirement: CapabilityRequirement): NexusCapability[];
}

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly capabilities = new Map<string, NexusCapability>();
  register(capability: NexusCapability): void { this.capabilities.set(capability.id, capability); }
  list(): NexusCapability[] { return [...this.capabilities.values()]; }
  findByCapability(requirement: CapabilityRequirement): NexusCapability[] {
    return sortCapabilities(this.list().filter((capability) => capabilityMatches(capability, requirement)));
  }
  findCompatible(requirement: CapabilityRequirement): NexusCapability[] { return this.findByCapability(requirement); }
}
