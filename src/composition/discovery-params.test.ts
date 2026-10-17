import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DISCOVERY_LIMITS, parseCapabilityIds, parseSkillDiscoveryParams } from "./discovery-params";
import { GET as getCapabilities } from "../../app/api/nexus/capabilities/route";
import { GET as getSkills } from "../../app/api/nexus/skills/route";

const qs = (init: Record<string, string>) => new URLSearchParams(init);
const many = (n: number, prefix = "id") => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(",");

describe("parseCapabilityIds", () => {
  it("absent ids -> empty list", () => {
    expect(parseCapabilityIds(qs({}))).toEqual({ ok: true, value: [] });
  });

  it("trims, drops blanks and de-duplicates", () => {
    expect(parseCapabilityIds(qs({ ids: " a , ,b,a " }))).toEqual({ ok: true, value: ["a", "b"] });
  });

  it("accepts exactly the max item count", () => {
    const r = parseCapabilityIds(qs({ ids: many(DISCOVERY_LIMITS.maxListItems) }));
    expect(r.ok).toBe(true);
  });

  it("rejects more than the max item count (fail closed, no silent truncation)", () => {
    const r = parseCapabilityIds(qs({ ids: many(DISCOVERY_LIMITS.maxListItems + 1) }));
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toMatch(/at most 50/);
  });

  it("rejects an over-long id", () => {
    const r = parseCapabilityIds(qs({ ids: "x".repeat(DISCOVERY_LIMITS.maxIdLength + 1) }));
    expect(r.ok).toBe(false);
  });

  it("rejects control characters", () => {
    expect(parseCapabilityIds(qs({ ids: "github.read\u0000" })).ok).toBe(false);
    expect(parseCapabilityIds(qs({ ids: "a\u001bb" })).ok).toBe(false);
  });
});

describe("parseSkillDiscoveryParams", () => {
  it("empty params -> no filters", () => {
    expect(parseSkillDiscoveryParams(qs({}))).toEqual({ ok: true, value: { query: undefined, namespace: undefined, tags: undefined } });
  });

  it("passes bounded filters through, trimmed", () => {
    expect(parseSkillDiscoveryParams(qs({ query: " repo ", namespace: "resonance.observe", tags: "github, read" }))).toEqual({
      ok: true,
      value: { query: "repo", namespace: "resonance.observe", tags: ["github", "read"] },
    });
  });

  it("rejects over-long query, namespace and tag", () => {
    expect(parseSkillDiscoveryParams(qs({ query: "q".repeat(DISCOVERY_LIMITS.maxQueryLength + 1) })).ok).toBe(false);
    expect(parseSkillDiscoveryParams(qs({ namespace: "n".repeat(DISCOVERY_LIMITS.maxNamespaceLength + 1) })).ok).toBe(false);
    expect(parseSkillDiscoveryParams(qs({ tags: "t".repeat(DISCOVERY_LIMITS.maxTagLength + 1) })).ok).toBe(false);
  });

  it("rejects too many tags and control characters", () => {
    expect(parseSkillDiscoveryParams(qs({ tags: many(DISCOVERY_LIMITS.maxListItems + 1, "t") })).ok).toBe(false);
    expect(parseSkillDiscoveryParams(qs({ query: "a\nb" })).ok).toBe(false);
    expect(parseSkillDiscoveryParams(qs({ namespace: "ns\u007f" })).ok).toBe(false);
  });
});

describe("discovery routes enforce bounds", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.RESONANCE_AUTH_MODE = "optional";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("GET /api/nexus/capabilities: 400 on too many ids", async () => {
    const res = await getCapabilities(new Request(`http://localhost/api/nexus/capabilities?ids=${many(51)}`));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/ids accepts at most 50/);
  });

  it("GET /api/nexus/capabilities: bounded request still resolves", async () => {
    const res = await getCapabilities(new Request("http://localhost/api/nexus/capabilities?ids=does.not.exist"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requested).toEqual(["does.not.exist"]);
  });

  it("GET /api/nexus/skills: 400 on over-long query", async () => {
    const res = await getSkills(new Request(`http://localhost/api/nexus/skills?query=${"q".repeat(201)}`));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/query must be at most 200/);
  });

  it("GET /api/nexus/skills: bounded filters still return 200", async () => {
    const res = await getSkills(new Request("http://localhost/api/nexus/skills?tags=github&query=repo"));
    expect(res.status).toBe(200);
    expect(Array.isArray((await res.json()).resolutions)).toBe(true);
  });

  it("auth still dominates: required mode without a token -> 401, not 400", async () => {
    process.env.RESONANCE_AUTH_MODE = "required";
    const res = await getCapabilities(new Request(`http://localhost/api/nexus/capabilities?ids=${many(51)}`));
    expect(res.status).toBe(401);
  });
});
