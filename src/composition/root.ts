import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "../../lib/nexus-catalog";
import type { AdapterBinding, CatalogEntry } from "../nexus/capability-bridge";
import { composeNexusIntent, nexusAdapters, nexusRegistry } from "../nexus/runtime";
import type { NexusCapability, NexusCapabilityResolution, NexusIntent } from "../nexus/types";

/**
 * Composition root.
 *
 * `src/nexus/*` is the core and imports nothing outward. `lib/*` holds the capability
 * catalog. This module is the one place allowed to know about both, and it is what the
 * HTTP layer imports. Keeping the wiring here is what lets the core stay provider- and
 * fixture-neutral.
 *
 * It also closes the P2 gap: catalog capabilities are now *registered* with the runtime
 * registry, so `composeIntent` can resolve them, instead of being advertised on the
 * discovery endpoint and then failing with "No compatible capability" at compose time.
 */

/** Normalizes a provider display name to a candidate adapter id ("Brainbase MCP" → "brainbase-mcp"). */
function providerSlug(provider: string): string {
  return provider.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Binds a catalog entry to an adapter that can actually invoke it.
 * Unbound entries are surfaced as `executable: false` with a reason rather than
 * silently advertised as runnable.
 */
export function makeAdapterBinding(adapterIds: readonly string[]): AdapterBinding {
  const ids = new Set(adapterIds);
  return (entry: CatalogEntry) => {
    const slug = providerSlug(entry.provider);
    if (ids.has(slug)) return slug;
    // `tool.github` / `integration.github` both route to the `github` adapter.
    const leaf = entry.id.split(".").pop() ?? "";
    if (ids.has(leaf)) return leaf;
    return undefined;
  };
}

export const adapterBinding: AdapterBinding = makeAdapterBinding(nexusAdapters.map((adapter) => adapter.id));

/** Catalog capabilities mapped onto the Nexus contract, with real executability. */
export function catalogCapabilities(): NexusCapability[] {
  return listNexusCapabilitiesFromCatalog(adapterBinding);
}

export function resolveCatalogCapabilities(requested: string[]): NexusCapabilityResolution {
  return resolveNexusCapabilities(requested, adapterBinding);
}

let registered = false;

/**
 * Registers catalog capabilities with the runtime registry exactly once.
 * Runtime-native capabilities win on id collision — they are the ones with a
 * first-class adapter and a verified contract.
 */
export function ensureCatalogRegistered(): void {
  if (registered) return;
  registered = true;
  const runtimeIds = new Set(nexusRegistry.list().map((capability) => capability.id));
  for (const capability of catalogCapabilities()) {
    if (runtimeIds.has(capability.id)) continue;
    nexusRegistry.register(capability);
  }
}

/** The capability set the control plane should advertise: runtime-native first, then catalog. */
export function listAdvertisedCapabilities(): NexusCapability[] {
  ensureCatalogRegistered();
  return nexusRegistry.list();
}

/** Compose an intent against the fully-wired registry. */
export function composeIntentWithCatalog(intent: NexusIntent) {
  ensureCatalogRegistered();
  return composeNexusIntent(intent);
}
