import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { authenticateNexusRequest, isUuid } from "./nexus-request";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("authenticateNexusRequest", () => {
  const originalEnv = { ...process.env };
  const validProjectId = "123e4567-e89b-12d3-a456-426614174000";
  const validUserId = "98765432-b98e-43d1-a123-555555555555";
  const validToken = "valid-bearer-token";

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isUuid", () => {
    it("validates UUID format correctly", () => {
      expect(isUuid(validProjectId)).toBe(true);
      expect(isUuid("not-a-uuid")).toBe(false);
      expect(isUuid(12345)).toBe(false);
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
    });
  });

  describe("authenticateNexusRequest", () => {
    it("returns null if projectId is invalid or not a UUID", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      expect(await authenticateNexusRequest(request, "invalid-uuid")).toBeNull();
      expect(await authenticateNexusRequest(request, null)).toBeNull();
      expect(await authenticateNexusRequest(request, 123)).toBeNull();
    });

    it("returns null if Authorization header is missing or does not start with Bearer", async () => {
      const requestNoAuth = new Request("https://example.com");
      expect(await authenticateNexusRequest(requestNoAuth, validProjectId)).toBeNull();

      const requestBasicAuth = new Request("https://example.com", {
        headers: { authorization: "Basic dXNlcjpwYXNz" },
      });
      expect(await authenticateNexusRequest(requestBasicAuth, validProjectId)).toBeNull();
    });

    it("returns null if Bearer token is empty or whitespace only", async () => {
      const requestEmptyBearer = new Request("https://example.com", {
        headers: { authorization: "Bearer " },
      });
      expect(await authenticateNexusRequest(requestEmptyBearer, validProjectId)).toBeNull();

      const requestSpaceBearer = new Request("https://example.com", {
        headers: { authorization: "Bearer    " },
      });
      expect(await authenticateNexusRequest(requestSpaceBearer, validProjectId)).toBeNull();
    });

    it("returns null if required environment variables are missing", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(await authenticateNexusRequest(request, validProjectId)).toBeNull();

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(await authenticateNexusRequest(request, validProjectId)).toBeNull();
    });

    it("returns null if Supabase getUser fails or returns error", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error("Invalid token"),
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: mockGetUser },
      } as any);

      const result = await authenticateNexusRequest(request, validProjectId);
      expect(result).toBeNull();
      expect(mockGetUser).toHaveBeenCalledWith(validToken);
    });

    it("returns null if user is missing from getUser result", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: mockGetUser },
      } as any);

      const result = await authenticateNexusRequest(request, validProjectId);
      expect(result).toBeNull();
    });

    it("returns null if project membership check fails with error", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("DB Error"),
        }),
      });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
      } as any);

      const result = await authenticateNexusRequest(request, validProjectId);
      expect(result).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("project_members");
      expect(mockSelect).toHaveBeenCalledWith("project_id");
      expect(mockEq1).toHaveBeenCalledWith("project_id", validProjectId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", validUserId);
    });

    it("returns null if project membership record is not found", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
      } as any);

      const result = await authenticateNexusRequest(request, validProjectId);
      expect(result).toBeNull();
    });

    it("returns NexusRequestAuth object when token and membership are valid", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: `Bearer ${validToken}` },
      });

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { project_id: validProjectId },
          error: null,
        }),
      });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
      } as any);

      const result = await authenticateNexusRequest(request, validProjectId);
      expect(result).toEqual({
        userId: validUserId,
        projectId: validProjectId,
      });
      expect(createClient).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "service-role-secret",
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
    });
  });
});
