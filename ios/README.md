# Resonance iOS

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint

The project is designed to remain compatible with sideloaded distribution workflows, including SideStore. Avoid App Store-only assumptions in the core client. Keep signing, entitlements, network configuration, and dependencies explicit and minimal.

## Engineering constraints

- Swift 6.
- Swift concurrency correctness is required.
- Prefer native SwiftUI APIs.
- Keep domain models value-oriented and Sendable where they cross isolation boundaries.
- Keep network transport actor-isolated.
- No API keys or secrets in the client.
- Preserve a clean API boundary so Nexus evolves independently of UI.
- Minimum supported iOS version currently follows `Package.swift`.

## App Intents

The main app target exposes three primary App Intents (source under `App/AppIntents/`):

| Intent | Purpose |
|--------|---------|
| `ListCapabilitiesIntent` | Read-only inventory of Nexus capabilities |
| `ComposeNexusIntent` | Objective → execution plan (no side effects) |
| `ExecuteNexusPlanIntent` | Execute with mandatory non-blank `Idempotency-Key` |

`ResonanceShortcuts` registers Siri / Spotlight / Shortcuts phrases. Call `ResonanceShortcuts.updateAppShortcutParameters()` at app launch (already done in `ResonanceApp`).

**Important build note:** App Intent types that back App Shortcuts should be compiled into the **main app target**. Domain logic lives in the `ResonanceCore` package; intent structs live under `ios/App/AppIntents/`.

Configuration (base URL, project ID, optional bearer token) is resolved by `NexusClientFactory` from environment variables or UserDefaults. Prefer Keychain for production tokens.

## Planned first vertical slice

Nexus connection → capability discovery → intent composition → policy/approval state → execution → live evidence → result.

The slice should be usable without requiring the iOS client to own the underlying capability graph.
