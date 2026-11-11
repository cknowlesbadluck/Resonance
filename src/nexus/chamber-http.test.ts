import { describe, expect, it } from "vitest";
import { openChamber } from "./chamber-http";
import { MemoryChamberStore } from "./chamber-scenario";
import type { NexusCapability } from "./types";

const projectId = "00000000-0000-4000-8000-000000000001";

const readCapability: NexusCapability = {
  id: "cap-read",
  key: "note.read",
  name: "Note read",
  requiredPermissions: ["read"],
  risk: "low",
  availability: "available",
  executable: true,
};

const criticalCapability: NexusCapability = {
  ...readCapability,
  id: "cap-exec",
  key: "note.execute",
  name: "Note execute",
  requiredPermissions: ["execute"],
  risk: "low",
};

describe("openChamber", () => {
  it("forms, runs one governed step, and dissolves with audit", async () => {
    const store = new MemoryChamberStore();
    const result = await openChamber({
      projectId,
      objective: "Record a note",
      actorId: "actor-1",
      capability: readCapability,
      idempotencyKey: "idem-1",
    }, store);
    expect(result.status).toBe(200);
    expect(result.body.status).toBe("dissolved");
    const audit = result.body.audit as Array<{ type: string }>;
    expect(audit.map((item) => item.type)).toEqual(["chamber.opened", "chamber.step.completed", "chamber.dissolved"]);
  });

  it("pauses for approval and resumes the same chamber", async () => {
    const store = new MemoryChamberStore();
    const paused = await openChamber({
      projectId,
      objective: "Needs approval",
      actorId: "actor-1",
      capability: criticalCapability,
      idempotencyKey: "idem-2",
    }, store);
    expect(paused.status).toBe(202);
    expect(paused.body.status).toBe("waiting_approval");
    const chamberId = (paused.body.chamber as { id: string }).id;
    const resumed = await openChamber({
      projectId,
      objective: "Needs approval",
      actorId: "actor-1",
      capability: criticalCapability,
      idempotencyKey: "idem-2b",
      chamberId,
      approved: true,
    }, store);
    expect(resumed.status).toBe(200);
    expect(resumed.body.status).toBe("dissolved");
  });

  it("rejects an actor-less request", async () => {
    const result = await openChamber({
      projectId,
      objective: "x",
      actorId: " ",
      capability: readCapability,
      idempotencyKey: "idem-3",
    }, new MemoryChamberStore());
    expect(result.status).toBe(400);
  });
});
