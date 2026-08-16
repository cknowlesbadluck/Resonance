import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";

export interface HttpBridge { describe(): Promise<AdapterDescription>; invoke(capabilityId: string, input: unknown, request: InvocationRequest): Promise<unknown>; }

export class HttpAdapter implements NexusAdapter {
  readonly kind = "http";
  constructor(public readonly id: string, private readonly bridge: HttpBridge) {}
  describe(): Promise<AdapterDescription> { return this.bridge.describe(); }
  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    try { return { ok: true, output: await this.bridge.invoke(request.capabilityId, request.input, request) }; }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  }
}
