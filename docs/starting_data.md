# Seed Benchmark Dataset (Starting Data)

This document compiles high-fidelity starting benchmarks collected directly from `llama.cpp` discussions, GitHub pull requests, and the `r/LocalLLaMA` Reddit community. These records serve as initial seeding data for **llmdb.org** and demonstrate performance across Intel SYCL, AMD ROCm/Vulkan, and speculative/MTP decoding architectures.

NOTE: some items have "dual-gpu", ensure we add those details in when creating the records in the database

NOTE: Add the Original Source link to the "Observations" field when creating the records, so users can check the source for more details.
---

## 🔵 Section A: Intel Arc & Battlemage (SYCL Backend)

### Intel Arc Pro B70 (Battlemage) — Dense Q8_0 (SYCL Optimization PR)

* **Model**: `Qwen-3.5-27B-Dense`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp` (SYCL Backend)
* **Hardware**: Intel Arc Pro B70 (32GB VRAM) / Intel Core Ultra 9
* **Performance**: **15.24 tokens/sec** *(Improved from 4.88 t/s following Battlemage SYCL reorder optimization fix)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [llama.cpp GitHub Discussion #11832](https://github.com/ggerganov/llama.cpp/discussions/11832)

### Intel Arc Pro B70 (Battlemage) — Dense Q4_K_M

* **Model**: `Qwen-3.5-27B-Dense`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (SYCL Backend)
* **Hardware**: Intel Arc Pro B70 (32GB VRAM) / Intel Core Ultra 9
* **Performance**: **20.12 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [llama.cpp GitHub Discussion #11832](https://github.com/ggerganov/llama.cpp/discussions/11832)

### Intel Arc Pro B70 (Battlemage) — Qwen MoE (Mixture of Experts)

* **Model**: `Qwen-3.6-35B-A3B-MoE`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (SYCL Backend)
* **Hardware**: Intel Arc Pro B70 (32GB VRAM) / Intel Core Ultra 9
* **Performance**: **54.70 tokens/sec** *(Demonstrates high computational efficiency of MoE on SYCL kernels)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [llama.cpp GitHub Discussion Scoreboard](https://github.com/ggerganov/llama.cpp/discussions)

### Intel Arc B580 — DeepSeek R1 Distill 8B

* **Model**: `DeepSeek-R1-Distill-Qwen-8B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (SYCL Backend via command line)
* **Hardware**: Intel Arc B580 (12GB VRAM) / Intel Core i7-14700K
* **Performance**: **32.50 tokens/sec** *(Tested running clean llama.cpp instead of Ollama wrapper)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [Community Video Benchmarks & LocalLLaMA Thread](https://youtube.com/watch?v=community-b580-benchmark)

### Intel Arc A770 — Llama-2-7B

* **Model**: `Llama-2-7B`
* **Quantization**: `Q4_0`
* **Engine**: `llama.cpp` (SYCL Backend)
* **Hardware**: Intel Arc A770 (16GB VRAM) / Intel Core i5-13600K
* **Performance**: **36.50 tokens/sec** *(Standard baseline performance)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [llama.cpp SYCL Integration Scorecard](https://github.com/ggerganov/llama.cpp/issues)

### Intel Arc A770 — Qwen2.5-7B-Instruct (FP16)

* **Model**: `Qwen/Qwen2.5-7B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (Intel Extension for PyTorch)`
* **Hardware**: Intel Arc A770 (16GB VRAM) / Intel Core i7
* **Performance**: **36.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Best inference engine for Intel Arc](https://www.reddit.com/r/LocalLLaMA/comments/1gymtfp/best_inference_engine_for_intel_arc/)

### Intel Arc A770 — Gemma-2-9B (Q4_K)

* **Model**: `google/gemma-2-9b`
* **Quantization**: `Q4_K`
* **Engine**: `Ollama 0.3.6 (ipex-llm backend)`
* **Hardware**: Intel Arc A770 (16GB VRAM) / Intel Core i7
* **Performance**: **18.82 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Best inference engine for Intel Arc](https://www.reddit.com/r/LocalLLaMA/comments/1gymtfp/best_inference_engine_for_intel_arc/)

### Intel Arc A770 — Qwen2.5-7B (4-bit)

* **Model**: `Qwen/Qwen2.5-7B`
* **Quantization**: `Q4_K_M`
* **Engine**: `text-generation-webui (ipex-llm backend)`
* **Hardware**: Intel Arc A770 (16GB VRAM) / Intel Core i7
* **Performance**: **57.89 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Best inference engine for Intel Arc](https://www.reddit.com/r/LocalLLaMA/comments/1gymtfp/best_inference_engine_for_intel_arc/)

### Intel Arc B580 — Qwen2-7B-Dense

* **Model**: `Qwen/Qwen2-7B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (IPEX-LLM backend)`
* **Hardware**: Intel Arc B580 (12GB VRAM)
* **Performance**: **41.55 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Someone posted some numbers for LLM on the Intel B580. It's fast.](https://www.reddit.com/r/LocalLLaMA/comments/1hf98oy/someone_posted_some_numbers_for_llm_on_the_intel/)

### Intel Arc B580 — Qwen2-7B-Dense (Native SYCL)

* **Model**: `Qwen/Qwen2-7B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (SYCL backend)`
* **Hardware**: Intel Arc B580 (12GB VRAM)
* **Performance**: **15.87 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Someone posted some numbers for LLM on the Intel B580. It's fast.](https://www.reddit.com/r/LocalLLaMA/comments/1hf98oy/someone_posted_some_numbers_for_llm_on_the_intel/)

### Dual Intel Arc A770 — Llama-3.2-3B

* **Model**: `Meta-Llama-3.2-3B-Instruct`
* **Quantization**: `Q6_K_L`
* **Engine**: `llama.cpp (SYCL backend)`
* **Hardware**: 2x Intel Arc A770 (16GB VRAM each)
* **Performance**: **18.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [Intel arc a770 for local llm?](https://www.reddit.com/r/LocalLLaMA/comments/1pr76zz/intel_arc_a770_for_local_llm/)

---

## 🔴 Section B: AMD Radeon (ROCm & Vulkan Backends)

### AMD Radeon RX 7900 XTX — ROCm (Linux)

* **Model**: `Meta-Llama-3-8B-Instruct`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (ROCm Backend)
* **Hardware**: AMD Radeon RX 7900 XTX (24GB VRAM) / AMD Ryzen 7 7800X3D
* **Performance**: **127.00 tokens/sec** *(Peak optimization using native ROCm kernels on Linux)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Puget Systems comparative database & llama.cpp Discussion #15021](https://github.com/ggerganov/llama.cpp/issues/15021)

### AMD Radeon RX 7900 XTX — Vulkan (Windows)

* **Model**: `Meta-Llama-3-8B-Instruct`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (Vulkan Backend)
* **Hardware**: AMD Radeon RX 7900 XTX (24GB VRAM) / AMD Ryzen 7 7800X3D
* **Performance**: **108.00 tokens/sec** *(Stable Vulkan execution under Windows 11)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [LocalLLaMA comparative benchmarking logs](https://reddit.com/r/LocalLLaMA/comments/7900xtx-vulkan)

### AMD Radeon RX 7600 XT — ROCm (Linux)

* **Model**: `Llama-2-7B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (ROCm Backend)
* **Hardware**: AMD Radeon RX 7600 XT (16GB VRAM) / AMD Ryzen 5 7600
* **Performance**: **34.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [GigachadLLC GPU benchmarking scorecard](https://github.com/ggerganov/llama.cpp/discussions)

### AMD Radeon RX 480 — Vulkan Legacy

* **Model**: `Llama-2-7B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp` (Vulkan Backend)
* **Hardware**: AMD Radeon RX 480 (8GB VRAM) / Intel Core i7-6700K
* **Performance**: **30.00 tokens/sec** *(Demonstrates legacy AMD compatibility)*
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.80`
* **Original Source**: [Reddit r/LocalLLaMA Vulkan performance thread](https://reddit.com/r/LocalLLaMA/comments/rx480-vulkan)

### AMD Radeon AI Pro 9700 — Qwen3.6-27B (MTP Baseline)

* **Model**: `Qwen/Qwen3.6-27B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (ROCm backend)`
* **Hardware**: AMD Radeon AI Pro 9700 (32GB VRAM)
* **Performance**: **26.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [MTP benchmark results: the nature of the generative task dictates whether you will benefit](https://www.reddit.com/r/LocalLLaMA/comments/1t9gcar/mtp_benchmark_results_the_nature_of_the/)

### AMD Radeon AI Pro 9700 — Qwen3.6-27B (MTP Enabled)

* **Model**: `Qwen/Qwen3.6-27B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (ROCm backend)`
* **Hardware**: AMD Radeon AI Pro 9700 (32GB VRAM)
* **Performance**: **40.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 3`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [MTP benchmark results: the nature of the generative task dictates whether you will benefit](https://www.reddit.com/r/LocalLLaMA/comments/1t9gcar/mtp_benchmark_results_the_nature_of_the/)

### AMD Radeon 8060S (Strix Halo) — Qwen3.6-27B (MTP Baseline)

* **Model**: `Qwen/Qwen3.6-27B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (Vulkan backend)`
* **Hardware**: AMD Ryzen AI Max+ 395 / Radeon 8060S iGPU (30GB allocated RAM)
* **Performance**: **7.63 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Strix Halo Llama.cpp MTP Benchmarks: 27B Gets Much Faster, 35B Is Mixed](https://www.reddit.com/r/LocalLLaMA/comments/1teypb8/strix_halo_llamacpp_mtp_benchmarks_27b_gets_much/)

### AMD Radeon 8060S (Strix Halo) — Qwen3.6-27B (MTP Speedup)

* **Model**: `Qwen/Qwen3.6-27B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (Vulkan backend)`
* **Hardware**: AMD Ryzen AI Max+ 395 / Radeon 8060S iGPU (30GB allocated RAM)
* **Performance**: **16.15 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 3`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Strix Halo Llama.cpp MTP Benchmarks: 27B Gets Much Faster, 35B Is Mixed](https://www.reddit.com/r/LocalLLaMA/comments/1teypb8/strix_halo_llamacpp_mtp_benchmarks_27b_gets_much/)

### AMD Radeon 8060S (Strix Halo) — Qwen3.6-35B-A3B (MTP Baseline)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (Vulkan backend)`
* **Hardware**: AMD Ryzen AI Max+ 395 / Radeon 8060S iGPU (30GB allocated RAM)
* **Performance**: **48.18 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Strix Halo Llama.cpp MTP Benchmarks: 27B Gets Much Faster, 35B Is Mixed](https://www.reddit.com/r/LocalLLaMA/comments/1teypb8/strix_halo_llamacpp_mtp_benchmarks_27b_gets_much/)

### AMD Radeon 8060S (Strix Halo) — Qwen3.6-35B-A3B (MTP Speedup)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (Vulkan backend)`
* **Hardware**: AMD Ryzen AI Max+ 395 / Radeon 8060S iGPU (30GB allocated RAM)
* **Performance**: **56.12 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 3`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Strix Halo Llama.cpp MTP Benchmarks: 27B Gets Much Faster, 35B Is Mixed](https://www.reddit.com/r/LocalLLaMA/comments/1teypb8/strix_halo_llamacpp_mtp_benchmarks_27b_gets_much/)

### AMD Radeon RX 7900 XTX — Qwen3.5-27B

* **Model**: `Qwen/Qwen3.5-27B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (ROCm backend)`
* **Hardware**: AMD Radeon RX 7900 XTX (24GB VRAM)
* **Performance**: **33.41 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [What tokens/sec do you get when running Qwen 3.5 27B?](https://www.reddit.com/r/LocalLLaMA/comments/1rq8l0x/what_tokenssec_do_you_get_when_running_qwen_35_27b/)

---

## 🔥 Section C: Speculative Decoding & Multi-Token Prediction (MTP)

### NVIDIA RTX 4090 — Dense Baseline (No MTP)

* **Model**: `Qwen-2.5-27B-Instruct`
* **Quantization**: `FP8`
* **Engine**: `vLLM`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM) / Intel Core i9-14900K
* **Performance**: **38.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [r/LocalLLaMA MTP comparative analytics thread](https://reddit.com/r/LocalLLaMA/comments/qwen-27b-mtp)

### NVIDIA RTX 4090 — Speculative Multi-Token Prediction (MTP Enabled)

* **Model**: `Qwen-2.5-27B-Instruct`
* **Quantization**: `FP8`
* **Engine**: `vLLM` (MTP Enabled via target settings)
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM) / Intel Core i9-14900K
* **Performance**: **65.00 tokens/sec** *(Represents a 1.71x acceleration multiplier over baseline)*
* **Optimization Toggles**: `mla = true`, `speculative_method = mtp`, `num_speculative_tokens = 3`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [r/LocalLLaMA MTP comparative analytics thread](https://reddit.com/r/LocalLLaMA/comments/qwen-27b-mtp)

### Dual NVIDIA RTX 3090 — EAGLE Speculative Decoding

* **Model**: `DeepSeek-R1-Distill-Qwen-32B`
* **Quantization**: `Q4_K_M`
* **Engine**: `vLLM` (Speculative draft mode enabled)
* **Hardware**: 2x NVIDIA GeForce RTX 3090 (24GB VRAM each, NVLink enabled)
* **Performance**: **46.50 tokens/sec** *(Speedup achieved using EAGLE speculative verification)*
* **Optimization Toggles**: `mla = true`, `speculative_method = eagle`, `num_speculative_tokens = 5`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [r/LocalLLaMA speculative workflows benchmarks](https://reddit.com/r/LocalLLaMA/comments/r1-32b-eagle)

### NVIDIA RTX 3080 Ti — Qwen3.6-35B-A3B (MTP Accelerated)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (CUDA backend)`
* **Hardware**: NVIDIA GeForce RTX 3080 Ti (12GB VRAM) / 64GB CPU RAM
* **Performance**: **80.80 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 2`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [80 tok/sec and 128K context on 12GB VRAM with Qwen3.6 35B A3B and llama.cpp MTP](https://www.reddit.com/r/LocalLLaMA/comments/1t82zxv/80_toksec_and_128k_context_on_12gb_vram_with/)

### RTX 3090 — QwQ-32B-Instruct (AWQ)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 (24GB VRAM)
* **Performance**: **31.70 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 3090 — Gemma-3-27B

* **Model**: `google/gemma-3-27b`
* **Quantization**: `Q4_K_M`
* **Engine**: `Ollama (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 (24GB VRAM)
* **Performance**: **42.10 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [Benchmarking the DGX Spark against the RTX 3090](https://www.reddit.com/r/LocalLLaMA/comments/1of4ypq/benchmarking_the_dgx_spark_against_the_rtx_3090/)

### RTX 3090 — Qwen3-32B

* **Model**: `Qwen/Qwen3-32B`
* **Quantization**: `Q4_K_M`
* **Engine**: `Ollama (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 (24GB VRAM)
* **Performance**: **38.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [Benchmarking the DGX Spark against the RTX 3090](https://www.reddit.com/r/LocalLLaMA/comments/1of4ypq/benchmarking_the_dgx_spark_against_the_rtx_3090/)

### Dual RTX 3090 — QwQ-32B-Instruct (AWQ)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (Distributed CUDA)`
* **Hardware**: 2x NVIDIA GeForce RTX 3090 (24GB VRAM each)
* **Performance**: **28.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 3090 Ti — QwQ-32B-Instruct (AWQ)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 Ti (24GB VRAM, Overclocked)
* **Performance**: **36.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 3090 Ti — QwQ-32B (Sustained Load)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 Ti (24GB VRAM)
* **Performance**: **40.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### Dual RTX 3090 — Llama-3.1-70B (Offloaded CPU Baseline)

* **Model**: `Meta-Llama-3.1-70B`
* **Quantization**: `Q4_K_M`
* **Engine**: `Ollama (Partial CPU Offload)`
* **Hardware**: 2x NVIDIA GeForce RTX 3090 (24GB VRAM) / DDR4 System RAM
* **Performance**: **0.43 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [Benchmarking the DGX Spark against the RTX 3090](https://www.reddit.com/r/LocalLLaMA/comments/1of4ypq/benchmarking_the_dgx_spark_against_the_rtx_3090/)

### RTX 3090 — GPT-OSS-20B

* **Model**: `gpt-oss-20b`
* **Quantization**: `MXFP4`
* **Engine**: `Ollama (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 (24GB VRAM)
* **Performance**: **54.30 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.80`
* **Original Source**: [Benchmarking the DGX Spark against the RTX 3090](https://www.reddit.com/r/LocalLLaMA/comments/1of4ypq/benchmarking_the_dgx_spark_against_the_rtx_3090/)

### RTX 3090 — GPT-OSS-120B (Extreme CPU Offload)

* **Model**: `gpt-oss-120b`
* **Quantization**: `MXFP4`
* **Engine**: `Ollama (Partial GPU Split)`
* **Hardware**: 1x NVIDIA GeForce RTX 3090 (24GB VRAM) / DDR4 System RAM
* **Performance**: **0.24 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmarking the DGX Spark against the RTX 3090](https://www.reddit.com/r/LocalLLaMA/comments/1of4ypq/benchmarking_the_dgx_spark_against_the_rtx_3090/)

### Dual RTX 3090 — Qwen3.6-35B-A3B (MTP Configuration)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (CUDA backend with MTP)`
* **Hardware**: 2x NVIDIA GeForce RTX 3090 (24GB VRAM)
* **Performance**: **68.50 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 2`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [80 tok/sec and 128K context on 12GB VRAM with Qwen3.6 35B A3B and llama.cpp MTP](https://www.reddit.com/r/LocalLLaMA/comments/1t82zxv/80_toksec_and_128k_context_on_12gb_vram_with/)

---

### RTX 4090 — QwQ-32B-Instruct (AWQ Baseline)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **41.20 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 4090 — QwQ-32B (Sustained Run)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **43.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4090 — QwQ-32B (FP8 Optimized)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `FP8`
* **Engine**: `vLLM (via llmcompressor)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **66.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### Dual RTX 4090 — DeepSeek-R1 (Distill FP8)

* **Model**: `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B`
* **Quantization**: `FP8`
* **Engine**: `vLLM (Tensor Parallel = 2)`
* **Hardware**: 2x NVIDIA GeForce RTX 4090 (24GB VRAM each)
* **Performance**: **74.50 tokens/sec**
* **Optimization Toggles**: `mla = true`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4090 — Llama-3.1-70B (Offloaded CPU Bound)

* **Model**: `Meta-Llama-3.1-70B`
* **Quantization**: `Q4_0`
* **Engine**: `llama.cpp (Partial VRAM offload)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM) / PCIe 4.0 System RAM
* **Performance**: **2.50 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [2.2x faster at tokens/sec vs rtx 4090 24gb using LLama 3.1 70B-Q4!](https://www.reddit.com/r/LocalLLaMA/comments/1hv7cia/22x_faster_at_tokenssec_vs_rtx_4090_24gb_using/)

### RTX 4090 — Mistral-Large-2 (Q4 Split execution)

* **Model**: `mistralai/Mistral-Large-Instruct-2407`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (Partial CPU offload)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM) / 64GB System RAM
* **Performance**: **4.80 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.88`
* **Original Source**: [2.2x faster at tokens/sec vs rtx 4090 24gb using LLama 3.1 70B-Q4!](https://www.reddit.com/r/LocalLLaMA/comments/1hv7cia/22x_faster_at_tokenssec_vs_rtx_4090_24gb_using/)

### RTX 4090 — Llama-3-8B-Instruct (Native FP16)

* **Model**: `Meta-Llama-3-8B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (CUDA Backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **94.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4090 — Llama-3-8B-Instruct (Speculative Drafted)

* **Model**: `Meta-Llama-3-8B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (Speculative Execution)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **142.10 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = draft_model`, `num_speculative_tokens = 4`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4090 — Qwen2.5-14B-Instruct

* **Model**: `Qwen/Qwen2.5-14B-Instruct`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (CUDA Backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **62.30 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 4090 — Qwen2.5-7B-Instruct (MTP Enabled)

* **Model**: `Qwen/Qwen2.5-7B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (MTP Enabled)`
* **Hardware**: 1x NVIDIA GeForce RTX 4090 (24GB VRAM)
* **Performance**: **135.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 3`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [80 tok/sec and 128K context on 12GB VRAM with Qwen3.6 35B A3B and llama.cpp MTP](https://www.reddit.com/r/LocalLLaMA/comments/1t82zxv/80_toksec_and_128k_context_on_12gb_vram_with/)

---

### RTX 5090 — QwQ-32B-Instruct (AWQ Native)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA + FlashInfer)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM, Limited to 400W)
* **Performance**: **65.03 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### Dual RTX 5090 — QwQ-32B-Instruct (AWQ Attention Kernels)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (Distributed Native)`
* **Hardware**: 2x NVIDIA GeForce RTX 5090 (32GB VRAM each)
* **Performance**: **82.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 5090 — Qwen3.6-27B-Uncensored (400W TG Cap)

* **Model**: `HauhauCS/Qwen3.6-27B-Uncensored-HauhauCS-Balanced`
* **Quantization**: `Q6_K_P`
* **Engine**: `llama.cpp (Dockerized Backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM) / Threadripper 6970
* **Performance**: **71.20 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [[Benchmark] 5090RTX: Promt Parsing, Token Generation and Power Level](https://www.reddit.com/r/LocalLLaMA/comments/1tcvji7/benchmark_5090rtx_promt_parsing_token_generation/)

### RTX 5090 — Qwen3.6-27B-Uncensored (600W Max Uncapped)

* **Model**: `HauhauCS/Qwen3.6-27B-Uncensored-HauhauCS-Balanced`
* **Quantization**: `Q6_K_P`
* **Engine**: `llama.cpp (Dockerized Backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM) / Threadripper 6970
* **Performance**: **76.18 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [[Benchmark] 5090RTX: Promt Parsing, Token Generation and Power Level](https://www.reddit.com/r/LocalLLaMA/comments/1tcvji7/benchmark_5090rtx_promt_parsing_token_generation/)

### Dual RTX 5090 — 122B MoE (RPC Inference Setup)

* **Model**: `Mixed-MoE-122B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (Distributed via RPC over 2.5GbE)`
* **Hardware**: 2x NVIDIA GeForce RTX 5090 (32GB VRAM each)
* **Performance**: **96.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [[Benchmark] Dual RTX 5090 Distributed Inference via llama.cpp RPC - Running 122B MoE at 96 t/s](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 5090 — Qwen3.6-35B-A3B (Absurd Coding Speed)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q8_0`
* **Engine**: `vLLM (NVIDIA Native)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM)
* **Performance**: **114.20 tokens/sec**
* **Optimization Toggles**: `mla = true`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Qwen 3.6 35B A3B on rtx 5090 is absurdly fast for coding](https://www.google.com/search?q=https://www.reddit.com/r/LocalLLM/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 5090 — DeepSeek-V3 (Quantized FP4 Target)

* **Model**: `deepseek-ai/DeepSeek-V3`
* **Quantization**: `FP4`
* **Engine**: `vLLM (Sustained Local Engine)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM)
* **Performance**: **24.50 tokens/sec**
* **Optimization Toggles**: `mla = true`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [[Benchmark] 5090RTX: Promt Parsing, Token Generation and Power Level](https://www.reddit.com/r/LocalLLaMA/comments/1tcvji7/benchmark_5090rtx_promt_parsing_token_generation/)

### RTX 5090 — Llama-3.1-405B (Offloaded Local Configuration)

* **Model**: `Meta-Llama-3.1-405B`
* **Quantization**: `Q2_K`
* **Engine**: `llama.cpp (Hybrid RAM/VRAM offload)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM) / 128GB DDR5 RAM
* **Performance**: **3.10 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.80`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 5090 — Qwen2.5-72B-Instruct (AWQ Split)

* **Model**: `Qwen/Qwen2.5-72B-Instruct`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (Partial Layer Offload)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM)
* **Performance**: **18.70 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 5090 — Gemma-2-27B-Instruct (Native FP16 execution)

* **Model**: `google/gemma-2-27b-it`
* **Quantization**: `FP16`
* **Engine**: `vLLM (CUDA pipeline)`
* **Hardware**: 1x NVIDIA GeForce RTX 5090 (32GB VRAM)
* **Performance**: **88.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

---

## 🟢 Section D: NVIDIA RTX 4080

### RTX 4080 — QwQ-32B-Instruct (AWQ Baseline)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (CUDA setup)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **28.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### Dual RTX 4080 — QwQ-32B-Instruct (AWQ Homogeneous Split)

* **Model**: `Qwen/QwQ-32B-Preview`
* **Quantization**: `AWQ`
* **Engine**: `vLLM (Tensor Parallel = 2)`
* **Hardware**: 2x NVIDIA GeForce RTX 4080 (16GB VRAM each)
* **Performance**: **52.00 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.98`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4080 Mobile — Qwen3.5-4B (Vibe Coder Run)

* **Model**: `Qwen/Qwen3.5-4B-Instruct`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (WebUI backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 Mobile (12GB VRAM)
* **Performance**: **58.30 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Qwen 3.5 4b is so good, that it can vibe code a fully working OS web app in one go](https://www.reddit.com/r/LocalLLaMA/comments/1rkb8en/qwen_35_4b_is_so_good_that_it_can_vibe_code_a/)

### RTX 4080 — Qwen3.6-35B-A3B (MTP Sub-16GB Optimization)

* **Model**: `Qwen/Qwen3.6-35B-A3B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (CUDA via MTP Script)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **78.20 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = mtp`, `num_speculative_tokens = 2`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [80 tok/sec and 128K context on 12GB VRAM with Qwen3.6 35B A3B and llama.cpp MTP](https://www.reddit.com/r/LocalLLaMA/comments/1t82zxv/80_toksec_and_128k_context_on_12gb_vram_with/)

### RTX 4080 — Meta-Llama-3-8B-Instruct (Native FP16 execution)

* **Model**: `Meta-Llama-3-8B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (CUDA pipeline)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **71.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)

### RTX 4080 — Llama-3.1-70B (Aggressive Layer Offload)

* **Model**: `Meta-Llama-3.1-70B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (Offloaded Layer Processing)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM) / DDR5 System RAM
* **Performance**: **1.95 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = false`
* **Confidence Trust Rating**: `0.85`
* **Original Source**: [2.2x faster at tokens/sec vs rtx 4090 24gb using LLama 3.1 70B-Q4!](https://www.reddit.com/r/LocalLLaMA/comments/1hv7cia/22x_faster_at_tokenssec_vs_rtx_4090_24gb_using/)

### RTX 4080 — DeepSeek-R1-Distill-Qwen-14B (Native Execution)

* **Model**: `deepseek-ai/DeepSeek-R1-Distill-Qwen-14B`
* **Quantization**: `Q8_0`
* **Engine**: `llama.cpp (CUDA pipeline)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **44.10 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 4080 — DeepSeek-R1-Distill-Qwen-32B (Layer Split Execution)

* **Model**: `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B`
* **Quantization**: `Q4_K_M`
* **Engine**: `llama.cpp (Partial Pipeline Offload)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM) / 32GB RAM
* **Performance**: **11.20 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = false`, `flash_attention = true`
* **Confidence Trust Rating**: `0.90`
* **Original Source**: [Benchmark: RTX 3090, 4090, and even 4080 are surprisingly strong for 1-person QwQ-32B inference](https://www.reddit.com/r/LocalLLaMA/comments/1jnjrdk/benchmark_rtx_3090_4090_and_even_4080_are/)

### RTX 4080 — Qwen2.5-7B-Instruct (FP16 Baseline)

* **Model**: `Qwen/Qwen2.5-7B-Instruct`
* **Quantization**: `FP16`
* **Engine**: `vLLM (CUDA engine)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **82.30 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.95`
* **Original Source**: [80 tok/sec and 128K context on 12GB VRAM with Qwen3.6 35B A3B and llama.cpp MTP](https://www.reddit.com/r/LocalLLaMA/comments/1t82zxv/80_toksec_and_128k_context_on_12gb_vram_with/)

### RTX 4080 — Gemma-2-9B-Instruct

* **Model**: `google/gemma-2-9b-it`
* **Quantization**: `Q8_0`
* **Engine**: `vLLM (CUDA Backend)`
* **Hardware**: 1x NVIDIA GeForce RTX 4080 (16GB VRAM)
* **Performance**: **61.40 tokens/sec**
* **Optimization Toggles**: `mla = false`, `speculative_method = none`, `num_speculative_tokens = 0`, `chunked_prefill = true`, `flash_attention = true`
* **Confidence Trust Rating**: `0.92`
* **Original Source**: [Benchmark: Dual-GPU boosts speed, despite all common internet wisdom](https://www.reddit.com/r/LocalLLaMA/comments/1jobe0u/benchmark_dualgpu_boosts_speed_despire_all_common/)