import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../../src/auth/nexus-request";
import { listAdvertisedCapabilities, resolveCatalogCapabilities } from "../../../../../src/composition/root";
import { DefaultNexusPolicy } from "../../../../../src/nexus/policy";
import { CAPABILITY_ID_PATTERN, explainCapability } from "../../../../../src/nexus/policy-explain";

const policy = new DefaultNexusPolicy();

/**
 * GET /api/nexus/capabilities/explain?projectId=<uuid>&capabilityId=<id>
 *
 * Policy dry-run: returns the decision the Nexus policy would make for this capability
 * (allow / approval_required / deny) and the checks behind it. Never executes, never writes.
 * Auth: same gate as discovery when auth is configured; with auth not configured it is refused in
 * production (fail closed) and answers for a local dev actor otherwise. Input is bounded.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const capabilityId = searchParams.get("capabilityId") ?? "";
  const projectId = searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID;
  if (!CAPABILITY_ID_PATTERN.test(capabilityId)) {
    return NextResponse.json({ error: "capabilityId is required (1-200 chars: letters, digits, . _ : -)." }, { status: 400 });
  }

  let actorId = "dev-local";
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    actorId = auth.userId;
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Authentication is not configured; policy explain is unavailable in production." }, { status: 401 });
  }

  const advertised = await listAdvertisedCapabilities();
  let capability = advertised.find((c) => c.id === capabilityId);
  if (!capability) {
    const resolution = await resolveCatalogCapabilities([capabilityId]);
    capability = resolution.resolved[0];
  }
  if (!capability) return NextResponse.json({ error: "Unknown capability.", capabilityId }, { status: 404 });

  return NextResponse.json({ explanation: explainCapability(policy, actorId, capability) }, { headers: { "Cache-Control": "no-store" } });
}
