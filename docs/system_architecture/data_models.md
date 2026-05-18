# Data Models

## 1. Benchmark

### Core Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |
| `author_id` | UUID | nullable | FK to users, null for API posts |
| `title` | string(200) | yes | |
| `narrative` | text | no | Markdown |
| `status` | enum | auto | `published`, `pending`, `flagged` |
| `source_url` | string(500) | no | For agent-crawled posts |
| `upvotes` | int | auto | Denormalized counter |
| `raw_log_content` | text | no | Optional raw pasted logs/config |
| `confidence_score` | float | auto | Range 0.0 - 1.0 (default 1.0) |

### Hardware Sub-schema
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `gpu_model_id` | UUID | yes | FK → gpu_canonical_names.id |
| `gpu_model` | string(100) | no | Denormalized for quick display |
| `gpu_count` | int | yes | Default 1 |
| `gpu_count` | int | yes | Default 1 |
| `gpu_vram` | string(50) | no | e.g. "24GB" |
| `cpu` | string(200) | no | |
| `ram` | string(50) | no | |

### Software Sub-schema
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `engine` | string(50) | yes | `llama.cpp`, `vLLM`, `TGI`, `Ollama`, `exllamav2` |
| `engine_version` | string(50) | no | |
| `os` | string(50) | no | |

### Model Sub-schema
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `model_name_id` | UUID | yes | FK → model_canonical_names.id |
| `model_name` | string(200) | no | Denormalized for quick display |
| `model_params` | float | no | e.g. 8.0 |
| `model_quant` | string(50) | no | e.g. "Q4_K_M", "AWQ", "FP16" |
| `model_source` | string(300) | no | HF URL |

### Settings Sub-schema
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `context_length` | int | no | |
| `batch_size` | int | no | |
| `num_threads` | int | no | |
| `flash_attention` | bool | no | |
| `cuda_graphs` | bool | no | |
| `ngl` | int | no | llama.cpp GPU layers |
| `kv_cache_dtype` | string(20) | no | |
| `mla` | bool | no | Multi-Head Latent Attention enabled |
| `chunked_prefill` | bool | no | Chunked Prefill enabled |
| `speculative_method` | string(50) | no | `mtp`, `dflash`, `eagle`, `draft_model`, `none` |
| `num_speculative_tokens` | int | no | Number of tokens drafted per step |
| `load_precision` | string(20) | no | Weight precision, e.g. `fp16`, `bf16`, `fp8` |

### Performance Sub-schema
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `tokens_per_sec` | float | yes | **Required** — primary metric |
| `prompt_tokens_per_sec` | float | no | |
| `prompt_tokens` | int | no | Run size |
| `generation_tokens` | int | no | Run size |
| `ttft_ms` | float | no | Time to first token |
| `p50_ms` | float | no | |
| `p99_ms` | float | no | |
| `temperature` | float | no | |
| `top_p` | float | no | |

### Meta
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `tags` | string[] | no | `edge`, `serving`, `local`, `quantized` |

## 2. User

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `email` | string(200) | yes | Unique |
| `display_name` | string(50) | no | |
| `avatar_url` | string(500) | no | |
| `created_at` | datetime | auto | |
| `role` | enum | auto | `user`, `moderator`, `admin` |

## 3. ApiKey

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `user_id` | UUID | yes | FK to users |
| `key_hash` | string | yes | SHA-256 of actual key |
| `name` | string(100) | no | User-visible label |
| `created_at` | datetime | auto | |
| `last_used_at` | datetime | nullable | |

## 4. GpuCanonicalName (Phase 1)

Used for GPU model name normalization.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `canonical_name` | string(100) | yes | e.g. "RX 7900 XTX", "RTX 4090" |
| `aliases` | string[] | no | ["rx7900xtx", "7900 xtx", "amd 7900 xtx"] |
| `created_at` | datetime | auto | |

## 5. ModelCanonicalName (Phase 1)

Used for model name normalization.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | PK |
| `canonical_name` | string(200) | yes | e.g. "Llama-3.1-8B-Instruct" |
| `aliases` | string[] | no | ["llama3.1-8b", "meta-llama/Llama-3.1-8B-Instruct"] |
| `created_at` | datetime | auto | |

## Relationships

```
User 1──N Benchmark (author_id FK)
User 1──N ApiKey (user_id FK)
Benchmark N──1 GpuCanonicalName (gpu_model FK)
Benchmark N──1 ModelCanonicalName (model_name FK)
```
