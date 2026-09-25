import { capabilityMatches, sortCapabilities } from "./capabilities";
import { normalizeGrants } from "./grants";
import type { CapabilityRegistry } from "./registry";
import type { NexusAdapter } from "./adapters/types";
import type { CapabilityRequirement, NexusCapability, NexusIntent, NexusExecutionPlan } from "./types";
import type { NexusPolicy } from "./policy";

/**
 * Explains why a registered capability failed to satisfy a requirement.
 * Composition used to collapse every failure into "No compatible capability for <key>",
 * which was indistinguishable from "that capability does not exist" and gave callers
 * nothing to act on.
 */
function rejectionReason(capability: NexusCapability, requirement: CapabilityRequirement): string {
  if (capability.availability === "unavailable" || capability.availability === "planned") {
    return `it is marked ${capability.availability}`;
  }
  if (requirement.resourceType && capability.resourceType !== requirement.resourceType) {
    return `it exposes resourceType "${capability.resourceType ?? "none"}", not "${requirement.resourceType}"`;
  }
  if (requirement.preferredProviderIds?.length && !requirement.preferredProviderIds.includes(capability.providerId ?? "")) {
    return `its provider "${capability.providerId ?? "none"}" is not among the preferred providers`;
  }
  if (requirement.maxRisk) {
    return `its risk "${capability.risk}" exceeds the requested maximum "${requirement.maxRisk}"`;
  }
  const missingGrants = requirement.requiredPermissions?.filter((p) => !capability.requiredPermissions.includes(p)) ?? [];
  if (missingGrants.length) return `it does not declare the required grant(s): ${missingGrants.join(", ")}`;
  const missingTags = requirement.tags?.filter((tag) => !capability.tags?.includes(tag)) ?? [];
  if (missingTags.length) return `it is missing the required tag(s): ${missingTags.join(", ")}`;
  return "it did not satisfy the requirement";
}

export class CompositionError extends Error {
  constructor(message: string, readonly requirementKey: string, readonly code: CompositionErrorCode) {
    super(message);
    this.name = "CompositionError";
  }
}

export type CompositionErrorCode =
  | "capability_not_registered"
  | "capability_filtered"
  | "capability_denied"
  | "adapter_unbound";

export function composeIntent(intent: NexusIntent, registry: CapabilityRegistry, policy: NexusPolicy, adapters: NexusAdapter[]): NexusExecutionPlan {
  const all = registry.list();

  const steps = intent.requirements.map((requirement, index) => {
    const sameKey = all.filter((capability) => capability.key === requirement.key);
    if (!sameKey.length) {
      throw new CompositionError(
        `No capability is registered for "${requirement.key}".`,
        requirement.key,
        "capability_not_registered",
      );
    }

    const candidates = sortCapabilities(sameKey.filter((capability) => capabilityMatches(capability, requirement)));
    if (!candidates.length) {
      const reasons = sameKey.map((capability) => `${capability.id}: ${rejectionReason(capability, requirement)}`);
      throw new CompositionError(
        `Capability "${requirement.key}" is registered but unusable — ${reasons.join("; ")}.`,
        requirement.key,
        "capability_filtered",
      );
    }

    const selected = candidates[0];

    // Policy is evaluated before adapter binding so that governance reasons — including
    // "no adapter is bound to provider X" — surface ahead of a generic lookup miss.
    const decision = policy.evaluate(intent.requestedBy, selected);
    if (!decision.allowed) {
      throw new CompositionError(
        decision.reason ?? `Capability ${selected.id} denied by policy.`,
        requirement.key,
        "capability_denied",
      );
    }

    const adapter = adapters.find((item) => item.id === selected.adapterId || item.id === selected.providerId);
    if (!adapter) {
      throw new CompositionError(
        `Capability ${selected.id} is registered but adapter "${selected.adapterId ?? selected.providerId ?? "unknown"}" is not available in this deployment.`,
        requirement.key,
        "adapter_unbound",
      );
    }

    return {
      id: `${intent.id}-step-${index}`,
      capabilityId: selected.id,
      adapterId: adapter.id,
      input: intent.metadata?.input ?? {},
      requiresApproval: decision.requiresApproval,
    };
  });

  const approvalRequired = steps.some((step) => step.requiresApproval);
  const grantSummary = normalizeGrants(
    steps.flatMap((step) => all.find((c) => c.id === step.capabilityId)?.requiredPermissions ?? []),
  );

  return {
    id: crypto.randomUUID(),
    intentId: intent.id,
    projectId: intent.projectId,
    actorId: intent.requestedBy,
    mode: steps.length > 1 ? "chamber" : "direct",
    steps,
    contextRefs: intent.contextRefs ?? [],
    approvalRequired,
    rationale: [
      `Matched ${steps.length} provider-neutral capability requirement(s).`,
      `Highest authority requested: ${grantSummary.highest}.`,
    ],
    retry: { maxAttempts: 2, backoffMs: 250 },
  };
}
