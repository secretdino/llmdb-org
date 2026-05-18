import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean,
  doublePrecision, 
  integer, 
  varchar, 
  pgEnum 
} from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

/**
 * User roles indicating access privilege tiers.
 * - 'user': Standard community member. Can submit benchmarks and upvote.
 * - 'moderator': Can moderate benchmarks, review flagged/quarantined runs.
 * - 'admin': Full system privileges, including scraper API key generation.
 */
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);

/**
 * Benchmark status for quarantine and trust gatekeeping.
 * - 'approved': High trust score (>= 0.85), immediately public.
 * - 'pending_review': Moderate trust score (0.70 - 0.84), public but flagged.
 * - 'quarantined': Low trust score (< 0.70) or missing logs, hidden until admin approval.
 */
export const benchmarkStatusEnum = pgEnum('benchmark_status', ['approved', 'pending_review', 'quarantined']);

/**
 * ============================================================================
 * SCHEMAS & TABLES
 * ============================================================================
 */

/**
 * Users Table
 * Represents the registered community members and system administrators.
 */
export const users = pgTable('users', {
  // Unique system-generated ID for each user
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Unique email used for authentication and communications
  email: varchar('email', { length: 200 }).notNull().unique(),
  
  // Friendly display name for community views (optional)
  displayName: varchar('display_name', { length: 50 }),
  
  // URL to the user's avatar image (optional)
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // User authority role within llmdb (defaults to standard 'user')
  role: userRoleEnum('role').default('user').notNull(),
  
  // Hashed password for credentials-based logins (optional)
  passwordHash: text('password_hash'),

  // GitHub user profile ID for mapping GitHub logins (optional)
  githubId: varchar('github_id', { length: 100 }).unique(),

  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * API Keys Table
 * Cryptographically secure tokens used by crawling agents to submit benchmarks.
 * We store a SHA-256 hash of the salted key to protect credentials at rest.
 */
export const apiKeys = pgTable('api_keys', {
  // Unique identification key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Foreign key linking to the User who owns this API Key
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  
  // SHA-256 hash of the salted API Key string
  keyHash: text('key_hash').notNull(),
  
  // Friendly name or label to identify this key (e.g. "HuggingFace Crawler")
  name: varchar('name', { length: 100 }),
  
  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Timestamp when the API key was last used for requests
  lastUsedAt: timestamp('last_used_at'),
});

/**
 * GPU Canonical Names Table (FEAT-003)
 * Maps normalized matching signatures (e.g. "nvidia-rtx-4090") to official, 
 * beautiful UI display names (e.g. "NVIDIA GeForce RTX 4090") and specifications.
 */
export const gpuCanonicalNames = pgTable('gpu_canonical_names', {
  // Unique identification key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Clean, lower-cased hyphenated match string used by the deduplication engine
  matchKey: varchar('match_key', { length: 100 }).notNull().unique(),
  
  // Official, human-friendly hardware display name (e.g. "NVIDIA GeForce RTX 4090")
  canonicalName: varchar('canonical_name', { length: 100 }).notNull(),
  
  // RAM/VRAM capacity specifications (e.g. "24GB GDDR6X")
  memorySpecs: varchar('memory_specs', { length: 50 }),
  
  // A list of common alternative names or aliases mapping to this hardware
  aliases: text('aliases').array(),
  
  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Model Canonical Names Table (FEAT-003)
 * Maps normalized model matching slugs (e.g. "meta-llama-3.1-8b-instruct") 
 * to clean publisher display names and official HuggingFace repository IDs.
 */
export const modelCanonicalNames = pgTable('model_canonical_names', {
  // Unique identification key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Clean, normalized match key for model detection (e.g. "meta-llama-3.1-8b-instruct")
  matchKey: varchar('match_key', { length: 200 }).notNull().unique(),
  
  // Clean, official name of the model (e.g. "Meta-Llama-3.1-8B-Instruct")
  canonicalName: varchar('canonical_name', { length: 200 }).notNull(),
  
  // Total parameters count (e.g. "8.0B" or "671B (37B Active)")
  parameterCount: varchar('parameter_count', { length: 50 }),
  
  // Official publisher ID on HuggingFace (e.g. "meta-llama/Llama-3.1-8B-Instruct")
  publisherHfId: varchar('publisher_hf_id', { length: 200 }),
  
  // Alternative names or slugs associated with the model
  aliases: text('aliases').array(),
  
  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Canonical Benchmark Aggregates Table
 * Holds the deduplicated master parent records. Represents the statistical 
 * aggregates of all benchmark runs possessing matching configuration signatures.
 */
export const canonicalBenchmarks = pgTable('canonical_benchmarks', {
  // Unique identification key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Deterministic SHA-256 fingerprint hash of configuration settings (Unique index)
  benchmarkHash: varchar('benchmark_hash', { length: 64 }).notNull().unique(),
  
  // Statistical running average of text generation throughput (tokens/sec)
  averageGenerationTps: doublePrecision('average_generation_tps').notNull(),
  
  // Smallest recorded text generation throughput speed
  minGenerationTps: doublePrecision('min_generation_tps').notNull(),
  
  // Largest recorded text generation throughput speed
  maxGenerationTps: doublePrecision('max_generation_tps').notNull(),
  
  // Statistical average of prompt evaluation/prefill throughput (tokens/sec)
  averagePromptTps: doublePrecision('average_prompt_tps'),
  
  // Total number of individual runs merged into this aggregate record
  sampleRunCount: integer('sample_run_count').default(1).notNull(),
  
  // Last update timestamp
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Individual Benchmark Runs Table (Child Records)
 * Records every single raw user submission or crawled benchmark run, 
 * including precise performance figures and diagnostic console logs.
 */
export const benchmarks = pgTable('benchmarks', {
  // Unique identification key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Foreign key referencing the parent Canonical Benchmark aggregate record
  canonicalBenchmarkId: uuid('canonical_benchmark_id')
    .references(() => canonicalBenchmarks.id, { onDelete: 'set null' }),
  
  // Foreign key referencing the User who submitted this run (null for API posts)
  authorId: uuid('author_id')
    .references(() => users.id, { onDelete: 'set null' }),
  
  // Descriptive submission title
  title: varchar('title', { length: 200 }).notNull(),
  
  // Markdown-formatted user notes or post narrative
  narrative: text('narrative'),
  
  // Current status (approved, pending_review, quarantined) based on trust gates
  status: benchmarkStatusEnum('status').default('approved').notNull(),
  
  // Crawled origin URL for scraper submissions
  sourceUrl: varchar('source_url', { length: 500 }),
  
  // Social score denoting total helpful upvotes received
  upvotes: integer('upvotes').default(0).notNull(),
  
  // Raw text output of engine console execution logs (crucial for log parsing)
  rawLogContent: text('raw_log_content'),
  
  // Trust rating score calculated by parser matching (0.0 to 1.0)
  confidenceScore: doublePrecision('confidence_score').default(1.0).notNull(),
  
  // Fingerprint hash of this run's config (indexed for deduplication checks)
  benchmarkHash: varchar('benchmark_hash', { length: 64 }).notNull(),

  /**
   * Hardware Configuration Sub-schema
   */
  // FK pointing to resolved canonical GPU hardware name
  gpuModelId: uuid('gpu_model_id').references(() => gpuCanonicalNames.id),
  
  // Raw hardware name submitted by the user/crawler (e.g. "nvidia 4090 ti super")
  gpuModel: varchar('gpu_model', { length: 100 }),
  
  // Total active GPU cards utilized for execution (defaults to 1)
  gpuCount: integer('gpu_count').default(1).notNull(),
  
  // GPU RAM spec mapped during run creation
  gpuVram: varchar('gpu_vram', { length: 50 }),
  
  // Server/Local CPU model (optional)
  cpu: varchar('cpu', { length: 200 }),
  
  // System RAM capacity (optional)
  ram: varchar('ram', { length: 50 }),

  /**
   * Software Stack Sub-schema
   */
  // Execution engine framework (llama.cpp, vLLM, Ollama, TGI, exllamav2)
  engine: varchar('engine', { length: 50 }).notNull(),
  
  // Software version of the execution engine
  engineVersion: varchar('engine_version', { length: 50 }),
  
  // Host operating system (e.g. Linux, Windows, macOS)
  os: varchar('os', { length: 50 }),

  /**
   * Model Metadata Sub-schema
   */
  // FK pointing to canonical model lookup
  modelNameId: uuid('model_name_id').references(() => modelCanonicalNames.id),
  
  // Raw model name submitted by the user/crawler
  modelName: varchar('model_name', { length: 200 }),
  
  // Model parameter count (in billions, e.g. 8.0 or 70.0)
  modelParams: doublePrecision('model_params'),
  
  // Quantization scheme applied (e.g. "Q4_K_M", "AWQ", "FP16")
  modelQuant: varchar('model_quant', { length: 50 }),
  
  // HuggingFace repository card or weight origin URL
  modelSource: varchar('model_source', { length: 300 }),

  /**
   * Run Execution Settings Sub-schema
   */
  // Total context length config in tokens (e.g. 4096, 8192)
  contextLength: integer('context_length'),
  
  // Concurrently processed batch size
  batchSize: integer('batch_size'),
  
  // CPU execution threads assigned
  numThreads: integer('num_threads'),
  
  // Toggle showing if Flash Attention optimization was active
  flashAttention: boolean('flash_attention'),
  
  // Toggle showing if CUDA Graphs were utilized
  cudaGraphs: boolean('cuda_graphs'),
  
  // Number of GPU offloaded layers (specific to llama.cpp)
  ngl: integer('ngl'),
  
  // Key-value cache data precision type (e.g. f16, q4_0)
  kvCacheDtype: varchar('kv_cache_dtype', { length: 20 }),
  
  // Toggle showing if Multi-Head Latent Attention (MLA) was enabled
  mla: boolean('mla'),
  
  // Toggle showing if chunked prefill optimizations were enabled
  chunkedPrefill: boolean('chunked_prefill'),
  
  // Speculative draft method ('mtp', 'dflash', 'eagle', 'draft_model', 'none')
  speculativeMethod: varchar('speculative_method', { length: 50 }),
  
  // Number of speculative draft tokens prepared per step
  numSpeculativeTokens: integer('num_speculative_tokens'),
  
  // Precision precision of model weights (e.g. fp16, bf16, fp8)
  loadPrecision: varchar('load_precision', { length: 20 }),

  /**
   * Performance Metrics Sub-schema
   */
  // Token generation/decoding execution speed (Primary required metric)
  tokensPerSec: doublePrecision('tokens_per_sec').notNull(),
  
  // Prompt evaluation/prefill execution speed (tokens/sec)
  promptTokensPerSec: doublePrecision('prompt_tokens_per_sec'),
  
  // Count of tokens in prompt evaluation payload
  promptTokens: integer('prompt_tokens'),
  
  // Count of tokens in generation output payload
  generationTokens: integer('generation_tokens'),
  
  // Time To First Token in milliseconds
  ttftMs: doublePrecision('ttft_ms'),
  
  // Median (50th percentile) latency in milliseconds
  p50Ms: doublePrecision('p50_ms'),
  
  // Tail (99th percentile) latency in milliseconds
  p99Ms: doublePrecision('p99_ms'),
  
  // Generation sampling temperature
  temperature: doublePrecision('temperature'),
  
  // Generation sampling nucleus top-P value
  topP: doublePrecision('top_p'),

  /**
   * Meta-Information
   */
  // Specialized classification tags (e.g. ["edge", "local", "serving"])
  tags: text('tags').array(),
  
  // Record creation timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Record modification timestamp
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
