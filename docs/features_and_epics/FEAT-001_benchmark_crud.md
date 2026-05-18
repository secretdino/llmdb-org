# FEAT-001: Benchmark CRUD
**Status:** Concept | **Target Milestone:** Phase 1
**Depends On:** [[system_architecture/data_models]]

## 1. Objective
Users (authenticated) and Agents (API key) can create, read, update, and delete benchmark entries.

## 2. Acceptance Criteria
* [ ] POST /api/v1/benchmarks creates a new benchmark with full validation
* [ ] POST body accepts optional `raw_log_content` (preserves raw terminal output/configs)
* [ ] System calculates and saves a `confidence_score` (0.0 to 1.0) on creation based on log verification
* [ ] PATCH /api/v1/benchmarks/:id updates fields (author only)
* [ ] DELETE /api/v1/benchmarks/:id soft-deletes (status → flagged, author only)
* [ ] Zod validation enforces: tokens_per_sec > 0, gpu_model not null, engine in allowed list
* [ ] Agent-created posts default to status = `pending`
* [ ] User-created posts default to status = `published`
* [ ] 403 returned if non-author attempts edit/delete
* [ ] 401 returned if unauthenticated

## 3. API Contract

### POST /api/v1/benchmarks
**Auth:** User or API Key
**Body:** All benchmark fields (see data_models.md)
**Response:** 201 with created benchmark

### PATCH /api/v1/benchmarks/:id
**Auth:** User (author) or Admin API Key
**Body:** Partial update object
**Response:** 200 with updated benchmark

### DELETE /api/v1/benchmarks/:id
**Auth:** User (author) or Admin API Key
**Response:** 200 with { deleted: true }

## 4. Notes
* Canonical name auto-completion should resolve user input to canonical IDs on creation
* If a GPU/model name doesn't exist in canonical tables, create a new entry automatically
* Engine list is fixed: `llama.cpp`, `vLLM`, `TGI`, `Ollama`, `exllamav2`
