import { dissolveChamber, type Chamber } from "./chamber";

/**
 * Fail-closed dissolve.
 * A watch chamber observes. It does not dissolve.
 * A dissonance block may dissolve and must leave an audit token.
 * This does not claim production proof and does not touch persistence.
 */

export type ChamberWatch = "work" | "watch";

export type GuardedDissolveReason = "success" | "dissonance" | "policy" | "cancelled";

export type DissolveDecision = {
  allowed: boolean;
  chamber: Chamber;
  audit: string | null;
  refusal: string | null;
};

export function dissolveGuarded(
  chamber: Chamber,
  watch: ChamberWatch,
  reason: GuardedDissolveReason,
): DissolveDecision {
  if (chamber.status === "dissolved") {
    return { allowed: false, chamber, audit: null, refusal: "already_dissolved" };
  }
  if (watch === "watch") {
    return { allowed: false, chamber, audit: null, refusal: "watch_cannot_dissolve" };
  }
  const dissolved = dissolveChamber(chamber);
  return {
    allowed: true,
    chamber: dissolved,
    audit: `chamber.dissolved:${reason}`,
    refusal: null,
  };
}
