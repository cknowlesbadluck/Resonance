import { describe, expect, it } from "vitest";
import { MemoryChamberStore, cancelChamberScenario, runChamberScenario } from "./chamber-scenario";
import type { Agenda } from "./chamber";
import type { NexusCapability } from "./types";

const projectA = "00000000-0000-4000-8000-0000000000aa";
const projectB = "00000000-0000-4000-8000-0000000000bb";

const readCap: NexusCapability = {
  id: "github.repository.read",
  key: "github.repository.read",
  name: "Read",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
  provenance: "test",
};

const writeCap: NexusCapability = {
  id: "repo.write",
  key: "repo.write",
  name: "Write",
  requiredPermissions: ["execute"],
  risk: "high",
  availability: "available",
  provenance: "test",
};

const agenda: Agenda = {
  id: "agenda-1",
  projectId: projectA,
  objective: "Read repository metadata, then pause before a privileged write.",
  createdBy: "member-a",
};

describe("chamber scenario", () => {
  it("pauses for approval, resumes, dissolves, and keeps audit isolated to the project", async () => {
    const store = new MemoryChamberStore();
    const invoked: string[] = [];
    const invoke = async (capability: NexusCapability) => {
      invoked.push(capability.key);
      return { ok: true as const, output: { capability: capability.key } };
    };
    const participants = [
      { id: "member-a", projectId: projectA },
      { id: "member-b", projectId: projectA },
    ];

    const paused = await runChamberScenario({
      agenda,
      participants,
      permittedCapabilityKeys: ["github.repository.read", "repo.write"],
      capabilities: [readCap, writeCap],
      context: [{
        id: "ctx-1",
        scope: projectA,
        key: "repository",
        value: { owner: "cknowlesbadluck", repo: "Resonance" },
        visibility: "project",
        createdBy: "member-a",
        persistent: true,
        createdAt: "2026-09-25T00:00:00.000Z",
      }],
      sequence: [
        { capabilityKey: "github.repository.read", input: { owner: "cknowlesbadluck", repo: "Resonance" } },
        { capabilityKey: "repo.write", input: { ref: "main" } },
      ],
      store,
      invoke,
    });

    expect(paused.status).toBe("waiting_approval");
    expect(invoked).toEqual(["github.repository.read"]);
    expect(paused.chamber.toolkitCapabilityKeys).toContain("github.repository.read");

    const resumed = await runChamberScenario({
      agenda,
      participants,
      permittedCapabilityKeys: ["github.repository.read", "repo.write"],
      capabilities: [readCap, writeCap],
      context: [],
      sequence: [
        { capabilityKey: "github.repository.read" },
        { capabilityKey: "repo.write" },
      ],
      store,
      invoke,
      chamberId: paused.chamber.id,
      actorId: "member-a",
      approved: true,
    });

    expect(resumed.status).toBe("dissolved");
    expect(resumed.chamber.toolkitCapabilityKeys).toEqual([]);
    expect(invoked).toEqual(["github.repository.read", "repo.write"]);

    const audit = await store.listAudit(projectA, paused.chamber.id);
    expect(audit.map((record) => record.type)).toEqual([
      "chamber.opened",
      "chamber.step.completed",
      "chamber.waiting_approval",
      "chamber.step.completed",
      "chamber.dissolved",
    ]);
    const evidence = await store.listEvidence(projectA);
    expect(evidence).toHaveLength(2);
    expect(await store.listAudit(projectB, paused.chamber.id)).toEqual([]);
    expect(await store.listEvidence(projectB)).toEqual([]);
    await expect(store.getChamber(projectB, paused.chamber.id)).resolves.toBeNull();
  });

  it("rejects a participant from another project and can cancel without dropping prior evidence", async () => {
    const store = new MemoryChamberStore();
    await expect(runChamberScenario({
      agenda,
      participants: [{ id: "member-a", projectId: projectA }, { id: "outsider", projectId: projectB }],
      permittedCapabilityKeys: ["github.repository.read"],
      capabilities: [readCap],
      context: [],
      sequence: [{ capabilityKey: "github.repository.read" }],
      store,
      invoke: async () => ({ ok: true, output: {} }),
    })).rejects.toThrow(/not in project/);

    const paused = await runChamberScenario({
      agenda,
      participants: [{ id: "member-a", projectId: projectA }],
      permittedCapabilityKeys: ["github.repository.read", "repo.write"],
      capabilities: [readCap, writeCap],
      context: [],
      sequence: [
        { capabilityKey: "github.repository.read" },
        { capabilityKey: "repo.write" },
      ],
      store,
      invoke: async (capability) => ({ ok: true, output: { capability: capability.key } }),
    });
    const cancelled = await cancelChamberScenario({
      agendaProjectId: projectA,
      chamberId: paused.chamber.id,
      actorId: "member-a",
      participants: [{ id: "member-a", projectId: projectA }],
      store,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(await store.listEvidence(projectA)).toHaveLength(1);
    expect((await store.listAudit(projectA, paused.chamber.id)).some((record) => record.type === "chamber.cancelled")).toBe(true);
    await expect(cancelChamberScenario({
      agendaProjectId: projectB,
      chamberId: paused.chamber.id,
      actorId: "member-a",
      participants: [{ id: "member-a", projectId: projectA }],
      store,
    })).rejects.toThrow(/not a permitted participant/);
  });
});
