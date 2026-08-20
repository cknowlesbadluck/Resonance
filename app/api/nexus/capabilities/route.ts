import { NextResponse } from "next/server";
import {
  listNexusCapabilitiesFromCatalog,
  resolveNexusCapabilities,
} from "../../../../src/nexus/capability-bridge";

/**
 * Capability plane API — returns **NexusCapability** shapes (converged domain).
 * Catalog remains the seed source; bridge maps to Nexus contracts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids =
    searchParams
      .get("ids")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ capabilities: listNexusCapabilitiesFromCatalog() });
  }

  return NextResponse.json(resolveNexusCapabilities(ids));
}
