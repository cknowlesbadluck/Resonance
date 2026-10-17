// Conformance: the real /api/ready route handler output must satisfy the vendored
// portable readiness contract (schemas/readiness/v1.schema.json). No network; placeholder env only.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../app/api/ready/route";
import { readiness } from "./health";
import { READINESS_CONTRACT_VERSION, RESONANCE_VERSION } from "./version";

type Schema = Record<string, unknown>;
const root = resolve(__dirname, "../..");
const schema = JSON.parse(readFileSync(resolve(root, "schemas/readiness/v1.schema.json"), "utf8")) as Schema;

const ANNOTATIONS = new Set(["$schema", "$id", "title", "description", "x-contract-version"]);
const KNOWN = new Set(["type", "required", "properties", "additionalProperties", "enum", "pattern", "minLength", "maxLength", "items", "uniqueItems", "maxItems"]);

/** Zero-dependency validator for the keyword subset the contract uses. Unknown keywords fail loudly. */
function validate(node: Schema, value: unknown, path = "$"): string[] {
  for (const key of Object.keys(node)) {
    if (!ANNOTATIONS.has(key) && !KNOWN.has(key)) throw new Error(`unsupported schema keyword ${key} at ${path}`);
  }
  const errors: string[] = [];
  const type = node.type as string | undefined;
  if (type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [`${path}: expected object`];
    const record = value as Record<string, unknown>;
    for (const key of (node.required as string[] | undefined) ?? []) if (!(key in record)) errors.push(`${path}.${key}: required`);
    const props = (node.properties as Record<string, Schema> | undefined) ?? {};
    for (const [key, child] of Object.entries(record)) {
      if (props[key]) errors.push(...validate(props[key], child, `${path}.${key}`));
      else if (node.additionalProperties === false) errors.push(`${path}.${key}: not allowed`);
    }
  } else if (type === "array") {
    if (!Array.isArray(value)) return [`${path}: expected array`];
    if (typeof node.maxItems === "number" && value.length > node.maxItems) errors.push(`${path}: too many items`);
    if (node.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${path}: duplicate items`);
    if (node.items) value.forEach((item, index) => errors.push(...validate(node.items as Schema, item, `${path}[${index}]`)));
  } else if (type === "string") {
    if (typeof value !== "string") return [`${path}: expected string`];
    if (typeof node.minLength === "number" && value.length < node.minLength) errors.push(`${path}: too short`);
    if (typeof node.maxLength === "number" && value.length > node.maxLength) errors.push(`${path}: too long`);
    if (typeof node.pattern === "string" && !new RegExp(node.pattern, "u").test(value)) errors.push(`${path}: pattern mismatch`);
  } else if (type !== undefined) {
    throw new Error(`unsupported type ${type} at ${path}`);
  }
  if (Array.isArray(node.enum) && !node.enum.includes(value)) errors.push(`${path}: not in enum`);
  return errors;
}

const PLACEHOLDER = "placeholder-not-a-real-value";
const FULL = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.invalid",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: PLACEHOLDER,
  SUPABASE_SERVICE_ROLE_KEY: PLACEHOLDER,
  RESONANCE_PROJECT_ID: "00000000-0000-4000-8000-000000000000",
  RESONANCE_AUTH_MODE: "required",
};
const CONFIGS: Record<string, Record<string, string>> = {
  "production, fully configured": FULL,
  "production, missing service role": { ...FULL, SUPABASE_SERVICE_ROLE_KEY: "" },
  "production, nothing configured": { NODE_ENV: "production" },
  "development, nothing configured": { NODE_ENV: "development" },
  "production with a commit sha": { ...FULL, COMMIT_REF: "a".repeat(40) },
};
const ALL_KEYS = ["NODE_ENV", "RESONANCE_DEPLOY_STAGE", "COMMIT_REF", "RESONANCE_COMMIT_SHA", "VERCEL_GIT_COMMIT_SHA", "GITHUB_SHA", ...Object.keys(FULL)];

afterEach(() => vi.unstubAllEnvs());

describe("portable readiness contract v1", () => {
  it("vendored schema version matches the code and the version matches package.json", () => {
    expect(schema["x-contract-version"]).toBe(READINESS_CONTRACT_VERSION);
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { version: string };
    expect(RESONANCE_VERSION).toBe(pkg.version);
  });

  for (const [name, env] of Object.entries(CONFIGS)) {
    it(`GET /api/ready conforms (${name}) and HTTP code agrees with status`, async () => {
      for (const key of ALL_KEYS) vi.stubEnv(key, "");
      for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
      const response = await GET();
      const body = (await response.json()) as Record<string, unknown>;
      expect(validate(schema, body)).toEqual([]);
      expect(response.status).toBe(body.status === "ready" ? 200 : 503);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(JSON.stringify(body)).not.toContain(PLACEHOLDER);
      expect(JSON.stringify(body)).not.toContain("placeholder.invalid");
      if ((body.missingRequired as string[]).length > 0) expect(body.status).not.toBe("ready");
    });
  }

  it("validator actually enforces the contract (negative cases)", () => {
    const good = JSON.parse(JSON.stringify(readiness())) as Record<string, unknown>;
    const bad: Array<Record<string, unknown>> = [
      { ...good, status: "ok" },
      { ...good, version: undefined },
      { ...good, commitSha: null },
      { ...good, commitSha: "https://example.test" },
      { ...good, missingRequired: ["sk_live_value"] },
      { ...good, stage: "" },
    ];
    for (const body of bad) expect(validate(schema, JSON.parse(JSON.stringify(body)))).not.toEqual([]);
    expect(() => validate({ type: "string", format: "uri" }, "x")).toThrow(/unsupported schema keyword/);
  });
});
