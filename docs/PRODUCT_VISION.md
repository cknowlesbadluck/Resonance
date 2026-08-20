# Resonance — Finished Product Vision

What Resonance becomes when the roadmap is complete.

## One sentence

**Resonance is the control plane and runtime where humans and agents compose provider-neutral capabilities into governed, auditable work — from phone or web — without coupling the product core to any single vendor or agent framework.**

## The finished system

### Control plane (web + native iOS)

- Spatial Nexus view of projects, capabilities, live executions, and Chambers.
- Compose an intent in natural or structured form; see the plan before it runs.
- Approve privileged steps; resume or cancel from the same surface.
- Full history: evidence, audit events, artifacts — not chat scrollback as truth.

### Nexus runtime

- Capabilities are first-class (`NexusCapability`): skill, tool, integration kinds; risk; permissions; dependencies.
- Policy gate is unbypassable; connection is not authority.
- Every execution is idempotent, project-scoped, and optionally authenticated.
- Chambers form around an Agenda, seed a toolkit, coordinate participants, then dissolve with durable residue.

### Adapters

- HTTP, MCP, and provider bridges sit behind one contract.
- GitHub, Linear, Supabase, model providers — installed, scoped, and ranked by health/cost/latency.
- Demo adapters only in non-production modes.

### Native iOS

- Full peer of the web client: capabilities, compose, execute, approve, history.
- Idempotency-Key and Bearer on every mutating call.
- Siri / App Intents for “run this Nexus intent” without opening the app.
- On-device session material in Keychain only.

## Possibilities unlocked

### 1. Governed multi-agent work without framework lock-in
Operators assemble temporary teams of tools and agents per Agenda. When the Chamber dissolves, the org keeps evidence and policy trail — not a proprietary agent graph.

### 2. Same contract on iPhone and desktop
A founder on the phone can approve a high-risk step that a CI agent requested. One Nexus API; two control surfaces.

### 3. Honest capability marketplace (internal first)
Planned vs available is explicit. Dependencies resolve before execution. Nothing pretends to work.

### 4. Audit-grade automation
Regulated or high-stakes workflows get correlation IDs, idempotent retries, and human gates as product features — not afterthoughts.

### 5. Provider substitution
Swap OpenAI for another model tool, or GitHub for another forge, without rewriting Chamber logic. Adapters change; Nexus contracts do not.

### 6. Composition as the product
The moat is not a single model or a single integration. It is the fabric: Agenda, Chamber, capability policy, evidence, and cross-surface control.

## What finished does *not* mean

- Not “another agent chat UI.”
- Not Quicksilver rebranded.
- Not a Cloudflare-dependent edge product by default.
- Not unbounded third-party agent install without policy.

## Success signals

1. A user can complete intent → plan → (approval) → execute → evidence on web and iOS.
2. Duplicate requests never double-execute.
3. Unauthenticated production traffic is rejected when `RESONANCE_AUTH_MODE=required`.
4. Capability list/resolve return one domain model everywhere.
5. Branch entropy and open-PR count stay low for consecutive sessions.
6. A Chamber can form, work, and dissolve with audit intact.

## Near-term path to that vision

Ship P1–P3 tightly (auth, durable state, capability convergence, iOS execute loop), then P5 Chamber vertical slice, then P6 release smoke. Resist net-new feature branches until those contracts are boringly reliable.
