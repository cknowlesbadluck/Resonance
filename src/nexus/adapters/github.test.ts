import { describe, expect, it, vi } from "vitest";
import { GitHubAdapter, githubRepositoryReadCapability } from "./github";

describe("GitHubAdapter", () => {
  it("describes the normalized repository capability", async () => {
    const adapter = new GitHubAdapter("test-token");
    const description = await adapter.describe();
    expect(description.identity.id).toBe("github");
    expect(description.capabilities).toContainEqual(githubRepositoryReadCapability);
  });

  it("reads repository metadata with authenticated GitHub headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ full_name: "octo/repo" }), { status: 200 }));
    const adapter = new GitHubAdapter("secret-token");
    const result = await adapter.invoke({
      capabilityId: githubRepositoryReadCapability.id,
      input: { owner: "octo", repo: "repo" },
      actorId: "user-1",
      correlationId: "execution-1",
    });
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ full_name: "octo/repo" });
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
    fetchMock.mockRestore();
  });

  it("normalizes provider failures into an invocation result", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }));
    const result = await new GitHubAdapter("secret-token").invoke({
      capabilityId: githubRepositoryReadCapability.id,
      input: { owner: "octo", repo: "missing" },
      actorId: "user-1",
      correlationId: "execution-2",
    });
    expect(result).toEqual(expect.objectContaining({ ok: false, error: "Not Found" }));
    fetchMock.mockRestore();
  });
});
