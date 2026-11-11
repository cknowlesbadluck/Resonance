import { riskForGrants } from "../src/nexus/grants";
import type { CapabilityKind, NexusCapability, NexusCapabilityResolution } from "../src/nexus/types";

/** Resolves the adapter that can actually invoke a capability from a given provider. */
export type AdapterBinding = (capability: NexusCapability) => string | undefined;

export const noAdapterBinding: AdapterBinding = () => undefined;

const rawCatalog = [
  { id: "skill.ios-swiftui", name: "iOS SwiftUI", description: "Production SwiftUI architecture, implementation and testing.", kind: "skill", providerId: "Build iOS Apps", version: "1.0.0", availability: "available", requiredPermissions: ["repo.read", "repo.write", "build.run", "test.run"], dependencies: [{ capabilityKey: "tool.github", kind: "tool" }], tags: ["ios", "swift", "swiftui"] },
  { id: "skill.code-review", name: "Code Review", description: "Independent correctness, maintainability and security review.", kind: "skill", providerId: "CodeRabbit", version: "1.0.0", availability: "available", requiredPermissions: ["repo.read", "review.write"], dependencies: [{ capabilityKey: "tool.github", kind: "tool" }], tags: ["review", "quality"] },
  { id: "skill.supabase-architecture", name: "Supabase Architecture", description: "Database, RLS, Realtime and Edge Function design.", kind: "skill", providerId: "Supabase", version: "1.0.0", availability: "available", requiredPermissions: ["database.read", "database.write"], dependencies: [{ capabilityKey: "integration.supabase", kind: "integration" }], tags: ["supabase", "postgres", "rls"] },
  { id: "skill.workflow-governance", name: "Workflow Governance", description: "Plan, execute and verify governed multi-step work.", kind: "skill", providerId: "aictrl.dev", version: "1.0.0", availability: "available", requiredPermissions: ["workflow.start", "workflow.read"], dependencies: [{ capabilityKey: "tool.linear", kind: "tool" }], tags: ["workflow", "governance"] },
  { id: "tool.github", name: "GitHub", description: "Repositories, branches, commits, issues and pull requests.", kind: "tool", providerId: "GitHub", version: "1.0.0", availability: "available", requiredPermissions: ["repo.read", "repo.write", "pr.write"], dependencies: [], tags: ["git", "github", "code"] },
  { id: "tool.linear", name: "Linear", description: "Project, milestone and issue tracking.", kind: "tool", providerId: "Linear", version: "1.0.0", availability: "available", requiredPermissions: ["issue.read", "issue.write"], dependencies: [], tags: ["planning", "issues"] },
  { id: "tool.figma", name: "Figma", description: "Design inspection and component integration.", kind: "tool", providerId: "Figma", version: "1.0.0", availability: "available", requiredPermissions: ["design.read"], dependencies: [], tags: ["design", "ui"] },
  { id: "tool.openai", name: "OpenAI", description: "OpenAI model and agent capabilities.", kind: "tool", providerId: "OpenAI Developers", version: "1.0.0", availability: "available", requiredPermissions: ["model.invoke"], dependencies: [], tags: ["ai", "agents"] },
  { id: "tool.brainbase", name: "Brainbase MCP", description: "Managed agent orchestration and execution.", kind: "tool", providerId: "Brainbase MCP", version: "1.0.0", availability: "available", requiredPermissions: ["agent.execute"], dependencies: [], tags: ["agents", "mcp"] },
  { id: "integration.supabase", name: "Supabase", description: "Resonance backend integration.", kind: "integration", providerId: "Supabase", version: "1.0.0", availability: "available", requiredPermissions: ["database.read", "database.write", "realtime.subscribe"], dependencies: [], tags: ["backend", "database"] },
  { id: "integration.github", name: "GitHub Integration", description: "Source-control integration for Resonance execution.", kind: "integration", providerId: "GitHub", version: "1.0.0", availability: "available", requiredPermissions: ["repo.read", "repo.write"], dependencies: [{ capabilityKey: "tool.github", kind: "tool" }], tags: ["git"] },
  { id: "integration.strengthcode", name: "StrengthCode", description: "Specialized capability provider.", kind: "integration", providerId: "StrengthCode", version: "1.0.0", availability: "planned", requiredPermissions: [], dependencies: [], tags: ["specialized"] },
  { id: "integration.riqor", name: "Riqor", description: "Registered integration capability slot.", kind: "integration", providerId: "Riqor", version: "1.0.0", availability: "planned", requiredPermissions: [], dependencies: [], tags: ["integration"] },
  { id: "integration.kora", name: "Kora", description: "Registered integration capability slot.", kind: "integration", providerId: "Kora", version: "1.0.0", availability: "planned", requiredPermissions: [], dependencies: [], tags: ["integration"] }
] as const;

function hydrateCapability(raw: typeof rawCatalog[number], bindAdapter: AdapterBinding): NexusCapability {
  const kind = raw.kind as CapabilityKind;
  const permissions = raw.requiredPermissions as unknown as string[];

  // Create a partial capability to pass to bindAdapter
  const partialCap = { id: raw.id, providerId: raw.providerId } as NexusCapability;
  const adapterId = bindAdapter(partialCap);

  return {
    id: raw.id,
    key: raw.id,
    name: raw.name,
    description: raw.description,
    providerId: raw.providerId,
    adapterId,
    kind,
    requiredPermissions: permissions,
    risk: riskForGrants(permissions),
    tags: [...raw.tags, `kind:${kind}`],
    availability: raw.availability as any,
    version: raw.version,
    dependencies: raw.dependencies as any,
    provenance: "catalog",
    executable: Boolean(adapterId),
    unexecutableReason: adapterId
      ? undefined
      : `No adapter is bound to provider "${raw.providerId}" in this deployment.`,
  };
}

export function listNexusCapabilitiesFromCatalog(bindAdapter: AdapterBinding = noAdapterBinding): NexusCapability[] {
  return rawCatalog.map((raw) => hydrateCapability(raw, bindAdapter));
}

export function resolveNexusCapabilities(
  requested: string[],
  bindAdapter: AdapterBinding = noAdapterBinding,
): NexusCapabilityResolution {
  const byId = new Map(rawCatalog.map(raw => [raw.id, raw]));
  const resolved: NexusCapability[] = [];
  const missing: string[] = [];
  const unavailable: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Capability dependency cycle detected at ${id}`);
    visiting.add(id);

    const raw = byId.get(id as any);
    if (!raw) {
      missing.push(id);
      visiting.delete(id);
      visited.add(id);
      return;
    }
    if (raw.availability !== "available") {
      unavailable.push(id);
      visiting.delete(id);
      visited.add(id);
      return;
    }

    for (const dependency of raw.dependencies) visit(dependency.capabilityKey);
    resolved.push(hydrateCapability(raw, bindAdapter));
    visiting.delete(id);
    visited.add(id);
  };

  requested.forEach(visit);
  return { requested: [...requested], resolved, missing, unavailable };
}
