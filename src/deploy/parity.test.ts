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
});
