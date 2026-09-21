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

export type GitHubFailureCode =
  | "invalid_input"
  | "unsupported_capability"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "malformed_response";

const GITHUB_FAILURE_CODES: ReadonlySet<GitHubFailureCode> = new Set([
  "invalid_input", "unsupported_capability", "unauthorized", "forbidden", "not_found",
  "rate_limited", "unavailable", "timeout", "malformed_response",
]);

interface RepositoryInput { owner: string; repo: string; }
export interface GitHubAdapterOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function repositoryInput(value: unknown): RepositoryInput {
  if (!value || typeof value !== "object") throw Object.assign(new Error("GitHub repository input must be an object."), { code: "invalid_input" as const });
  const owner = (value as Record<string, unknown>).owner;
  const repo = (value as Record<string, unknown>).repo;
  const isValidSegment = (v: unknown): v is string =>
    typeof v === "string" && /^[A-Za-z0-9_.-]{1,100}$/.test(v) && v !== "." && v !== "..";
  if (!isValidSegment(owner)) throw Object.assign(new Error("GitHub owner is invalid."), { code: "invalid_input" as const });
  if (!isValidSegment(repo)) throw Object.assign(new Error("GitHub repository name is invalid."), { code: "invalid_input" as const });
  return { owner, repo };
}

function codeForStatus(status: number): GitHubFailureCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  return "unavailable";
}

function fail(error: string, code: GitHubFailureCode, extra?: Record<string, unknown>): InvocationResult {
  return { ok: false, error, evidence: { provider: "github", code, ...extra } };
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && ((error as { name?: string }).name === "AbortError" || (error as { name?: string }).name === "TimeoutError"));
}

export class GitHubAdapter implements NexusAdapter {
  readonly id = "github";
  readonly kind = "github";
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly token: string, options: GitHubAdapterOptions = {}) {
    if (!token.trim()) throw new Error("GitHub adapter requires GITHUB_TOKEN.");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async describe(): Promise<AdapterDescription> {
    return {
      identity: { id: "github", type: "connector", name: "GitHub" },
      capabilities: [capability],
    };
  }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    try {
      switch (request.capabilityId) {
        case capability.id:
          return await this.handleRepositoryRead(request);
        default:
          return fail(`Unsupported GitHub capability: ${request.capabilityId}`, "unsupported_capability");
      }
    } catch (error) {
      if (isAbortError(error)) return fail("GitHub request timed out.", "timeout");
      const candidate = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
      const extra = error && typeof error === "object" ? (error as { extra?: Record<string, unknown> }).extra : undefined;
      const code: GitHubFailureCode = typeof candidate === "string" && GITHUB_FAILURE_CODES.has(candidate as GitHubFailureCode)
        ? candidate as GitHubFailureCode
        : "unavailable";
      return fail(error instanceof Error ? error.message : String(error), code, extra);
    }
  }

  private async handleRepositoryRead(request: InvocationRequest): Promise<InvocationResult> {
    const { owner, repo } = repositoryInput(request.input);
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const { body, status } = await this.fetchGitHubApi(path);

    const record = body as Record<string, unknown>;
    if (typeof record.full_name !== "string" || typeof record.private !== "boolean") {
      throw Object.assign(new Error("GitHub API returned repository metadata with an unexpected shape."), {
        code: "malformed_response" as const,
        extra: { status },
      });
    }

    return {
      ok: true,
      output: {
        provider: "github",
        resourceType: "repository",
        owner,
        name: repo,
        fullName: record.full_name,
        private: record.private,
        htmlUrl: typeof record.html_url === "string" ? record.html_url : null,
        defaultBranch: typeof record.default_branch === "string" ? record.default_branch : null,
        description: typeof record.description === "string" ? record.description : null,
      },
      evidence: { provider: "github", capability: capability.id, correlationId: request.correlationId, code: "ok" },
    };
  }

  private async fetchGitHubApi(path: string): Promise<{ body: unknown; status: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`https://api.github.com${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Resonance-Nexus",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const raw = await response.text();
      let body: unknown = null;
      let parseFailed = false;
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          parseFailed = true;
        }
      }

      if (!response.ok) {
        throw this.classifyHttpError(response, body, parseFailed);
      }

      if (parseFailed || !body || typeof body !== "object") {
        throw Object.assign(new Error("GitHub API returned a malformed response."), {
          code: "malformed_response" as const,
          extra: { status: response.status },
        });
      }

      return { body, status: response.status };
    } finally {
      clearTimeout(timer);
    }
  }

  private classifyHttpError(response: Response, body: unknown, parseFailed: boolean): Error {
    const message = !parseFailed && body && typeof body === "object" && typeof (body as Record<string, unknown>).message === "string"
      ? (body as Record<string, unknown>).message as string
      : `GitHub API returned HTTP ${response.status}`;

    let code = codeForStatus(response.status);

    if (response.status === 403) {
      if (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after") || message.toLowerCase().includes("rate limit")) {
        code = "rate_limited";
      }
    }

    return Object.assign(new Error(message), {
      code,
      extra: { status: response.status },
    });
  }
}

export { capability as githubRepositoryReadCapability };
