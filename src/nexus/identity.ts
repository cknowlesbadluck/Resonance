import type { NexusIdentity } from "./types";

export function identityKey(identity: NexusIdentity): string {
  return `${identity.type}:${identity.providerId ?? "local"}:${identity.externalId ?? identity.id}`;
}
