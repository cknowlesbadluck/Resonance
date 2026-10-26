import { describe, expect, it } from "vitest";
import { safeErrorSummary } from "./log-safe";

describe("safeErrorSummary", () => {
  it("keeps a Postgres code, drops message/details", () => {
    const s = safeErrorSummary({ code: "23505", message: "Key (email)=(a@b.c) exists", details: "secret" });
    expect(s).toEqual({ code: "23505", kind: "object" });
    expect(JSON.stringify(s)).not.toMatch(/a@b\.c|secret/);
  });
  it("rejects code values that could carry data", () => {
    expect(safeErrorSummary({ code: "token=abc def" }).code).toBe("unknown");
  });
  it("handles Error, null and strings", () => {
    expect(safeErrorSummary(new TypeError("leak sk-123"))).toEqual({ code: "unknown", kind: "TypeError" });
    expect(safeErrorSummary(null)).toEqual({ code: "unknown", kind: "object" });
    expect(JSON.stringify(safeErrorSummary("password=x"))).not.toMatch(/password/);
  });
});

describe("safeErrorSummary hostile shapes (review)", () => {
  it("does not throw on non-primitive or throwing code", () => {
    expect(safeErrorSummary({ code: { toString: null } })).toEqual({ code: "unknown", kind: "object" });
    const hostile = Object.defineProperty({}, "code", { get() { throw new Error("boom"); } });
    expect(safeErrorSummary(hostile).code).toBe("unknown");
    expect(safeErrorSummary({ code: 23505 }).code).toBe("23505");
  });
});
