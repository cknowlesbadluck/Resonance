import { describe, expect, it } from "vitest";
import type { NexusCapability } from "../nexus/types";
import { canInvokeCapability, capabilityStateLabel } from "./invoke";

describe("control surface invoke gate", () => {
  it("allows only an executable capability that is not planned or unavailable", () => {
    expect(canInvokeCapability({ executable: true, availability: "available" } as Partial<NexusCapability>)).toBe(true);
    expect(canInvokeCapability({ executable: true, availability: "degraded" } as Partial<NexusCapability>)).toBe(true);
  });

  it("refuses catalog descriptors and fixtures the runtime will not run", () => {
    expect(canInvokeCapability({ executable: false, availability: "available", unexecutableReason: "no adapter" } as Partial<NexusCapability>)).toBe(false);
    expect(canInvokeCapability({ executable: true, availability: "unavailable" } as Partial<NexusCapability>)).toBe(false);
    expect(canInvokeCapability({ executable: true, availability: "planned" } as Partial<NexusCapability>)).toBe(false);
    expect(canInvokeCapability(null)).toBe(false);
    expect(canInvokeCapability({ availability: "available" } as Partial<NexusCapability>)).toBe(false);
  });

  it("labels the reason the cockpit should show", () => {
    expect(capabilityStateLabel({ executable: true, availability: "available" } as Partial<NexusCapability>)).toBe("executable");
    expect(capabilityStateLabel({ executable: true, availability: "degraded" } as Partial<NexusCapability>)).toBe("degraded");
    expect(capabilityStateLabel({ executable: false, availability: "available" } as Partial<NexusCapability>)).toBe("not executable");
    expect(capabilityStateLabel({ executable: true, availability: "planned" } as Partial<NexusCapability>)).toBe("planned");
    expect(capabilityStateLabel({ executable: true, availability: "unavailable" } as Partial<NexusCapability>)).toBe("unavailable");
  });
});
