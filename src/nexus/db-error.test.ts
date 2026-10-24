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
    expect(body).toEqual({ error: PERSISTENCE_ERROR_MESSAGE, code: "persistence_error", context: "events.insert" });
    expect(JSON.stringify(body)).not.toContain("nexus_execution_requests");
  });

  it("logs the detail server-side", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    persistenceErrorResponse("x", new Error("relation \"secret_table\" does not exist"));
    expect(spy.mock.calls[0].join(" ")).toContain("secret_table");
  });
});
