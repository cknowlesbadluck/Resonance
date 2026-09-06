# Nexus API Reference

The Nexus API provides a contract-driven control plane for discovering capabilities, composing intents, managing executions, and tracking events across integrated ecosystems.

**Base URL:** `https://resonancenexus.netlify.app/api/nexus`

## Authentication

All Nexus endpoints require:

```
Authorization: Bearer <access_token>
```

Tokens are scoped to a single project. Cross-project requests are rejected (CHR-49).

## Core Contracts

### Idempotency-Key (Mandatory)

Every execution-creating request **must** send a non-blank `Idempotency-Key` header:

```
POST /api/nexus/executions
Idempotency-Key: {uuid-or-string}
```

The server returns `400` if missing or blank (CHR-37).

**Purpose:** Prevents unintended double-execution on retry. The key uniquely identifies the request within the project; concurrent requests with the same key see exactly-once execution semantics.

### Error Responses

All endpoints return structured errors:

```json
{
  "error": "Human-readable error message",
  "status": "optional_machine_code"
}
```

**Common Status Codes:**
- `400` — Malformed request (missing Idempotency-Key, invalid JSON, etc.)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (insufficient project permissions)
- `404` — Not found (capability, intent, or execution does not exist)
- `409` — Conflict (idempotency collision, state mismatch, approval required)
- `422` — Unprocessable (composition or execution failure)
- `500` — Internal server error

---

## Endpoints

### POST /api/nexus/executions

**Initiate or replay an execution.**

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Idempotency-Key: <string>` (required)

**Request Body:**
```json
{
  "intent": {
    "id": "string (uuid)",
    "name": "human-readable name",
    "description": "what the intent aims to accomplish",
    "projectId": "must match authenticated project",
    "actor": {
      "id": "string (uuid)",
      "source": "origin of this actor (e.g., 'slack', 'browser')"
    },
    "requestedCapabilities": ["capability-name", ...],
    "context": {
      "conversation_history": [...],
      "user_preferences": {...}
    }
  }
}
```

**Response (202 Accepted):**
```json
{
  "status": "approval_required",
  "intent": { ... },
  "plan": {
    "steps": [
      {
        "id": "step-uuid",
        "description": "what this step does",
        "requiresApproval": true,
        "capabilities": ["capability-name"],
        "estimatedDuration": "5m"
      }
    ]
  }
}
```

**Response (200 OK — Idempotent Replay):**
```json
{
  "intent": { ... },
  "plan": { ... },
  "execution": {
    "id": "execution-uuid",
    "status": "completed",
    "result": {...}
  }
}
```

**Behavior:**

1. **First request:** Compose the intent into a plan. If approval is required, return 202 with the plan and ask human to approve (resume route).
2. **Concurrent request (same Idempotency-Key):** Return the result of the first request once it completes (exactly-once semantics).
3. **After 5 min staleness:** If the original handler was interrupted, retry can reclaim the execution and proceed (CHR-51).

**Errors:**
- `400` — Missing `Idempotency-Key`, invalid JSON
- `409` — Idempotency-Key was already used for a *different* intent (CHR-37)
- `422` — Composition failed (capability mismatch, policy violation)

---

### POST /api/nexus/executions/:id/resume

**Approve a pending execution and continue from the composed plan.**

**Path Parameters:**
- `id` — Execution request ID (uuid)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "approved": true,
  "approverActorId": "actor-uuid"
}
```

**Response (200 OK):**
```json
{
  "intent": { ... },
  "plan": { ... },
  "execution": {
    "id": "execution-uuid",
    "status": "completed",
    "result": {...}
  }
}
```

**Response (409 Conflict — Escalation):**
```json
{
  "error": "Plan requirements changed since approval was requested; re-approval is required.",
  "intent": { ... },
  "plan": { ... }
}
```

**Behavior:**

1. Load the pending execution request and its stored composition.
2. Recompose the intent to detect approval escalations (CHR-48).
3. If the recomposed plan requires *more* approval than the stored plan, reject and return 409 (new approval needed).
4. If approved and stable, transition the request to `executing` status and run `NexusExecutor.execute()`.
5. If another handler is currently executing (status=`executing` and recent heartbeat), reject with 409.
6. If the prior handler was interrupted (status=`executing` and >5min stale), reclaim the request and proceed.

**Errors:**
- `404` — Execution request does not exist
- `409` — Already claimed by another handler, plan escalated, or request is not awaiting approval
- `422` — Execution failed

---

### GET /api/nexus/capabilities

**List available capabilities across all integrated ecosystems.**

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `filter` (optional) — Search by name or description
- `category` (optional) — Filter by capability category (e.g., "document", "data", "tool")
- `limit` (default: 50) — Max results

**Response (200 OK):**
```json
{
  "capabilities": [
    {
      "id": "capability-uuid",
      "name": "read-document",
      "description": "Read and summarize a document",
      "source": "google-drive-adapter",
      "resourceType": "document",
      "inputs": [
        {
          "name": "documentId",
          "type": "string",
          "required": true,
          "description": "Google Drive file ID"
        }
      ],
      "outputs": [
        {
          "name": "content",
          "type": "string",
          "description": "Document text content"
        }
      ],
      "requiresApproval": false,
      "policies": ["data-retention:30d", "pii:redact"]
    }
  ],
  "pageInfo": {
    "total": 127,
    "limit": 50,
    "offset": 0
  }
}
```

**Behavior:**

1. Return capabilities registered by all active adapters.
2. Sort by relevance (matches filter term) and insertion order (tie-breaker).
3. Include policy requirements and data handling metadata.

**Errors:**
- `400` — Invalid filter or category
- `401` — Unauthorized

---

### POST /api/nexus/identities

**Register or update an identity (actor) in the system.**

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "id": "actor-uuid",
  "source": "slack",
  "profile": {
    "name": "Alice",
    "email": "alice@company.com",
    "avatar": "https://..."
  }
}
```

**Response (200 OK):**
```json
{
  "id": "actor-uuid",
  "source": "slack",
  "profile": {...},
  "createdAt": "2026-09-02T10:00:00Z",
  "updatedAt": "2026-09-02T10:00:00Z"
}
```

**Behavior:**

1. Create a new identity if it doesn't exist (by source + id).
2. Update profile if it does exist.
3. Identities are scoped to the authenticated project.

**Errors:**
- `400` — Missing required fields
- `409` — Identity ID conflict

---

### POST /api/nexus/intents

**Create a new intent explicitly (alternative to POST /executions).**

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Idempotency-Key: <string>` (required)

**Request Body:**
```json
{
  "name": "approve-contract",
  "description": "Review and approve the Q4 contract with Acme Corp",
  "requestedCapabilities": ["read-document", "send-message"],
  "actor": {
    "id": "alice-uuid",
    "source": "slack"
  },
  "context": {
    "document_id": "acme-q4-contract",
    "approval_threshold": "CFO-level"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "intent-uuid",
  "name": "approve-contract",
  "status": "created",
  "createdAt": "2026-09-02T10:00:00Z"
}
```

**Behavior:**

1. Create the intent without immediately composing or executing.
2. Return intent metadata for later reference.
3. Use this endpoint if you want to create intents asynchronously and manage composition separately.

**Errors:**
- `400` — Invalid intent structure
- `409` — Idempotency-Key conflict

---

### POST /api/events

**Ingest custom events from external systems.**

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "event": {
    "id": "event-uuid",
    "type": "execution-step-completed",
    "status": "success",
    "source": "github-adapter",
    "actor_id": "bot-uuid",
    "resource_type": "workflow",
    "resource_id": "workflow-123",
    "correlation_id": "execution-uuid",
    "external_id": "github-run-456",
    "payload": {
      "duration_ms": 1200,
      "artifacts_url": "https://..."
    },
    "timestamp": "2026-09-02T10:00:00Z"
  }
}
```

**Response (204 No Content):**

**Behavior:**

1. Accept the event and persist it to the event log.
2. Link to the execution via `correlation_id`.
3. Use `external_id` for deduplication (same external ID = no re-ingest).

**Errors:**
- `400` — Malformed event
- `422` — Event type not recognized

---

### POST /api/webhooks/github

**GitHub integration webhook for push, PR, and release events.**

**Headers:**
- `X-Hub-Signature-256: sha256=<hmac>` (required for signature verification)

**Request Body:**
GitHub webhook payload (see GitHub docs).

**Response (204 No Content):**

**Behavior:**

1. Verify webhook signature using the shared secret.
2. Process push events to trigger capability discovery / refresh.
3. Process PR events to attach capabilities/requirements discovered in code.
4. Process release events to version adapter capabilities.

**Errors:**
- `400` — Invalid payload
- `401` — Signature verification failed

---

## Common Patterns

### Composition + Approval Flow

```
1. POST /api/nexus/executions (Idempotency-Key: K1)
   ↓ (Status: approval_required, 202)
2. [Human reviews plan]
3. POST /api/nexus/executions/{id}/resume (approved=true)
   ↓ (Status: completed, 200)
```

### Idempotent Retry

```
1. POST /api/nexus/executions (Idempotency-Key: K1)
   ↓ (Timeout or network error)
2. POST /api/nexus/executions (same Idempotency-Key: K1)
   ↓ (Returns cached result from step 1 if still available, or 202 if re-processing)
```

### Stale Execution Recovery

```
1. POST /api/nexus/executions (Idempotency-Key: K1)
   ↓ (Status: executing, handler starts work)
2. [Handler crashes mid-execution]
3. [Wait 5+ minutes]
4. POST /api/nexus/executions (same Idempotency-Key: K1)
   ↓ (Reclaims the stale execution and proceeds)
```

---

## Policy & Security

### Authorization

- All requests require a bearer token scoped to a project.
- Cross-project access is rejected (CHR-49).
- Capabilities can be restricted to specific actor sources (e.g., only "slack" can trigger certain actions).

### Approval Gates

- Compositions that require approval return 202 and must be resumed manually.
- Escalations (new approval requirements after recomposition) return 409 and require re-approval (CHR-48).

### Audit Trail

All executions, approvals, and events are persisted for audit and compliance (CHR-35).

---

## Rate Limits

- **Burst:** 100 requests per 10 seconds per project
- **Sustained:** 1000 requests per minute per project
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Changelog

### 2026-09-02
- Added CHR-51 guarantee documentation (stale-execution recovery, concurrent execution prevention).
- Clarified Idempotency-Key contract.
- Added approval escalation (CHR-48) semantics to resume route.

### 2026-08-31
- Initial Nexus API reference.

