import type { CapabilityKind, NexusCapability, NexusCapabilityResolution } from "./types";
import {
  listCapabilities as listCatalog,
  resolveCapabilities as resolveCatalog,
  type Capability,
} from "../../lib/capabilities";

const DEFAULT_RISK: NexusCapability["risk"] = "medium";

/** Map catalog Capability → canonical NexusCapability (single domain model). */
export function catalogToNexus(capability: Capability): NexusCapability {
  const kind = capability.kind as CapabilityKind;
  return {
    id: capability.id,
    key: capability.id,
    name: capability.name,
    description: capability.description,
    providerId: capability.provider,
    kind,
    requiredPermissions: capability.permissions ?? [],
    risk: DEFAULT_RISK,
    inputSchema: capability.inputSchema,
    outputSchema: capability.outputSchema,
    tags: [...(capability.tags ?? []), `kind:${kind}`],
    availability: capability.status,
    version: capability.version,
    dependencies: (capability.dependencies ?? []).map((d) => ({
      capabilityKey: d.id,
      kind: d.kind as CapabilityKind,
      optional: d.optional,
    })),
  };
}

export function listNexusCapabilitiesFromCatalog(): NexusCapability[] {
  return listCatalog().map(catalogToNexus);
}

export function resolveNexusCapabilities(requested: string[]): NexusCapabilityResolution {
  const result = resolveCatalog(requested);
  return {
    requested: result.requested,
    resolved: result.resolved.map(catalogToNexus),
    missing: result.missing,
    unavailable: result.unavailable,
  };
}
