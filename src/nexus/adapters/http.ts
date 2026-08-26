import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";

export interface HttpBridge {
  describe(): Promise<AdapterDescription>;
  invoke(capabilityId: string, input: unknown, request: InvocationRequest): Promise<unknown>;
}

export class HttpAdapter implements NexusAdapter {
  readonly kind = "http";

  constructor(
    public readonly id: string,
    private readonly bridge: HttpBridge,
    private readonly timeoutMs: number = 30000
  ) {}

  describe(): Promise<AdapterDescription> { return this.bridge.describe(); }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    try {
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`HTTP Adapter invocation timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
      });

      const invokePromise = this.bridge.invoke(request.capabilityId, request.input, request).finally(() => clearTimeout(timeoutId));

      const output = await Promise.race([invokePromise, timeoutPromise]);
      return { ok: true, output };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        evidence: { error: String(error) }
      };
    }
  }
}
