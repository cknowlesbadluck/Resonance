import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../app/api/ready/route";
import { DEPLOY_ENV_KEYS } from "./contract";

const CANARY = "canary-value-must-never-leak-7f3a";

/** Every string anywhere in the JSON body (keys and values). */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) { out.push(k); strings(v, out); }
  return out;
}

describe("/api/ready privacy floor", () => {
  afterEach(() => vi.unstubAllEnvs());

  for (const stage of ["production", "development"]) {
    it(`publishes env NAMES only, never values (${stage})`, async () => {
      vi.stubEnv("RESONANCE_DEPLOY_STAGE", stage);
      // Set every contract key except one required key, each to a unique canary value.
      // RESONANCE_AUTH_MODE is a non-secret mode switch (echoed as authMode), so it gets a real mode.
      for (const spec of DEPLOY_ENV_KEYS) {
        if (spec.key === "RESONANCE_AUTH_MODE") vi.stubEnv(spec.key, "required");
        else vi.stubEnv(spec.key, spec.key === "SUPABASE_SERVICE_ROLE_KEY" ? "" : `${CANARY}-${spec.key}`);
      }
      const res = await GET();
      const raw = await res.text();
      expect(raw).not.toContain(CANARY);
      const body = JSON.parse(raw);
      const names = new Set(DEPLOY_ENV_KEYS.map((s) => s.key));
      for (const list of [body.missingRequired, body.missing, body.ownerKeys].filter(Array.isArray))
        for (const item of list) expect(names.has(item)).toBe(true);
      for (const s of strings(body)) expect(s).not.toContain(CANARY);
      expect(["required", "optional", "auto", "disabled", "off"]).toContain(body.authMode);
    });
  }
});
