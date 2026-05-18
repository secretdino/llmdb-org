# Project Phasing & Milestones

This document establishes the strategic, step-by-step development roadmap for the **LLM Benchmarks Database (llmdb)**, optimized for a fast-to-market launch using our high-fidelity seed dataset.

---

## 🚀 Lean Phase 1: Core Viable Product (CVP) & Bootstrapping

### Phase 1.A: Database Setup, Canonical Mappings & Seed Import
- **Core Goal:** Establish structural foundations, display directories, and seed the database.
- **Included Features:**
  * Set up PostgreSQL local container and Drizzle ORM schemas.
  * Implement **`gpu_canonical_names`** and **`model_canonical_names`** lookups ([`FEAT-003`](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-003_canonical_name_lists.md)) to translate normalized keys to display strings.
  * **Database Seed Script (`db/seed.ts`)**: Write a simple database import script to populate the 12 starting benchmarks from `docs/starting_data.md` into PostgreSQL. This guarantees the database is populated from day one with zero crawler development overhead!

### Phase 1.B: API Ingestion, Log Parsing & Deduplication Engine
- **Core Goal:** Build secure backend endpoints that auto-parse configurations and prevent catalog duplication.
- **Included Features:**
  * Set up `POST /api/benchmarks` secured by cryptographically salted API Keys ([`FEAT-005`](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-005_admin_api_key_system.md)).
  * Implement the server-side **`FEAT-016` Log Parsing Engine** to isolate parameters out of stdout dumps.
  * Integrate the **Deduplication Engine** (`SHA256` configuration fingerprints, string normalizers, and parent canonical averages).
  * Configure the **Automated Quarantine Gate** (Auto-hide entries with `confidence_score < 0.70`).

### Phase 1.C: Community UI Catalog & Submission Forms
- **Core Goal:** Launch the user-facing web dashboard and submission tools.
- **Included Features:**
  * Build the Next.js Community Landing page with full multi-dimensional filters, search, and dynamic sorting ([`FEAT-002`](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-002_public_browse_filter.md)). *(Pre-populated with our 12 seeded benchmarks!)*
  * Build the Submit Benchmark form ([`FEAT-001`](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-001_benchmark_crud.md)) integrating the LocalStorage hardware profiles saver.
  * Build the Benchmark Detail Page ([`FEAT-004`](file:///c:/git/pi/llmdb/docs/features_and_epics/FEAT-004_benchmark_detail.md)) showing raw logs and Docker compose configs.

### Phase 1.D: Production Launch
- **Core Goal:** Secure and route the catalog.
- **Included Features:**
  * Deploy the unified Next.js codebase to Vercel and configure apex A-record and subdomain CNAME record routing for **`llmdb.org`**!

---

## 🪵 Deferred to Phase 2+ (Backlog)

### Phase 2: Community Engagement, Automated Crawling & Advanced Moderation
*   [ ] **`FEAT-007` Crawler Agent** *(Deferred back to Phase 2)*: Automated parser to crawl HuggingFace blogs, Github, or Reddit threads.
*   [ ] **`FEAT-006` Upvotes** and community sorting signals.
*   [ ] **`FEAT-008` Hardware Directory landing pages** (specific GPU aggregations).
*   [ ] **`FEAT-009` Model Directory landing pages** (specific model performance scales).
*   [ ] **`FEAT-010` Similar benchmarks recommendations sidebar** on detail page.
*   [ ] **`FEAT-011` Edit history** & versioning audits.
*   [ ] **`FEAT-012` Public community flagging system** (3 flags demotes record to review queue).

### Phase 3: Analytics & Export Utilities
*   [ ] **`FEAT-013` Side-by-side benchmark comparison tools**.
*   [ ] **`FEAT-014` Custom scatterplots** and performance charts.
*   [ ] **`FEAT-015` Export raw data** to CSV/JSON.
