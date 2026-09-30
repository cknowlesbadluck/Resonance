import { describe, expect, it } from "vitest";
import { canInvokeCapability, capabilityStateLabel } from "./invoke";

describe("control surface invoke gate", () => {
  it("allows only an executable capability that is not planned or unavailable", () => {
    expect(canInvokeCapability({ executable: true, availability: "available" })).toBe(true);
    expect(canInvokeCapability({ executable: true, availability: "degraded" })).toBe(true);
  });

  it("refuses catalog descriptors and fixtures the runtime will not run", () => {
    expect(canInvokeCapability({ executable: false, availability: "available", unexecutableReason: "no adapter" })).toBe(false);
    expect(canInvokeCapability({ executable: true, availability: "unavailable" })).toBe(false);
    expect(canInvokeCapability({ executable: true, availability: "planned" })).toBe(false);
    expect(canInvokeCapability(null)).toBe(false);
    expect(canInvokeCapability({ availability: "available" })).toBe(false);
  });

  it("labels the reason the cockpit should show", () => {
    expect(capabilityStateLabel({ executable: true, availability: "available" })).toBe("executable");
    expect(capabilityStateLabel({ executable: true, availability: "degraded" })).toBe("degraded");
    expect(capabilityStateLabel({ executable: false, availability: "available" })).toBe("not executable");
    expect(capabilityStateLabel({ executable: true, availability: "planned" })).toBe("planned");
    expect(capabilityStateLabel({ executable: true, availability: "unavailable" })).toBe("unavailable");
  });
});
