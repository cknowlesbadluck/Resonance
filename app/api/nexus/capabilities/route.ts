import { NextResponse } from "next/server";
import { authenticateNexusRequest } from "../../../../src/auth/nexus-request";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const auth = await authenticateNexusRequest(request, projectId);
  if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  const persistence = createNexusPersistenceFromEnv();
  if (!persistence) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  try {
    return NextResponse.json({ capabilities: await persistence.listCapabilities(auth.projectId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
