import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryEventStore, InMemoryAuditRecorder, EventBus } from "./events";
import type { NexusEvent, NexusEvidence } from "./types";

describe("Events", () => {
  describe("InMemoryEventStore", () => {
    let store: InMemoryEventStore;

    beforeEach(() => {
      store = new InMemoryEventStore();
    });

    it("should append events", async () => {
      const event: NexusEvent = {
        id: "1",
        source: "test-source",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test" },
        createdAt: new Date().toISOString(),
      };

      await store.append(event);
      expect(store.events).toHaveLength(1);
      expect(store.events[0]).toEqual(event);
    });

    it("should check if external event exists", async () => {
      const event: NexusEvent = {
        id: "1",
        source: "test-source",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      await store.append(event);

      expect(await store.hasExternal("test-source", "ext-1")).toBe(true);
      expect(await store.hasExternal("other-source", "ext-1")).toBe(false);
      expect(await store.hasExternal("test-source", "ext-2")).toBe(false);
    });
  });

  describe("InMemoryAuditRecorder", () => {
    let recorder: InMemoryAuditRecorder;

    beforeEach(() => {
      recorder = new InMemoryAuditRecorder();
    });

    it("should record evidence", async () => {
      const evidence: NexusEvidence = {
        id: "1",
        executionId: "exec-1",
        type: "event",
        summary: "test evidence",
        payload: { data: "test" },
        createdAt: new Date().toISOString(),
      };

      await recorder.record(evidence);
      expect(recorder.records).toHaveLength(1);
      expect(recorder.records[0]).toEqual(evidence);
    });
  });

  describe("EventBus", () => {
    let store: InMemoryEventStore;
    let bus: EventBus;

    beforeEach(() => {
      store = new InMemoryEventStore();
      bus = new EventBus(store);
    });

    it("should publish a new event without externalId", async () => {
      const event: NexusEvent = {
        id: "1",
        source: "test-source",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test" },
        createdAt: new Date().toISOString(),
      };

      const result = await bus.publish(event);
      expect(result).toBe(true);
      expect(store.events).toHaveLength(1);
      expect(store.events[0]).toEqual(event);
    });

    it("should publish a new event with a new externalId", async () => {
      const event: NexusEvent = {
        id: "1",
        source: "test-source",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      const result = await bus.publish(event);
      expect(result).toBe(true);
      expect(store.events).toHaveLength(1);
      expect(store.events[0]).toEqual(event);
    });

    it("should not publish an event if externalId already exists for the source", async () => {
      const event1: NexusEvent = {
        id: "1",
        source: "test-source",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test1" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      const event2: NexusEvent = {
        id: "2",
        source: "test-source",
        type: "test-type-other",
        status: "pending",
        correlationId: "corr-2",
        payload: { data: "test2" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      await bus.publish(event1);
      const result = await bus.publish(event2);

      expect(result).toBe(false);
      expect(store.events).toHaveLength(1);
      expect(store.events[0]).toEqual(event1);
    });

    it("should publish an event with same externalId but different source", async () => {
      const event1: NexusEvent = {
        id: "1",
        source: "source-1",
        type: "test-type",
        status: "pending",
        correlationId: "corr-1",
        payload: { data: "test1" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      const event2: NexusEvent = {
        id: "2",
        source: "source-2",
        type: "test-type",
        status: "pending",
        correlationId: "corr-2",
        payload: { data: "test2" },
        createdAt: new Date().toISOString(),
        externalId: "ext-1",
      };

      const result1 = await bus.publish(event1);
      const result2 = await bus.publish(event2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(store.events).toHaveLength(2);
    });
  });
});
