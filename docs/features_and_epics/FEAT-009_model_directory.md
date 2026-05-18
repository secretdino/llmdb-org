# FEAT-009: Model Directory Pages
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-003_canonical_name_lists]], [[FEAT-001_benchmark_crud]]

## 1. Objective
Browse all models with performance comparison across hardware.

## 2. Acceptance Criteria
* [ ] GET /api/v1/models returns list with counts and avg tokens/sec per model
* [ ] GET /api/v1/models/:model returns filtered benchmark list for that model
* [ ] Model detail page shows:
  - Header with model name, parameters, quant (if available)
  - Comparison table: performance across different GPUs
  - Summary: avg tok/s, best/worst hardware
  - Filterable benchmark list below
* [ ] Click model → URL updates with model_name filter

## 3. API Contract

### GET /api/v1/models
**Auth:** None (public)
**Response:** 200 with { models: [{ canonical_name, model_params, model_quant, benchmark_count, avg_tokens_per_sec, min_tokens_per_sec, max_tokens_per_sec }], total: int }

### GET /api/v1/models/:model/benchmarks
**Auth:** None (public)
**Query Params:** Same as FEAT-002 (gpu_model, engine, quant, context_length, sort, limit, offset)
**Response:** 200 with { benchmarks: [], total: int, model_info: { canonical_name, model_params, model_quant } }

## 4. Notes
- Model params/quant denormalized from most recent benchmark
- Comparison table groups benchmarks by GPU model, shows avg tok/s per GPU
- All stats cached/updated via benchmark create/delete triggers
