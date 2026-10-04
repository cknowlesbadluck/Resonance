export type InvokeView = {
  availability?: string;
  executable?: boolean;
  unexecutableReason?: string;
};

/**
 * The control surface may offer invoke only when this deployment can actually run
 * the capability. Upstream availability is not local executability, and a fixture
 * that an adapter declares but marks unavailable is still not invocable.
 */
export function canInvokeCapability(capability: InvokeView | null | undefined): boolean {
  if (!capability || capability.executable !== true) return false;
  return capability.availability !== "unavailable" && capability.availability !== "planned";
}

export function capabilityStateLabel(capability: InvokeView): string {
  if (canInvokeCapability(capability)) return capability.availability === "degraded" ? "degraded" : "executable";
  if (capability.availability === "planned") return "planned";
  if (capability.availability === "unavailable") return "unavailable";
  return "not executable";
}
