import { isUuid } from "../auth/nexus-request";
import { DefaultNexusPolicy } from "../nexus/policy";
import { InMemorySkillRegistry, resolveSkill } from "../nexus/skills";
import type { SkillDiscoveryFilter, SkillResolution } from "../nexus/types";
import { BUILTIN_SKILLS } from "./builtin-skills";
import { listAdvertisedCapabilities } from "./root";

let registry: InMemorySkillRegistry | null = null;

function builtinRegistry(): InMemorySkillRegistry {
  if (!registry) {
    registry = new InMemorySkillRegistry();
    for (const skill of BUILTIN_SKILLS) registry.register(skill);
  }
  return registry;
}

/** Test seam. */
export function resetSkillPlane(): void {
  registry = null;
}

export function listBuiltinSkills(filter?: SkillDiscoveryFilter) {
  return builtinRegistry().discover(filter);
}

/**
 * Resolves every built-in skill against the capabilities this process actually advertises.
 * Resolution is not execution and does not grant authority.
 */
export async function discoverResolvedSkills(actorId: string, filter?: SkillDiscoveryFilter): Promise<SkillResolution[]> {
  const capabilities = await listAdvertisedCapabilities();
  const policy = new DefaultNexusPolicy();
  return listBuiltinSkills(filter).map((skill) => resolveSkill(skill, capabilities, policy, actorId));
}

export async function resolveBuiltinSkill(skillId: string, actorId: string): Promise<SkillResolution | null> {
  const skill = builtinRegistry().get(skillId);
  if (!skill) return null;
  const capabilities = await listAdvertisedCapabilities();
  return resolveSkill(skill, capabilities, new DefaultNexusPolicy(), actorId);
}

export function parseSkillResolveBody(body: unknown): { skillId: string; projectId: string } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Invalid JSON body." };
  const record = body as Record<string, unknown>;
  const rawId = typeof record.skillId === "string" ? record.skillId : typeof record.id === "string" ? record.id : "";
  const skillId = rawId.trim();
  if (!skillId || skillId.length > 128) return { error: "skillId is required and must be at most 128 characters." };
  if (typeof record.projectId !== "string" || !isUuid(record.projectId)) return { error: "projectId must be a UUID." };
  return { skillId, projectId: record.projectId };
}
