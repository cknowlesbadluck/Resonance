import { listRuntimeCapabilities } from "../src/nexus/runtime";
import { SupabaseNexusPersistence } from "../src/nexus/persistence/supabase";
import type { NexusCapability } from "../src/nexus/types";

async function run() {
  const runtime = listRuntimeCapabilities();
  const projectId = "benchmark-project";

  let callCount = 0;
  // Mock Supabase client to simulate network overhead and measure DB calls
  const mockDb = {
    from: (table: string) => ({
      upsert: async (data: any) => {
        callCount++;
        // simulate some realistic minimal network/processing delay (50ms) per DB call
        return new Promise(resolve => setTimeout(() => resolve({ error: null }), 50));
      }
    })
  };

  const persistence = new SupabaseNexusPersistence(mockDb as any);

  // Generate 100 capabilities for testing bulk operations
  const lotsOfCaps = Array(100).fill(0).map((_, i) => ({...runtime[0], id: `cap-${i}`}));

  console.log("=== Benchmarking N+1 (Promise.all map) ===");
  callCount = 0;
  const startIndividual = Date.now();
  await Promise.all(lotsOfCaps.map((capability) => persistence.saveCapability(capability, projectId)));
  const endIndividual = Date.now();
  console.log(`Time: ${endIndividual - startIndividual}ms`);
  console.log(`Database calls: ${callCount}`);

  console.log("\n=== Benchmarking Bulk Save (upsert) ===");
  callCount = 0;
  const startBulk = Date.now();
  await persistence.saveCapabilities(lotsOfCaps, projectId);
  const endBulk = Date.now();
  console.log(`Time: ${endBulk - startBulk}ms`);
  console.log(`Database calls: ${callCount}`);
}

run();
