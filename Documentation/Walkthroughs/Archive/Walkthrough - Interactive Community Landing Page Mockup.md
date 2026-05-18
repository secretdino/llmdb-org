# Walkthrough - Interactive Community Landing Page Mockup

This walkthrough summarizes the development and interactive capabilities of the **Community Inference Benchmarks Catalog & Landing Page** for the **LLM Benchmarks Database (llmdb)**.

## 🌟 Changes Made

### 1. Mockup Dashboard Creation
- **[[NEW] mockups/index.html](file:///c:/git/pi/llmdb/mockups/index.html)**: Created a gorgeous, interactive cyberglass landing page featuring:
  - **Dynamic Telemetry KPIs**: Summarizes active catalog metrics in real time (Total active configurations, Peak Prompt Evaluation tok/s, Peak Token Generation tok/s, and Average Trust score rating).
  - **Query Controls Box**:
    - *Live Search bar*: Parses typed queries and matches them against model signatures, GPU hardware, and CPUs.
    - *Engine Filters bar*: Sleek responsive chips to isolate benchmarks by runtime engine (`llama.cpp`, `vLLM`, `Ollama`, `ExLlamaV2`, `llamafile`).
    - *Collapsible Advanced Panel*: Sliding drawer containing hardware family selectors (NVIDIA RTX, Apple Silicon, etc.), cache load precision, and active acceleration switches (MLA, Spec-Dec, Chunked Prefill, Flash Attention).
    - *Dynamic Sort Dropdown*: Re-orders the listing immediately by Generation Speed, Prompt Speed, Submission Date, or Trust Rating.
  - **Pre-populated Benchmark Database**: Loaded 8 extremely realistic community benchmarks representing real-world rigs (e.g. DeepSeek-V3 on 8x H100s, DeepSeek-R1 on dual RTX 4090s, Llama-3 on Apple MacBooks, and CPU-only configurations).
  - **Interactive Detail Drawer**: Clicking "Explore specs ⚡" slides in a gorgeous diagnostic overview containing:
    - Multi-dimensional stats (Prompt speed, Latency, and Trust rating).
    - Extracted console timing logs.
    - **Auto-generated Docker Compose configurations**: Dynamically builds ready-to-run YAML schemas based on the active record's engine and acceleration flags, featuring a one-click clipboard copier.
  - **Cyberglass Blank View**: Displays a beautiful cybernetic warning card if filters isolate zero records, allowing users to clear settings immediately.

### 2. Project Tracking & Deployments
- **[[MODIFY] Documentation/TODO.md](file:///c:/git/pi/llmdb/Documentation/TODO.md)**: Overwrote with the **Leaned-Down CVP Milestone Tasks**. Aligned Phase 1 into core database setups, API log parsers, deduplication hashing logic, public filtering dashboards, and Vercel hosting. Moved the Crawler Ingestion Agent (`FEAT-007`) to Phase 2.
- **[[MODIFY] docs/phases.md](file:///c:/git/pi/llmdb/docs/phases.md)**: Overwrote with the **Lean Phase 1 Milestones Roadmap**. Since we compiled a high-fidelity starting dataset (`docs/starting_data.md`), the complex automated Crawler Ingestion Agent (`FEAT-007`) is deferred back to Phase 2. Phase 1 is optimized into a super lean flow utilizing a simple seed import script (`db/seed.ts`).
- **[[MODIFY] docs/system_architecture/deployment_guide.md](file:///c:/git/pi/llmdb/docs/system_architecture/deployment_guide.md)**: Added Step 7 outlining A-record and CNAME-record details for routing your newly registered custom domain **`llmdb.org`** and `www.llmdb.org` to Vercel's edge network router.
- **[[NEW] docs/starting_data.md](file:///c:/git/pi/llmdb/docs/starting_data.md)**: Compiled a seed catalog of 12 baseline benchmarks representing actual Intel SYCL, AMD ROCm/Vulkan, and speculative/MTP decoding timings collected from community scoreboards and discussions.

---

## 🧪 Verification Results

The index mockup was tested and verified across all operations:
1.  **Multi-Dimensional Filtering**:
    *   *Search Input*: Typing `"4090"` immediately filters the catalog to show only cards containing GeForce RTX 4090 graphics, instantly updating the KPIs.
    *   *Engine Chips*: Clicking the `vLLM` chip hides all `llama.cpp` and `Ollama` cards, adjusting average stats perfectly.
    *   *Advanced Drawer*: Collapsing and expanding filters performs a smooth transition. Toggling the `"MLA Attention"` checkbox displays only the H100 DeepSeek-V3 configurations.
2.  **Dynamic KPI Telemetry**:
    *   Summary KPIs immediately recalculate upon filter changes. Max Generation speed instantly shifts to reflect the highest throughput active in the visible list.
3.  **Docker Compose Generator**:
    *   Selecting the DeepSeek-R1 card reveals an auto-generated Docker file showing speculative decoding configuration:
        `SPECULATIVE_ALGORITHM=EAGLE` and `DRAFT_TOKENS_COUNT=5`.
    *   Selecting the DeepSeek-V3 card reveals an auto-generated Docker file containing:
        `ENABLE_FLASHINFER_MLA=1` and `ENABLE_CHUNKED_PREFILL=1`.
    *   Clipboard copy correctly copy-pastes complete code schemas.
4.  **Reset Handlers**:
    *   Clicking `Reset All Filters` in the fallback blank card immediately returns the interface to its full default state showing all 8 catalog items.
5.  **Domain Mappings (`llmdb.org`)**:
    *   Documented Porkbun/Namecheap apex `A` and subdomain `CNAME` routing details pointing `llmdb.org` to `76.76.21.21` and `www.llmdb.org` to `cname.vercel-dns.com` to provision automated SSL security.
6.  **Seed Benchmark Dataset (`starting_data.md`)**:
    *   Compiled 12 high-fidelity starting benchmarks collected directly from llama.cpp SYCL discussions, AMD ROCm/Vulkan scoreboards, and speculative/MTP threads on Reddit LocalLLaMA, mapping actual VRAM configurations, timings, and direct source URLs.
7.  **Optimized Phases Roadmap (`phases.md` & `TODO.md`)**:
    - Strategically aligned phases to seed the database in Phase 1.A utilizing a seed script `db/seed.ts` reading from `starting_data.md`, allowing the complex Crawler Agent (`FEAT-007`) to be deferred back to Phase 2 for a faster launch!
