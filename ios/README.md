# Resonance iOS

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint

The project is designed to remain compatible with sideloaded distribution workflows, including SideStore. Avoid App Store-only assumptions in the core client. Keep signing, entitlements, network configuration, and dependencies explicit and minimal.

## Release gate

A production candidate must pass all of these gates:

1. Archive the actual iOS application with Xcode using a Release configuration and real signing configuration. `swift build` is not sufficient evidence of an installable IPA.
2. Export a signed IPA and install it through SideStore on the target iPhone.
3. Record commit SHA, bundle identifier, iOS version, IPA export result, SideStore installation result, and launch result.
4. From the installed app, authenticate to Nexus, discover project-scoped capabilities, submit a valid intent with an idempotency key, observe persisted execution state, and retrieve durable evidence.
5. Repeat the same idempotency key and confirm the original execution is returned rather than duplicated.
6. Verify invalid authentication, unauthorized project access, malformed/oversized input, unavailable capabilities, execution failure, and process-restart recovery.

A green backend CI run does not substitute for these device-level checks.

## Engineering constraints

- Swift 6.
- Swift concurrency correctness is required.
- Prefer native SwiftUI APIs.
- Keep domain models value-oriented and Sendable where they cross isolation boundaries.
- Keep network transport actor-isolated.
- No API keys or secrets in the client.
- Preserve a clean API boundary so Nexus evolves independently of UI.
- Minimum supported iOS version currently follows `Package.swift`.

## Planned first vertical slice

Nexus connection → capability discovery → intent composition → policy/approval state → execution → live evidence → result.

The slice should be usable without requiring the iOS client to own the underlying capability graph.

## Local AI boundary

AMD Embeddable Lemonade/`lemond` is an optional external local-AI provider for supported desktop environments. It must not be bundled into the iOS target or required for the iOS app to build, sign, install, or operate.
