import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/nexus/identities route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RESONANCE_AUTH_MODE;
    delete process.env.RESONANCE_PROJECT_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns identities and resources in response JSON", async () => {
    const req = new Request("http://localhost/api/nexus/identities");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("identities");
    expect(body).toHaveProperty("resources");
    expect(Array.isArray(body.identities)).toBe(true);
    expect(Array.isArray(body.resources)).toBe(true);
    expect(body.identities.length).toBeGreaterThan(0);
  });

  it("returns 400 if projectId parameter is invalid non-UUID", async () => {
    const req = new Request("http://localhost/api/nexus/identities?projectId=invalid-id");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/projectId must be a UUID/i);
  });

  it("returns 200 with valid UUID projectId", async () => {
    const req = new Request("http://localhost/api/nexus/identities?projectId=123e4567-e89b-12d3-a456-426614174000");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
