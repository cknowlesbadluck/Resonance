export type Capability = { name: string; description: string; mutating?: boolean };
export type ProviderEvent = { provider: string; type: string; externalId?: string; payload: unknown };

export interface IntegrationAdapter {
  provider: string;
  capabilities: Capability[];
  health(): Promise<{ ok: boolean; detail?: string }>;
  handleEvent?(event: ProviderEvent): Promise<void>;
}

export const capabilities: Record<string, Capability[]> = {
  github: ["repository.read","branch.write","pull_request.read","pull_request.write","workflow.read","workflow.write"].map(name => ({ name, description: name, mutating: /write/.test(name) })),
  vercel: ["project.read","deployment.read","deployment.write","domain.read"].map(name => ({ name, description: name, mutating: /write/.test(name) })),
  supabase: ["database.read","database.write","auth.read","storage.read","edge_function.invoke"].map(name => ({ name, description: name, mutating: /write|invoke/.test(name) })),
  linear: ["project.read","issue.read","issue.write","cycle.read"].map(name => ({ name, description: name, mutating: /write/.test(name) })),
  twilio: ["message.send","voice.call"].map(name => ({ name, description: name, mutating: true }))
};
