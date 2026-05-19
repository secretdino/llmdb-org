CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "kv_cache_dtype_k" varchar(20);--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "kv_cache_dtype_v" varchar(20);--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "ubatch_size" integer;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "no_mmap" boolean;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "top_k" integer;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD COLUMN "min_p" double precision;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_benchmark_id_benchmarks_id_fk" FOREIGN KEY ("benchmark_id") REFERENCES "public"."benchmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;