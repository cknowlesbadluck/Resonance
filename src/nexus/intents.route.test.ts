import { describe, expect, it } from "vitest";
import { POST } from "../../app/api/nexus/intents/route";

const VALID_PROJECT_ID = "00000000-0000-4000-8000-000000000001";

describe("POST /api/nexus/intents route handler", () => {
  it("returns 400 when request body is invalid JSON", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json payload",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 400 when request body exceeds the 64 KiB limit", async () => {
    const hugeString = "x".repeat(65 * 1024);
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(hugeString.length),
      },
      body: JSON.stringify({ huge: hugeString }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({ error: "Request body exceeds the 64 KiB limit." });
  });

  it("returns 400 when projectId is missing or not a valid UUID", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "invalid-uuid",
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({ error: "projectId must be a UUID." });
  });

  it("returns 400 when objective is missing or invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "   ",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "objective is required and must be at most 4000 characters.",
    });
  });

  it("returns 400 when requestedBy is missing when auth is not configured", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error:
        "requestedBy is required and must be a non-empty string when auth is not configured",
    });
  });

  it("returns 400 when requirements array is empty or invalid", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "requirements must contain between 1 and 32 items with a key.",
    });
  });

  it("returns 400 when requirement key is missing or empty", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [{ key: "   " }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "requirements must contain between 1 and 32 items with a key.",
    });
  });

  it("returns 400 when optional id field is empty string", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "   ",
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "id, if provided, must be a non-empty string.",
    });
  });

  it("returns 400 when contextRefs is not an array of strings", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
        contextRefs: [123],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "contextRefs, if provided, must be an array of strings.",
    });
  });

  it("returns 400 when metadata is not a non-array object", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Test objective",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
        metadata: ["invalid"],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({
      error: "metadata, if provided, must be a non-array object.",
    });
  });

  it("returns 422 when composition fails due to unresolvable requirement", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Unresolvable objective",
        requestedBy: "user-1",
        requirements: [{ key: "nonexistent.capability" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.error).toMatch(/No compatible capability for nonexistent.capability/);
  });

  it("returns 200 with intent and plan on valid request payload", async () => {
    const request = new Request("http://localhost/api/nexus/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: VALID_PROJECT_ID,
        objective: "Valid demo intent",
        requestedBy: "user-1",
        requirements: [{ key: "demo.read" }],
        contextRefs: ["ctx-1"],
        metadata: { source: "test" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.intent).toBeDefined();
    expect(body.intent.projectId).toBe(VALID_PROJECT_ID);
    expect(body.intent.objective).toBe("Valid demo intent");
    expect(body.intent.requestedBy).toBe("user-1");
    expect(body.intent.contextRefs).toEqual(["ctx-1"]);
    expect(body.intent.metadata).toEqual({ source: "test" });
    expect(body.plan).toBeDefined();
    expect(body.plan.intentId).toBe(body.intent.id);
  });
});
