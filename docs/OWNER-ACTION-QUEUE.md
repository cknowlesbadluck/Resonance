# Owner Action Queue

**Living checklist for owner-gated items. Updated 2026-11-13 21:05Z.**

Do not invent evidence. Do not apply without explicit authorization.

## Security / Database (Critical)

- [ ] **Apply #265 RLS lock-down migration** (Resonance). CI green. Explicit owner review required. Live DB currently has broader PUBLIC policies. See PR #265.
- [ ] **Apply #208 composite indexes** (Resonance). Additive migration. Prefer CONCURRENTLY on large tables. See PR #208.
- [ ] Run `scripts/verify-rls.sql` (PR #196) against live DB after #265 lands. Read-only.

## Environment / Configuration (Medium)

- [ ] Set `GITHUB_TOKEN` + webhook secret on Netlify for Resonance githubAdapter. Currently `githubAdapterConfigured=false`.
- [ ] Review and merge or close residual drafts: Resonance #250 (two-key policy), Conduit #321 (HTTP factory), Conduit #120 (migrations).

## Device / Product Gate (High for Quicksilver ship)

- [ ] Record real iPhone 16e / iOS 27 IPA for CHR-55. Simulator insufficient. deviceAcceptance remains not_recorded.
- [ ] Review and merge QuicksilverV1 #416 (Spotlight opt-in notes) after CI green. Opt-in, bounded, on-device.

## Hygiene (Medium)

- [ ] Prune stale `audit/*` and `docs/audit-*` branches on Resonance (>14 days, no open PR). Dozens present.
- [ ] Upgrade Conduit Hono to >=4.13.16 (Dependabot mediums).
- [ ] Pin or upgrade QuicksilverV1 undici in gateway (dev scope high).

## Notes

Highest-value sequence: #265 → #208 → #416 → CHR-55 device record → githubAdapter config → branch prune.

This file is updated on each portfolio audit pass.
