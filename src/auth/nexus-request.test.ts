import { describe, expect, it, beforeEach, afterEach, vi, Mock } from "vitest";
import { authenticateNexusRequest } from "./nexus-request";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("authenticateNexusRequest", () => {
  const originalEnv = { ...process.env };

  const mockProjectId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUserId = "987fcdeb-51a2-43d7-9012-345678901234";
  const mockToken = "valid-token";

  let mockRequest: Request;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-service-key";

    mockRequest = new Request("https://example.com", {
      headers: {
        authorization: `Bearer ${mockToken}`,
      },
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function setupDbMock(
    userResult: { data: { user: { id: string } | null }; error: any },
    membershipResult: { data: any; error: any }
  ) {
    const maybeSingle = vi.fn().mockResolvedValue(membershipResult);
    const eqUserId = vi.fn().mockReturnValue({ maybeSingle });
    const eqProjectId = vi.fn().mockReturnValue({ eq: eqUserId });
    const select = vi.fn().mockReturnValue({ eq: eqProjectId });
    const from = vi.fn().mockReturnValue({ select });
    const getUser = vi.fn().mockResolvedValue(userResult);

    const mockDb = {
      auth: { getUser },
      from,
    };

    (createClient as Mock).mockReturnValue(mockDb);
    return { getUser, from, select, eqProjectId, eqUserId, maybeSingle };
  }

  it("returns null if projectId is not a UUID", async () => {
    const result = await authenticateNexusRequest(mockRequest, "not-a-uuid");
    expect(result).toBeNull();
  });

  it("returns null if authorization header is missing", async () => {
    const request = new Request("https://example.com");
    const result = await authenticateNexusRequest(request, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if authorization header does not start with Bearer", async () => {
    const request = new Request("https://example.com", {
      headers: { authorization: "Basic " + btoa("user:pass") },
    });
    const result = await authenticateNexusRequest(request, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if SUPABASE_URL env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if SUPABASE_SERVICE_ROLE_KEY env var is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if db.auth.getUser returns an error", async () => {
    setupDbMock(
      { data: { user: null }, error: new Error("Auth failed") },
      { data: null, error: null }
    );
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if db.auth.getUser returns no user", async () => {
    setupDbMock(
      { data: { user: null }, error: null },
      { data: null, error: null }
    );
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if membership query returns an error", async () => {
    setupDbMock(
      { data: { user: { id: mockUserId } }, error: null },
      { data: null, error: new Error("DB Error") }
    );
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns null if no membership is found", async () => {
    setupDbMock(
      { data: { user: { id: mockUserId } }, error: null },
      { data: null, error: null }
    );
    const result = await authenticateNexusRequest(mockRequest, mockProjectId);
    expect(result).toBeNull();
  });

  it("returns userId and projectId if authentication and membership succeed", async () => {
    const { getUser, from, select, eqProjectId, eqUserId, maybeSingle } = setupDbMock(
      { data: { user: { id: mockUserId } }, error: null },
      { data: { project_id: mockProjectId }, error: null }
    );

    const result = await authenticateNexusRequest(mockRequest, mockProjectId);

    expect(result).toEqual({ userId: mockUserId, projectId: mockProjectId });

    // Verify createClient was called correctly
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "secret-service-key",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Verify token was passed to getUser
    expect(getUser).toHaveBeenCalledWith(mockToken);

    // Verify membership query was built correctly
    expect(from).toHaveBeenCalledWith("project_members");
    expect(select).toHaveBeenCalledWith("project_id");
    expect(eqProjectId).toHaveBeenCalledWith("project_id", mockProjectId);
    expect(eqUserId).toHaveBeenCalledWith("user_id", mockUserId);
    expect(maybeSingle).toHaveBeenCalled();
  });
});
