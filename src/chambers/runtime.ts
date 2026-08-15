/**
 * Chamber Runtime — core composition fabric execution contracts.
 * This is the upgraded workflow/run layer.
 */

import type {
  Agenda,
  Chamber,
  ChamberParticipant,
  ChamberStatus,
  ContextPlane,
  ContextView,
  ToolkitSnapshot,
  ToolkitPlugin,
  RunStatus,
  CapabilityLevel,
} from "../domain/types";

export interface OpenChamberRequest {
  projectId: string;
  agenda: Omit<Agenda, "id" | "createdAt" | "updatedAt">;
  seedAgentIds?: string[];
  seedSkillIds?: string[];
  requestedBy: string;
}

export interface OpenChamberResult {
  chamber: Chamber;
  runId: string;
  agendaId: string;
  initialToolkit: ToolkitSnapshot;
  contextPlaneId: string;
}

export interface ResourcePullRequest {
  chamberId: string;
  query: string;
  requiredCapabilities?: string[];
  maxResults?: number;
  requestedBy: string;
}

export interface ResourcePullResult {
  added: ToolkitPlugin[];
  toolkit: ToolkitSnapshot;
}

export interface Contribution {
  id: string;
  chamberId: string;
  agentId: string;
  type: "message" | "artifact" | "decision" | "tool_result" | "status";
  payload: unknown;
  createdAt: string;
}

export interface DissolveReason {
  type: "success" | "cancelled" | "failed" | "timeout" | "policy" | "dissonance";
  message?: string;
  artifacts?: string[];
}

export interface ChamberResult {
  chamberId: string;
  runId: string;
  status: RunStatus;
  agendaSatisfied: boolean;
  artifacts: string[];
  extractedContext?: Record<string, unknown>;
  events: ChamberEvent[];
  dissolvedAt: string;
}

export interface ChamberEvent {
  id: string;
  chamberId: string;
  type:
    | "chamber.opened"
    | "agent.activated"
    | "agent.exited"
    | "toolkit.seeded"
    | "toolkit.pulled"
    | "context.updated"
    | "contribution"
    | "approval.requested"
    | "approval.resolved"
    | "dissonance.detected"
    | "chamber.dissolving"
    | "chamber.dissolved";
  agentId?: string;
  payload: unknown;
  createdAt: string;
}

/**
 * Primary runtime interface for the composition fabric.
 * Implementations must enforce policy before any mutation.
 */
export interface ChamberRuntime {
  open(request: OpenChamberRequest): Promise<OpenChamberResult>;
  activateAgent(chamberId: string, agentId: string, permissions: CapabilityLevel[]): Promise<ChamberParticipant>;
  pullResource(request: ResourcePullRequest): Promise<ResourcePullResult>;
  getContextView(chamberId: string, agentId: string): Promise<ContextView>;
  updateContext(chamberId: string, entry: Omit<ContextPlane["entries"][0], "id" | "createdAt">): Promise<void>;
  contribute(contribution: Omit<Contribution, "id" | "createdAt">): Promise<Contribution>;
  dissolve(chamberId: string, reason: DissolveReason): Promise<ChamberResult>;
  get(chamberId: string): Promise<Chamber | null>;
}

export interface PolicyGate {
  evaluate(params: {
    actorId: string;
    projectId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requiredLevel: CapabilityLevel;
    context?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; requiresApproval: boolean; reason?: string }>;
}

export interface ToolkitSeeder {
  seed(agenda: Agenda, availablePlugins: ToolkitPlugin[]): Promise<ToolkitPlugin[]>;
}
