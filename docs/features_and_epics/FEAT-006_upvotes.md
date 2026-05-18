# FEAT-006: Upvotes
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-001_benchmark_crud]]

## 1. Objective
Users can upvote benchmarks to surface high-quality entries.

## 2. Acceptance Criteria
* [ ] POST /api/v1/benchmarks/:id/upvote toggles upvote for current user
* [ ] GET /api/v1/benchmarks/:id includes upvote count and user's upvote status
* [ ] Users can only upvote once per benchmark (toggle on/off)
* [ ] Upvote count stored as denormalized counter on benchmark
* [ ] Upvote count updated atomically (increment/decrement)
* [ ] 401 returned if unauthenticated

## 3. Data Model Addition

### Upvote
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `benchmark_id` | UUID | yes | FK → benchmarks.id |
| `user_id` | UUID | yes | FK → users.id |
| `created_at` | datetime | auto | |

Unique constraint: (benchmark_id, user_id)

## 4. API Contract

### POST /api/v1/benchmarks/:id/upvote
**Auth:** User
**Response:** 200 with { upvotes: int, user_voted: bool }
**Behavior:** Toggle upvote (add if not present, remove if present)
