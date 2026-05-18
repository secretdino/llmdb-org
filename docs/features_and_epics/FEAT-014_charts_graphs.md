# FEAT-014: Charts/Graphs
**Status:** Concept | **Target Milestone:** Phase 3
**Depends On:** [[FEAT-002_public_browse_filter]]

## 1. Objective
Visualize benchmark trends: tokens/sec vs context length, performance by GPU, etc.

## 2. Acceptance Criteria
* [ ] Benchmark detail page includes chart: tokens_per_sec vs context_length (if multiple benchmarks on same GPU+model)
* [ ] Hardware detail page includes chart: avg tokens_per_sec by model (bar chart)
* [ ] Engine comparison chart: avg tokens_per_sec by engine for same GPU+model
* [ ] Charts use recharts or similar lightweight library
* [ ] Charts responsive on mobile
* [ ] Data fetched via API endpoint for server-side rendering

## 3. API Contract

### GET /api/v1/stats/trends
**Auth:** None (public)
**Query Params:** gpu_model, model_name, engine, context_length
**Response:** 200 with { data: [{ context_length, avg_tokens_per_sec, count, min_tokens_per_sec, max_tokens_per_sec }] }

### GET /api/v1/stats/comparison
**Auth:** None (public)
**Query Params:** gpu_model, engine (optional)
**Response:** 200 with { data: [{ engine, avg_tokens_per_sec, count, model_name }] }

## 4. Notes
- Use recharts for React components (lightweight, SSR-friendly)
- Aggregate data server-side to minimize client computation
- Cache chart data (benchmarks rarely change)
- Consider using Postgres aggregations for performance
