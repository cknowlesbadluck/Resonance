import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("client-only capability retirement", () => {
  it("does not keep the deprecated IntegrationAdapter module", () => {
    const retired = path.join(process.cwd(), "lib", "integrations.ts");
    expect(existsSync(retired)).toBe(false);
  });
});
