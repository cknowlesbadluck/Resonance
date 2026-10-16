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
2. In Supabase, go to Project Settings → API Keys and create (or copy) a **secret key** (`sb_secret_…`). Supabase is retiring the legacy JWT `service_role` key, so prefer the new secret key; it goes into the same `SUPABASE_SERVICE_ROLE_KEY` variable with no code change (the value is passed straight to `createClient`). Use the legacy `service_role` key only if the new keys are not yet enabled on the project. Never paste either into chat, issues, PRs, logs or commits.
3. In Netlify, go to `resonancenexus` → Site configuration → Environment variables. Set `SUPABASE_SERVICE_ROLE_KEY`, scoped to **Functions** only (not Runtime, Builds or Post processing) and the **Production** context only, and mark it secret. Check that `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESONANCE_PROJECT_ID` and `RESONANCE_AUTH_MODE=required` are present.
4. Trigger a production deploy of `main` with Deploys → Trigger deploy → "Deploy project without cache".
5. Re-run §1. You should see 200, `persistenceConfigured: true` and an empty `missingRequired`. Then close CHR-54.

If the key may have leaked:

1. Create a replacement secret key in Supabase (do not delete the old one yet).
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Netlify with the replacement and redeploy (steps 3–4).
3. Verify with §1 that production is `ready` on the new key, and update any other place that used the old key.
4. **Retire the compromised key**: delete/revoke that secret key in Supabase (for a leaked legacy `service_role` key, disable the legacy keys or rotate the JWT secret). Until this step, the leaked key still bypasses RLS.
5. Record the rotation (date, which key, no values) in the incident issue.

## 3. Verify RLS (read-only, PR #196)

> **Deferred until #196 merges.** `scripts/verify-rls.sql` and `docs/VERIFY-RLS.md` are added by #196 and do not exist on `main` yet; until then, run the SQL from that PR's branch or skip this section.

`scripts/verify-rls.sql` only reads catalog state. Run it in the Supabase SQL editor or with `psql` as a privileged role:

```sh
psql "$DATABASE_URL" -f scripts/verify-rls.sql   # read-only; never run migrations from here
```

Expect every public table to report RLS **enabled**, with policies that match the intent pinned by the migration lint (#195). Any table with RLS disabled, or any drift from the migrations, is a finding. Record it in an issue. Fix it through a reviewed migration PR that the owner applies. `search_path` hardening (#173) also needs the owner to apply it.

## 4. Netlify deploy checks

- **Is production current?** Netlify → Deploys: the published deploy's commit should equal the current `main` head. Fetch first so you aren't comparing against a stale local ref: `git fetch origin main && git rev-parse origin/main` (or `git ls-remote origin refs/heads/main`). After #178 merges, `/api/ready` also exposes `commitSha`.
- **No deploy after a merge?** A missing Netlify commit status alone does not prove the Git link is broken (statuses are configurable notifications). Check, in order and independently: (1) Deploys list — was a build created for the merge commit? If it exists but failed, read its log. (2) Site configuration → Build & deploy → Continuous deployment → **Build status**: builds may be *stopped*; re-activating them is a deliberate owner decision. (3) Deploy notifications: is the GitHub commit-status notification configured? (4) Only if the repository link itself is missing or broken, relink it. A stale `package-lock.json` is the usual cause; fix it through a PR, not on the host.
- **Previews:** PR deploy previews run without production secrets, so `/api/ready` 503 is expected there.
- **Smoke:** `SMOKE_BASE_URL=https://resonancenexus.netlify.app npm run smoke`.

## 5. Rollback

1. Netlify → Deploys → pick the last good deploy → "Publish deploy".
2. **Lock it**: on the Deploys page use "Lock to stop auto publishing" so later Git-triggered deploys of `main` can't overwrite the rollback while the revert is in review.
3. Open a revert PR against `main` (it requires one review). Do not force-push.
4. After the revert merges and its deploy is built and verified (§1), publish that deploy and **unlock** auto publishing.
