# Resonance iOS

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint

Compatible with SideStore / sideloaded workflows. Avoid App Store-only assumptions.

## Engineering constraints

- Swift 6, structured concurrency
- Domain models Sendable where they cross isolation
- No secrets in the client; Keychain preferred for tokens
- Package platforms: iOS 17+, macOS 14+ (for CI)

## App Intents

Sources under `App/AppIntents/` (main app target):

| Type | Purpose |
|------|---------|
| ListCapabilitiesIntent | Inventory |
| ComposeNexusIntent | Objective → plan |
| ExecuteNexusPlanIntent | Execute + Idempotency-Key |
| OpenNexusIntent | Open cockpit |
| NexusCapabilityEntity | Rich capability picker |

`ResonanceShortcuts` registers Siri/Spotlight phrases. Token order: Keychain → env → UserDefaults.
