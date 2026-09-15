import { describe, expect, it } from "vitest";
import { LinearAdapter, linearIssueReadCapability } from "./linear";

function response(body: unknown, init: { status?: number; text?: string } = {}) {
  const status = init.status ?? 200;
  const payload = init.text ?? JSON.stringify(body);
  return new Response(payload, { status, headers: { "Content-Type": "application/json" } });
}

function adapter(fetchImpl: typeof fetch, timeoutMs = 8_000) {
  return new LinearAdapter("lin_api_test", { fetchImpl, timeoutMs });
}

const request = { capabilityId: "linear.issue.read", input: { id: "CHR-51" }, actorId: "a1", correlationId: "c1" };

const issuePayload = {
  data: {
    issue: {
      id: "11111111-1111-4111-8111-111111111111",
      identifier: "CHR-51",
      title: "Execution concurrency",
      url: "https://linear.app/x/issue/CHR-51",
      state: { name: "In Progress", type: "started" },
      team: { key: "CHR", name: "Chris" },
    },
  },
};

describe("LinearAdapter", () => {
  it("requires an API key", () => {
    expect(() => new LinearAdapter("   ")).toThrowError(/LINEAR_API_KEY/);
  });

  it("declares exactly the capability it can invoke", async () => {
    const description = await adapter(async () => response({})).describe();
    expect(description.identity.id).toBe("linear");
    expect(description.capabilities.map((c) => c.id)).toEqual(["linear.issue.read"]);
    expect(linearIssueReadCapability.requiredPermissions).toEqual(["issue.read"]);
    expect(linearIssueReadCapability.executable).toBe(true);
  });

  it("rejects a capability it does not declare", async () => {
    const result = await adapter(async () => response({})).invoke({ ...request, capabilityId: "linear.issue.write" });
    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({ code: "unsupported_capability" });
  });

  it("reads an issue and returns a provider-neutral shape", async () => {
    let sent: RequestInit | undefined;
    const result = await adapter(async (_url, init) => {
      sent = init;
      return response(issuePayload);
    }).invoke(request);

    expect(result.ok).toBe(true);
    expect(result.output).toMatchObject({
      provider: "linear",
      resourceType: "issue",
      identifier: "CHR-51",
      state: "In Progress",
      teamKey: "CHR",
    });
    // Linear personal API keys are sent bare, not as a Bearer token.
    const headers = sent?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("lin_api_test");
  });

  it("validates the issue identifier before making a request", async () => {
    let called = false;
    const run = (input: unknown) => adapter(async () => { called = true; return response(issuePayload); }).invoke({ ...request, input });

    for (const bad of [null, {}, { id: "" }, { id: "not an id" }, { id: "lowercase-1" }]) {
      const result = await run(bad);
      expect(result.ok).toBe(false);
      expect(result.evidence).toMatchObject({ code: "invalid_input" });
    }
    expect(called).toBe(false);
  });

  it("accepts either an identifier or a UUID", async () => {
    for (const id of ["CHR-51", "11111111-1111-4111-8111-111111111111"]) {
      const result = await adapter(async () => response(issuePayload)).invoke({ ...request, input: { id } });
      expect(result.ok).toBe(true);
    }
  });

  /**
   * Linear returns HTTP 200 with a populated `errors` array for application-level
   * failures, so a 200 is not on its own evidence of success.
   */
  it("treats a 200 carrying GraphQL errors as a failure", async () => {
    const result = await adapter(async () => response({
      errors: [{ message: "Authentication required", extensions: { code: "AUTHENTICATION_ERROR" } }],
    })).invoke(request);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Authentication required");
    expect(result.evidence).toMatchObject({ code: "unauthorized" });
  });

  it("classifies GraphQL rate limiting", async () => {
    const result = await adapter(async () => response({
      errors: [{ message: "slow down", extensions: { code: "RATELIMITED" } }],
    })).invoke(request);
    expect(result.evidence).toMatchObject({ code: "rate_limited" });
  });

  it("classifies by HTTP status before attempting to parse the body", async () => {
    const cases: [number, string][] = [[401, "unauthorized"], [403, "forbidden"], [404, "not_found"], [429, "rate_limited"], [503, "unavailable"]];
    for (const [status, code] of cases) {
      // A non-JSON error page must still classify by status, not be masked as malformed.
      const result = await adapter(async () => response(null, { status, text: "<html>nope</html>" })).invoke(request);
      expect(result.ok).toBe(false);
      expect(result.evidence).toMatchObject({ code, status });
    }
  });

  it("reports a missing issue as not_found rather than a malformed response", async () => {
    const result = await adapter(async () => response({ data: { issue: null } })).invoke(request);
    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({ code: "not_found" });
  });

  it("reports an unexpected issue shape as malformed", async () => {
    const result = await adapter(async () => response({ data: { issue: { id: 7 } } })).invoke(request);
    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({ code: "malformed_response" });
  });

  it("reports unparseable success bodies as malformed", async () => {
    const result = await adapter(async () => response(null, { text: "not json" })).invoke(request);
    expect(result.evidence).toMatchObject({ code: "malformed_response" });
  });

  it("times out rather than hanging the execution", async () => {
    const result = await adapter((_url, init) => new Promise((_resolve, reject) => {
      (init?.signal as AbortSignal).addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }), 5).invoke(request);

    expect(result.ok).toBe(false);
    expect(result.evidence).toMatchObject({ code: "timeout" });
  });

  it("never leaks the api key into evidence or error text", async () => {
    const result = await adapter(async () => response(null, { status: 401, text: "lin_api_test rejected" })).invoke(request);
    expect(JSON.stringify(result)).not.toContain("lin_api_test");
  });
});
