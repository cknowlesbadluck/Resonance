import { describe, it, expect } from "vitest";
import { identityKey, sameIdentity } from "./identity";
import type { NexusIdentity } from "./types";

describe("identityKey", () => {
  it("uses provided providerId and externalId", () => {
    const identity: NexusIdentity = {
      id: "id-123",
      type: "human",
      name: "Test User",
      providerId: "google",
      externalId: "ext-123",
    };
    expect(identityKey(identity)).toBe("human:google:ext-123");
  });

  it("falls back to 'local' when providerId is missing", () => {
    const identity: NexusIdentity = {
      id: "id-123",
      type: "agent",
      name: "Test Agent",
      externalId: "ext-123",
    };
    expect(identityKey(identity)).toBe("agent:local:ext-123");
  });

  it("falls back to id when externalId is missing", () => {
    const identity: NexusIdentity = {
      id: "id-123",
      type: "model",
      name: "Test Model",
      providerId: "openai",
    };
    expect(identityKey(identity)).toBe("model:openai:id-123");
  });

  it("falls back for both providerId and externalId", () => {
    const identity: NexusIdentity = {
      id: "id-123",
      type: "skill",
      name: "Test Skill",
    };
    expect(identityKey(identity)).toBe("skill:local:id-123");
  });
});

describe("sameIdentity", () => {
  it("returns true for identical identities", () => {
    const a: NexusIdentity = {
      id: "id-123",
      type: "human",
      name: "Test User",
      providerId: "google",
      externalId: "ext-123",
    };
    const b: NexusIdentity = { ...a };
    expect(sameIdentity(a, b)).toBe(true);
  });

  it("returns true for structurally different but equivalent identities", () => {
    const a: NexusIdentity = {
      id: "id-123",
      type: "human",
      name: "Test User",
    };
    const b: NexusIdentity = {
      id: "id-123",
      type: "human",
      name: "Test User",
      providerId: "local",
      externalId: "id-123",
    };
    expect(sameIdentity(a, b)).toBe(true);
  });

  it("returns false for different types", () => {
    const a: NexusIdentity = { id: "1", type: "human", name: "A" };
    const b: NexusIdentity = { id: "1", type: "agent", name: "B" };
    expect(sameIdentity(a, b)).toBe(false);
  });

  it("returns false for different providerIds", () => {
    const a: NexusIdentity = { id: "1", type: "human", name: "A", providerId: "google" };
    const b: NexusIdentity = { id: "1", type: "human", name: "B", providerId: "github" };
    expect(sameIdentity(a, b)).toBe(false);
  });

  it("returns false for different externalIds", () => {
    const a: NexusIdentity = { id: "1", type: "human", name: "A", externalId: "ext-1" };
    const b: NexusIdentity = { id: "1", type: "human", name: "B", externalId: "ext-2" };
    expect(sameIdentity(a, b)).toBe(false);
  });
});
