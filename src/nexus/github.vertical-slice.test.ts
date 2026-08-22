import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GitHubAdapter, githubRepositoryReadCapability } from "./adapters/github";
import { InMemoryCapabilityRegistry } from "./registry";
import { DefaultNexusPolicy } from "./policy";
import { composeIntent } from "./composer";
import { NexusExecutor } from "./executor";
import type { NexusEvent, NexusExecution, NexusIntent } from "./types";

const sliceEnabled = process.env.GITHUB_VERTICAL_SLICE === "1";
const token = process.env.GITHUB_TOKEN?.trim() ?? "";
const owner = process.env.GITHUB_OWNER?.trim() || "cknowlesbadluck";
const repo = process.env.GITHUB_REPO?.trim() || "Resonance";
const evidencePath = path.join(process.cwd(), "artifacts", "github-vertical-slice.json");

function publicRepositoryFields(output: unknown) {
  if (!output || typeof output !== "object") return output;
  const body = output as Record<string, unknown>;
  return {
    provider: body.provider,
    resourceType: body.resourceType,
    owner: body.owner,
    name: body.name,
    fullName: body.fullName ?? body.full_name,
    private: body.private,
    htmlUrl: body.htmlUrl ?? body.html_url,
    defaultBranch: body.defaultBranch ?? body.default_branch,
  };
}

describe("GitHub authenticated vertical slice", () => {
  it("requires GITHUB_TOKEN when the slice is enabled in CI", () => {
    if (!sliceEnabled) return;
    expect(token, "GITHUB_TOKEN must be present for credential-backed execution").toBeTruthy();
  });

  it.skipIf(!sliceEnabled || !token)("resolves a real GitHub capability, passes policy, executes, and persists evidence", async () => {
    const adapter = new GitHubAdapter(token);
    const registry = new InMemoryCapabilityRegistry();
    registry.register(githubRepositoryReadCapability);
    const policy = new DefaultNexusPolicy();
    const decision = policy.evaluate("ci-actor", githubRepositoryReadCapability);
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);

    const intent: NexusIntent = {
      id: "github-vertical-slice",
      projectId: "00000000-0000-4000-8000-000000000032",
      objective: `Read GitHub repository metadata for ${owner}/${repo}`,
      requestedBy: "ci-actor",
      requirements: [{ key: githubRepositoryReadCapability.key, requiredPermissions: ["read"], maxRisk: "low" }],
      metadata: { input: { owner, repo } },
    };

    const plan = composeIntent(intent, registry, policy, [adapter]);
    expect(plan.approvalRequired).toBe(false);
    expect(plan.steps).toEqual([
      expect.objectContaining({
        capabilityId: githubRepositoryReadCapability.id,
        adapterId: "github",
        input: { owner, repo },
        requiresApproval: false,
      }),
    ]);

    const executions: NexusExecution[] = [];
    const events: NexusEvent[] = [];
    const result = await new NexusExecutor([adapter], {
      recordEvidence: async () => {},
      recordExecution: async (item) => { executions.push({ ...item }); },
      recordEvent: async (item) => { events.push(item); },
    }).execute(plan);

    const repository = Array.isArray(result.execution.output) ? result.execution.output[0] : result.execution.output;
    const snapshot = {
      generatedAt: new Date().toISOString(),
      owner,
      repo,
      capabilityId: githubRepositoryReadCapability.id,
      policy: decision,
      intent: { id: intent.id, objective: intent.objective, projectId: intent.projectId },
      plan: { id: plan.id, mode: plan.mode, approvalRequired: plan.approvalRequired, steps: plan.steps },
      execution: {
        ...result.execution,
        output: [publicRepositoryFields(repository)],
      },
      evidence: result.evidence.map((item) => ({
        ...item,
        payload: publicRepositoryFields(item.payload),
      })),
      events: events.map((event) => ({
        type: event.type,
        status: event.status,
        correlationId: event.correlationId,
      })),
      persistedExecutions: executions.map((item) => item.status),
    };

    await mkdir(path.dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

    expect(result.execution.status).toBe("completed");
    expect(result.execution.id).toBeTruthy();
    expect(result.evidence).toHaveLength(1);
    expect(events.map((event) => event.type)).toEqual(["execution.started", "execution.step.completed", "execution.completed"]);
    expect(executions.map((item) => item.status)).toEqual(["running", "completed"]);
    expect(publicRepositoryFields(repository)).toEqual(expect.objectContaining({ fullName: `${owner}/${repo}`, provider: "github" }));
  });
});
