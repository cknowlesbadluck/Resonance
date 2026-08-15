/**
 * Resonance Core Domain Types
 * Production contracts for the composition fabric.
 */

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
  | "forming"          // Chamber is opening / agents transporting
  | "running"
  | "waiting"
  | "approval_required"
  | "dissolving"       // Chamber is closing
  | "failed"
  | "cancelled"
  | "completed";

export type ChamberStatus =
  | "forming"
  | "active"
  | "paused"
  | "dissolving"
  | "dissolved";

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

/** Structured goal that organizes a Chamber */
export interface Agenda {
  id: string;
  projectId: string;
  goal: string;
  constraints: AgendaConstraint[];
  successCriteria: SuccessCriterion[];
  preferredAgents?: string[];
  preferredSkills?: string[];
  privacyCeiling?: PrivacyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaConstraint {
  type: "latency" | "cost" | "privacy" | "source" | "approval" | "custom";
  value: string | number | boolean;
  description?: string;
}

export interface SuccessCriterion {
  id: string;
  description: string;
  required: boolean;
  satisfied?: boolean;
}

export type PrivacyLevel = "public" | "project" | "private" | "strict";

/** Temporary shared execution space bound to an Agenda */
export interface Chamber {
  id: string;
  runId: string;
  projectId: string;
  agendaId: string;
  status: ChamberStatus;
  participants: ChamberParticipant[];
  toolkit: ToolkitSnapshot;
  contextPlaneId: string;
  openedAt: string;
  closedAt?: string;
  dissolutionReason?: string;
}

export interface ChamberParticipant {
  agentId: string;
  origin: AgentOrigin;
  role: string;
  status: "activating" | "active" | "paused" | "exited";
  joinedAt: string;
  exitedAt?: string;
  permissions: CapabilityLevel[];
}

export interface AgentOrigin {
  type: "local" | "project" | "remote_bridge";
  sourceId?: string;
  displayName: string;
}

/** Live set of fully-equipped plugins available inside a Chamber */
export interface ToolkitSnapshot {
  id: string;
  chamberId: string;
  plugins: ToolkitPlugin[];
  seededAt: string;
  lastPulledAt?: string;
}

export interface ToolkitPlugin {
  skillId?: string;
  mcpServerId?: string;
  connectorId?: string;
  name: string;
  version: string;
  capabilities: string[];
  fullyEquipped: boolean;
  permissionScope: CapabilityLevel[];
}

/** Scoped shared memory for a Chamber */
export interface ContextPlane {
  id: string;
  chamberId: string;
  entries: ContextEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextEntry {
  id: string;
  key: string;
  value: unknown;
  visibility: "all" | "agents" | "specific";
  visibleTo?: string[];
  createdBy: string;
  createdAt: string;
}

export interface ContextView {
  planeId: string;
  agentId: string;
  entries: ContextEntry[];
}

/** Fully-equipped plugin / skill contract */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  tools: ToolDescriptor[];
  resources: ResourceDescriptor[];
  templates: TemplateDescriptor[];
  stateSchema?: Record<string, unknown>;
  requiredPermissions: CapabilityLevel[];
  compatibility: string[];
}

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  risk: "low" | "medium" | "high" | "critical";
}

export interface ResourceDescriptor {
  name: string;
  description: string;
  mimeType?: string;
  readOnly: boolean;
}

export interface TemplateDescriptor {
  name: string;
  description: string;
  contentType: string;
  variables: string[];
}

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
  "Chamber toolkit seeding",
  "Agenda refinement",
] as const;
