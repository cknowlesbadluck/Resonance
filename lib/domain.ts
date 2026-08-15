export const capabilityLevels = [
  "read",
  "analyze",
  "modify",
  "execute",
  "commit",
  "create_pr",
  "merge",
  "deploy",
  "admin",
] as const;

export type CapabilityLevel = (typeof capabilityLevels)[number];

export type RunStatus =
  | "queued"
  | "planning"
  | "running"
  | "waiting"
  | "approval_required"
  | "failed"
  | "cancelled"
  | "completed";

export type IntegrationKey =
  | "github"
  | "supabase"
  | "linear"
  | "figma"
  | "openai"
  | "brainbase"
  | "mcp";

export interface IntegrationDescriptor {
  key: IntegrationKey;
  name: string;
  category: string;
  description: string;
}

export const resonanceIntegrations: IntegrationDescriptor[] = [
  { key: "github", name: "GitHub", category: "Source control", description: "Repositories, branches, commits, PRs and Actions." },
  { key: "supabase", name: "Supabase", category: "Backend", description: "Database, auth, realtime and Edge Functions." },
  { key: "linear", name: "Linear", category: "Execution", description: "Issues, projects, milestones and delivery tracking." },
  { key: "figma", name: "Figma", category: "Design", description: "Design source of truth and UI system." },
  { key: "openai", name: "OpenAI", category: "AI provider", description: "Provider-neutral agent intelligence, initially backed by OpenAI." },
  { key: "brainbase", name: "Brainbase", category: "Agent runtime", description: "Agent management and execution where appropriate." },
  { key: "mcp", name: "MCP", category: "Tool protocol", description: "Explicitly permissioned tools and resources." },
];

export const initialAgents = [
  "Architect",
  "iOS Engineer",
  "Backend Engineer",
  "Database Engineer",
  "UI Engineer",
  "Integration Engineer",
  "QA Engineer",
  "Security Engineer",
  "Code Reviewer",
  "Product Planner",
] as const;

export const initialSkills = [
  "SwiftUI feature development",
  "iOS debugging",
  "Supabase schema design",
  "Supabase security",
  "GitHub PR review",
  "Security audit",
  "API integration",
  "Systematic debugging",
  "Code refactoring",
  "Figma-to-SwiftUI",
  "Agent orchestration",
] as const;
