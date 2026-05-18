# FEAT-002: Public Browse + Filter
**Status:** Concept | **Target Milestone:** Phase 1
**Depends On:** [[system_architecture/data_models]], [[FEAT-001_benchmark_crud]]

## 1. Objective
Visitors can browse and filter benchmarks without logging in. All filters are URL-shareable.

## 2. Acceptance Criteria
* [ ] GET /api/v1/benchmarks returns paginated list with filters
* [ ] Filters: gpu_model, engine, model_name, quant, context_length, tokens_per_sec range
* [ ] Sort: newest, tokens_per_sec, prompt_tokens_per_sec
* [ ] Pagination: limit (default 20, max 100), offset
* [ ] All filter state reflected in URL for shareability
* [ ] Only published benchmarks returned
* [ ] 400 error for invalid filter values

## 3. API Contract

### GET /api/v1/benchmarks
**Auth:** None (public)
**Query Params:**
- `gpu_model` (string)
- `engine` (string)
- `model_name` (string)
- `quant` (string)
- `context_length` (int)
- `min_tokens_per_sec` (float)
- `max_tokens_per_sec` (float)
- `sort` (enum: newest, tokens_per_sec, prompt_tokens_per_sec)
- `limit` (int, default 20, max 100)
- `offset` (int, default 0)

**Response:** 200 with { benchmarks: [], total: int, limit: int, offset: int }

## 4. Notes
- Canonical name filtering should match against both canonical_name and aliases
- String filters use ILIKE for case-insensitive matching
- Numeric filters use BETWEEN for ranges
