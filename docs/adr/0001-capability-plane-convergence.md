# ADR 0001 — Capability plane convergence

- **Status**: Proposed (Two-Key: first key only — second approval outstanding)
- **Date**: 2026-09-14
- **Supersedes**: the implicit "catalog is a view, registry is the runtime" split

## Context

Resonance had two capability planes that shared a type name and nothing else.

`GET /api/nexus/capabilities` merged a 14-entry catalog (`lib/capabilities.ts`) with a
3-entry runtime registry. `composeIntent` read only the registry. Catalog capabilities
were therefore advertised and then rejected at compose time — measured at 14 out of 14,
by three independent mechanisms: they were never registered, their grant vocabulary was
unknown to the policy, and their provider names bound to no adapter.

For a product whose thesis is "integration without domination; connection does not imply
authority", a control plane that advertises capabilities it cannot invoke is the specific
failure that most undermines the claim.

## Decision

1. **One registry.** Catalog capabilities are registered into the runtime registry via an
   explicit composition root (`src/composition/root.ts`). Discovery and composition read
   the same set.

2. **One permission vocabulary, one translation seam.** `src/nexus/grants.ts` normalizes
   resource-action grants (`repo.read`) onto policy levels (`read`). It is the only place
   the two vocabularies meet. Fail-closed is preserved: an uninterpretable grant still
   denies. Normalization widens what is *understood*, never what is *allowed*.

3. **Risk is derived, not declared by fiat.** Risk is a function of the authority a
   capability requests. The previous `DEFAULT_RISK = "medium"` constant meant policy —
   documented as unbypassable — was deciding against fabricated inputs.

4. **Availability and executability are different facts.** `availability` describes the
   upstream provider; the new `executable` / `unexecutableReason` describe whether *this
   deployment* has an adapter bound. A capability can be `available` upstream and
   `executable: false` locally, and the API now says so instead of implying it can run.

5. **The core depends on nothing outward.** `src/nexus/*` no longer imports `lib/`.
   The catalog-backed source lives in `lib/nexus-catalog.ts`; wiring lives in the
   composition root.

## Consequences

**Good**
- Every advertised capability is now resolvable by the composer, or reports a specific,
  actionable reason. The opaque `No compatible capability for X` is gone.
- `tool.github` / `integration.github` execute for real through `GitHubAdapter` once
  `GITHUB_TOKEN` is configured.
- Adding an adapter is now the single act that makes a whole class of catalog
  capabilities executable.

**Costs**
- `NexusCapability` gained two fields. Additive and optional, but it touches one of the
  nine first-class concepts, hence the Two-Key flag.
- Most catalog capabilities now report `executable: false`. This is not a regression —
  it is the previously hidden truth becoming visible, and any UI that assumed everything
  listed was runnable will need to show the distinction.
- The composition root is a new place wiring can rot. It is small and tested on purpose.

**Rejected alternatives**
- *Let the policy default-allow unknown grants.* Trades a correctness bug for a security
  hole.
- *Delete the catalog.* It is the product's discovery surface; the bug was that it was
  disconnected, not that it existed.
- *Keep advertising everything as runnable and fail at execution.* Preserves the exact
  dishonesty this ADR exists to remove.
