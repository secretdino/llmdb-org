# FEAT-013: Side-by-Side Comparison Tool
**Status:** Concept | **Target Milestone:** Phase 3
**Depends On:** [[FEAT-001_benchmark_crud]], [[FEAT-002_public_browse_filter]]

## 1. Objective
Users can select multiple benchmarks and compare them side-by-side in a table.

## 2. Acceptance Criteria
* [ ] Users can select 2-10 benchmarks for comparison
* [ ] Comparison table shows: GPU, model, engine, quant, context_length, tokens_per_sec, prompt tok/s, TTFT
* [ ] Benchmarks sorted by tokens_per_sec (descending)
* [ ] Best value highlighted in green
* [ ] Comparison state preserved in URL for shareability
* [ ] "Add to compare" button on benchmark cards and detail page
* [ ] Compare button navigates to /compare?ids=...

## 3. API Contract

### GET /api/v1/benchmarks/compare
**Auth:** None (public)
**Query Params:** ids (comma-separated UUIDs, max 10)
**Response:** 200 with { benchmarks: [] } — full benchmark objects for comparison

## 4. Notes
- Client-side comparison table (no separate page needed)
- URL format: /compare?ids=uuid1,uuid2,uuid3
- Validate IDs exist and are published
- Return 400 if more than 10 IDs or invalid IDs
