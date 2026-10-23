import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateDeployContract } from "./contract";
import { EXPECTED_CONTRACT_REVISION } from "./deployLag";
import { readiness } from "./health";

const ROOT = path.resolve(__dirname, "../..");
const SCRIPT = path.join(ROOT, "scripts/deploy-parity.mjs");

function run(args: string[]): Record<string, unknown> {
  return JSON.parse(execFileSync(process.execPath, [SCRIPT, ...args, "--json"], { cwd: ROOT, encoding: "utf8" }));
}

describe("deploy-parity script", () => {
  it("derives exactly the fields main's readiness() serializes", () => {
    const expected = run(["--expected"]) as { fields: string[]; contractRevision: string };
    const body = readiness(evaluateDeployContract({ NODE_ENV: "production" }));
    expect([...expected.fields].sort()).toEqual(Object.keys(body).sort());
    expect(expected.contractRevision).toBe(EXPECTED_CONTRACT_REVISION);
  });

  it("main's own body is in parity", () => {
    const body = readiness(evaluateDeployContract({ NODE_ENV: "production" }));
    const dir = mkdtempSync(path.join(tmpdir(), "parity-"));
    const file = path.join(dir, "main-ready.json");
    writeFileSync(file, JSON.stringify(body));
    try {
      const out = run(["--body-file", file]);
      expect(out.verdict).toBe("in_parity");
      expect(out.behindMain).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports the 2026-10-16 live body as behind main, naming fields only", () => {
    const out = run(["--body-file", path.join(ROOT, "src/deploy/__fixtures__/ready-live-2026-10-16.json")]);
    expect(out.verdict).toBe("behind_main");
    expect(out.missingFields).toEqual(
      expect.arrayContaining(["contractRevision", "ownerActionRequired", "ownerKeys", "agentActionRequired", "posture"]),
    );
    expect(out.liveContractRevision).toBeNull();
    expect(String(out.summary)).toMatch(/^prod is behind main/);
    // Never echoes values from the live body (only names + the public revision stamp).
    expect(JSON.stringify(out)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("--plan turns the stale 503 into an ordered owner unblock plan, names from main's allowlist only", () => {
    const out = run(["--body-file", path.join(ROOT, "src/deploy/__fixtures__/ready-live-2026-10-16.json"), "--plan"]) as {
      plan: { productionReady: boolean; steps: { who: string; action: string }[] };
    };
    expect(out.plan.productionReady).toBe(false);
    const who = out.plan.steps.map((s) => s.who);
    expect(who[who.length - 1]).toBe("agent"); // always ends with a verify step
    expect(out.plan.steps.some((s) => s.who === "owner" && /Redeploy main/.test(s.action))).toBe(true);
  });

  it("--plan is empty for main's own ready body and ignores non-env-name junk", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "parity-plan-"));
    try {
      const ready = { ...readiness(evaluateDeployContract({ NODE_ENV: "production" })), status: "ready", authModeOk: true, missingRequired: [] };
      const readyFile = path.join(dir, "ready.json");
      writeFileSync(readyFile, JSON.stringify(ready));
      expect(run(["--body-file", readyFile, "--plan"]).plan).toEqual({ productionReady: true, steps: [] });
      const junkFile = path.join(dir, "junk.json");
      writeFileSync(junkFile, JSON.stringify({ service: "resonance-nexus", missingRequired: ["<script>", "lower_case", "X".repeat(80)] }));
      const plan = run(["--body-file", junkFile, "--plan"]).plan;
      expect(JSON.stringify(plan)).not.toMatch(/<script>|lower_case|XXXX/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
