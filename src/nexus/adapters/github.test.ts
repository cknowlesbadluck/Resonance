import { describe, expect, it, vi } from "vitest";
import { GitHubAdapter, githubRepositoryReadCapability } from "./github";

function invoke(adapter: GitHubAdapter, input: unknown = { owner: "octo", repo: "repo" }) {
  return adapter.invoke({
    capabilityId: githubRepositoryReadCapability.id,
    input,
    actorId: "user-1",
    correlationId: "execution-1",
  });
}

describe("GitHubAdapter", () => {
  it("describes the normalized repository capability", async () => {
    const adapter = new GitHubAdapter("test-token");
    const description = await adapter.describe();
    expect(description.identity.id).toBe("github");
    expect(description.capabilities).toContainEqual(githubRepositoryReadCapability);
  });

  it("rejects construction without a token", () => {
    expect(() => new GitHubAdapter("  ")).toThrow(/GITHUB_TOKEN/);
  });

  it("reads repository metadata with authenticated GitHub headers and a normalized output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      full_name: "octo/repo",
      private: false,
      html_url: "https://github.com/octo/repo",
      default_branch: "main",
      description: "demo",
    }), { status: 200 })) as typeof fetch;
    const adapter = new GitHubAdapter("secret-token", { fetchImpl: fetchMock });
    const result = await invoke(adapter);
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({
      provider: "github",
      resourceType: "repository",
      owner: "octo",
      name: "repo",
      fullName: "octo/repo",
      private: false,
      htmlUrl: "https://github.com/octo/repo",
      defaultBranch: "main",
      description: "demo",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octo/repo",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
  });

  it.each([
    [401, "Bad credentials", "unauthorized"],
    [403, "Resource not accessible", "forbidden"],
    [404, "Not Found", "not_found"],
    [429, "API rate limit exceeded", "rate_limited"],
    [503, "Service Unavailable", "unavailable"],
  ] as const)("normalizes HTTP %s into %s", async (status, message, code) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message }), { status })) as typeof fetch;
    const result = await invoke(new GitHubAdapter("secret-token", { fetchImpl: fetchMock }), { owner: "octo", repo: "missing" });
    expect(result).toEqual(expect.objectContaining({
      ok: false,
      error: message,
      evidence: expect.objectContaining({ provider: "github", code, status }),
    }));
  });

  it("rejects invalid repository input without calling GitHub", async () => {
    const fetchMock = vi.fn() as typeof fetch;
    const result = await invoke(new GitHubAdapter("secret-token", { fetchImpl: fetchMock }), { owner: "../etc", repo: "repo" });
    expect(result.ok).toBe(false);
    expect(result.evidence).toEqual(expect.objectContaining({ code: "invalid_input" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes malformed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html>nope</html>", { status: 200 })) as typeof fetch;
    const result = await invoke(new GitHubAdapter("secret-token", { fetchImpl: fetchMock }));
    expect(result).toEqual(expect.objectContaining({
      ok: false,
      evidence: expect.objectContaining({ code: "malformed_response" }),
    }));
  });

  it("normalizes timeouts", async () => {
    const fetchMock = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("Aborted");
        error.name = "AbortError";
        reject(error);
      });
    })) as typeof fetch;
    const result = await invoke(new GitHubAdapter("secret-token", { fetchImpl: fetchMock, timeoutMs: 5 }));
    expect(result).toEqual(expect.objectContaining({
      ok: false,
      error: "GitHub request timed out.",
      evidence: expect.objectContaining({ code: "timeout" }),
    }));
  });
});
