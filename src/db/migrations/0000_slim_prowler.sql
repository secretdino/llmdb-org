CREATE TYPE "public"."benchmark_status" AS ENUM('approved', 'pending_review', 'quarantined');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_benchmark_id" uuid,
	"author_id" uuid,
	"title" varchar(200) NOT NULL,
	"narrative" text,
	"status" "benchmark_status" DEFAULT 'approved' NOT NULL,
	"source_url" varchar(500),
	"upvotes" integer DEFAULT 0 NOT NULL,
	"raw_log_content" text,
	"confidence_score" double precision DEFAULT 1 NOT NULL,
	"benchmark_hash" varchar(64) NOT NULL,
	"gpu_model_id" uuid,
	"gpu_model" varchar(100),
	"gpu_count" integer DEFAULT 1 NOT NULL,
	"gpu_vram" varchar(50),
	"cpu" varchar(200),
	"ram" varchar(50),
	"engine" varchar(50) NOT NULL,
	"engine_version" varchar(50),
	"os" varchar(50),
	"model_name_id" uuid,
	"model_name" varchar(200),
	"model_params" double precision,
	"model_quant" varchar(50),
	"model_source" varchar(300),
	"context_length" integer,
	"batch_size" integer,
	"num_threads" integer,
	"flash_attention" boolean,
	"cuda_graphs" boolean,
	"ngl" integer,
	"kv_cache_dtype" varchar(20),
	"mla" boolean,
	"chunked_prefill" boolean,
	"speculative_method" varchar(50),
	"num_speculative_tokens" integer,
	"load_precision" varchar(20),
	"tokens_per_sec" double precision NOT NULL,
	"prompt_tokens_per_sec" double precision,
	"prompt_tokens" integer,
	"generation_tokens" integer,
	"ttft_ms" double precision,
	"p50_ms" double precision,
	"p99_ms" double precision,
	"temperature" double precision,
	"top_p" double precision,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canonical_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_hash" varchar(64) NOT NULL,
	"average_generation_tps" double precision NOT NULL,
	"min_generation_tps" double precision NOT NULL,
	"max_generation_tps" double precision NOT NULL,
	"average_prompt_tps" double precision,
	"sample_run_count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "canonical_benchmarks_benchmark_hash_unique" UNIQUE("benchmark_hash")
);
--> statement-breakpoint
CREATE TABLE "gpu_canonical_names" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_key" varchar(100) NOT NULL,
	"canonical_name" varchar(100) NOT NULL,
	"memory_specs" varchar(50),
	"aliases" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gpu_canonical_names_match_key_unique" UNIQUE("match_key")
);
--> statement-breakpoint
CREATE TABLE "model_canonical_names" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_key" varchar(200) NOT NULL,
	"canonical_name" varchar(200) NOT NULL,
	"parameter_count" varchar(50),
	"publisher_hf_id" varchar(200),
	"aliases" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_canonical_names_match_key_unique" UNIQUE("match_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(200) NOT NULL,
	"display_name" varchar(50),
	"avatar_url" varchar(500),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_canonical_benchmark_id_canonical_benchmarks_id_fk" FOREIGN KEY ("canonical_benchmark_id") REFERENCES "public"."canonical_benchmarks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_gpu_model_id_gpu_canonical_names_id_fk" FOREIGN KEY ("gpu_model_id") REFERENCES "public"."gpu_canonical_names"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_model_name_id_model_canonical_names_id_fk" FOREIGN KEY ("model_name_id") REFERENCES "public"."model_canonical_names"("id") ON DELETE no action ON UPDATE no action;