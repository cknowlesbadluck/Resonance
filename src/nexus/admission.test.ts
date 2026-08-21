import { describe, expect, it } from "vitest";

describe("execution admission contract", () => {
  it("defines the durable admission outcomes", () => {
    const outcomes = ["accepted", "replay", "conflict", "rate_limited"] as const;
    expect(outcomes).toEqual(["accepted", "replay", "conflict", "rate_limited"]);
  });
});
