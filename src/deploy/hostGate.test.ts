import { describe, expect, it } from "vitest";
import { CANONICAL_PUBLIC_HOST, classifyDeploymentTarget } from "./hostGate";

describe("classifyDeploymentTarget", () => {
  it("recognizes the canonical public host without treating a deploy status as proof", () => {
    const result = classifyDeploymentTarget(`https://${CANONICAL_PUBLIC_HOST}/api/ready`);
    expect(result.publicHost).toBe(true);
    expect(result.note).toBe("canonical_public_host");
    expect(result.countsAsProductionProof).toBe(false);
  });

  it("treats an alternate preview host as non-canonical", () => {
    const result = classifyDeploymentTarget("https://preview.example.net/api/ready");
    expect(result.publicHost).toBe(false);
    expect(result.note).toBe("unknown_host");
    expect(result.countsAsProductionProof).toBe(false);
  });

  it("does not invent a host from garbage", () => {
    const result = classifyDeploymentTarget("not a url");
    expect(result.publicHost).toBe(false);
    expect(result.note).toBe("unknown_host");
    expect(result.countsAsProductionProof).toBe(false);
  });
});
