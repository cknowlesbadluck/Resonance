export type Capability = { name: string; description: string; mutating?: boolean };
export type ProviderEvent = { provider: string; type: string; externalId?: string; payload: unknown };
export type ExecutionContext = { projectId: string; integrationId: string; runId?: string };

export interface IntegrationAdapter {
  provider: string;
  capabilities: Capability[];
  health(): Promise<{ ok: boolean; detail?: string }>;
  execute(capability: string, input: unknown, context: ExecutionContext): Promise<unknown>;
  handleEvent?(event: ProviderEvent): Promise<void>;
}

const names = (items: string[], mutatingPattern: RegExp) =>
  items.map((name) => ({ name, description: name, mutating: mutatingPattern.test(name) }));

export const capabilities: Record<string, Capability[]> = {
  github: names(["repository.read", "branch.write", "commit.read", "pull_request.read", "pull_request.write", "workflow.read", "workflow.write"], /write/),
  supabase: names(["database.read", "database.write", "auth.read", "storage.read", "edge_function.invoke"], /write|invoke/),
  linear: names(["project.read", "issue.read", "issue.write", "cycle.read"], /write/),
  figma: names(["file.read", "file.write", "comment.read", "comment.write"], /write/),
  openai: names(["responses.generate", "embeddings.generate"], /generate/),
  brainbase: names(["agent.read", "agent.execute", "skill.read", "skill.execute"], /execute/),
  mcp: names(["server.read", "tool.read", "tool.execute", "resource.read"], /execute/),
};
