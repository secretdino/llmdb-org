# FEAT-008: Hardware Directory Pages
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-003_canonical_name_lists]], [[FEAT-001_benchmark_crud]]

## 1. Objective
Browse all GPU models with summary statistics and drill into benchmark listings per GPU.

## 2. Acceptance Criteria
* [ ] GET /api/v1/gpus returns list with counts and avg tokens/sec per GPU
* [ ] GET /api/v1/gpus/:gpu returns filtered benchmark list for that GPU
* [ ] Summary stats: avg tok/s, min/max range, most common models
* [ ] GPU detail page shows:
  - Header with GPU name, VRAM (if available)
  - Summary cards: avg tok/s, total benchmarks, most common models
  - Filterable benchmark list below
* [ ] Click GPU → URL updates with gpu_model filter

## 3. API Contract

### GET /api/v1/gpus
**Auth:** None (public)
**Response:** 200 with { gpus: [{ canonical_name, gpu_vram, benchmark_count, avg_tokens_per_sec, min_tokens_per_sec, max_tokens_per_sec }], total: int }

### GET /api/v1/gpus/:gpu/benchmarks
**Auth:** None (public)
**Query Params:** Same as FEAT-002 (engine, model_name, quant, context_length, sort, limit, offset)
**Response:** 200 with { benchmarks: [], total: int, gpu_info: { canonical_name, gpu_vram } }

## 4. Notes
- GPU VRAM denormalized from most recent benchmark with gpu_vram field
- Most common models calculated from benchmark count per model within that GPU
- All stats cached/updated via benchmark create/delete triggers
