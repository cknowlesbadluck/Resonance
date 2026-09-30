import { NextResponse } from "next/server";
import { authRequired, authenticateNexusRequest } from "../../../../../src/auth/nexus-request";
import { parseSkillResolveBody, resolveBuiltinSkill } from "../../../../../src/composition/skills";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;

/** Resolves one built-in skill. Does not execute it and does not register new skills. */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request body exceeds the 16 KiB limit." }, { status: 400 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body exceeds the 16 KiB limit." }, { status: 400 });
  }
  const body = (() => {
    try { return JSON.parse(text) as unknown; }
    catch { return null; }
  })();
  const parsed = parseSkillResolveBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let actorId = "control-surface";
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, parsed.projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    actorId = auth.userId;
  }

  const resolution = await resolveBuiltinSkill(parsed.skillId, actorId);
  if (!resolution) return NextResponse.json({ error: `No built-in skill is registered with id ${parsed.skillId}.` }, { status: 404 });
  return NextResponse.json({
    source: "builtin",
    persistent: false,
    actorId,
    note: "Skill resolution is not execution and not authorization. A composable result still requires an explicit, idempotent execution request.",
    resolution,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
