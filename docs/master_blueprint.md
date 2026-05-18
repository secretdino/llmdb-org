# LLM Benchmarks Database — Master Blueprint

## Concept
A community-driven database of LLM inference benchmarks across **llama.cpp, vLLM, TGI, Ollama, ExLlamaV2**, and similar engines. Users can see real-world performance on their hardware — especially non-NVIDIA GPUs where data is scarce.

**Value Proposition**: "What tokens/sec can I expect on *my* GPU with *this* model?" — answered by real community data.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js (GitHub, Google, email magic links) |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Deployment | Vercel or Fly.io |

## Core User Roles

| Role | Capabilities |
|------|--------------|
| **Visitor** (unauthenticated) | Browse benchmarks, filter, view detail |
| **User** (authenticated) | Create/edit/delete own benchmarks, upvote |
| **Moderator** | Review agent-created posts, manage flags |
| **Admin** | Manage canonical name lists, full system access |
| **Agent** (API key) | Auto-post benchmarks from crawled sources |

## Global Boundaries

### In Scope
- Benchmark creation, browsing, filtering, and detail views
- Log auto-fill parser to eliminate data entry friction (from llama.cpp, vLLM, Ollama, etc.)
- GPU and model canonical name normalization
- API access for agents and integrations
- Community-driven data with trust and quality controls

### Out of Scope (for now)
- Real-time benchmarking (this is a database, not a tool)
- Model training benchmarks (inference only)
- Multi-user collaboration on single posts
- Mobile-native apps

## Key Design Decisions
1. **Community-first data**: All benchmarks are user-submitted with validation.
2. **Auto-Fill UX Acceleration**: Raw terminal/engine log paste auto-fills up to 30 fields, drastically reducing friction.
3. **Canonical names**: GPU/model normalization prevents duplicates.
4. **Quality Trust Scoring**: Implement a `confidence_score` (0.0 to 1.0) on entries to filter and highlight high-fidelity logs.
5. **Agent-assisted**: Crawler agents fill gaps but require human review.
6. **Public by default**: All benchmarks visible without auth; creation requires auth.
7. **Hardware Configuration Profiles**: Enables users to save rig specifications locally (using Local Storage) to instantly select and auto-fill their hardware configurations when reporting multiple model benchmarks.

