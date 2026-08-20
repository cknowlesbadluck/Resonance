import { describe, expect, it } from "vitest";
import { activateChamber, agendaFromIntent, dissolveChamber, formChamber } from "./chamber";
import type { NexusCapability, NexusIntent } from "./types";

const cap: NexusCapability = {
  id: "c1",
  key: "tool.github",
  name: "GitHub",
  requiredPermissions: ["repo.read"],
  risk: "low",
  availability: "available",
};

const intent: NexusIntent = {
  id: "i1",
  projectId: "00000000-0000-4000-8000-000000000001",
  objective: "Review PR",
  requestedBy: "user-1",
  requirements: [{ key: "tool.github" }],
};

describe("Chamber lifecycle", () => {
  it("forms from agenda with toolkit seed", () => {
    const agenda = agendaFromIntent(intent);
    const chamber = formChamber(agenda, [cap]);
    expect(chamber.status).toBe("forming");
    expect(chamber.toolkitCapabilityKeys).toContain("tool.github");
    expect(chamber.projectId).toBe(intent.projectId);
  });

  it("activates then dissolves cleanly", () => {
    const agenda = agendaFromIntent(intent);
    let chamber = formChamber(agenda, [cap]);
    chamber = activateChamber(chamber);
    expect(chamber.status).toBe("active");
    chamber = dissolveChamber(chamber);
    expect(chamber.status).toBe("dissolved");
    expect(chamber.dissolvedAt).toBeTruthy();
    expect(chamber.toolkitCapabilityKeys).toEqual([]);
  });
});
