# Resonance iOS

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint (SideStore)

Compatible with **SideStore / sideloaded** workflows:

- No App Store–only services (no StoreKit, no required push, no CloudKit identity).
- Bearer tokens live in **Keychain** (`KeychainTokenStore`), not in the binary.
- **Base URL is user-configurable** (Settings). Physical devices cannot use Mac-only `localhost`; point at a LAN or public Nexus HTTPS endpoint.
- Bundle id / provisioning must match the SideStore signing identity; Keychain items are scoped to that identity.
- App Intents work on-device when the host OS supports them; they are not an App Store entitlement.

## Engineering constraints

- Swift 6, structured concurrency
- Domain models Sendable where they cross isolation
- Package platforms: iOS 17+, macOS 14+ (for CI `swift test`)
- UI flow: **Intent → Plan → Execute → Evidence → Result** (`docs/IOS_UI_DIRECTION.md`)

## App structure

| Area | Role |
|------|------|
| `Sources/ResonanceCore` | Transport, models, client, Keychain, error mapping |
| `App/NexusCockpitStore.swift` | `@MainActor` UI state |
| `App/ResonanceApp.swift` | Tabs: Home, Intent, Capabilities, History, Settings |
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
