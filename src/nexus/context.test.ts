import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryContextStore } from "./context";
import type { ContextScope } from "./context";
import type { ContextEntry } from "./types";

describe("InMemoryContextStore", () => {
  let store: InMemoryContextStore;

  beforeEach(() => {
    store = new InMemoryContextStore();
  });

  describe("put", () => {
    it("should add an entry and generate id and createdAt", () => {
      const input = {
        scope: "scope1",
        key: "testKey",
        value: "testValue",
        visibility: "project" as const,
        createdBy: "actor1",
        persistent: false,
      };

      const entry = store.put(input);

      expect(entry).toMatchObject(input);
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.createdAt).toBeDefined();
      expect(typeof entry.createdAt).toBe("string");
      // Check if createdAt is a valid date string
      expect(!isNaN(Date.parse(entry.createdAt))).toBe(true);
    });
  });

  describe("viewFor", () => {
    const scope1: ContextScope = { id: "scope1", visibility: "project" };
    const scope2: ContextScope = { id: "scope2", visibility: "project" };
    const participantsScope: ContextScope = { id: "scope1", visibility: "participants", participants: ["actor1", "actor2"] };

    beforeEach(() => {
      // Setup some initial entries
      store.put({
        scope: "scope1",
        key: "k1",
        value: "v1",
        visibility: "project",
        createdBy: "actor1",
        persistent: false,
      }); // id generated

      store.put({
        scope: "scope1",
        key: "k2",
        value: "v2",
        visibility: "participants",
        createdBy: "actor2",
        persistent: false,
      });

      store.put({
        scope: "scope1",
        key: "k3",
        value: "v3",
        visibility: "private",
        createdBy: "actor3",
        persistent: false,
      });

      store.put({
        scope: "scope2",
        key: "k4",
        value: "v4",
        visibility: "project",
        createdBy: "actor1",
        persistent: false,
      });
    });

    it("should only return entries for the requested scope", () => {
      const entries = store.viewFor("actor1", scope1);
      expect(entries.every(e => e.scope === "scope1")).toBe(true);

      const entriesScope2 = store.viewFor("actor1", scope2);
      expect(entriesScope2.length).toBe(1);
      expect(entriesScope2[0].key).toBe("k4");
    });

    it("should return 'project' visibility entries to any actor", () => {
      const entries = store.viewFor("someRandomActor", scope1);
      const projectEntries = entries.filter(e => e.key === "k1");
      expect(projectEntries.length).toBe(1);
    });

    it("should return 'participants' visibility entries only to actors in scope.participants", () => {
      const entriesActor1 = store.viewFor("actor1", participantsScope);
      const participantsEntries1 = entriesActor1.filter(e => e.key === "k2");
      expect(participantsEntries1.length).toBe(1);

      const entriesActor3 = store.viewFor("actor3", participantsScope);
      const participantsEntries3 = entriesActor3.filter(e => e.key === "k2");
      expect(participantsEntries3.length).toBe(0);
    });

    it("should return 'participants' visibility entries to non-participants if they created it", () => {
        // actor2 is the creator of k2, even if not in participants list, they should see it
        const scopeWithoutActor2: ContextScope = { id: "scope1", visibility: "participants", participants: ["actor1"] };
        const entriesActor2 = store.viewFor("actor2", scopeWithoutActor2);
        const participantsEntries2 = entriesActor2.filter(e => e.key === "k2");
        expect(participantsEntries2.length).toBe(1);
    });

    it("should not return 'participants' visibility entries if scope has no participants and actor is not creator", () => {
        const entries = store.viewFor("actor1", scope1); // scope1 has no participants defined
        const participantsEntries = entries.filter(e => e.key === "k2");
        expect(participantsEntries.length).toBe(0);
    });

    it("should return 'private' visibility entries only to the creator", () => {
      const entriesActor3 = store.viewFor("actor3", scope1);
      const privateEntries3 = entriesActor3.filter(e => e.key === "k3");
      expect(privateEntries3.length).toBe(1);

      const entriesActor1 = store.viewFor("actor1", scope1);
      const privateEntries1 = entriesActor1.filter(e => e.key === "k3");
      expect(privateEntries1.length).toBe(0);
    });
  });

  describe("promoteToKnowledge", () => {
    it("should update persistent flag to true and return updated entry", () => {
      const entry = store.put({
        scope: "scope1",
        key: "testKey",
        value: "testValue",
        visibility: "project",
        createdBy: "actor1",
        persistent: false,
      });

      expect(entry.persistent).toBe(false);

      const promoted = store.promoteToKnowledge(entry.id);

      expect(promoted).toBeDefined();
      expect(promoted?.persistent).toBe(true);
      expect(promoted?.id).toBe(entry.id);

      // Verify it's updated in the store
      const entries = store.viewFor("actor1", { id: "scope1", visibility: "project" });
      const storedPromoted = entries.find(e => e.id === entry.id);
      expect(storedPromoted?.persistent).toBe(true);
    });

    it("should return undefined for non-existent entry", () => {
      const result = store.promoteToKnowledge("non-existent-id");
      expect(result).toBeUndefined();
    });
  });
});
