import type { ContextEntry } from "./types";

export interface ContextScope { id: string; visibility: ContextEntry["visibility"]; participants?: string[]; projectId?: string; }
export interface ContextStore {
  put(entry: Omit<ContextEntry, "id" | "createdAt">): ContextEntry;
  viewFor(actorId: string, scope: ContextScope): ContextEntry[];
  promoteToKnowledge(id: string): ContextEntry | undefined;
}

export class InMemoryContextStore implements ContextStore {
  private readonly entries = new Map<string, ContextEntry>();
  put(input: Omit<ContextEntry, "id" | "createdAt">): ContextEntry {
    const entry = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.entries.set(entry.id, entry); return entry;
  }
  viewFor(actorId: string, scope: ContextScope): ContextEntry[] {
    return [...this.entries.values()].filter((entry) => entry.scope === scope.id && (entry.visibility === "project" || (entry.visibility === "participants" && scope.participants?.includes(actorId)) || entry.createdBy === actorId));
  }
  promoteToKnowledge(id: string): ContextEntry | undefined {
    const entry = this.entries.get(id); if (!entry) return undefined;
    const promoted = { ...entry, persistent: true }; this.entries.set(id, promoted); return promoted;
  }
}
