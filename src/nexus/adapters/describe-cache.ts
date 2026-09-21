import type { AdapterDescription, NexusAdapter } from "./types";

export interface DescribeCacheOptions {
  ttlMs?: number;
}

interface CacheEntry {
  description: AdapterDescription;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;

const descriptionCache = new WeakMap<NexusAdapter, CacheEntry>();
const inFlightRequests = new WeakMap<NexusAdapter, Promise<AdapterDescription>>();

export async function describeAdapter(
  adapter: NexusAdapter,
  options?: DescribeCacheOptions
): Promise<AdapterDescription> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  const cached = descriptionCache.get(adapter);
  if (cached && cached.expiresAt > now) {
    return cached.description;
  }

  let inFlight = inFlightRequests.get(adapter);
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const description = await adapter.describe();
      descriptionCache.set(adapter, {
        description,
        expiresAt: Date.now() + ttlMs,
      });
      return description;
    } finally {
      inFlightRequests.delete(adapter);
    }
  })();

  inFlightRequests.set(adapter, inFlight);
  return inFlight;
}

export async function describeAdapters(
  adapters: NexusAdapter[],
  options?: DescribeCacheOptions
): Promise<AdapterDescription[]> {
  return Promise.all(adapters.map((adapter) => describeAdapter(adapter, options)));
}

export function clearAdapterDescriptionCache(adapter?: NexusAdapter): void {
  if (adapter) {
    descriptionCache.delete(adapter);
    inFlightRequests.delete(adapter);
  }
}
