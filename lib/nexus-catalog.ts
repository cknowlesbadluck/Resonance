import {
  catalogEntryToNexus,
  noAdapterBinding,
  type AdapterBinding,
  type CatalogEntry,
} from "../src/nexus/capability-bridge";
import type { NexusCapability, NexusCapabilityResolution } from "../src/nexus/types";
import { listCapabilities as listCatalog, resolveCapabilities as resolveCatalog } from "./capabilities";

/**
 * Catalog-backed capability source.
 *
 * The dependency arrow points inward: this outer module depends on `src/nexus`,
 * and `src/nexus` depends on nothing here. Previously `src/nexus/capability-bridge.ts`
 * imported `lib/capabilities`, inverting the arrow and coupling the core contract to a
 * hard-coded fixture list.
 */

export function listNexusCapabilitiesFromCatalog(bindAdapter: AdapterBinding = noAdapterBinding): NexusCapability[] {
  return listCatalog().map((entry) => catalogEntryToNexus(entry as CatalogEntry, bindAdapter));
}

export function resolveNexusCapabilities(
  requested: string[],
  bindAdapter: AdapterBinding = noAdapterBinding,
): NexusCapabilityResolution {
  const result = resolveCatalog(requested);
  return {
    requested: result.requested,
    resolved: result.resolved.map((entry) => catalogEntryToNexus(entry as CatalogEntry, bindAdapter)),
    missing: result.missing,
    unavailable: result.unavailable,
  };
}
