export const capabilityLevels = [
  "read",
  "analyze",
  "modify",
  "execute",
  "commit",
  "publish",
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
  | "mcp"
  | "connector"
  | "api";

export interface IntegrationDescriptor {
  key: IntegrationKey;
  name: string;
  category: string;
  description: string;
}

export const resonanceIntegrations: IntegrationDescriptor[] = [
  { key: "github", name: "GitHub", category: "Source control", description: "A connected repository and delivery capability provider." },
  { key: "supabase", name: "Supabase", category: "Persistence", description: "An operational persistence and backend capability provider." },
  { key: "linear", name: "Linear", category: "Planning", description: "A connected planning and work-tracking capability provider." },
  { key: "figma", name: "Figma", category: "Design", description: "A connected design and visual-resource capability provider." },
  { key: "openai", name: "OpenAI", category: "AI provider", description: "One possible model and AI capability provider; not a Resonance authority." },
  { key: "brainbase", name: "Brainbase", category: "Agent runtime", description: "One possible external agent capability provider." },
  { key: "mcp", name: "MCP", category: "Interoperability", description: "A standardized bridge for exposing tools and resources to participating systems." },
  { key: "connector", name: "Connector", category: "Interoperability", description: "A generic provider adapter boundary." },
  { key: "api", name: "API", category: "Interoperability", description: "A generic API integration boundary." },
];

export const initialAgents = [
  "Architect",
  "Analyst",
  "Researcher",
  "Planner",
  "Builder",
  "Operator",
  "Reviewer",
  "Tester",
  "Security Reviewer",
  "Coordinator",
] as const;

export const initialSkills = [
  "System analysis",
  "Research and synthesis",
  "Planning",
  "API integration",
  "Tool execution",
  "Data modeling",
  "Security review",
  "Testing",
  "Code review",
  "Context management",
  "Agent coordination",
] as const;
