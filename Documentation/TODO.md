# Project Roadmap & TODO List

This document tracks the execution progress of features across the project's development phases.

## 🚀 Lean Phase 1: Core Viable Product (CVP) & Bootstrapping

### Phase 1.A: Database Setup, Canonical Mappings & Seed Import
- [x] **Setup Local PostgreSQL & Drizzle ORM**: Initialize local docker container and Drizzle schemas.
- [x] **[[FEAT-003] Canonical Name Lists](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-003_canonical_name_lists.md)**: Establish mapped lookups to normalize model and GPU keys to canonical display titles.
- [x] **Database Seeder (`db/seed.ts`)**: Write seed scripts to load the 12 compiled baseline benchmarks from `docs/starting_data.md` directly into PostgreSQL.

### Phase 1.B: API Ingestion, Log Parsing & Deduplication Engine
- [x] **[[FEAT-005] Salted API Key System](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-005_admin_api_key_system.md)**: Authenticated credentials for scraper pipelines.
- [x] **FEAT-016 Log Parsing Backend**: Server-side raw console timing output parsing.
- [x] **Deduplication Engine**: Fingerprint hashing calculations, normalization functions, and parent aggregate mappings.
- [x] **Automated Ingestion Quarantine**: Automated trust score filters to isolate low-confidence benchmarks.
- [x] **BUGFIX: logParser timing regex fix**: Fix prompt eval log interference on token generation speed parsing

### Phase 1.C: Community UI Catalog & Submission Forms
- [x] **[[FEAT-002] Public Browse + Filter](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-002_public_browse_filter.md)**: Visitors can query, filter, and sort benchmarks with URL-shareable state.
- [x] **[[FEAT-001] Benchmark CRUD](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-001_benchmark_crud.md)**: Users can create/edit/delete benchmarks with dynamic settings.
  - [x] Fix API session validation to support NextAuth cookies
- [x] **[[FEAT-004] Benchmark Detail Page](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-004_benchmark_detail.md)**: Detail view displaying raw logs and custom Docker Compose files.
- [x] **[FEAT-017] Shareable Entry Links**: Sync active entry in URL (?run=id) and add a share button with translation keys.

### Phase 1.D: Production Launch
- [x] **Public Release Licensing & Attributions**: Implement standard MIT License, write detailed third-party attributions, configure env.example, and integrate Cyberglass footer and modal.
- [ ] **Deploy to Vercel**: Connect codebase, configure environment variables, and map A/CNAME records for **`llmdb.org`**!

### Phase 1.E: User Authentication & Profile System
- [x] **NextAuth.js Integration**: Implement Credentials and OAuth authentication layers with navbar widgets, user profile configurations, and secure action guards.

### Phase 1.G: Custom i18n Translation Engine
- [x] **Internationalization System**: Build React Context provider, write EN, ES, DE translation assets, wrap global layout, and design custom header language selectors.

## 🪵 Phase 2: Engagement, Automated Crawling & Advanced Moderation
- [ ] **[[FEAT-007] Crawler Agent](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-007_crawler_agent.md)**: Automated parser to crawl HuggingFace blogs, Github, or Reddit threads.
- [ ] **[FEAT-006] Upvotes**: Community signals & sorting by upvote count.
- [ ] **[FEAT-008] Hardware Directory Pages**: Landing pages for specific GPUs.
- [ ] **[FEAT-009] Model Directory Pages**: Landing pages for specific models.
- [ ] **[FEAT-010] Similar Benchmarks Sidebar**: Recommendation panel on detail page.
- [ ] **[FEAT-011] Edit History & Versioning**: Transparency for changed entries.
- [ ] **[FEAT-012] Public Community Flagging**: Quality controls for spam/invalid data (3 flags demotes record to review queue).

## 📊 Phase 3: Analytics & Advanced Features
- [ ] **[FEAT-013] Side-by-Side Comparison Tool**: Compare two configs side by side.
- [ ] **[FEAT-014] Charts & Graphs**: Scatterplots of tok/s vs context length.
- [ ] **[FEAT-015] Export data**: CSV/JSON data dumps for research.
