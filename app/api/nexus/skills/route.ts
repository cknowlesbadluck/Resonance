import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../src/auth/nexus-request";
import { discoverResolvedSkills } from "../../../../src/composition/skills";
import { parseSkillDiscoveryParams } from "../../../../src/composition/discovery-params";

export const dynamic = "force-dynamic";

/**
 * Skill discovery is a pure read. Built-in skills are planning inputs.
 * This route does not register caller-supplied skills and does not execute anything.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? process.env.RESONANCE_PROJECT_ID;
  let actorId = "control-surface";
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    actorId = auth.userId;
  }

  const filter = parseSkillDiscoveryParams(searchParams);
  if (!filter.ok) return NextResponse.json({ error: filter.error }, { status: 400 });
  const resolutions = await discoverResolvedSkills(actorId, filter.value);

  return NextResponse.json({
    source: "builtin",
    persistent: false,
    actorId,
    note: "Skill resolution is not execution and not authorization. A composable result still requires an explicit, idempotent execution request.",
    resolutions,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
