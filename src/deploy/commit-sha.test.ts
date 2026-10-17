import { describe, expect, it } from "vitest";
import { deployedCommitSha, readiness } from "./health";

// The deploy-parity *script* lives in #202 (scripts/deploy-parity.mjs, contract field-set parity).
// This PR keeps only the additive commitSha on /api/ready, which #202's script can also compare.
const A = "a".repeat(40);
describe("deployed commitSha", () => {
  it("reads the first valid 40-hex SHA from host env, ignoring junk", () => {
    expect(deployedCommitSha({ COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: A.toUpperCase() })).toBe(A);
    expect(deployedCommitSha({ RESONANCE_COMMIT_SHA: "  " + A + " " })).toBe(A);
    expect(deployedCommitSha({})).toBeNull();
  });
  it("readiness carries commitSha additively", () => {
    expect(readiness()).toHaveProperty("commitSha");
  });
});
