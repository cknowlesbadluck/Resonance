# Resonance 24-Hour Actionable Roadmap

**Objective:** Achieve a stable, production-ready, and Sidestore-compatible state while establishing correct project boundaries.

## Phase 1: Clean Foundation (Hours 1-3)
- **Terminology Purge:** Remove all instances of "cockpit", "Twilio", and "Vercel" from documentation, iOS AppIntents, and READMEs. Resonance is a Nexus, not a generic dashboard or cockpit.
- **Project Boundary Enforcement:** Update any docs that blur the line between Resonance and Quicksilver.
- **Codebase Triage:** Ensure tests and builds (backend/frontend) pass reliably locally.

## Phase 2: iOS Client Alignment & Sidestore Polish (Hours 4-8)
- **Sidestore Compatibility Check:** Guarantee no paid developer entitlements (like Push Notifications, Game Center) are accidentally required. The app must run cleanly sideloaded.
- **UI Refinement:** Shift the iOS UI from a generic "dashboard" to an intent-driven interface prioritizing capabilities.
- **AppIntents Cleanup:** Rename `OpenNexusIntent` description to "Open the Resonance Nexus" instead of "cockpit".

## Phase 3: Capability Integration & Backend Hardening (Hours 9-16)
- **Adapter Contracts:** Ensure GitHub, HTTP, and MCP adapters in `src/nexus/adapters/` adhere strictly to the `NexusAdapter` contract.
- **Execution & Retry Resiliency:** Verify retries and error boundaries in the executor for external bridge calls (simulate failure modes).

## Phase 4: CI/CD & Final Verification (Hours 17-24)
- **CI Enforcement:** Confirm branch protection requires clean TS and Swift tests.
- **Production Smoke Test:** Validate the end-to-end flow: Authentication -> Discover Capability -> Propose Intent -> Execute -> Observe Evidence.
- **Documentation Snapshot:** Update `IMPLEMENTATION_STATUS.md` and `ARCHITECTURE.md` to reflect the purged terminology and stabilized architecture.
