import { describe, expect, it } from "vitest";
import { classifyProbeSurface, classifyPublicReady } from "../../scripts/public-ready-pin.mjs";

const liveOwnerBody = {
  status: "not_ready",
  service: "resonance-nexus",
  stage: "deployment",
  production: true,
  authMode: "required",
  authModeOk: true,
  persistenceConfigured: false,
  githubAdapterConfigured: false,
  missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
  timestamp: "2026-10-05T21:01:54.282Z",
};

describe("public ready pin", () => {
  it("flags the live 2026-10-05 Netlify body as deploy lag and not proof", () => {
    const result = classifyPublicReady(liveOwnerBody);
    expect(result.deployLag).toBe(true);
    expect(result.missingContractFields).toContain("contractRevision");
    expect(result.missingContractFields).toContain("ownerActionRequired");
    expect(result.countsAsProof).toBe(false);
  });

  it("accepts a contract-shaped owner gate without calling it proof", () => {
    const result = classifyPublicReady({
      status: "not_ready",
      ownerActionRequired: true,
      ownerKeys: ["SUPABASE_SERVICE_ROLE_KEY"],
      agentActionRequired: false,
      missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"],
      contractRevision: "2026-10-03-owner-gate",
    });
    expect(result.deployLag).toBe(false);
    expect(result.ownerGateOpen).toBe(true);
    expect(result.countsAsProof).toBe(false);
  });

  it("classifies a dead Vercel alias as absent, not an owner gate", () => {
    const result = classifyProbeSurface({
      url: "https://resonancenexus.vercel.app/api/ready",
      httpStatus: 404,
      bodyText: "The deployment could not be found on Vercel.\n\nDEPLOYMENT_NOT_FOUND",
      json: null,
    });
    expect(result.kind).toBe("alias_absent");
    expect(result.aliasAbsent).toBe(true);
    expect(result.deployLag).toBe(false);
    expect(result.ownerGateOpen).toBe(false);
    expect(result.countsAsProof).toBe(false);
  });

  it("rejects a Vercel host even when it returns a ready-shaped JSON body", () => {
    const result = classifyProbeSurface({
      url: "https://resonance-2in3qv6ni-inbetweenz.vercel.app/api/ready",
      httpStatus: 200,
      bodyText: "{}",
      json: {
        status: "ready",
        ownerActionRequired: false,
        ownerKeys: [],
        agentActionRequired: false,
        missingRequired: [],
        contractRevision: "2026-10-03-owner-gate",
      },
    });
    expect(result.aliasAbsent).toBe(true);
    expect(result.countsAsProof).toBe(false);
    expect(result.note).toBe("vercel_alias_is_not_the_public_gate");
  });

  it("keeps the canonical Netlify 503 on the owner-gate path", () => {
    const result = classifyProbeSurface({
      url: "https://resonancenexus.netlify.app/api/ready",
      httpStatus: 503,
      bodyText: JSON.stringify(liveOwnerBody),
      json: liveOwnerBody,
    });
    expect(result.kind).toBe("deploy_lag");
    expect(result.aliasAbsent).toBe(false);
    expect(result.note).toBe("canonical_public_host");
    expect(result.countsAsProof).toBe(false);
  });
});
