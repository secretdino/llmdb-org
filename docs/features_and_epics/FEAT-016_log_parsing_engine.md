# FEAT-016: Log Parsing & Extraction Engine
**Status:** Approved Specification | **Target Milestone:** Phase 1
**Depends On:** [[system_architecture/data_models]], [[FEAT-001_benchmark_crud]]

## 1. Objective
Provide a robust client-side and server-side parsing engine that extracts hardware, model, configuration, and performance parameters from raw, copy-pasted log/terminal outputs of popular LLM inference engines.

---

## 2. Supported Engines & Regex Definitions

### A. Llama.cpp / Llamafile
Standard outputs contain rich startup information followed by a `llama_print_timings` block on exit/completion.

#### 1. Engine & Compile Flags
* **Target Line:** `system_info: n_threads = ...`
* **Regex:** `/system_info:\s+n_threads\s*=\s*(?<threads>\d+)\s*\/\s*(?<total_threads>\d+)\s*\|\s*(?<details>.*)/i`
* **Extractions:** `threads` (Inference Settings -> threads), compiler details (helps extract CPU name, GPU backend e.g. CUDA, Metal).

#### 2. Model & Quantization
* **Target Line:** `llama_model_loader: loaded model`
* **Regex:** `/llama_model_loader:\s+loaded\s+model\s+([^\s]+)/i` (or extract from the GGUF file path)
* **Regex for Quant:** `/(?<quant>Q\d_[K_a-zA-Z\d]+|FP16|BF16|IQ\d_[a-zA-Z\d]+)/` (searched within file path/name)

#### 3. GPU Offloading (Layers offloaded to VRAM)
* **Target Line:** `llm_load_tensors: offloaded ... layers to GPU`
* **Regex:** `/llm_load_tensors:\s+offloaded\s+(?<ngl>\d+)\/(?<total_layers>\d+)\s+layers\s+to\s+GPU/i`
* **Extractions:** `ngl` (Inference Settings -> ngl)

#### 4. Performance: TTFT & Prompt Evaluation Speed
* **Target Line:** `llama_print_timings:     prompt eval time = ...`
* **Regex:** `/prompt\s+eval\s+time\s*=\s*(?<time_ms>[\d\.]+)\s*ms\s*\/\s*(?<tokens>\d+)\s*tokens\s*\(.*?,?\s*(?<tps>[\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i`
* **Extractions:** `ttft_ms` (approximate as `time_ms`), `prompt_tokens` (`tokens`), `prompt_tokens_per_sec` (`tps`)

#### 5. Performance: Generation Speed
* **Target Line:** `llama_print_timings:          eval time = ...`
* **Regex:** `/eval\s+time\s*=\s*(?<time_ms>[\d\.]+)\s*ms\s*\/\s*(?<tokens>\d+)\s*(?:runs|tokens)\s*\(.*?,?\s*(?<tps>[\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i`
* **Extractions:** `tokens_per_sec` (`tps`), `generation_tokens` (`tokens`)

---

### B. vLLM
vLLM outputs standard Python logging format specifying model parameters during initialization and throughput reports in stdout.

#### 1. Model Name
* **Target Line:** `Initializing model ...`
* **Regex:** `/Initializing\s+model\s+(?<model>[a-zA-Z0-9_\-\.\/]+)/i` or `/model\s*=\s*['"](?<model>[^'"]+)['"]/i`
* **Extractions:** `model_name`

#### 2. Hardware: GPU Count & Type
* **Target Line:** `Found 4 NVIDIA GeForce RTX 4090 GPU(s)`
* **Regex:** `/Found\s+(?<gpu_count>\d+)\s+(?<gpu_model>[^G]+)\s*GPU/i`
* **Extractions:** `gpu_count`, `gpu_model`

#### 3. Inference Parameters
* **Target Line:** `max_model_len=...`
* **Regex:** `/max_model_len=(?<context_len>\d+)/i`
* **Extractions:** `context_length`

#### 4. Performance: Generation Speed
* **Target Line:** `Avg generation throughput: ... tokens/s`
* **Regex:** `/Avg\s+generation\s+throughput:\s+(?<tps>[\d\.]+)\s+tokens\/s/i`
* **Extractions:** `tokens_per_sec` (`tps`)

---

### C. Ollama
Ollama exposes `/api/generate` and `/api/chat` with detailed JSON fields, or outputs verbose timing data in terminal.

#### 1. Ollama Verbose Timings
* **Target Lines:**
  * `prompt eval time: 1.2s`
  * `eval time: 4.8s (38.5 tokens/s)`
* **Regex for Prompt Eval:** `/prompt\s+eval\s+time:\s*(?<time_s>[\d\.]+)s/i`
* **Regex for Generation:** `/eval\s+time:\s*(?<time_s>[\d\.]+)s\s*\(\s*(?<tps>[\d\.]+)\s*tokens\/s\)/i`
* **Extractions:** `tokens_per_sec` (`tps`), `ttft_ms` (`time_s * 1000`)

---

### D. ExLlamaV2
ExLlamaV2 benchmark scripts (`test_inference.py`) output structured performance data.

#### 1. Performance Timings
* **Target Lines:**
  * `Prompt processing: 2420.5 tokens/sec`
  * `Token generation: 82.34 tokens/sec`
* **Regex for Prompt:** `/Prompt\s+processing:\s*(?<tps>[\d\.]+)\s+tokens\/sec/i`
* **Regex for Gen:** `/Token\s+generation:\s*(?<tps>[\d\.]+)\s+tokens\/sec/i`
* **Extractions:** `prompt_tokens_per_sec` (Prompt), `tokens_per_sec` (Gen)

---

---

### E. Docker Compose & CLI Configuration Strings
Many developers run their inference environments locally using `docker-compose.yml` configs or standard CLI commands. The engine extracts inference parameters from these structures.

#### 1. Llama.cpp Docker Environment Keys
* **Target Line:** `LLAMA_ARG_MODEL`, `LLAMA_ARG_CTX_SIZE`, etc.
* **Regex for Model:** `/LLAMA_ARG_MODEL\s*:\s*["']?(?<model>[^"'\n\s]+)/i`
* **Regex for Context:** `/LLAMA_ARG_CTX_SIZE\s*:\s*["']?(?<ctx>\d+)/i`
* **Regex for Layers:** `/LLAMA_ARG_N_GPU_LAYERS\s*:\s*["']?(?<ngl>\d+)/i`
* **Regex for Threads:** `/LLAMA_ARG_THREADS\s*:\s*["']?(?<threads>\d+)/i`
* **Regex for Batch Size:** `/LLAMA_ARG_BATCH_SIZE\s*:\s*["']?(?<batch>\d+)/i`

#### 2. Llama.cpp CLI Command Arguments
Parsed from `command:` lists or shell scripts.
* **Model Name (-m, --model):** `/(?:-m|--model)\s+["']?(?<model>[^"'\s\-\n]+)/i`
* **Context (-c, --ctx-size):** `/(?:-c|--ctx-size)\s+(?<ctx>\d+)/i`
* **Layers (-ngl, --n-gpu-layers):** `/(?:-ngl|--n-gpu-layers)\s+(?<ngl>\d+)/i`
* **Threads (-t, --threads):** `/(?:-t|--threads)\s+(?<threads>\d+)/i`
* **Batch (-b, --batch-size):** `/(?:-b|--batch-size)\s+(?<batch>\d+)/i`
* **Flash Attention:** `/--flash-attn/i` (Flags `flash_attention` as true)

#### 3. Modern Optimization Features
The engine parses log strings, CLI arguments, and config values to determine state-of-the-art acceleration flags:
* **Multi-Head Latent Attention (MLA):** Triggered by `--enable-flashinfer-mla` or `--attention-backend mla` or if the loaded model contains `DeepSeek` (which natively features MLA).
* **Chunked Prefill:** Triggered by `--enable-chunked-prefill` or `--chunked-prefill-size` or `--max-num-batched-tokens` CLI args.
* **FP8 Precision:** Triggered by `--kv-cache-dtype fp8`, `--quantization fp8`, or explicit `fp8` keywords (FP8-E4M3, FP8-E5M2).
* **Speculative Decoding Frameworks:**
  - *Trigger:* Presence of `--speculative-model`, `--speculative-algorithm`, or draft parameters.
  - *Method Categorization:* Matches `mtp` (Multi-Token Prediction) if model/algorithm matches MTP; `dflash` if matches DFlash/Diffusion; `eagle` if Eagle; and `draft_model` for traditional speculative setups.
  - *Draft Steps:* Extracted using `/(?:num-speculative-tokens|speculative-num-steps)\s+(?<tokens>\d+)/i`.

---

## 3. UI/UX Specifications

1. **Paste Target:** A prominent `textarea` placed in a glowing panel at the top of the form: `[⚡ Paste terminal logs or configurations here to auto-fill]`.
2. **One-Click Demos:** Interactive tabs/chips under the textarea that paste pre-configured real logs (e.g., `llama.cpp` benchmark, `vLLM` startup log) to demonstrate the feature to new users.
3. **Pulsing Auto-fill Cues:** Fields that are populated via log parsing must temporarily pulse with a green boundary (`class="ring-2 ring-emerald-500 transition-all duration-1000"`) and display a small, elegant "Auto-filled" pill badge next to the input label.
4. **Validation Summary Card:** An animated alert card appears showing the engine type, number of parameters extracted, and a confidence rating (e.g., `Confidence: High (9 parameters parsed)`).
5. **Dynamic Form Toggles:** The parsed engine (or manually selected engine) triggers a script that toggles visibility of setting sub-fields, hiding options that do not apply to that engine.

---

## 4. Acceptance Criteria
* [ ] Frontend parser handles complex inputs containing multiple logs, isolating the correct benchmark section.
* [ ] Normalization maps extracted strings (e.g., "RTX4090", "GeForce RTX 4090") to the nearest canonical entity.
* [ ] Empty or failed parses decay nicely, leaving existing form inputs untouched and giving helpful validation warnings.
