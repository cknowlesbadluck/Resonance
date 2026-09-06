# Resonance Deployment

P6 — host-neutral release surface for the Nexus control plane.

The host is **runtime infrastructure**, not a domain object. Adapters stay in adapters. Switching Netlify → Render → Vercel does not change Identity, Capability, Intent, or Evidence.

## Current host

- Live web surface: [https://resonancenexus.netlify.app](https://resonancenexus.netlify.app)
- Netlify project: `resonancenexus`
- GitHub is the engineering source of truth; this host is interchangeable

Render (`resonance-admin`) was a draft cut-over and is **not** the live production host. Do not treat `render.yaml` as canonical.

## Probes

| Path | Auth | Meaning |
|------|------|---------|
| `GET /api/health` | none | Process liveness. Always 200 if the Node process is up. |
| `GET /api/ready` | none | Env contract. 200 when ready; 503 with structured `missingRequired` when not. Never echoes secret values. |

Production is ready only when:

1. Persistence URL + anon key + service role are present
2. `RESONANCE_PROJECT_ID` is present
3. `RESONANCE_AUTH_MODE=required`

`GITHUB_TOKEN` enables the GitHub adapter. It is **not** required for process boot. Issue #32 stays open until the live host has the token and authenticated `github.repository.read` produces durable evidence.

## Production env (set in the host; never commit)

```text
NODE_ENV=production
RESONANCE_DEPLOY_STAGE=production
RESONANCE_AUTH_MODE=required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESONANCE_PROJECT_ID=
GITHUB_TOKEN=                 # adapter; required for the GitHub vertical slice
GITHUB_WEBHOOK_SECRET=        # adapter
LINEAR_API_KEY=               # ops
```

## Smoke

```bash
SMOKE_BASE_URL=https://resonancenexus.netlify.app npm run smoke
```

Cases:

1. `/api/health` → 200
2. `/api/ready` → 200 or 503 (structured)
3. `POST /api/nexus/executions` without `Idempotency-Key` → 400
4. `GET /api/nexus/executions` → 401 when auth is required, otherwise 200

GitHub Actions: workflow_dispatch `CI` with input `smoke_url`. Required PR checks remain `web`, `ios`, and the aggregate job named `CI`.

## Native iOS (I4, not this PR)

SideStore / IPA evidence is issue #11. The Nexus contract (Idempotency-Key + Bearer) is already on main. Do not treat an IPA as a substitute for `/api/ready`.

## Two-Key

Host/runtime configuration is not a critical reformation. Changing core identity, domain semantics, or locking the Nexus to one vendor remains Two-Key.
