import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn((url: string, key: string, options: unknown) => ({ url, key, options }));
vi.mock("@supabase/supabase-js", () => ({ createClient: (...args: [string, string, unknown]) => createClient(...args) }));

const { createServiceRoleClient, serviceRoleConfig } = await import("./service-client");

const env = (overrides: Record<string, string | undefined>) => ({ ...overrides }) as NodeJS.ProcessEnv;
const FULL = env({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-placeholder" });

beforeEach(() => createClient.mockClear());

describe("serviceRoleConfig", () => {
  it("is null unless both URL and service-role key are set", () => {
    expect(serviceRoleConfig(env({}))).toBeNull();
    expect(serviceRoleConfig(env({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }))).toBeNull();
    expect(serviceRoleConfig(env({ SUPABASE_SERVICE_ROLE_KEY: "test-placeholder" }))).toBeNull();
    expect(serviceRoleConfig(env({ NEXT_PUBLIC_SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" }))).toBeNull();
    expect(serviceRoleConfig(FULL)).toEqual({ url: "https://example.supabase.co", key: "test-placeholder" });
  });
});

describe("createServiceRoleClient", () => {
  it("returns null and never constructs a client when unconfigured", () => {
    expect(createServiceRoleClient({}, env({}))).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("default options match the previous route copies exactly: { auth: { persistSession: false } }", () => {
    createServiceRoleClient({}, FULL);
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "test-placeholder", { auth: { persistSession: false } });
  });

  it("token-verification clients also disable auto refresh (previous nexus-request options)", () => {
    createServiceRoleClient({ autoRefreshToken: false }, FULL);
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "test-placeholder", { auth: { persistSession: false, autoRefreshToken: false } });
  });

  it("reads process.env by default", () => {
    const saved = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(createServiceRoleClient()).toBeNull();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://env.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-placeholder";
      expect(createServiceRoleClient()).not.toBeNull();
    } finally {
      if (saved.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = saved.url;
      if (saved.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.key;
    }
  });
});

describe("single construction site (static guard)", () => {
  const root = process.cwd();
  const serverFiles = [
    "app/api/webhooks/github/route.ts",
    "app/api/nexus/executions/route.ts",
    "app/api/nexus/executions/[id]/resume/route.ts",
    "app/api/events/route.ts",
    "src/nexus/persistence/supabase.ts",
    "src/auth/nexus-request.ts",
  ];
  for (const file of serverFiles) {
    it(`${file} builds its service-role client through createServiceRoleClient`, () => {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).toMatch(/createServiceRoleClient\(/);
      expect(source).not.toMatch(/\bcreateClient\(/);
    });
  }
});
