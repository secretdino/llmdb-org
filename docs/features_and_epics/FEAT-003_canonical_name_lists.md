# FEAT-003: Canonical GPU/Model Name Lists
**Status:** Concept | **Target Milestone:** Phase 1
**Depends On:** [[system_architecture/data_models]]

## 1. Objective
Maintain canonical lists of GPU models and model names with aliases for normalization.

## 2. Acceptance Criteria
* [ ] GET /api/v1/gpus returns list of all GPU models with counts
* [ ] GET /api/v1/models returns list of all model names with counts
* [ ] POST /api/v1/gpus creates new GPU entry (admin/mod only)
* [ ] POST /api/v1/models creates new model entry (admin/mod only)
* [ ] PATCH /api/v1/gpus/:id updates aliases (admin/mod only)
* [ ] Auto-creation: when a benchmark is created with a new GPU/model name, a canonical entry is created automatically
* [ ] Canonical name resolution: given any alias, return the canonical name

## 3. API Contract

### GET /api/v1/gpus
**Auth:** None (public)
**Response:** 200 with { gpus: [{ canonical_name, count, avg_tokens_per_sec }], total: int }

### GET /api/v1/models
**Auth:** None (public)
**Response:** 200 with { models: [{ canonical_name, count, avg_tokens_per_sec }], total: int }

### POST /api/v1/gpus
**Auth:** Admin or Moderator
**Body:** { canonical_name, aliases? }
**Response:** 201 with created entry

### POST /api/v1/models
**Auth:** Admin or Moderator
**Body:** { canonical_name, aliases? }
**Response:** 201 with created entry

### PATCH /api/v1/gpus/:id
**Auth:** Admin or Moderator
**Body:** { aliases? }
**Response:** 200 with updated entry

## 4. Notes
- Canonical name creation should be idempotent (check for existing before creating)
- Alias matching should be case-insensitive
- GPU/model counts should be denormalized (updated on benchmark create/delete)
