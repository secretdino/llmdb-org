# FEAT-005: Admin API Key System
**Status:** Concept | **Target Milestone:** Phase 1
**Depends On:** [[system_architecture/data_models]], [[FEAT-001_benchmark_crud]]

## 1. Objective
Users can generate and manage API keys for agent access. Keys authenticate against the API and enable automated benchmark posting.

## 2. Acceptance Criteria
* [ ] POST /api/v1/keys generates a new API key (returns key once, then only hash)
* [ ] GET /api/v1/keys lists all user keys (name, created_at, last_used_at)
* [ ] DELETE /api/v1/keys/:id revokes a key
* [ ] API key authentication via Bearer token header
* [ ] Key hash stored in database (SHA-256), never plaintext
* [ ] Rate limiting: 100 req/min per key (configurable)
* [ ] last_used_at updated on each authenticated request
* [ ] 401 returned for invalid/expired keys
* [ ] Admin keys can modify any post (bypass author check)

## 3. API Contract

### POST /api/v1/keys
**Auth:** User
**Body:** { name: string(100) }
**Response:** 201 with { id, name, key: string(once), created_at }
**Note:** `key` field returned only on creation. Subsequent GETs return null.

### GET /api/v1/keys
**Auth:** User
**Response:** 200 with { keys: [{ id, name, created_at, last_used_at }] }

### DELETE /api/v1/keys/:id
**Auth:** User (key owner only)
**Response:** 200 with { deleted: true }

### Authentication Middleware
**Header:** Authorization: Bearer <api_key>
**Flow:**
1. Hash incoming key with SHA-256
2. Look up key_hash in api_keys table
3. If found, attach user_id + role to request context
4. If not found, return 401

## 4. Notes
- API keys are user-scoped by default
- Admin role keys bypass author checks on benchmark mutations
- Rate limiting tracked per key_hash with sliding window
- Key rotation: users can revoke and regenerate at any time
