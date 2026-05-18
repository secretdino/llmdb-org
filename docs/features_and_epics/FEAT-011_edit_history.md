# FEAT-011: Edit History
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-001_benchmark_crud]]

## 1. Objective
Track changes to benchmarks over time for accountability and transparency.

## 2. Acceptance Criteria
* [ ] Every PATCH to a benchmark creates an edit_history record
* [ ] Edit history stores: field changed, old value, new value, timestamp, author
* [ ] GET /api/v1/benchmarks/:id/history returns full edit log
* [ ] Edit history visible on detail page (collapsible)
* [ ] Edit history includes agent-created posts
* [ ] No edit history for auto-generated fields (created_at, upvotes)

## 3. Data Model Addition

### EditHistory
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `benchmark_id` | UUID | yes | FK → benchmarks.id |
| `author_id` | UUID | yes | FK → users.id |
| `field` | string(50) | yes | e.g. "tokens_per_sec", "gpu_vram" |
| `old_value` | jsonb | yes | Previous value |
| `new_value` | jsonb | yes | New value |
| `created_at` | datetime | auto | |

## 4. API Contract

### GET /api/v1/benchmarks/:id/history
**Auth:** None (public)
**Response:** 200 with { edits: [{ id, field, old_value, new_value, author: { display_name, avatar_url }, created_at }], total: int }

## 5. Notes
- Use JSONB for old_value and new_value to handle any field type
- Index on (benchmark_id, created_at) for fast lookup
- Consider soft-delete: archive old edits after 2 years
