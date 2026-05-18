# FEAT-012: Community Flagging System
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-001_benchmark_crud]]

## 1. Objective
Users can flag benchmarks for review (inaccurate, duplicate, spam). Moderators can review and act on flags.

## 2. Acceptance Criteria
* [ ] Users can flag any benchmark (authenticated only)
* [ ] Flag reasons: `inaccurate`, `duplicate`, `spam`, `other`
* [ ] Each user can flag a benchmark once (toggle on/off)
* [ ] Benchmark flagged with 3+ unique flags → status → `pending` for review
* [ ] Moderators can see flagged benchmarks in review queue
* [ ] Moderators can resolve flags: dismiss, mark as duplicate, or publish
* [ ] Flag count visible on benchmark detail page

## 3. Data Model Addition

### Flag
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `benchmark_id` | UUID | yes | FK → benchmarks.id |
| `user_id` | UUID | yes | FK → users.id |
| `reason` | enum | yes | `inaccurate`, `duplicate`, `spam`, `other` |
| `note` | text | no | User-provided explanation |
| `status` | enum | auto | `open`, `resolved`, `dismissed` |
| `created_at` | datetime | auto | |
| `resolved_at` | datetime | nullable | |
| `resolved_by` | UUID | nullable | FK → users.id (moderator) |

Unique constraint: (benchmark_id, user_id)

## 4. API Contract

### POST /api/v1/benchmarks/:id/flag
**Auth:** User
**Body:** { reason: enum, note?: string }
**Response:** 201 with { flag_count: int, status: "open" }

### GET /api/v1/admin/flags
**Auth:** Moderator or Admin API Key
**Query Params:** status (open, resolved, dismissed)
**Response:** 200 with { flags: [{ id, benchmark_id, user_id, reason, note, flag_count, created_at }], total: int }

### PATCH /api/v1/admin/flags/:id/resolve
**Auth:** Moderator or Admin API Key
**Body:** { action: "dismiss" | "publish" | "flag_as_duplicate" }
**Response:** 200 with { status: "resolved" | "flagged" }
