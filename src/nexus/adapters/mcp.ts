import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";

export interface McpBridge { describe(): Promise<AdapterDescription>; callTool(capabilityId: string, input: unknown): Promise<unknown>; }

export class McpAdapter implements NexusAdapter {
  readonly kind = "mcp";
  constructor(public readonly id: string, private readonly bridge: McpBridge) {}
  describe(): Promise<AdapterDescription> { return this.bridge.describe(); }
  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    try { return { ok: true, output: await this.bridge.callTool(request.capabilityId, request.input) }; }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  }
}
