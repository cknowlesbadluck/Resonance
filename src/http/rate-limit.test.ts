import { describe, expect, it } from "vitest";
import { FixedWindowLimiter, clientKey, isExempt, limitFromEnv } from "./rate-limit";

describe("FixedWindowLimiter", () => {
  it("allows up to the limit then refuses until the window resets", () => {
    const l = new FixedWindowLimiter(2, 1000);
    expect(l.check("a", 0).allowed).toBe(true);
    expect(l.check("a", 10).allowed).toBe(true);
    const third = l.check("a", 20);
    expect(third.allowed).toBe(false);
    expect(third.resetSeconds).toBe(1);
    expect(l.check("b", 20).allowed).toBe(true);
    expect(l.check("a", 1000).allowed).toBe(true);
  });

  it("bounds memory by evicting stale keys", () => {
    const l = new FixedWindowLimiter(1, 1000, 2);
    l.check("a", 0); l.check("b", 0);
    expect(l.check("c", 5000).allowed).toBe(true);
  });
});

describe("helpers", () => {
  it("keys on the first forwarded hop", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
  it("exempts probes and webhooks only", () => {
    expect(isExempt("/api/health")).toBe(true);
    expect(isExempt("/api/webhooks/github")).toBe(true);
    expect(isExempt("/api/events")).toBe(false);
  });
  it("parses env limits defensively", () => {
    expect(limitFromEnv("50", 10)).toBe(50);
    expect(limitFromEnv("-1", 10)).toBe(10);
    expect(limitFromEnv(undefined, 10)).toBe(10);
  });
});
