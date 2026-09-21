import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest, isUuid } from "../../../../src/auth/nexus-request";
import { nexusAdapters } from "../../../../src/nexus/runtime";
import { describeAdapters } from "../../../../src/nexus/adapters/describe-cache";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID ?? null;
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) {
      return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    }
  }
  if (projectId && !isUuid(projectId)) {
    return NextResponse.json({ error: "projectId must be a UUID." }, { status: 400 });
  }
  const descriptions = await describeAdapters(nexusAdapters);
  return NextResponse.json({
    identities: descriptions.map((item) => item.identity),
    resources: descriptions.flatMap((item) => item.resources ?? []),
  });
}
