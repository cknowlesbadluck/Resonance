# Pushing this work

Two commits on `feat/p2-capability-plane-convergence`, branched from `main` @ `b331906`.
Nothing was pushed — this environment has no GitHub credentials of any kind.

Either method works. The bundle is preferred: it carries the commits exactly as made,
with authorship and messages intact.

## Option A — git bundle (recommended)

```bash
cd /path/to/resonance
git fetch /path/to/resonance-p2.bundle feat/p2-capability-plane-convergence:feat/p2-capability-plane-convergence
git push -u origin feat/p2-capability-plane-convergence
```

## Option B — patch

```bash
cd /path/to/resonance
git checkout main && git pull
git checkout -b feat/p2-capability-plane-convergence
git am < resonance-p2-capability-plane-convergence.patch
git push -u origin feat/p2-capability-plane-convergence
```

## Before you open the PR

`swift test --package-path ios` has never run against these changes — there is no Swift
toolchain in the environment they were written in. The macOS CI job is the first real
compile. Expect to fix something there; the TypeScript side is fully verified
(typecheck, 112 tests, production build).

## PR description starter

> Converges the Resonance capability plane so advertised capabilities are executable.
>
> `GET /api/nexus/capabilities` advertised 17 capabilities and could execute 3. All 14
> catalog capabilities failed at compose time, each blocked by three independent walls.
> See `docs/AUDIT-2026-09-14.md` §1 for the measurement and
> `docs/adr/0001-capability-plane-convergence.md` for the decision.
>
> **Two-Key Reformation Rule — second approval outstanding** for two changes that touch
> core domain semantics:
> 1. `NexusCapability` gains `executable` / `unexecutableReason`
> 2. `DefaultNexusPolicy` normalizes grant vocabularies
>
> Both were kept additive and reversible for exactly this reason. No migration was
> applied and no existing field changed meaning.
