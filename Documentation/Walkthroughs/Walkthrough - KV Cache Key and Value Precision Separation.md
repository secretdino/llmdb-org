# Walkthrough - KV Cache Key and Value Precision Separation

We have successfully implemented the separation of KV Cache Precision into Key and Value precisions, and removed the Weight Load Precision field completely from the submission form and the drawer details.

## Changes Implemented

### 1. Database Schema & Utilities (Completed in Previous Turns)
- Modified the Drizzle ORM pgTable schemas in `src/db/schema.ts` to add `kvCacheDtypeK` and `kvCacheDtypeV` varchar columns to the `benchmarks` table while maintaining backward compatibility.
- Updated `IncomingBenchmarkInput` typing and database insertion properties inside `src/utils/dedup.ts` to support both `kvCacheDtypeK` and `kvCacheDtypeV`.
- Performed local database migrations using Drizzle Kit to apply the two new database columns.

### 2. Localization Dictionaries (English, Spanish, German)
- Modified `src/i18n/en.json`, `src/i18n/es.json`, and `src/i18n/de.json` to:
  - Remove `"load_precision"` keys from both `"dashboard.drawer"` and `"submit.form"` scopes.
  - Split `"kv_cache_dtype"` into separate Key and Value cache precision localized strings (`"kv_cache_dtype_k"` and `"kv_cache_dtype_v"`).

### 3. Submission Page (`src/app/submit/page.tsx`)
- Updated the `FormState` interface to replace `loadPrecision` and `kvCacheDtype` with `kvCacheDtypeK` and `kvCacheDtypeV`.
- Replaced initial state keys and the POST request payload mapping blocks.
- Removed the Weight Load Precision input field component completely from the JSX structure.
- Replaced the single KV Cache Precision text input with two separate side-by-side text inputs for Key Precision (`kvCacheDtypeK`) and Value Precision (`kvCacheDtypeV`).

### 4. API Query & Validation Routes
- Updated Zod validation schema `benchmarkIngestSchema` in `src/app/api/v1/benchmarks/route.ts` to validate the incoming `kvCacheDtypeK` and `kvCacheDtypeV` strings.
- Updated list and detail retrieval SQL select queries in both `src/app/api/v1/benchmarks/route.ts` and `src/app/api/v1/benchmarks/[id]/route.ts` to return the new `kvCacheDtypeK` and `kvCacheDtypeV` fields.

### 5. Detail Catalog Drawer (`src/app/page.tsx`)
- Updated the `BenchmarkItem` interface to include the two new fields.
- Removed the Weight Load Precision display row from the specifications grid.
- Replaced the KV Cache Precision display row with separate, conditional rows for KV Cache Key Precision and KV Cache Value Precision using the new translation keys.

---

## Verification & Build Validation

We ran the Next.js production compiler build to verify complete compile, build tracing, and static pre-rendering correctness:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/llmdb"; $env:API_KEY_SALT="dummy_salt_value_at_least_32_characters"; $env:NEXTAUTH_SECRET="dummy_secret_value_at_least_32_characters"; $env:NEXTAUTH_URL="http://localhost:3000"; $env:GITHUB_ID="dummy_id"; $env:GITHUB_SECRET="dummy_secret"; npm run build
```

**Build Status**: **SUCCESS (Exit Code 0)**
- All static pre-rendered routes generated successfully.
- TypeScript verification passed 100%.
- ESLint and compilation completed cleanly.
