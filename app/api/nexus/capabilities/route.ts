import { NextResponse } from "next/server";
import { nexusRegistry } from "../../../../src/nexus/runtime";
import { createNexusPersistenceFromEnv } from "../../../../src/nexus/persistence/supabase";

export async function GET() {
  const capabilities = nexusRegistry.list();
  const persistence = createNexusPersistenceFromEnv();
  if (persistence) {
    await Promise.all(capabilities.map((capability) => persistence.saveCapability(capability)));
  }
  return NextResponse.json({ capabilities, persistenceConfigured: Boolean(persistence) });
}
