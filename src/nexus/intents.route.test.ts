import { describe, expect, it } from "vitest";
import { POST } from "../../app/api/nexus/intents/route";

describe("POST /api/nexus/intents error paths and validation", () => {
  const validProjectId = "123e4567-e89b-12d3-a456-426614174000";

  it("returns 400 for invalid JSON body", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json payload",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 400 when body exceeds size limit", async () => {
    const largeString = "a".repeat(65 * 1024);
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "content-length": String(largeString.length),
      },
      body: JSON.stringify({ data: largeString }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/exceeds the 64 KiB limit/i);
  });

  it("returns 400 when projectId is missing or invalid UUID", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "invalid-project-uuid",
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: "projectId must be a UUID." });
  });

  it("returns 400 when objective is missing or invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "   ",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/objective is required/i);
  });

  it("returns 400 when requestedBy is missing", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/requestedBy is required/i);
  });

  it("returns 400 when requirements array is invalid or empty", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/requirements must contain/i);
  });

  it("returns 400 when optional field id is invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
        id: "   ",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/id, if provided, must be a non-empty string/i);
  });

  it("returns 400 when optional field contextRefs is invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
        contextRefs: "not-an-array",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/contextRefs, if provided, must be an array/i);
  });

  it("returns 400 when optional field metadata is invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
        metadata: ["invalid-array-metadata"],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/metadata, if provided, must be a non-array object/i);
  });

  it("returns 422 when composition fails for unknown requirement capability", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Test objective",
        requestedBy: "user-123",
        requirements: [{ key: "nonexistent.capability.key" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const json = await response.json();
    expect(json.error).toMatch(/No compatible capability for nonexistent.capability.key/i);
  });

  it("returns 200 with intent and plan for valid payload", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: validProjectId,
        objective: "Fetch demo status",
        requestedBy: "user-123",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.intent).toBeDefined();
    expect(json.intent.projectId).toBe(validProjectId);
    expect(json.intent.objective).toBe("Fetch demo status");
    expect(json.plan).toBeDefined();
    expect(json.plan.steps.length).toBe(1);
  });
});
