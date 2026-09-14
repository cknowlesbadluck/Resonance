import { describe, it, expect, vi } from "vitest";
import { SupabaseNexusPersistence } from "./supabase";
import type { NexusCapability } from "../types";

describe("SupabaseNexusPersistence", () => {
  it("saveCapabilities saves multiple capabilities in a single upsert call", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
    const mockDb = { from: mockFrom } as any;

    const persistence = new SupabaseNexusPersistence(mockDb);

    const capabilities: NexusCapability[] = [
      {
        id: "cap-1",
        key: "key-1",
        name: "Capability 1",
        requiredPermissions: [],
        risk: "low",
      },
      {
        id: "cap-2",
        key: "key-2",
        name: "Capability 2",
        requiredPermissions: [],
        risk: "medium",
      },
    ];

    await persistence.saveCapabilities(capabilities, "proj-123");

    expect(mockFrom).toHaveBeenCalledWith("nexus_capabilities");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const rows = mockUpsert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe("cap-1");
    expect(rows[0].project_id).toBe("proj-123");
    expect(rows[1].id).toBe("cap-2");
    expect(rows[1].project_id).toBe("proj-123");
  });

  it("saveCapabilities handles empty array without calling db", async () => {
    const mockFrom = vi.fn();
    const mockDb = { from: mockFrom } as any;
    const persistence = new SupabaseNexusPersistence(mockDb);

    await persistence.saveCapabilities([], "proj-123");

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("saveCapability delegates to saveCapabilities", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
    const mockDb = { from: mockFrom } as any;

    const persistence = new SupabaseNexusPersistence(mockDb);
    const cap: NexusCapability = {
      id: "cap-single",
      key: "key-single",
      name: "Single Capability",
      requiredPermissions: [],
      risk: "low",
    };

    await persistence.saveCapability(cap, "proj-456");

    expect(mockFrom).toHaveBeenCalledWith("nexus_capabilities");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0]).toHaveLength(1);
    expect(mockUpsert.mock.calls[0][0][0].id).toBe("cap-single");
  });

  it("compares bulk upsert request count vs individual upsert calls", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
    const mockDb = { from: mockFrom } as any;

    const persistence = new SupabaseNexusPersistence(mockDb);
    const capabilities: NexusCapability[] = Array.from({ length: 10 }, (_, i) => ({
      id: `cap-${i}`,
      key: `key-${i}`,
      name: `Capability ${i}`,
      requiredPermissions: [],
      risk: "low",
    }));

    // Measure individual calls (baseline behavior)
    mockUpsert.mockClear();
    await Promise.all(capabilities.map((c) => persistence.saveCapability(c, "proj-bench")));
    const callsIndividual = mockUpsert.mock.calls.length;

    // Measure bulk batch call (optimized behavior)
    mockUpsert.mockClear();
    await persistence.saveCapabilities(capabilities, "proj-bench");
    const callsBulk = mockUpsert.mock.calls.length;

    expect(callsIndividual).toBe(10);
    expect(callsBulk).toBe(1);
  });
});
