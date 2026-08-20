export type CapabilityKind = "skill" | "tool" | "integration";
export type CapabilityStatus = "available" | "degraded" | "unavailable" | "planned";

export interface CapabilityDependency {
  id: string;
  kind: CapabilityKind;
  optional?: boolean;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  kind: CapabilityKind;
  provider: string;
  version: string;
  status: CapabilityStatus;
  permissions: string[];
  dependencies: CapabilityDependency[];
  tags: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CapabilityResolution {
  requested: string[];
  resolved: Capability[];
  missing: string[];
  unavailable: string[];
}

const catalog: Capability[] = [
  { id: "skill.ios-swiftui", name: "iOS SwiftUI", description: "Production SwiftUI architecture, implementation and testing.", kind: "skill", provider: "Build iOS Apps", version: "1.0.0", status: "available", permissions: ["repo.read", "repo.write", "build.run", "test.run"], dependencies: [{ id: "tool.github", kind: "tool" }], tags: ["ios", "swift", "swiftui"] },
  { id: "skill.code-review", name: "Code Review", description: "Independent correctness, maintainability and security review.", kind: "skill", provider: "CodeRabbit", version: "1.0.0", status: "available", permissions: ["repo.read", "review.write"], dependencies: [{ id: "tool.github", kind: "tool" }], tags: ["review", "quality"] },
  { id: "skill.supabase-architecture", name: "Supabase Architecture", description: "Database, RLS, Realtime and Edge Function design.", kind: "skill", provider: "Supabase", version: "1.0.0", status: "available", permissions: ["database.read", "database.write"], dependencies: [{ id: "integration.supabase", kind: "integration" }], tags: ["supabase", "postgres", "rls"] },
  { id: "skill.workflow-governance", name: "Workflow Governance", description: "Plan, execute and verify governed multi-step work.", kind: "skill", provider: "aictrl.dev", version: "1.0.0", status: "available", permissions: ["workflow.start", "workflow.read"], dependencies: [{ id: "tool.linear", kind: "tool" }], tags: ["workflow", "governance"] },
  { id: "tool.github", name: "GitHub", description: "Repositories, branches, commits, issues and pull requests.", kind: "tool", provider: "GitHub", version: "1.0.0", status: "available", permissions: ["repo.read", "repo.write", "pr.write"], dependencies: [], tags: ["git", "github", "code"] },
  { id: "tool.linear", name: "Linear", description: "Project, milestone and issue tracking.", kind: "tool", provider: "Linear", version: "1.0.0", status: "available", permissions: ["issue.read", "issue.write"], dependencies: [], tags: ["planning", "issues"] },
  { id: "tool.figma", name: "Figma", description: "Design inspection and component integration.", kind: "tool", provider: "Figma", version: "1.0.0", status: "available", permissions: ["design.read"], dependencies: [], tags: ["design", "ui"] },
  { id: "tool.openai", name: "OpenAI", description: "OpenAI model and agent capabilities.", kind: "tool", provider: "OpenAI Developers", version: "1.0.0", status: "available", permissions: ["model.invoke"], dependencies: [], tags: ["ai", "agents"] },
  { id: "tool.brainbase", name: "Brainbase MCP", description: "Managed agent orchestration and execution.", kind: "tool", provider: "Brainbase MCP", version: "1.0.0", status: "available", permissions: ["agent.execute"], dependencies: [], tags: ["agents", "mcp"] },
  { id: "integration.supabase", name: "Supabase", description: "Resonance backend integration.", kind: "integration", provider: "Supabase", version: "1.0.0", status: "available", permissions: ["database.read", "database.write", "realtime.subscribe"], dependencies: [], tags: ["backend", "database"] },
  { id: "integration.github", name: "GitHub Integration", description: "Source-control integration for Resonance execution.", kind: "integration", provider: "GitHub", version: "1.0.0", status: "available", permissions: ["repo.read", "repo.write"], dependencies: [{ id: "tool.github", kind: "tool" }], tags: ["git"] },
  { id: "integration.strengthcode", name: "StrengthCode", description: "Specialized capability provider.", kind: "integration", provider: "StrengthCode", version: "1.0.0", status: "planned", permissions: [], dependencies: [], tags: ["specialized"] },
  { id: "integration.riqor", name: "Riqor", description: "Registered integration capability slot.", kind: "integration", provider: "Riqor", version: "1.0.0", status: "planned", permissions: [], dependencies: [], tags: ["integration"] },
  { id: "integration.kora", name: "Kora", description: "Registered integration capability slot.", kind: "integration", provider: "Kora", version: "1.0.0", status: "planned", permissions: [], dependencies: [], tags: ["integration"] }
];

export function listCapabilities(): Capability[] {
  return [...catalog];
}

export function resolveCapabilities(requested: string[]): CapabilityResolution {
  const byId = new Map(catalog.map(capability => [capability.id, capability]));
  const resolved: Capability[] = [];
  const missing: string[] = [];
  const unavailable: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Capability dependency cycle detected at ${id}`);
    visiting.add(id);

    const capability = byId.get(id);
    if (!capability) {
      missing.push(id);
      visiting.delete(id);
      visited.add(id);
      return;
    }
    if (capability.status !== "available") {
      unavailable.push(id);
      visiting.delete(id);
      visited.add(id);
      return;
    }

    for (const dependency of capability.dependencies) visit(dependency.id);
    resolved.push(capability);
    visiting.delete(id);
    visited.add(id);
  };

  requested.forEach(visit);
  return { requested: [...requested], resolved, missing, unavailable };
}
