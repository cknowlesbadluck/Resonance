import { capabilityMatches, sortCapabilities } from "./capabilities";
import type {
  CapabilityRequirement,
  NexusCapability,
  NexusSkill,
  SkillDiscoveryFilter,
  SkillRequirementResolution,
  SkillResolution,
} from "./types";
import type { NexusPolicy, NexusPolicyDecision } from "./policy";

export interface SkillRegistry {
  register(skill: NexusSkill): void;
  get(id: string): NexusSkill | undefined;
  discover(filter?: SkillDiscoveryFilter): NexusSkill[];
  remove(id: string): boolean;
}

export function validateSkill(skill: NexusSkill): string[] {
  const errors: string[] = [];
  if (!skill.id?.trim()) errors.push("Skill id is required.");
  if (!skill.name?.trim()) errors.push("Skill name is required.");
  if (!skill.namespace?.trim()) errors.push("Skill namespace is required.");
  if (!skill.version?.trim()) errors.push("Skill version is required.");
  if (!Array.isArray(skill.requirements)) errors.push("Skill requirements must be an array.");
  return errors;
}

export class InMemorySkillRegistry implements SkillRegistry {
  private readonly skills = new Map<string, NexusSkill>();

  register(skill: NexusSkill): void {
    const errors = validateSkill(skill);
    if (errors.length) throw new Error(`Invalid skill: ${errors.join(" ")}`);
    if (this.skills.has(skill.id)) throw new Error(`Skill ${skill.id} is already registered.`);
    this.skills.set(skill.id, structuredClone(skill));
  }

  get(id: string): NexusSkill | undefined {
    const skill = this.skills.get(id);
    return skill ? structuredClone(skill) : undefined;
  }

  discover(filter: SkillDiscoveryFilter = {}): NexusSkill[] {
    const query = filter.query?.trim().toLowerCase();
    const result = [...this.skills.values()].filter((skill) => {
      if (filter.namespace && skill.namespace !== filter.namespace) return false;
      if (filter.tags?.some((tag) => !skill.tags?.includes(tag))) return false;
      if (query && !`${skill.name} ${skill.description ?? ""} ${skill.id}`.toLowerCase().includes(query)) return false;
      return true;
    });
    return result
      .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
      .map((skill) => structuredClone(skill));
  }

  remove(id: string): boolean {
    return this.skills.delete(id);
  }
}

function resolveRequirement(
  requirement: CapabilityRequirement,
  capabilities: NexusCapability[],
  policy: NexusPolicy,
  actorId: string,
): SkillRequirementResolution {
  const candidates = sortCapabilities(capabilities.filter((capability) => capabilityMatches(capability, requirement)));
  if (!candidates.length) return { requirement, missing: true };

  const decisions = candidates.map((capability) => ({ capability, decision: policy.evaluate(actorId, capability) }));
  const permitted = decisions.find(({ decision }) => decision.allowed);
  if (!permitted) {
    return {
      requirement,
      missing: false,
      denied: true,
      policyReasons: decisions.map(({ capability, decision }) => `${capability.id}: ${decision.reason ?? "Denied by policy."}`),
    };
  }

  return {
    requirement,
    capability: permitted.capability,
    missing: false,
    denied: false,
    requiresApproval: permitted.decision.requiresApproval,
    policyReason: permitted.decision.reason,
  };
}

export function resolveSkill(
  skill: NexusSkill,
  capabilities: NexusCapability[],
  policy: NexusPolicy,
  actorId: string,
): SkillResolution {
  const requirements = skill.requirements.map((requirement) => resolveRequirement(requirement, capabilities, policy, actorId));
  const unresolved = requirements.filter((result) => result.missing || result.denied);
  const approvalRequired = requirements.some((result) => result.requiresApproval);
  return {
    skill,
    requirements,
    composable: unresolved.length === 0,
    approvalRequired,
    missing: unresolved.filter((result) => result.missing).map((result) => result.requirement.key),
    denied: unresolved.filter((result) => result.denied).map((result) => result.requirement.key),
  };
}
