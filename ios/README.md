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

## Building the app

`ios/project.yml` (XcodeGen) defines the buildable app:

| Target | Sources | Notes |
|--------|---------|-------|
| `Resonance` (iOS app) | `App/` incl. `App/AppIntents/` | Bundle id `com.cknowlesbadluck.resonance`; ships `App/PrivacyInfo.xcprivacy` |
| `ResonanceCore` (framework) | `Sources/ResonanceCore` | Same sources as the SwiftPM library |
| `ResonanceCoreTests` | `Tests/ResonanceCoreTests` | Runs on an iOS simulator |

```sh
brew install xcodegen
cd ios && xcodegen generate
open Resonance.xcodeproj   # set your Team for device / SideStore builds
```

Release builds need a control-plane URL: set `RESONANCE_BASE_URL` (build setting → Info.plist),
e.g. `xcodebuild ... RESONANCE_BASE_URL=https://your-nexus.example`. `Resonance.xcodeproj` and
`App/Info.plist` are generated and git-ignored. CI (`ios-app` job) generates the project, builds
Debug (simulator) and Release (device, unsigned), and runs `ResonanceCoreTests` on a simulator.
