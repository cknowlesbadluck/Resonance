import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";
import type { NexusCapability } from "../types";

const capability: NexusCapability = {
  id: "linear.issue.read",
  key: "linear.issue.read",
  name: "Read Linear issue",
  description: "Reads a single Linear issue through the provider-neutral Nexus adapter boundary.",
  providerId: "linear",
  adapterId: "linear",
  kind: "integration",
  requiredPermissions: ["issue.read"],
  risk: "low",
  availability: "available",
  provenance: "linear-adapter",
  tags: ["linear", "issue", "read"],
  executable: true,
};

export type LinearFailureCode =
  | "invalid_input"
  | "unsupported_capability"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "malformed_response";

const LINEAR_FAILURE_CODES: ReadonlySet<LinearFailureCode> = new Set([
  "invalid_input", "unsupported_capability", "unauthorized", "forbidden", "not_found",
  "rate_limited", "unavailable", "timeout", "malformed_response",
]);

export interface LinearAdapterOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  endpoint?: string;
}

/** Linear issue identifier ("CHR-51") or the issue's UUID. */
const IDENTIFIER_RE = /^[A-Z][A-Z0-9]{0,9}-\d{1,6}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function issueInput(value: unknown): { id: string } {
  if (!value || typeof value !== "object") {
    throw Object.assign(new Error("Linear issue input must be an object."), { code: "invalid_input" as const });
  }
  const raw = (value as Record<string, unknown>).id ?? (value as Record<string, unknown>).identifier;
  if (typeof raw !== "string" || !(IDENTIFIER_RE.test(raw) || UUID_RE.test(raw))) {
    throw Object.assign(
      new Error("Linear issue id must be an identifier such as \"CHR-51\" or an issue UUID."),
      { code: "invalid_input" as const },
    );
  }
  return { id: raw };
}

function codeForStatus(status: number): LinearFailureCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  return "unavailable";
}

function fail(error: string, code: LinearFailureCode, extra?: Record<string, unknown>): InvocationResult {
  return { ok: false, error, evidence: { provider: "linear", code, ...extra } };
}

function isAbortError(error: unknown): boolean {
  const name = error && typeof error === "object" ? (error as { name?: string }).name : undefined;
  return name === "AbortError" || name === "TimeoutError";
}

const ISSUE_QUERY = `query NexusIssue($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    url
    state { name type }
    team { key name }
  }
}`;

/**
 * Linear adapter.
 *
 * Mirrors `GitHubAdapter` deliberately: injected `fetchImpl`, an explicit timeout, a
 * closed set of failure codes, and status-before-parse classification so a non-JSON
 * error page still surfaces as unauthorized/rate_limited rather than being masked as
 * a malformed response.
 *
 * GraphQL note: Linear returns HTTP 200 with a populated `errors` array for
 * application-level failures, so a 200 is not sufficient evidence of success.
 */
export class LinearAdapter implements NexusAdapter {
  readonly id = "linear";
  readonly kind = "linear";
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly endpoint: string;

  constructor(private readonly apiKey: string, options: LinearAdapterOptions = {}) {
    if (!apiKey.trim()) throw new Error("Linear adapter requires LINEAR_API_KEY.");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.endpoint = options.endpoint ?? "https://api.linear.app/graphql";
  }

  async describe(): Promise<AdapterDescription> {
    return {
      identity: { id: "linear", type: "connector", name: "Linear" },
      capabilities: [capability],
    };
  }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    if (request.capabilityId !== capability.id) {
      return fail(`Unsupported Linear capability: ${request.capabilityId}`, "unsupported_capability");
    }

    try {
      const { id } = issueInput(request.input);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: {
            // Linear personal API keys are sent bare, not as a Bearer token.
            Authorization: this.apiKey,
            "Content-Type": "application/json",
            "User-Agent": "Resonance-Nexus",
          },
          body: JSON.stringify({ query: ISSUE_QUERY, variables: { id } }),
          cache: "no-store",
          signal: controller.signal,
        });

        const raw = await response.text();
        let body: unknown = null;
        let parseFailed = false;
        if (raw) {
          try { body = JSON.parse(raw); } catch { parseFailed = true; }
        }

        if (!response.ok) {
          const message = !parseFailed && body && typeof body === "object" && typeof (body as Record<string, unknown>).error === "string"
            ? (body as Record<string, unknown>).error as string
            : `Linear API returned HTTP ${response.status}`;
          let code = codeForStatus(response.status);
          if (response.status === 400 && message.toLowerCase().includes("authentication")) code = "unauthorized";
          return fail(message, code, { status: response.status });
        }

        if (parseFailed || !body || typeof body !== "object") {
          return fail("Linear API returned a malformed response.", "malformed_response", { status: response.status });
        }

        const envelope = body as { data?: { issue?: unknown }; errors?: unknown };

        // A 200 with `errors` is Linear's normal failure mode for GraphQL-level problems.
        if (Array.isArray(envelope.errors) && envelope.errors.length > 0) {
          const first = envelope.errors[0] as { message?: unknown; extensions?: { code?: unknown } };
          const message = typeof first?.message === "string" ? first.message : "Linear returned a GraphQL error.";
          const extensionCode = typeof first?.extensions?.code === "string" ? first.extensions.code : "";
          const code: LinearFailureCode = extensionCode.toUpperCase().includes("AUTH")
            ? "unauthorized"
            : extensionCode.toUpperCase().includes("RATELIMIT")
              ? "rate_limited"
              : "unavailable";
          return fail(message, code, { status: response.status, graphqlCode: extensionCode || null });
        }

        const issue = envelope.data?.issue;
        if (issue === null || issue === undefined) {
          return fail(`Linear issue ${id} was not found.`, "not_found", { status: response.status });
        }
        if (typeof issue !== "object") {
          return fail("Linear API returned an issue with an unexpected shape.", "malformed_response", { status: response.status });
        }

        const record = issue as Record<string, unknown>;
        if (typeof record.id !== "string" || typeof record.identifier !== "string") {
          return fail("Linear API returned an issue with an unexpected shape.", "malformed_response", { status: response.status });
        }

        const state = record.state as Record<string, unknown> | null | undefined;
        const team = record.team as Record<string, unknown> | null | undefined;

        return {
          ok: true,
          output: {
            provider: "linear",
            resourceType: "issue",
            id: record.id,
            identifier: record.identifier,
            title: typeof record.title === "string" ? record.title : null,
            url: typeof record.url === "string" ? record.url : null,
            state: typeof state?.name === "string" ? state.name : null,
            stateType: typeof state?.type === "string" ? state.type : null,
            teamKey: typeof team?.key === "string" ? team.key : null,
          },
          evidence: { provider: "linear", capability: capability.id, correlationId: request.correlationId, code: "ok" },
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      if (isAbortError(error)) return fail("Linear request timed out.", "timeout");
      const candidate = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
      const code: LinearFailureCode = typeof candidate === "string" && LINEAR_FAILURE_CODES.has(candidate as LinearFailureCode)
        ? candidate as LinearFailureCode
        : "unavailable";
      return fail(error instanceof Error ? error.message : String(error), code);
    }
  }
}

export { capability as linearIssueReadCapability };
