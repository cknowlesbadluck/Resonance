# Resonance Runbook

Operational steps for the owner. Production host: **https://resonancenexus.netlify.app** (Netlify project `resonancenexus`). That is the only correct host; `*.vercel.app` names are not ours. Agents do not perform these steps. They need owner credentials, and they change production config or the database.

## 1. Readiness check

```sh
curl -s -w '\n%{http_code}\n' https://resonancenexus.netlify.app/api/health   # expect 200 {"status":"ok",...}
curl -s -w '\n%{http_code}\n' https://resonancenexus.netlify.app/api/ready    # expect 200 {"status":"ready",...}
```

`/api/ready` reports presence only and never echoes values. Fields: `status` (`ready`|`not_ready`), `service`, `stage`, `production`, `authMode`, `authModeOk`, `persistenceConfigured`, `githubAdapterConfigured`, `missingRequired` (env var **names**), `timestamp`. It returns HTTP 503 whenever `status` is `not_ready`.

Observed 2026-10-16 10:02 EDT: 503, `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]`, `authMode: "required"`, `persistenceConfigured: false`.

## 2. Restore the service-role key (owner only)

1. Make sure the Resonance Supabase project is active. Restore it from the Supabase dashboard if it is paused. That is free-tier; do not upgrade the plan.
2. In Supabase, go to Project Settings → API and copy the `service_role` key. Never paste it into chat, issues, PRs, logs or commits.
3. In Netlify, go to `resonancenexus` → Site configuration → Environment variables. Set `SUPABASE_SERVICE_ROLE_KEY`, scoped to **Functions/Runtime** and the **Production** context only, and mark it secret. Check that `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESONANCE_PROJECT_ID` and `RESONANCE_AUTH_MODE=required` are present.
4. Trigger a production deploy of `main` with Deploys → Trigger deploy → "Deploy project without cache".
5. Re-run §1. You should see 200, `persistenceConfigured: true` and an empty `missingRequired`. Then close CHR-54.

If the key may have leaked, rotate it in Supabase first. Then update Netlify and redeploy.

## 3. Verify RLS (read-only, PR #196)

`scripts/verify-rls.sql` (added in #196, see `docs/VERIFY-RLS.md`) only reads catalog state. Run it in the Supabase SQL editor or with `psql` as a privileged role:

```sh
psql "$DATABASE_URL" -f scripts/verify-rls.sql   # read-only; never run migrations from here
```

Expect every public table to report RLS **enabled**, with policies that match the intent pinned by the migration lint (#195). Any table with RLS disabled, or any drift from the migrations, is a finding. Record it in an issue. Fix it through a reviewed migration PR that the owner applies. `search_path` hardening (#173) also needs the owner to apply it.

## 4. Netlify deploy checks

- **Is production current?** Netlify → Deploys: the published deploy's commit should equal `git rev-parse origin/main`. After #178 merges, `/api/ready` also exposes `commitSha`.
- **No deploy after a merge?** Check for a Netlify commit status on the merge commit. If none exists, the production Git link is inactive. Reconnect it under Site configuration → Build & deploy → Continuous deployment. If a build exists but failed, read its log. A stale `package-lock.json` is the usual cause; fix it through a PR, not on the host.
- **Previews:** PR deploy previews run without production secrets, so `/api/ready` 503 is expected there.
- **Smoke:** `SMOKE_BASE_URL=https://resonancenexus.netlify.app npm run smoke`.

## 5. Rollback

Netlify → Deploys → pick the last good deploy → "Publish deploy". Then open a revert PR against `main`, because `main` requires one review. Do not force-push.
