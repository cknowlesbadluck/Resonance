import { capabilityMatches, sortCapabilities } from "./capabilities";
import type { CapabilityRegistry } from "./registry";
import type { NexusAdapter } from "./adapters/types";
import type { NexusIntent, NexusExecutionPlan } from "./types";
import type { NexusPolicy } from "./policy";

export function composeIntent(intent: NexusIntent, registry: CapabilityRegistry, policy: NexusPolicy, adapters: NexusAdapter[]): NexusExecutionPlan {
  const steps = intent.requirements.map((requirement, index) => {
    const candidates = sortCapabilities(registry.list().filter((capability) => capabilityMatches(capability, requirement)));
    if (!candidates.length) throw new Error(`No compatible capability for ${requirement.key}`);
    const selected = candidates[0];
    const adapter = adapters.find((item) => item.id === selected.adapterId || item.id === selected.providerId);
    if (!adapter) throw new Error(`No adapter for capability ${selected.id}`);
    const decision = policy.evaluate(intent.requestedBy, selected);
    if (!decision.allowed) throw new Error(decision.reason ?? `Capability ${selected.id} denied by policy`);
    return { id: `${intent.id}-step-${index}`, capabilityId: selected.id, adapterId: adapter.id, input: {}, requiresApproval: decision.requiresApproval };
  });
  const approvalRequired = steps.some((step) => step.requiresApproval);
  return { id: crypto.randomUUID(), intentId: intent.id, actorId: intent.requestedBy, mode: steps.length > 1 ? "chamber" : "direct", steps, contextRefs: intent.contextRefs ?? [], approvalRequired, rationale: [`Matched ${steps.length} provider-neutral capability requirement(s).`] };
}
