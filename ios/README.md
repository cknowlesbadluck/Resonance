# Resonance iOS

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint (SideStore)

Compatible with **SideStore / sideloaded** workflows. That is a **shipping constraint**, not a feature ceiling:

- Keep App Intents, plan review, approval resume, evidence, and authenticated Nexus calls.
- Do **not** add App Store–only runtime dependencies (StoreKit, CloudKit identity, required push).
- Bearer tokens live in **Keychain** (`KeychainTokenStore`).
- **Base URL is user-configurable**. Physical devices cannot use Mac-only `localhost`.
- `Info.plist.example` enables local-network ATS so a sideloaded device can reach a LAN Nexus. Production should still be HTTPS.
- Bundle id / provisioning must match the SideStore signing identity.

## Engineering constraints

- Swift 6, structured concurrency
- Domain models Sendable where they cross isolation
- Package platforms: iOS 17+, macOS 14+ (for CI `swift test`)
- UI flow: **Intent → Plan → Execute → Evidence → Result**, plus spatial capability map

## App structure

| Area | Role |
|------|------|
| `Sources/ResonanceCore` | Transport, models, client, Keychain, error mapping, resume |
| `App/NexusCockpitStore.swift` | `@MainActor` UI state |
| `App/ResonanceApp.swift` | Spatial Nexus + Intent/Capabilities/Evidence/Settings |
| `App/AppIntents/` | Siri/Shortcuts entry points |

## App Intents

| Type | Purpose |
|------|---------|
| ListCapabilitiesIntent | Inventory |
| ComposeNexusIntent | Objective → plan |
| ExecuteNexusPlanIntent | Execute + Idempotency-Key |
| OpenNexusIntent | Open cockpit |
| NexusCapabilityEntity | Rich capability picker |

Token order: Keychain → env → UserDefaults (legacy read only).

## Local package tests

```bash
swift test --package-path ios
```
