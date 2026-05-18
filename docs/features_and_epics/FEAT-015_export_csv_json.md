# FEAT-015: Export to CSV/JSON
**Status:** Concept | **Target Milestone:** Phase 3
**Depends On:** [[FEAT-002_public_browse_filter]]

## 1. Objective
Users can export benchmark data (with filters applied) to CSV or JSON for offline analysis.

## 2. Acceptance Criteria
* [ ] GET /api/v1/benchmarks/export?format=csv|json returns downloadable file
* [ ] Export respects current filter state (passed as query params)
* [ ] CSV includes all benchmark fields with headers
* [ ] JSON includes full benchmark objects with resolved canonical names
* [ ] Max 10,000 rows per export (rate limit)
* [ ] Streaming response for large exports
* [ ] Content-Disposition header for file download

## 3. API Contract

### GET /api/v1/benchmarks/export
**Auth:** None (public)
**Query Params:**
- `format` (enum: csv, json) — required
- All filter params from FEAT-002
- `limit` (max 10000, default 1000)

**Response:**
- CSV: text/csv with Content-Disposition: attachment; filename="benchmarks.csv"
- JSON: application/json with Content-Disposition: attachment; filename="benchmarks.json"

## 4. Notes
- Use streaming for large exports to avoid memory issues
- CSV: flatten nested fields (gpu_model, engine, etc.) into columns
- JSON: include full benchmark objects with resolved canonical names
- Rate limit: 10 exports/hour per user, 3/hour anonymous
