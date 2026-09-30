# Portfolio 10-phase roadmap — 2026-09-30 12:00 EDT

1. **Stabilize entropy** — close superseded hygiene stamps. Keep live work only.
2. **Owner production redeploy (CHR-54)** — SERVICE_ROLE is already set on `resonancenexus` production context. Redeploy current main from GitHub. Exit: `/api/ready` 200. Do not invent the secret. Do not switch hosts.
3. **Land Resonance hardening already written** — rebase/merge #133 and #131 after green `web`+`ios`. Keep #134 as the iOS app-target slice.
4. **Durable GitHub vertical slice on the live host** after phase 2.
5. **Quicksilver device HG CHR-55** from `4f9660ff`. Simulator CI is not acceptance.
6. **Repair QS #195 / rebase or close #193**. Do not merge red.
7. **Conduit freeze** — #119/#120 stay draft red. Hold #155 for Render TLS. Rebase #152 onto `cefebc6f`.
8. **Resonance iOS I1** blocked by phase 2.
9. **Chamber lifecycle** blocked by phase 2.
10. **Release surface** + owner prune leftover branches. No delete-ref tool on this connector.
