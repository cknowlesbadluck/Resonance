import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../src/auth/nexus-request";
import { listAdvertisedCapabilities, resolveCatalogCapabilities } from "../../../../src/composition/root";

/**
 * Capability discovery returns the normalized NexusCapability contract.
 *
 * This endpoint is a pure read. It previously wrote every runtime capability back to
 * Supabase on each GET (an unauthenticated write path whenever auth mode was `optional`,
 * plus N round-trips and a fresh Supabase client per request). Capability persistence
 * belongs to registration, not discovery.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  }

  const ids = searchParams.get("ids")?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const advertised = await listAdvertisedCapabilities();
  if (ids.length === 0) return NextResponse.json({ capabilities: advertised });

  const direct = advertised.filter((capability) => ids.includes(capability.id));
  const remainingIds = ids.filter((id) => !direct.some((capability) => capability.id === id));
  const resolution = remainingIds.length > 0
    ? await resolveCatalogCapabilities(remainingIds)
    : { requested: [], resolved: [], missing: [], unavailable: [] };

  return NextResponse.json({
    requested: ids,
    resolved: [...direct, ...resolution.resolved],
    missing: resolution.missing,
    unavailable: resolution.unavailable,
  });
}
