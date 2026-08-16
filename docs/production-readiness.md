# Resonance production-readiness gate

## Release gates

- [x] Nexus request authentication and project scoping
- [x] Durable execution state
- [x] Idempotency enforcement
- [x] Durable audit/evidence persistence
- [x] Bounded request/event payloads
- [ ] CI green on the production-hardening branch
- [ ] Production build verified
- [ ] Runtime smoke test against configured Supabase environment
- [ ] Authentication negative-path test
- [ ] Idempotency replay test
- [ ] Execution restart/recovery test
- [ ] SideStore-loadable iOS archive/IPA verified on a real iOS device
- [ ] End-to-end iOS → Nexus → execution → evidence verification

## Local AI boundary

Resonance keeps local AI behind the provider abstraction. AMD Embeddable Lemonade is an optional provider for supported desktop environments; it is not an iOS dependency and is not required for the core Nexus release gate.

The eventual local provider must expose the same normalized execution contract as cloud providers and must not weaken Nexus authentication, policy, persistence, idempotency, or evidence requirements.

## Verification rule

A green TypeScript/test/build pipeline is necessary but not sufficient for production readiness. Release status must only advance after runtime, security, persistence, and SideStore installation evidence is recorded.
