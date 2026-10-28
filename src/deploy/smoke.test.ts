import { describe, expect, it } from "vitest";
import { PUBLIC_SMOKE_PATHS, productionSmokeCases, smokePassed } from "./smoke";

describe("production smoke cases", () => {
  it("covers liveness, readiness, and every anonymous refusal edge", () => {
    const ids = productionSmokeCases().map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(["health", "ready", "executions-post-unauth", "executions-get-unauth", "events-post-unauth", "skills-resolve-post-unauth", "resume-long-id-unauth", "webhook-github-unsigned"]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is fail-closed: non-public routes accept 401 and never 200 for anonymous callers", () => {
    for (const c of productionSmokeCases().filter((x) => !PUBLIC_SMOKE_PATHS.includes(x.path))) {
      expect(c.expectStatus, c.id).toContain(401);
      expect(c.expectStatus.some((s) => s >= 200 && s < 300), c.id).toBe(false);
      if (c.targetStatus) expect(c.targetStatus, c.id).toEqual([401]);
      // a non-401 status is only allowed while a target says it will be tightened
      if (c.expectStatus.some((s) => s !== 401)) expect(c.targetStatus, `${c.id} needs targetStatus`).toEqual([401]);
    }
  });

  it("matches the runtime case list in scripts/production-smoke-cases.mjs", async () => {
    const path = "../../scripts/production-smoke-cases.mjs";
    const mod = (await import(path)) as { productionSmokeCases: () => unknown; PUBLIC_SMOKE_PATHS: string[] };
    expect(mod.productionSmokeCases()).toEqual(productionSmokeCases());
    expect(mod.PUBLIC_SMOKE_PATHS).toEqual(PUBLIC_SMOKE_PATHS);
  });

  it("accepts structured not-ready as a passing ready probe", () => {
    expect(smokePassed(503, [200, 503])).toBe(true);
    expect(smokePassed(500, [200, 503])).toBe(false);
  });
});
