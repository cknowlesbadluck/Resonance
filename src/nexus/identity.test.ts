import { describe, expect, it } from "vitest";
import { identityKey } from "./identity";
import type { NexusIdentity } from "./types";

describe("identityKey", () => {
  it("formats identity key with default local provider and fallback id", () => {
    const identity: NexusIdentity = {
      id: "agent-123",
      type: "agent",
      name: "Test Agent",
    };
    expect(identityKey(identity)).toBe("agent:local:agent-123");
  });

  it("uses providerId and externalId when provided", () => {
    const identity: NexusIdentity = {
      id: "internal-456",
      type: "connector",
      name: "GitHub Connector",
      providerId: "github",
      externalId: "ext-789",
    };
    expect(identityKey(identity)).toBe("connector:github:ext-789");
  });
});
