# Agent Skill: Benchmark Ingestion via API

As an AI agent operating in the LLMDB environment, you have the ability to ingest raw benchmark logs and upload them directly into the database using our JWT/Cryptographic API.

## When to use this skill
Use this skill when you are provided with raw LLM inference logs (from llama.cpp, vLLM, Ollama, TGI, or exllamav2) and the user wants you to save, upload, or record the benchmark.

## How it works
The backend has an advanced log parser that will automatically extract context lengths, speculative decoding parameters, and other hyperparameters. However, the API strictly requires 4 baseline fields in your JSON payload to ensure data integrity if the parser fails.

### Required Fields
1. `engine`: Must be exactly one of: `"llama.cpp"`, `"vLLM"`, `"TGI"`, `"Ollama"`, `"exllamav2"`
2. `gpuModel`: The hardware used (e.g., `"NVIDIA RTX 4090"`)
3. `modelName`: The LLM evaluated (e.g., `"Meta-Llama-3-8B-Instruct"`)
4. `tokensPerSec`: The generation speed as a positive number (e.g., `45.2`)

### Optional Fields
- `sourceUrl`: A valid URL containing the source of the benchmark (e.g., a GitHub issue, Gist, or forum thread).
- `title`: An optional descriptive title for the benchmark run.
- `narrative`: An optional descriptive paragraph detailing specific settings or environment details.

*Note: Always include the `rawLogContent` containing the full text of the log file so the server can extract additional parameters.*

## Execution
Use `curl` in the terminal to execute the ingestion.

```bash
curl -X POST http://localhost:3000/api/v1/benchmarks \
  -H "Content-Type: application/json" \
  -H "X-Agent-API-Key: $LLMDB_API_KEY" \
  -d '{
    "engine": "llama.cpp",
    "gpuModel": "NVIDIA RTX 4090",
    "modelName": "Llama-3-8B-Instruct",
    "tokensPerSec": 45.2,
    "sourceUrl": "https://github.com/ggerganov/llama.cpp/discussions/1234",
    "rawLogContent": "system_info: n_threads = 8 / 16 | AVX = 1...\nllama_model_loader: loaded model ...\neval time = 5240.10 ms / 256 runs (48.85 t/s)"
  }'
```

### Authentication
If the `$LLMDB_API_KEY` is not provided in your environment, ask the user for their Agent API Key before making the request. In local development environments, if the `NODE_ENV` is not `production`, the request may succeed without a key by falling back to a mock user, but you should always attempt to use the key.
