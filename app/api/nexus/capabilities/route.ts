import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../src/auth/nexus-request";
import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "../../../../src/nexus/capability-bridge";
import { listRuntimeCapabilities } from "../../../../src/nexus/runtime";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";

/** Capability discovery returns the normalized NexusCapability contract. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  }
  const ids = searchParams.get("ids")?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const runtime = listRuntimeCapabilities();
  const persistence = createNexusPersistenceFromEnv();
  if (persistence && projectId) {
    await Promise.all(runtime.map((capability) => persistence.saveCapability(capability, projectId)));
  }
  const catalog = listNexusCapabilitiesFromCatalog();
  const merged = [...runtime, ...catalog.filter((catalogCapability) => !runtime.some((runtimeCapability) => runtimeCapability.id === catalogCapability.id))];
  if (ids.length === 0) return NextResponse.json({ capabilities: merged });
  const runtimeMatches = runtime.filter((capability) => ids.includes(capability.id));
  const remainingIds = ids.filter((id) => !runtimeMatches.some((capability) => capability.id === id));
  const catalogResolution = remainingIds.length > 0 ? resolveNexusCapabilities(remainingIds) : { requested: [], resolved: [], missing: [], unavailable: [] };
  return NextResponse.json({
    requested: ids,
    resolved: [...runtimeMatches, ...catalogResolution.resolved],
    missing: catalogResolution.missing,
    unavailable: catalogResolution.unavailable,
  });
}
