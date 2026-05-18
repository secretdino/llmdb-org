# Walkthrough — Production Readiness Hardening

## Summary

Comprehensive security and compatibility hardening of the LLMDB codebase before Vercel production deployment. Addressed 3 critical, 5 important, and 2 minor issues identified during the production readiness audit.

## Files Modified

### [db/index.ts](file:///c:/git/pi/llmdb/src/db/index.ts)
**Dual-driver database architecture**: Added env-var `DB_DRIVER` that switches between:
- `neon` — Neon serverless HTTP driver via `@neondatabase/serverless` + `drizzle-orm/neon-http` (default in production). Stateless HTTP queries, no persistent connections.
- `pg` — Traditional `pg` Pool with TCP connections (default in dev). Best for local PostgreSQL.

Both drivers are cached globally to prevent hot-reload connection leaks. The `pool` export was removed (internal to factory).

### [auth.ts](file:///c:/git/pi/llmdb/src/utils/auth.ts)
- `API_KEY_SALT`: Now throws in production if the env var is missing instead of falling back to a hardcoded salt
- Fixed implicit `any` on error callback parameter (line 152)

### [NextAuth route.ts](file:///c:/git/pi/llmdb/src/app/api/auth/%5B...nextauth%5D/route.ts)
- Added startup guards: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITHUB_ID`, and `GITHUB_SECRET` all throw if missing in production
- Renamed dev fallback strings to include `_dev_only` suffix for clarity

### [benchmarks/route.ts](file:///c:/git/pi/llmdb/src/app/api/v1/benchmarks/route.ts)
- Error responses: `details` field now only included in non-production environments (2 handlers)

### [benchmarks/[id]/route.ts](file:///c:/git/pi/llmdb/src/app/api/v1/benchmarks/%5Bid%5D/route.ts)
- Added `rawLogContent` to the GET select clause (drawer console logs now have data)
- Error responses: `details` stripped in production (3 handlers)
- Fixed 2 pre-existing implicit `any` on `tx` transaction parameters

### [keys/route.ts](file:///c:/git/pi/llmdb/src/app/api/v1/keys/route.ts)
- Error responses: `details` stripped in production (2 handlers)

### [keys/[id]/route.ts](file:///c:/git/pi/llmdb/src/app/api/v1/keys/%5Bid%5D/route.ts)
- Error responses: `details` stripped in production (1 handler)

### [register/route.ts](file:///c:/git/pi/llmdb/src/app/api/auth/register/route.ts)
- Added IP-based sliding window rate limiter: 5 requests per 15-minute window per IP
- Returns 429 with `Retry-After: 900` header when exceeded
- Best-effort defense in serverless (fresh map per cold start)

### [markdown.ts](file:///c:/git/pi/llmdb/src/utils/markdown.ts)
- Replaced stale CSS classes: `slate-950` → `surface-0`, `slate-900` → `zinc-800`, `indigo-300` → `amber-300`, `indigo-400` → `accent-amber`, `slate-300` → `zinc-300`, `slate-400` → `zinc-400`

### [seed.ts](file:///c:/git/pi/llmdb/src/db/seed.ts)
- Admin password now sourced from `ADMIN_SEED_PASSWORD` env var
- Throws in production if the env var is missing, falls back to `adminpass` in dev only

### [next.config.mjs](file:///c:/git/pi/llmdb/next.config.mjs)
- `poweredByHeader: false` — removes X-Powered-By fingerprinting header
- `images.remotePatterns` — allows GitHub and Gravatar avatar CDNs
- Security headers on all routes: X-Frame-Options DENY, X-Content-Type-Options nosniff, strict Referrer-Policy, Permissions-Policy

### [dedup.ts](file:///c:/git/pi/llmdb/src/utils/dedup.ts)
- Fixed 8 pre-existing implicit `any` type errors on transaction, reducer, and filter callbacks

### [test-api.ts](file:///c:/git/pi/llmdb/src/db/test-api.ts)
- Updated import to remove `pool` (no longer exported by dual-driver db/index.ts)
- Replaced `pool.end()` with `process.exit(0)` in finally block

## Required Environment Variables for Production

| Variable | Purpose | Required? |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon pooler URL) | ✅ Required |
| `DB_DRIVER` | `neon` or `pg` (defaults to `neon` in prod, `pg` in dev) | Optional |
| `NEXTAUTH_SECRET` | JWT signing key (min 32 chars) | ✅ Required |
| `NEXTAUTH_URL` | Canonical app URL for callback resolution | ✅ Required |
| `GITHUB_ID` | GitHub OAuth app client ID | ✅ Required |
| `GITHUB_SECRET` | GitHub OAuth app client secret | ✅ Required |
| `API_KEY_SALT` | Cryptographic salt for API key hashing | ✅ Required |
| `ADMIN_SEED_PASSWORD` | Admin account password for seed script | ✅ If seeding |

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors (including pre-existing fixes) |
| Error detail stripping | ✅ 8 handlers across 4 route files confirmed |
| Stale CSS in markdown.ts | ✅ Zero `slate-*` or `indigo-*` references remain |
| Rate limiter | ✅ Compiles, 429 + Retry-After header |
| Security headers | ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
