import { describe, expect, it } from "vitest";
import { compareParity } from "../../scripts/deploy-parity.mjs";
import { deployedCommitSha, readiness } from "./health";

const A = "a".repeat(40);
describe("deploy parity", () => {
  it("reads the first valid 40-hex SHA from host env, ignoring junk", () => {
    expect(deployedCommitSha({ COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: A.toUpperCase() })).toBe(A);
    expect(deployedCommitSha({ RESONANCE_COMMIT_SHA: "  " + A + " " })).toBe(A);
    expect(deployedCommitSha({})).toBeNull();
  });
  it("readiness carries commitSha additively", () => {
    expect(readiness()).toHaveProperty("commitSha");
  });
  it("fails closed when either side is unknown", () => {
    expect(compareParity(null, A)).toEqual({ parity: false, reason: "live_sha_missing" });
    expect(compareParity(A, undefined).reason).toBe("main_sha_unknown");
    expect(compareParity(A, "b".repeat(40)).reason).toBe("drift");
    expect(compareParity(A, A.toUpperCase()).parity).toBe(true);
  });
});
