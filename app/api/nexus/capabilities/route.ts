import { NextResponse } from "next/server";
import { listNexusCapabilitiesFromCatalog, resolveNexusCapabilities } from "../../../../src/nexus/capability-bridge";
import { listRuntimeCapabilities } from "../../../../src/nexus/runtime";

/** Capability discovery returns the normalized NexusCapability contract. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const runtime = listRuntimeCapabilities();
  const catalog = listNexusCapabilitiesFromCatalog();
  const merged = [...runtime, ...catalog.filter((catalogCapability) => !runtime.some((runtimeCapability) => runtimeCapability.id === catalogCapability.id))];
  if (ids.length === 0) return NextResponse.json({ capabilities: merged });
  return NextResponse.json(resolveNexusCapabilities(ids));
}
