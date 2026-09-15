import type { CapabilityLevel } from "../domain/types";
import type { CapabilityRisk } from "./types";

/**
 * Capability grant normalization.
 *
 * Resonance has carried two permission vocabularies that never met:
 *   - the *policy* vocabulary (CapabilityLevel: read | analyze | modify | execute |
 *     commit | create_pr | merge | deploy | admin), used by DefaultNexusPolicy, and
 *   - the *catalog* vocabulary (resource.action grants: repo.read, database.write,
 *     model.invoke, ...), used by every registered capability outside the demo runtime.
 *
 * Because DefaultNexusPolicy hard-denies any permission outside its rank table, every
 * catalog capability was denied by construction — advertised on /api/nexus/capabilities
 * and impossible to execute. This module is the single translation seam between the two.
 *
 * Fail-closed is preserved: a grant that cannot be normalized returns `null`, and the
 * policy denies it. Normalization widens what is *understood*, never what is *allowed*.
 */

export const capabilityLevelRank: Record<CapabilityLevel, number> = {
  read: 0,
  analyze: 1,
  modify: 2,
  execute: 3,
  commit: 4,
  create_pr: 5,
  merge: 6,
  deploy: 7,
  admin: 8,
};

const LEVELS = new Set<string>(Object.keys(capabilityLevelRank));

/**
 * Explicit overrides for grants whose action verb does not map cleanly by suffix.
 * Kept small and auditable on purpose — an opaque mapping table is a policy hazard.
 *
 * Both lookup tables are Maps rather than object literals. A plain object would
 * resolve inherited keys such as `constructor` or `toString` to truthy values and
 * silently admit them as grants — the CHR-47 prototype-pollution class of bug.
 */
const GRANT_OVERRIDES = new Map<string, CapabilityLevel>(Object.entries({
  "pr.write": "create_pr",
  "pr.merge": "merge",
  "review.write": "analyze",
  "repo.commit": "commit",
  "workflow.start": "execute",
  "agent.execute": "execute",
  "model.invoke": "execute",
  "realtime.subscribe": "read",
} as const));

/** action verb → policy level, applied to the segment after the final `.` */
const ACTION_LEVELS = new Map<string, CapabilityLevel>(Object.entries({
  read: "read",
  list: "read",
  get: "read",
  subscribe: "read",
  analyze: "analyze",
  review: "analyze",
  write: "modify",
  modify: "modify",
  update: "modify",
  create: "modify",
  delete: "modify",
  run: "execute",
  execute: "execute",
  invoke: "execute",
  start: "execute",
  call: "execute",
  commit: "commit",
  merge: "merge",
  deploy: "deploy",
  release: "deploy",
  admin: "admin",
} as const));

/**
 * Normalize a declared grant to a policy level.
 * Returns `null` when the grant cannot be understood — callers must fail closed.
 */
export function normalizeGrant(grant: string): CapabilityLevel | null {
  const raw = grant?.trim().toLowerCase();
  if (!raw) return null;
  if (LEVELS.has(raw)) return raw as CapabilityLevel;

  const override = GRANT_OVERRIDES.get(raw);
  if (override) return override;

  // Accept both `resource.action` and `resource:action` shapes.
  const separator = Math.max(raw.lastIndexOf("."), raw.lastIndexOf(":"));
  if (separator <= 0 || separator === raw.length - 1) return null;
  const action = raw.slice(separator + 1);
  return ACTION_LEVELS.get(action) ?? null;
}

export interface GrantNormalization {
  /** Grants that mapped to a policy level. */
  levels: CapabilityLevel[];
  /** Grants that could not be understood. Presence of any means deny. */
  unrecognized: string[];
  /** Highest level reached, or "read" when no grants are declared. */
  highest: CapabilityLevel;
}

export function normalizeGrants(grants: readonly string[]): GrantNormalization {
  const levels: CapabilityLevel[] = [];
  const unrecognized: string[] = [];
  let highest: CapabilityLevel = "read";

  for (const grant of grants) {
    const level = normalizeGrant(grant);
    if (!level) {
      unrecognized.push(grant);
      continue;
    }
    levels.push(level);
    if (capabilityLevelRank[level] > capabilityLevelRank[highest]) highest = level;
  }

  return { levels, unrecognized, highest };
}

/**
 * Derive risk from declared grants.
 *
 * Previously the catalog bridge stamped every capability `risk: "medium"` regardless of
 * what it could actually do, which meant policy decisions were made against fabricated
 * inputs. Risk is now a function of the authority a capability asks for.
 */
export function riskForGrants(grants: readonly string[]): CapabilityRisk {
  const { unrecognized, highest, levels } = normalizeGrants(grants);
  // An unreadable grant is the most dangerous case: treat it as critical so it surfaces.
  if (unrecognized.length > 0) return "critical";
  if (levels.length === 0) return "low";
  const rank = capabilityLevelRank[highest];
  if (rank >= capabilityLevelRank.merge) return "critical";
  if (rank >= capabilityLevelRank.execute) return "high";
  if (rank >= capabilityLevelRank.modify) return "medium";
  return "low";
}
