import type { NexusAdapter, AdapterDescription, InvocationRequest, InvocationResult } from "./types";
import type { NexusCapability } from "../types";

type LemonadeChatResponse = { choices?: Array<{ message?: { content?: string } }> };
type LemonadeErrorResponse = { error?: string };

/** Optional desktop/local-AI adapter. Never imported by the iOS target. */
export class LemonadeAdapter implements NexusAdapter {
  readonly kind = "local-ai";
  constructor(
    public readonly id: string,
    private readonly baseURL: URL,
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  async describe(): Promise<AdapterDescription> {
    const capability: NexusCapability = {
      id: `${this.id}.chat`, key: "local.ai.chat", name: "Lemonade Local Chat", adapterId: this.id,
      requiredPermissions: ["execute"], risk: "low", availability: "available", provenance: "amd-lemonade",
      compatibility: ["desktop", "local-ai"],
    };
    return { identity: { id: this.id, type: "provider", name: "AMD Lemonade" }, capabilities: [capability] };
  }

  async invoke(request: InvocationRequest): Promise<InvocationResult> {
    if (request.capabilityId !== `${this.id}.chat`) return { ok: false, error: `Unsupported Lemonade capability: ${request.capabilityId}` };
    const input = (request.input ?? {}) as { prompt?: string; system?: string };
    if (!input.prompt?.trim()) return { ok: false, error: "Lemonade prompt is required." };
    const response = await fetch(new URL("chat/completions", this.baseURL), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify({ model: this.model, messages: [...(input.system ? [{ role: "system", content: input.system }] : []), { role: "user", content: input.prompt }] }),
    });
    const data = await response.json().catch(() => null) as LemonadeChatResponse | LemonadeErrorResponse | null;
    if (!response.ok) {
      const error = data && "error" in data ? data.error : undefined;
      return { ok: false, error: error ? String(error) : `Lemonade HTTP ${response.status}` };
    }
    const output = data && "choices" in data ? data.choices?.[0]?.message?.content : undefined;
    if (!output) return { ok: false, error: "Lemonade returned no completion content." };
    return { ok: true, output, evidence: { provider: "amd-lemonade", model: this.model } };
  }
}
