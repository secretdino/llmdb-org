# FEAT-007: Crawler Agent
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-001_benchmark_crud]], [[FEAT-003_canonical_name_lists]]

## 1. Objective
Automated agent scans sources for benchmark data, extracts structured results, and posts them as `pending` benchmarks for human review.

## 2. Acceptance Criteria
* [ ] Agent can scan configurable sources (HuggingFace model cards, Reddit, blogs, Twitter)
* [ ] Extractor pipeline: parse source → extract benchmark fields → normalize names → create via Admin API
* [ ] Agent-created posts default to status = `pending`
* [ ] Agent posts tagged with `source:agent` and `source_url`
* [ ] Dedup detection alerts on near-duplicate submissions
* [ ] Moderator review queue for pending agent posts
* [ ] Rate-limited: max 10 scans/hour per source type
* [ ] Failed scans logged with error details

## 3. Data Model Addition

### AgentScan
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `source_type` | enum | yes | `huggingface`, `reddit`, `blog`, `twitter` |
| `source_url` | string(500) | yes | |
| `status` | enum | auto | `scanning`, `complete`, `failed` |
| `benchmarks_found` | int | auto | Count of extracted benchmarks |
| `benchmarks_created` | int | auto | Count of successfully created |
| `error` | text | nullable | |
| `created_at` | datetime | auto | |
| `completed_at` | datetime | nullable | |

### SourceParser (config, not a table)
- Parser registry: each source type has a registered parser function
- Parser returns structured benchmark data or null
- Canonical name resolution applied before creation

## 4. Agent Flow

```
1. Scan source URL
2. Parse content (HTML/Markdown/JSON)
3. Extract: gpu_model, model_name, engine, tokens_per_sec, settings
4. Resolve canonical names (create if new)
5. Check dedup: same GPU + model + engine + quant + context?
6. POST /api/v1/benchmarks via Admin API with status=pending
7. Log scan result in agent_scans table
```

## 5. API Contract

### POST /api/v1/admin/scans
**Auth:** Admin API Key
**Body:** { source_type, source_url }
**Response:** 202 with { scan_id, status: "queued" }

### GET /api/v1/admin/scans/:id
**Auth:** Admin API Key
**Response:** 200 with { id, source_type, source_url, status, benchmarks_found, benchmarks_created, error, created_at, completed_at }

### GET /api/v1/admin/pending
**Auth:** Moderator or Admin API Key
**Response:** 200 with { benchmarks: [], total: int } — pending agent posts

### PATCH /api/v1/admin/benchmarks/:id/review
**Auth:** Moderator or Admin API Key
**Body:** { action: "approve" | "reject", note?: string }
**Response:** 200 with { status: "published" | "flagged" }
