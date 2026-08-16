# Resonance iOS Distribution Mandate

## Product requirement

Resonance's primary human-facing product is a native Swift/SwiftUI iOS application.

The application MUST be designed to support side-loaded distribution as a first-class deployment mode.

## Distribution neutrality

Side-loading is a product requirement, not an architectural dependency. Resonance MUST remain capable of producing development, side-loaded, TestFlight, and App Store builds without changing Nexus semantics.

The product MUST NOT be designed around App Store review constraints as a substitute for product architecture.

## Architecture boundary

Swift/SwiftUI is the native client and Nexus cockpit. It is not the Nexus itself.

The Nexus remains provider-neutral and independently testable. The iOS client consumes stable Nexus contracts rather than embedding provider-specific business logic.

```text
Resonance Nexus
      |
  stable contracts
      |
Swift / SwiftUI client
      |
iPhone / iPad
      |
side-loaded build
```

## Core invariants

1. Side-loading is first-class.
2. App Store distribution remains possible without redesign.
3. SwiftUI is the primary native product surface.
4. Nexus semantics remain independent of iOS distribution.
5. Provider-specific integration logic stays outside the client.
6. Quicksilver remains completely independent.

## Implementation implication

Future iOS work should prioritize a clean Swift/SwiftUI client boundary, secure credential handling, deep links, notifications, Share Sheet/App Intents where useful, and an installable development/side-load path. None of these should redefine the Nexus core.
