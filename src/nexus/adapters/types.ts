import type { NexusCapability, NexusIdentity, NexusResource } from "../types";

export interface AdapterDescription { identity: NexusIdentity; capabilities: NexusCapability[]; resources?: NexusResource[]; }
export interface InvocationRequest { capabilityId: string; input: unknown; actorId: string; correlationId: string; }
export interface InvocationResult { ok: boolean; output?: unknown; error?: string; evidence?: unknown; }
export interface NexusAdapter { id: string; kind: string; describe(): Promise<AdapterDescription>; invoke(request: InvocationRequest): Promise<InvocationResult>; }

export class AdapterRegistry {
  private readonly adapters = new Map<string, NexusAdapter>();
  register(adapter: NexusAdapter): void { this.adapters.set(adapter.id, adapter); }
  resolve(id: string): NexusAdapter | undefined { return this.adapters.get(id); }
  list(): NexusAdapter[] { return [...this.adapters.values()]; }
}
