import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";
import type { NexusCapability } from "../types";

const capability: NexusCapability = {
  id: "github.repository.read",
  key: "github.repository.read",
  name: "Read GitHub repository metadata",
  description: "Reads repository metadata from GitHub through the provider-neutral Nexus adapter boundary.",
  providerId: "github",
  adapterId: "github",
  kind: "integration",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
  provenance: "github-adapter",
  tags: ["github", "repository", "read"],
};

interface RepositoryInput { owner: string; repo: string; }

function repositoryInput(value: unknown): RepositoryInput {
  if (!value || typeof value !== "object") throw new Error("GitHub repository input must be an object.");
  const owner = (value as Record<string, unknown>).owner;
  const repo = (value as Record<string, unknown>).repo;
  if (typeof owner !== "string" || !/^[A-Za-z0-9_.-]{1,100}$/.test(owner)) throw new Error("GitHub owner is invalid.");
  if (typeof repo !== "string" || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo)) throw new Error("GitHub repository name is invalid.");
  return { owner, repo };
}

export class GitHubAdapter implements NexusAdapter {
  readonly id = "github";
  readonly kind = "github";

  constructor(private readonly token: string) {
    if (!token.trim()) throw new Error("GitHub adapter requires GITHUB_TOKEN.");
  }

  async describe(): Promise<AdapterDescription> {
    return {
      identity: { id: "github", type: "connector", name: "GitHub" },
      capabilities: [capability],
    };
  }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    if (request.capabilityId !== capability.id) return { ok: false, error: `Unsupported GitHub capability: ${request.capabilityId}` };
    try {
      const { owner, repo } = repositoryInput(request.input);
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Resonance-Nexus",
        },
        cache: "no-store",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message = body && typeof body === "object" && typeof (body as Record<string, unknown>).message === "string"
          ? (body as Record<string, unknown>).message as string
          : `GitHub API returned HTTP ${response.status}`;
        return { ok: false, error: message, evidence: { provider: "github", status: response.status } };
      }
      return { ok: true, output: body, evidence: { provider: "github", capability: capability.id, correlationId: request.correlationId } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export { capability as githubRepositoryReadCapability };
