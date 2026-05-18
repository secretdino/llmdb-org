# FEAT-010: Similar Benchmarks Sidebar
**Status:** Concept | **Target Milestone:** Phase 2
**Depends On:** [[FEAT-001_benchmark_crud]]

## 1. Objective
On benchmark detail pages, show related benchmarks to help users compare.

## 2. Acceptance Criteria
* [ ] Detail page includes "Similar benchmarks" sidebar
* [ ] Similarity defined by: same GPU + model, or same GPU + engine
* [ ] Shows top 3-5 similar benchmarks (by recency or tokens_per_sec)
* [ ] Each similar result shows: GPU, model, engine, tokens_per_sec, date
* [ ] Clicking similar benchmark navigates to its detail page
* [ ] "No similar benchmarks" message when none found

## 3. API Contract

### GET /api/v1/benchmarks/:id/similar
**Auth:** None (public)
**Response:** 200 with { similar: [{ id, gpu_model, model_name, engine, tokens_per_sec, created_at }] }

## 4. Notes
- Similarity algorithm:
  1. Primary: same gpu_model_id AND model_name_id
  2. Secondary: same gpu_model_id AND engine
- Exclude current benchmark from results
- Limit to 5 results
- Can be cached (benchmarks rarely change)
