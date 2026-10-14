import { afterEach, describe, expect, it, vi } from "vitest";
import { PERSISTENCE_ERROR_MESSAGE, persistenceErrorResponse } from "./db-error";

describe("persistenceErrorResponse", () => {
  afterEach(() => vi.restoreAllMocks());

  it("never returns the raw database message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const raw = { message: 'duplicate key value violates unique constraint "nexus_execution_requests_pkey"', code: "23505" };
    const res = persistenceErrorResponse("events.insert", raw);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: PERSISTENCE_ERROR_MESSAGE, code: "persistence_error", context: "events.insert", requestId: expect.any(String) });
    expect(res.headers.get("x-request-id")).toBe(body.requestId);
    expect(JSON.stringify(body)).not.toContain("nexus_execution_requests");
  });

  it("logs the detail server-side", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    persistenceErrorResponse("x", new Error("relation \"secret_table\" does not exist"));
    expect(spy.mock.calls[0].join(" ")).toContain("secret_table");
  });
});

import { bodyErrorMessage, publicFailure } from "./db-error";

describe("publicFailure / bodyErrorMessage", () => {
  afterEach(() => vi.restoreAllMocks());
  it("passes CompositionError through and hides everything else", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const comp = Object.assign(new Error("No capability satisfies repo.read"), { name: "CompositionError" });
    expect(publicFailure(comp)).toEqual({ error: "No capability satisfies repo.read", code: "composition_error" });
    const leaked = publicFailure(new Error("GitHub 401: Bad credentials for token ghp_x"));
    expect(leaked.code).toBe("executor_failed");
    expect(leaked.error).not.toContain("ghp_");
  });
  it("keeps size limits, hides parser detail", () => {
    expect(bodyErrorMessage(new Error("Request body exceeds the 64 KiB limit."))).toMatch(/64 KiB/);
    expect(bodyErrorMessage(new SyntaxError("Unexpected token s in JSON at position 3: secret"))).toBe("Invalid JSON body.");
  });
});

describe("request id correlation", () => {
  afterEach(() => vi.restoreAllMocks());
  it("reuses a well-formed inbound X-Request-Id and logs it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = persistenceErrorResponse("x", new Error("boom"), { headers: new Headers({ "x-request-id": "req_abc12345" }) });
    expect((await res.json()).requestId).toBe("req_abc12345");
    expect(spy.mock.calls[0].join(" ")).toContain("requestId=req_abc12345");
  });
  it("ignores malformed inbound ids (no log/response injection)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = persistenceErrorResponse("x", new Error("boom"), { headers: new Headers({ "x-request-id": "bad id\\nINJECT" }) });
    const { requestId } = await res.json();
    expect(requestId).not.toContain("INJECT");
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
