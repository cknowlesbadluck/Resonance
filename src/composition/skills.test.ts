import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSkillResolveBody } from "./skills";

async function freshSkills(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./skills");
}

beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.LINEAR_API_KEY;
});

describe("builtin skill plane", () => {
  it("is not composable when no forge or tracker adapter is configured", async () => {
    const skills = await freshSkills();
    const resolutions = await skills.discoverResolvedSkills("control-surface");
    const repository = resolutions.find((item) => item.skill.id === "resonance.observe.repository");
    const review = resolutions.find((item) => item.skill.id === "resonance.govern.review");
    expect(repository?.composable).toBe(false);
    expect(repository?.missing).toContain("github.repository.read");
    expect(review?.composable).toBe(false);
    expect(review?.denied).toContain("skill.code-review");
  });

  it("becomes composable only for the capability the configured adapter declares", async () => {
    const skills = await freshSkills({ GITHUB_TOKEN: "ghp_test_token" });
    const resolution = await skills.resolveBuiltinSkill("resonance.observe.repository", "actor-1");
    expect(resolution?.composable).toBe(true);
    expect(resolution?.approvalRequired).toBe(false);
    expect(resolution?.requirements[0].capability?.id).toBe("github.repository.read");
    expect(resolution?.requirements[0].capability?.executable).toBe(true);

    const review = await skills.resolveBuiltinSkill("resonance.govern.review", "actor-1");
    expect(review?.composable).toBe(false);
  });

  it("does not expose a registration mutation and rejects a malformed resolve body", () => {
    expect(parseSkillResolveBody(null)).toEqual({ error: "Invalid JSON body." });
    expect(parseSkillResolveBody({ skillId: "resonance.observe.repository", projectId: "demo" })).toEqual({
      error: "projectId must be a UUID.",
    });
    expect(parseSkillResolveBody({
      skillId: "resonance.observe.repository",
      projectId: "00000000-0000-4000-8000-000000000001",
    })).toEqual({
      skillId: "resonance.observe.repository",
      projectId: "00000000-0000-4000-8000-000000000001",
    });
  });
});
