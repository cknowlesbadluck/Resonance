# SideStore release procedure

Resonance must remain distributable as a standard signed iOS IPA. Backend hardening and optional desktop local-AI providers must not introduce iOS-only-incompatible runtime dependencies.

## Gate

1. Build the iOS target with the repository's supported Xcode project/workspace.
2. Archive Release configuration.
3. Export a signed IPA using the developer's available signing identity/profile.
4. Install the IPA through SideStore on the target iPhone.
5. Launch Resonance and verify the app reaches its authenticated Nexus configuration without requiring desktop-only binaries.
6. Exercise the core path: authenticate → create intent → execute → observe durable evidence.
7. Record the exact commit, bundle identifier, iOS version, and install result.

## Architecture constraint

Lemonade/`lemond` is a desktop local-AI provider and must never be a required iOS process, embedded binary, or startup dependency. The iOS client talks to Nexus/provider abstractions; desktop local inference remains an optional external capability.

## Failure policy

A backend CI pass does not imply SideStore readiness. Do not label a release SideStore-ready until an IPA has actually been exported and installed on a physical iOS device.
