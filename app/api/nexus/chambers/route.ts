import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authRequired, authenticateNexusRequest, isUuid } from "../../../../src/auth/nexus-request";
import { openChamber } from "../../../../src/nexus/chamber-http";
import { MemoryChamberStore } from "../../../../src/nexus/chamber-scenario";
import { chamberTablesFromSupabase, TableChamberStore } from "../../../../src/nexus/persistence/chamber-store";
import { productionUserDataBlock } from "../../../../src/nexus/production-boundary";
import { listRuntimeCapabilities, nexusAdapters } from "../../../../src/nexus/runtime";
import type { NexusCapability } from "../../../../src/nexus/types";

const memory = new MemoryChamberStore();
const memoryKeys = new Map<string, string>();
const memoryStore = Object.assign(memory, {
  tag(key: string) {
    memoryStore.pending = key;
  },
  pending: undefined as string | undefined,
  async saveChamber(chamber: Parameters<MemoryChamberStore["saveChamber"]>[0], cursor: number) {
    await memory.saveChamber(chamber, cursor);
    if (memoryStore.pending) memoryKeys.set(`${chamber.projectId}\n${memoryStore.pending}`, chamber.id);
  },
  async findByIdempotency(projectId: string, key: string) {
    const id = memoryKeys.get(`${projectId}\n${key}`);
    return id ? memory.getChamber(projectId, id) : null;
  },
});

function durableStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false } });
  return new TableChamberStore(chamberTablesFromSupabase(db));
}

export async function GET(request: Request) {
  const blocked = productionUserDataBlock();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!isUuid(projectId)) return NextResponse.json({ error: "projectId must be a uuid." }, { status: 400 });
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
  }
  const store = durableStore() ?? memoryStore;
  const chambers = await store.listChambers(projectId);
  return NextResponse.json({ chambers, source: durableStore() ? "durable" : "memory" });
}

export async function POST(request: Request) {
  const blocked = productionUserDataBlock();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
  let body: { projectId?: string; objective?: string; capabilityKey?: string; input?: unknown; approved?: boolean; chamberId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const projectId = body.projectId ?? "";
  if (!isUuid(projectId)) return NextResponse.json({ error: "projectId must be a uuid." }, { status: 400 });
  let actorId = "operator";
  if (authRequired()) {
    const auth = await authenticateNexusRequest(request, projectId);
    if (!auth) return NextResponse.json({ error: "Authentication or project authorization required." }, { status: 401 });
    actorId = auth.userId;
  }
  const capability = listRuntimeCapabilities().find((item) => item.key === body.capabilityKey);
  if (!capability) return NextResponse.json({ error: "capabilityKey is not in the runtime catalog." }, { status: 404 });
  const store = durableStore() ?? memoryStore;
  const result = await openChamber(
    {
      projectId,
      objective: typeof body.objective === "string" ? body.objective : "",
      actorId,
      capability: capability as NexusCapability,
      idempotencyKey,
      input: body.input,
      approved: body.approved === true,
      chamberId: body.chamberId,
    },
    store,
    {
      invoke: async (cap, step, actor) => {
        const adapter = nexusAdapters.find((item) => item.id === cap.adapterId);
        if (!adapter) return { ok: false, error: `No adapter is bound for ${cap.key}.` };
        const invoked = await adapter.invoke({ capabilityId: cap.id, input: step.input ?? {}, actorId: actor, correlationId: idempotencyKey });
        return { ok: invoked.ok, output: invoked.output, error: invoked.error };
      },
    },
  );
  return NextResponse.json(result.body, { status: result.status });
}
