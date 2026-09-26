# Resonance iOS / SideStore release plane

Native Swift/SwiftUI client for the Resonance Nexus.

## Product boundary

The iOS client is a presentation and control layer over Nexus. Capabilities, intents, policy, providers, resources, execution, evidence, and persistence remain server/domain concerns.

## Distribution constraint

Compatible with SideStore / sideloaded workflows. Avoid App Store-only assumptions.

The app is now an actual, reproducible iOS application target rather than a collection
of Swift sources. `project.yml` is the source of truth for the generated Xcode project;
do not commit generated `.xcodeproj` state.

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

`ResonanceShortcuts` registers Siri/Spotlight phrases. Token order: explicit override → Keychain → environment; bearer tokens never enter UserDefaults.

## What ships

- A native capability cockpit with availability-aware execution controls.
- A fail-closed `/api/ready` preflight. Execution stays disabled until auth and
  persistence are ready.
- Execution history and evidence, including failed-execution evidence returned with 422.
- In-app base URL, project UUID, and bearer-token setup. Tokens are Keychain-only.
- App Intents for discovery, composition, and idempotent execution.
- An unsigned IPA build suitable for SideStore's normal on-device signing flow.

## Build the SideStore IPA

On macOS with Xcode 16 and [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
ios/scripts/build-sidestore.sh
```

The output is `ios/build/Resonance-unsigned.ipa`. It intentionally contains no
developer identity, provisioning profile, token, or backend secret. Install it through
SideStore, which signs the bundle with the user's Apple development identity. The
`iOS SideStore` GitHub workflow runs package tests and publishes the IPA as a CI artifact
for every iOS change.

## First launch

1. Open **Connection**.
2. Keep `https://resonancenexus.netlify.app` or enter another HTTPS deployment.
3. Enter a project UUID and a user bearer token; never enter a service-role key.
4. Tap **Save and verify**. The Nexus and execution surfaces unlock only when `/api/ready`
   reports ready.

The production host currently defaults to the canonical Resonance deployment, while
localhost remains supported for development. ATS is restricted to HTTPS plus local
networking; arbitrary HTTP is not enabled.
