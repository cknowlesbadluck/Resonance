import type { NexusIdentity } from "./types";

export function identityKey(identity: NexusIdentity): string {
  return `${identity.type}:${identity.providerId ?? "local"}:${identity.externalId ?? identity.id}`;
}

export function sameIdentity(a: NexusIdentity, b: NexusIdentity): boolean {
  return identityKey(a) === identityKey(b);
}
