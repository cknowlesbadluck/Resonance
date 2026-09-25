import { riskForGrants } from "./grants";
import type { CapabilityKind, NexusCapability } from "./types";

/**
 * Catalog → Nexus capability mapping.
 *
 * This module deliberately imports nothing from `lib/`. The Nexus core owns the
 * capability contract; outer layers adapt *into* it. The concrete catalog-backed
 * source lives in `lib/nexus-catalog.ts`, which depends on this file and not the
 * other way round.
 */

/** Structural port for any catalog-shaped capability source. */
export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  kind: string;
  provider: string;
  version?: string;
  status?: "available" | "degraded" | "unavailable" | "planned";
  permissions?: string[];
  dependencies?: { id: string; kind?: string; optional?: boolean }[];
  tags?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/**
 * Resolves the adapter that can actually invoke a capability from a given provider.
 * Returns `undefined` when this deployment has no adapter bound.
 */
export type AdapterBinding = (entry: CatalogEntry) => string | undefined;

export const noAdapterBinding: AdapterBinding = () => undefined;

/** Map a catalog entry onto the canonical NexusCapability contract. */
export function catalogEntryToNexus(entry: CatalogEntry, bindAdapter: AdapterBinding = noAdapterBinding): NexusCapability {
  const kind = entry.kind as CapabilityKind;
  const permissions = entry.permissions ?? [];
  const adapterId = bindAdapter(entry);

  return {
    id: entry.id,
    key: entry.id,
    name: entry.name,
    description: entry.description,
    providerId: entry.provider,
    adapterId,
    kind,
    requiredPermissions: permissions,
    // Risk is derived from declared authority rather than stamped as a constant,
    // so policy decisions are made against real inputs.
    risk: riskForGrants(permissions),
    inputSchema: entry.inputSchema,
    outputSchema: entry.outputSchema,
    tags: [...(entry.tags ?? []), `kind:${kind}`],
    availability: entry.status,
    version: entry.version,
    dependencies: (entry.dependencies ?? []).map((d) => ({
      capabilityKey: d.id,
      kind: d.kind as CapabilityKind | undefined,
      optional: d.optional,
    })),
    provenance: "catalog",
    executable: Boolean(adapterId),
    unexecutableReason: adapterId
      ? undefined
      : `No adapter is bound to provider "${entry.provider}" in this deployment.`,
  };
}

/** @deprecated Use `catalogEntryToNexus`. Retained for one release for callers still on the old name. */
export const catalogToNexus = catalogEntryToNexus;
