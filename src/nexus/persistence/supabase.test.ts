import { describe, expect, it, vi } from "vitest";
import { SupabaseNexusPersistence, createNexusPersistenceFromEnv } from "./supabase";
import type { NexusCapability, ContextEntry, NexusExecution, NexusEvidence } from "../types";

describe("createNexusPersistenceFromEnv", () => {
  it("returns null when environment variables are missing", () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(createNexusPersistenceFromEnv()).toBeNull();

    if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  it("returns a persistence instance when environment variables are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const instance = createNexusPersistenceFromEnv();
    expect(instance).toBeInstanceOf(SupabaseNexusPersistence);
  });
});

describe("SupabaseNexusPersistence", () => {
  it("saveCapability upserts data into nexus_capabilities", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockDb = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const cap: NexusCapability = {
      id: "cap-1",
      key: "test.cap",
      name: "Test Capability",
      risk: "low",
      requiredPermissions: ["read"],
      availability: "available",
    };

    await persistence.saveCapability(cap, "proj-123");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_capabilities");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cap-1",
        project_id: "proj-123",
        capability_key: "test.cap",
        name: "Test Capability",
        risk: "low",
        required_permissions: ["read"],
      })
    );
  });

  it("saveCapability throws error on database failure", async () => {
    const dbError = new Error("DB fail");
    const upsertMock = vi.fn().mockResolvedValue({ error: dbError });
    const mockDb = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const cap: NexusCapability = {
      id: "cap-1",
      key: "test.cap",
      name: "Test Capability",
      risk: "low",
      requiredPermissions: [],
    };

    await expect(persistence.saveCapability(cap)).rejects.toThrow("DB fail");
  });

  it("saveContext upserts data into nexus_context_entries", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockDb = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const entry: ContextEntry = {
      id: "ctx-1",
      scope: "global",
      key: "env",
      value: "prod",
      visibility: "project",
      createdBy: "user-1",
      persistent: true,
      createdAt: "2025-01-01T00:00:00Z",
    };

    await persistence.saveContext(entry, "proj-123");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_context_entries");
    expect(upsertMock).toHaveBeenCalledWith({
      id: "ctx-1",
      project_id: "proj-123",
      scope: "global",
      key: "env",
      value: "prod",
      visibility: "project",
      created_by: "user-1",
      provenance: null,
      persistent: true,
      created_at: "2025-01-01T00:00:00Z",
    });
  });

  it("saveExecution upserts data into nexus_executions", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockDb = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const exec: NexusExecution = {
      id: "exec-1",
      planId: "plan-1",
      status: "completed",
      output: { ok: true },
      startedAt: "2025-01-01T00:00:00Z",
    };

    await persistence.saveExecution(exec, "proj-123");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_executions");
    expect(upsertMock).toHaveBeenCalledWith({
      id: "exec-1",
      project_id: "proj-123",
      plan_id: "plan-1",
      status: "completed",
      output: { ok: true },
      error: null,
      started_at: "2025-01-01T00:00:00Z",
      completed_at: null,
    });
  });

  it("saveEvidence upserts data into nexus_evidence", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockDb = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const ev: NexusEvidence = {
      id: "ev-1",
      executionId: "exec-1",
      type: "artifact",
      summary: "Completed step",
      payload: { details: "all good" },
      createdAt: "2025-01-01T00:00:00Z",
    };

    await persistence.saveEvidence(ev, "proj-123");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_evidence");
    expect(upsertMock).toHaveBeenCalledWith({
      id: "ev-1",
      project_id: "proj-123",
      execution_id: "exec-1",
      evidence_type: "artifact",
      summary: "Completed step",
      payload: { details: "all good" },
      created_at: "2025-01-01T00:00:00Z",
    });
  });

  it("listExecutions queries and maps nexus_executions rows", async () => {
    const limitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "exec-1",
          plan_id: "plan-1",
          status: "completed",
          output: { result: 42 },
          error: null,
          started_at: "2025-01-01T00:00:00Z",
          completed_at: "2025-01-01T00:00:01Z",
        },
      ],
      error: null,
    });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    const mockDb = {
      from: vi.fn().mockReturnValue({ select: selectMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const executions = await persistence.listExecutions("proj-123");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_executions");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("project_id", "proj-123");
    expect(orderMock).toHaveBeenCalledWith("started_at", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(100);

    expect(executions).toEqual([
      {
        id: "exec-1",
        planId: "plan-1",
        status: "completed",
        output: { result: 42 },
        error: undefined,
        startedAt: "2025-01-01T00:00:00Z",
        completedAt: "2025-01-01T00:00:01Z",
      },
    ]);
  });

  it("listEvidence queries and maps nexus_evidence rows with optional executionId filter", async () => {
    const mockQueryBuilder: any = {};
    mockQueryBuilder.eq = vi.fn().mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.order = vi.fn().mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit = vi.fn().mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.then = (resolve: any) =>
      resolve({
        data: [
          {
            id: "ev-1",
            execution_id: "exec-1",
            evidence_type: "artifact",
            summary: "test",
            payload: {},
            created_at: "2025-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

    const selectMock = vi.fn().mockReturnValue(mockQueryBuilder);
    const mockDb = {
      from: vi.fn().mockReturnValue({ select: selectMock }),
    };

    const persistence = new SupabaseNexusPersistence(mockDb as any);
    const evidence = await persistence.listEvidence("proj-123", "exec-1");

    expect(mockDb.from).toHaveBeenCalledWith("nexus_evidence");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("project_id", "proj-123");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("execution_id", "exec-1");
    expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(200);

    expect(evidence).toEqual([
      {
        id: "ev-1",
        executionId: "exec-1",
        type: "artifact",
        summary: "test",
        payload: {},
        createdAt: "2025-01-01T00:00:00Z",
      },
    ]);
  });
});
