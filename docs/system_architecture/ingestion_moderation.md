# Ingestion, Moderation & Canonical Lookup Specification

This specification defines the security protocols, quality controls, and display name resolution logic required prior to initiating backend development. It bridges the gap between raw crawler data ingestion and a clean, trusted community-facing UI.

---

## 🖥️ 1. The Canonical Lookup Mapping System (FEAT-003)

While our Deduplication Engine utilizes stripped, hyphenated hashes (e.g., `nvidia-rtx-4090`) to locate duplicate configurations, displaying these raw keys in the user interface hurts the visual aesthetics. 

We establish a **Canonical Dictionary Mapping System** utilizing two lookup tables.

### A. Database Lookup Schemas

#### 1. Hardware Dictionary Table (`gpu_canonical_names`)
Resolves raw GPU models into clean, vendor-accurate display strings.

| Raw/Normalized Match Key (Primary Key) | Canonical Display Name | Memory Specifications |
| :--- | :--- | :--- |
| `nvidia-rtx-4090` | `NVIDIA GeForce RTX 4090` | `24GB GDDR6X` |
| `nvidia-h100-pcie` | `NVIDIA H100 PCIe` | `80GB HBM3` |
| `apple-m3-max-30-core` | `Apple M3 Max (30-core GPU)` | `Unified Memory` |
| `amd-radeon-rx-7900-xtx` | `AMD Radeon RX 7900 XTX` | `24GB GDDR6` |

#### 2. Model Dictionary Table (`model_canonical_names`)
Resolves crawled model strings into official publisher branding.

| Match Key (Primary Key) | Canonical Display Name | Parameter Count | Publisher / HuggingFace ID |
| :--- | :--- | :--- | :--- |
| `deepseek-v3` | `DeepSeek-V3` | `671B (37B Active)` | `deepseek-ai/DeepSeek-V3` |
| `meta-llama-3.1-8b-instruct` | `Meta-Llama-3.1-8B-Instruct` | `8.0B` | `meta-llama/Llama-3.1-8B-Instruct` |

### B. Display Name Resolution Algorithm
When rendering any benchmark in the UI, the frontend applies the following query pipeline:
```
IF exists(gpu_canonical_names[normalized_gpu_key]):
  render(gpu_canonical_names[normalized_gpu_key].display_name)
ELSE:
  // Fallback to title-cased raw input if no canonical mapping is present
  render(title_case(raw_gpu_input))
```

---

## 🛡️ 2. Moderation, Flags & Trust Gatekeeping (FEAT-012)

Because we allow automated crawler agents and anonymous visitors to submit benchmark records, we enforce a strict quality quarantine protocol to maintain database integrity.

### A. Automated Ingestion Quarantine (The Trust Gate)
When a benchmark is submitted (via web form or Agent API):
*   The system calculates its `confidence_score` (0.0 to 1.0) using the log parser matches.
*   **Approval Rules**:
    *   **Trust Score $\ge 0.85$**: Status is set to `approved` and is immediately visible in the community index.
    *   **Trust Score $0.70 - 0.84$**: Status is set to `pending_review`. Visible in search index, but flagged with a subtle `"⚠️ Unverified Log"` warning badge.
    *   **Trust Score $< 0.70$ or Missing Logs**: Status is set to `quarantined`. **Hidden** from public index searches until manually verified by an Admin or Moderator.

### B. Community Flagging & Spam Prevention
- **Flagging Action**: Authenticated users can click "Flag Benchmark" on any record.
- **Quarantine Threshold**: If a benchmark receives **3 flags**, it is automatically demoted to `pending_review` status, hidden from public views, and sent to the Moderator Admin Panel queue.

---

## 🔑 3. Agent API Authorization & Rate Limiting (FEAT-005)

Crawlers crawling the internet must ingest starting records securely without introducing DDoS vulnerabilities.

### A. Crytographic API Authentication
- **Endpoint**: `POST /api/benchmarks`
- **Header**: `X-Agent-API-Key`
- **Database Safety**: We **NEVER** store raw API keys. The database contains SHA256 hashed API keys (`api_key_hash`) with a unique cryptographic salt.
- **Validation Flow**:
```
incoming_key_hash = SHA256(incoming_header_key + db_salt)
IF incoming_key_hash == db.api_keys.key_hash:
  authorize_agent_post()
```

### B. Strict Rate Limiting (防刷限流)
We apply rate-limiting tiers utilizing a Redis-backed Token Bucket algorithm:

| Authenticated Tier | Rate Limit Configuration | Action on Exceeded |
| :--- | :--- | :--- |
| **Scraper Agent (API Key)** | 60 requests / minute | `429 Too Many Requests` (Block key for 10 min) |
| **Authenticated User (Web UI)** | 10 requests / minute | `429 Too Many Requests` (Block session for 5 min) |
| **Anonymous Visitor** | 5 requests / minute | `429 Too Many Requests` (IP block for 5 min) |
