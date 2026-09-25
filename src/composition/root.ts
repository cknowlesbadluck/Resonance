import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "../../lib/nexus-catalog";
import type { AdapterBinding, CatalogEntry } from "../nexus/capability-bridge";
import { composeNexusIntent, nexusAdapters, nexusRegistry } from "../nexus/runtime";
import type { NexusCapability, NexusCapabilityResolution, NexusIntent } from "../nexus/types";

/**
 * Composition root.
 *
 * `src/nexus/*` is the core and imports nothing outward. `lib/*` holds the capability
 * catalog. This module is the one place allowed to know about both, and it is what the
 * HTTP layer imports.
 *
 * Executability is derived from what adapters actually *declare*, not from a provider
 * name match. An earlier cut of this file bound `tool.github` to the GitHub adapter
 * because their provider slugs matched, which made the capability composable — and then
 * guaranteed to fail at invoke with `unsupported_capability`, because the adapter only
 * declares `github.repository.read`. That is the same "advertised but not executable"
 * defect this module exists to remove, one layer deeper.
 *
 * The catalog's provider-level entries (`tool.github`, `tool.linear`) are *descriptors*,
 * not invocable operations. They are reported as non-executable and point at the
 * concrete capabilities their provider does expose.
 */

/** Normalizes a provider display name to a candidate adapter id ("Brainbase MCP" → "brainbase-mcp"). */
function providerSlug(provider: string): string {
  return provider.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface AdapterSurface {
  /** capability id → adapter id, for every capability an adapter actually declares. */
  invocable: Map<string, string>;
  /** adapter id → the capability ids it declares, for actionable error messages. */
  byAdapter: Map<string, string[]>;
  /** declared capabilities, so the registry advertises exactly what can be invoked. */
  capabilities: NexusCapability[];
}

let surfacePromise: Promise<AdapterSurface> | null = null;

async function adapterSurface(): Promise<AdapterSurface> {
  surfacePromise ??= (async () => {
    const invocable = new Map<string, string>();
    const byAdapter = new Map<string, string[]>();
    const capabilities: NexusCapability[] = [];

    const descriptions = await Promise.all(
      nexusAdapters.map(async (adapter) => ({ adapter, description: await adapter.describe() })),
    );

    for (const { adapter, description } of descriptions) {
      const ids: string[] = [];
      for (const capability of description.capabilities) {
        invocable.set(capability.id, adapter.id);
        if (capability.key !== capability.id) invocable.set(capability.key, adapter.id);
        ids.push(capability.id);
        capabilities.push({ ...capability, adapterId: capability.adapterId ?? adapter.id, executable: true });
      }
      byAdapter.set(adapter.id, ids);
    }

    return { invocable, byAdapter, capabilities };
  })();
  return surfacePromise;
}

/** Test seam: forget the memoized adapter surface. */
export function resetCompositionRoot(): void {
  surfacePromise = null;
  registered = null;
}

/**
 * Binds a catalog entry to an adapter only when that adapter declares a capability with
 * the entry's id. Everything else is reported as non-executable, with a reason that says
 * what *is* available from the provider.
 */
function makeAdapterBinding(surface: AdapterSurface): AdapterBinding {
  return (entry: CatalogEntry) => surface.invocable.get(entry.id);
}

function unexecutableReason(entry: CatalogEntry, surface: AdapterSurface): string {
  const slug = providerSlug(entry.provider);
  const concrete = surface.byAdapter.get(slug);
  if (concrete?.length) {
    return `"${entry.id}" describes the ${entry.provider} provider rather than a single operation. Invocable capabilities from this provider: ${concrete.join(", ")}.`;
  }
  return `No adapter is bound to provider "${entry.provider}" in this deployment.`;
}

/** Minimal CatalogEntry view of an already-mapped capability, for reason rendering. */
function entryOf(capability: NexusCapability): CatalogEntry {
  return {
    id: capability.id,
    name: capability.name,
    kind: String(capability.kind ?? "other"),
    provider: capability.providerId ?? "",
  };
}

function withReason(capability: NexusCapability, entry: CatalogEntry, surface: AdapterSurface): NexusCapability {
  if (capability.executable) return capability;
  return { ...capability, unexecutableReason: unexecutableReason(entry, surface) };
}

/** Catalog capabilities mapped onto the Nexus contract, with real executability. */
export async function catalogCapabilities(): Promise<NexusCapability[]> {
  const surface = await adapterSurface();
  const binding = makeAdapterBinding(surface);
  return listNexusCapabilitiesFromCatalog(binding).map((capability) => withReason(capability, entryOf(capability), surface));
}

export async function resolveCatalogCapabilities(requested: string[]): Promise<NexusCapabilityResolution> {
  const surface = await adapterSurface();
  const binding = makeAdapterBinding(surface);
  const resolution = resolveNexusCapabilities(requested, binding);
  return {
    ...resolution,
    resolved: resolution.resolved.map((capability) => withReason(capability, entryOf(capability), surface)),
  };
}

let registered: Promise<void> | null = null;

/**
 * Registers adapter-declared and catalog capabilities with the runtime registry exactly
 * once. Adapter-declared capabilities win on id collision — they are the ones that can
 * actually be invoked.
 */
export function ensureNexusReady(): Promise<void> {
  registered ??= (async () => {
    const surface = await adapterSurface();
    for (const capability of surface.capabilities) nexusRegistry.register(capability);

    const runtimeIds = new Set(nexusRegistry.list().map((capability) => capability.id));
    for (const capability of await catalogCapabilities()) {
      if (runtimeIds.has(capability.id)) continue;
      nexusRegistry.register(capability);
    }
  })();
  return registered;
}

/** The capability set the control plane advertises. */
export async function listAdvertisedCapabilities(): Promise<NexusCapability[]> {
  await ensureNexusReady();
  return nexusRegistry.list();
}

/** Compose an intent against the fully-wired registry. */
export async function composeIntentWithCatalog(intent: NexusIntent) {
  await ensureNexusReady();
  return composeNexusIntent(intent);
}
