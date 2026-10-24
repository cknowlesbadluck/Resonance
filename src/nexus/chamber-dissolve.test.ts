import { describe, expect, it } from "vitest";
import { activateChamber, formChamber, agendaFromIntent } from "./chamber";
import { dissolveGuarded } from "./chamber-dissolve";
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

function active() {
  return activateChamber(formChamber(agendaFromIntent(intent), [cap]));
}

describe("guarded chamber dissolve", () => {
  it("lets a dissonance block dissolve and keeps an audit token", () => {
    const decision = dissolveGuarded(active(), "work", "dissonance");
    expect(decision.allowed).toBe(true);
    expect(decision.chamber.status).toBe("dissolved");
    expect(decision.chamber.toolkitCapabilityKeys).toEqual([]);
    expect(decision.audit).toBe("chamber.dissolved:dissonance");
    expect(decision.refusal).toBeNull();
  });

  it("refuses to dissolve a watch chamber", () => {
    const chamber = active();
    const decision = dissolveGuarded(chamber, "watch", "success");
    expect(decision.allowed).toBe(false);
    expect(decision.refusal).toBe("watch_cannot_dissolve");
    expect(decision.chamber).toBe(chamber);
    expect(decision.chamber.status).toBe("active");
    expect(decision.audit).toBeNull();
  });

  it("refuses a second dissolve", () => {
    const first = dissolveGuarded(active(), "work", "policy");
    const second = dissolveGuarded(first.chamber, "work", "success");
    expect(second.allowed).toBe(false);
    expect(second.refusal).toBe("already_dissolved");
  });
});
