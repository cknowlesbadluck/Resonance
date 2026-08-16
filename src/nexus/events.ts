import type { NexusEvent, NexusEvidence } from "./types";

export interface EventStore { append(event: NexusEvent): Promise<void>; hasExternal(source: string, externalId: string): Promise<boolean>; }
export interface AuditRecorder { record(evidence: NexusEvidence): Promise<void>; }

export class InMemoryEventStore implements EventStore {
  readonly events: NexusEvent[] = [];
  async append(event: NexusEvent): Promise<void> { this.events.push(event); }
  async hasExternal(source: string, externalId: string): Promise<boolean> { return this.events.some((e) => e.source === source && e.externalId === externalId); }
}

export class InMemoryAuditRecorder implements AuditRecorder {
  readonly records: NexusEvidence[] = [];
  async record(evidence: NexusEvidence): Promise<void> { this.records.push(evidence); }
}

export class EventBus {
  constructor(private readonly store: EventStore) {}
  async publish(event: NexusEvent): Promise<boolean> {
    if (event.externalId && await this.store.hasExternal(event.source, event.externalId)) return false;
    await this.store.append(event); return true;
  }
}
