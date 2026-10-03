import { describe, expect, it } from "vitest";
import { CANONICAL_PUBLIC_HOST, classifyDeploymentTarget } from "./hostGate";

describe("classifyDeploymentTarget", () => {
  it("recognizes the public Netlify host and still refuses to call it proof", () => {
    const result = classifyDeploymentTarget(`https://${CANONICAL_PUBLIC_HOST}/api/ready`);
    expect(result.publicHost).toBe(true);
    expect(result.vercelAlias).toBe(false);
    expect(result.note).toBe("canonical_public_host");
    expect(result.countsAsProductionProof).toBe(false);
  });

  it("treats the 15:03Z GitHub production target as a Vercel alias, not the gate", () => {
    const result = classifyDeploymentTarget("https://resonance-2in3qv6ni-inbetweenz.vercel.app");
    expect(result.publicHost).toBe(false);
    expect(result.vercelAlias).toBe(true);
    expect(result.note).toBe("vercel_alias_is_not_the_public_gate");
    expect(result.countsAsProductionProof).toBe(false);
  });

  it("does not invent a host from garbage", () => {
    const result = classifyDeploymentTarget("not a url");
    expect(result.publicHost).toBe(false);
    expect(result.vercelAlias).toBe(false);
    expect(result.note).toBe("unknown_host");
    expect(result.countsAsProductionProof).toBe(false);
  });
});
