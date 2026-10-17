# Portable readiness contract (v1)

`GET /api/ready` returns a small, versioned JSON body that any client (a probe, a
dashboard, an iOS app) can read the same way across services. The schema is
vendored in this repo at [`schemas/readiness/v1.schema.json`](../schemas/readiness/v1.schema.json).
Other services may vendor their own copy of the same contract. There is no
runtime or package dependency between repositories.

## Core fields

| Field | Type | Meaning |
| --- | --- | --- |
| `status` | `"ready"` \| `"not_ready"` \| `"degraded"` \| `"initializing"` | Only `"ready"` means serve traffic. |
| `service` | lowercase slug | Service identity, `"resonance-nexus"` here. |
| `version` | semver string | Released service version. |
| `contractRevision` | string | Deploy-contract generation stamp. |
| `commitSha` | `"unknown"` or 7–40 hex chars (optional) | Deployed commit (`RESONANCE_COMMIT_SHA`, Netlify `COMMIT_REF`, …). |
| `stage` | lowercase slug | Which readiness gate the body describes, `"deployment"` here. |
| `missingRequired` | array of `UPPER_SNAKE` names | Required config keys that are absent. Names only, never values. A non-empty list is never `ready`. |

Services may add fields (Resonance adds `production`, `authMode`, `authModeOk`, `persistenceConfigured`, `githubAdapterConfigured`, `ownerActionRequired`, `ownerKeys`, `agentActionRequired`, `posture`, `timestamp`). Clients **must ignore
unknown fields** and must not require optional ones.

## Client rules

1. HTTP `200` if and only if `status === "ready"`; otherwise `503`. Responses are not cached.
2. Decide readiness from `status` (or the HTTP code), never from the presence of other fields.
3. Show `missingRequired` to operators as-is. It never contains secrets, URLs or values.
4. Compare `commitSha` with the expected deploy to detect deploy lag. `"unknown"` means "not reported".

Swift sketch:

```swift
struct Readiness: Decodable {
  let status: String; let service: String; let version: String
  let contractRevision: String; let commitSha: String?
  let stage: String; let missingRequired: [String]
  var isReady: Bool { status == "ready" }
}
```

## Versioning

- Adding an optional field, or a new service-specific field, is **not** a version change.
- Removing or renaming a core field, changing a type, or adding a required core field means **v2**:
  ship `schemas/readiness/v2.schema.json` alongside v1, and keep serving v1-compatible fields until clients move.
- `src/deploy/readiness-contract.test.ts` validates the real `/api/ready` route handler output (production
  configured, missing keys, development, with a commit SHA) against the vendored schema in CI. The validator rejects
  schema keywords it doesn't understand, so the schema can't silently stop being enforced.
