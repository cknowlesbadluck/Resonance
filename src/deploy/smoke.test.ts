import { describe, expect, it } from "vitest";
import { productionSmokeCases, smokePassed } from "./smoke";

describe("production smoke cases", () => {
  it("covers health, ready, idempotency, and the auth boundary", () => {
    const ids = productionSmokeCases().map((item) => item.id);
    expect(ids).toEqual(["health", "ready", "idempotency-required", "executions-auth-boundary"]);
  });

  it("treats missing Idempotency-Key as a hard 400", () => {
    const idempotency = productionSmokeCases().find((item) => item.id === "idempotency-required");
    expect(idempotency?.expectStatus).toEqual([400]);
    expect(idempotency?.headers?.["content-type"]).toBe("application/json");
  });

  it("accepts structured not-ready as a passing ready probe", () => {
    expect(smokePassed(503, [200, 503])).toBe(true);
    expect(smokePassed(500, [200, 503])).toBe(false);
  });
});
