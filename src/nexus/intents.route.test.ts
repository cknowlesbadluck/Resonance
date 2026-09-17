import { describe, expect, it } from "vitest";
import { POST } from "../../app/api/nexus/intents/route";

const VALID_PROJECT_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("POST /api/nexus/intents route", () => {
  it("returns 400 when body is invalid JSON", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "invalid json {",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 400 when content-length header exceeds 64 KiB", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(65 * 1024),
      },
      body: JSON.stringify({ projectId: VALID_PROJECT_ID }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/exceeds the 64 KiB limit/i);
  });

  it("returns 400 when body text exceeds 64 KiB", async () => {
    const largePadding = "a".repeat(65 * 1024);
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: largePadding }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/exceeds the 64 KiB limit/i);
  });

  it("returns 400 when projectId is missing or invalid UUID", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: "invalid-uuid",
        objective: "Read repository",
        requestedBy: "user-1",
        requirements: [{ key: "github.repository.read" }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "projectId must be a UUID." });
  });

  it("returns 400 when objective is missing, empty, or exceeds 4000 characters", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "   ",
        requestedBy: "user-1",
        requirements: [{ key: "github.repository.read" }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/objective is required/i);
  });

  it("returns 400 when requestedBy is missing or whitespace when auth not required", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Read repository",
        requestedBy: "  ",
        requirements: [{ key: "github.repository.read" }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/requestedBy is required/i);
  });

  it("returns 400 when requirements is invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Read repository",
        requestedBy: "user-1",
        requirements: [],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/requirements must contain between 1 and 32 items/i);
  });

  it("returns 400 when optional fields (id, contextRefs, metadata) have invalid types", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Read repository",
        requestedBy: "user-1",
        requirements: [{ key: "github.repository.read" }],
        metadata: ["invalid-array"],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/metadata, if provided, must be a non-array object/i);
  });

  it("returns 200 with intent and plan for a valid payload", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Read repository",
        requestedBy: "user-1",
        requirements: [{ key: "github.repository.read" }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.intent).toBeDefined();
    expect(data.intent.projectId).toBe(VALID_PROJECT_ID);
    expect(data.plan).toBeDefined();
  });
});
