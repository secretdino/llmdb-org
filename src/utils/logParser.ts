/**
 * ============================================================================
 * LOG PARSING & CONFIGURATION EXTRACTION UTILITIES (FEAT-016)
 * ============================================================================
 * 
 * Provides parsing algorithms to extract performance metrics (tokens/sec), 
 * models, quantization, hardware configurations, and optimization settings
 * from raw copy-pasted console logs, Docker Compose keys, and CLI strings.
 */

export interface ParsedLogResult {
  engine: string;
  engineVersion?: string;
  tokensPerSec?: number;
  promptTokensPerSec?: number;
  ttftMs?: number;
  promptTokens?: number;
  generationTokens?: number;
  
  gpuModel?: string;
  gpuCount?: number;
  gpuVram?: string;
  
  modelName?: string;
  modelQuant?: string;
  
  contextLength?: number;
  batchSize?: number;
  numThreads?: number;
  ngl?: number;
  
  flashAttention?: boolean;
  mla?: boolean;
  chunkedPrefill?: boolean;
  speculativeMethod?: string;
  numSpeculativeTokens?: number;
  loadPrecision?: string;
  
  confidenceScore: number;
}

/**
 * Extracts all recognizable features and timing from a raw log dump.
 */
export function parseInferenceLogs(logs: string | null | undefined): ParsedLogResult | null {
  if (!logs || typeof logs !== 'string' || !logs.trim()) {
    return null;
  }

  // Initialize result with safe defaults
  const result: Partial<ParsedLogResult> = {
    gpuCount: 1,
    flashAttention: false,
    mla: false,
    chunkedPrefill: false,
    speculativeMethod: 'none',
    numSpeculativeTokens: 0,
  };

  let matchCount = 0;
  let detectedEngine = '';

  // --------------------------------------------------------------------------
  // 1. LLAMA.CPP / LLAMAFILE ENGINE MATCHERS
  // --------------------------------------------------------------------------

  // A. Threads parser
  // system_info: n_threads = 8 / 16 | AVX = 1 | ...
  const llamaThreadsRegex = /system_info:\s+n_threads\s*=\s*(\d+)\s*\/\s*(\d+)\s*\|\s*(.*)/i;
  const threadsMatch = logs.match(llamaThreadsRegex);
  if (threadsMatch) {
    result.numThreads = parseInt(threadsMatch[1], 10);
    detectedEngine = 'llama.cpp';
    matchCount++;
    
    // Scan threads compiler details for potential backend cues (Metal, CUDA, SYCL)
    const details = threadsMatch[3].toLowerCase();
    if (details.includes('metal')) {
      result.gpuModel = 'Apple GPU';
      matchCount++;
    } else if (details.includes('cuda')) {
      result.gpuModel = 'NVIDIA GPU';
      matchCount++;
    } else if (details.includes('sycl')) {
      result.gpuModel = 'Intel GPU';
      matchCount++;
    } else if (details.includes('rocm')) {
      result.gpuModel = 'AMD GPU';
      matchCount++;
    }
  }

  // B. Loaded GGUF Model Name
  // llama_model_loader: loaded model /path/to/models/meta-llama-3-8b.gguf
  const llamaModelRegex = /llama_model_loader:\s+loaded\s+model\s+([^\s]+)/i;
  const modelMatch = logs.match(llamaModelRegex);
  if (modelMatch) {
    const path = modelMatch[1];
    // Isolate file name from directory path
    const parts = path.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    result.modelName = fileName;
    detectedEngine = 'llama.cpp';
    matchCount++;

    // Extract GGUF quantization scheme from model path
    const quantRegex = /(Q\d_[K_a-zA-Z\d]+|FP16|BF16|IQ\d_[a-zA-Z\d]+|FP8)/i;
    const quantMatch = fileName.match(quantRegex);
    if (quantMatch) {
      result.modelQuant = quantMatch[1].toUpperCase();
      matchCount++;
    }
  }

  // C. GPU Layer Offloading (NGL)
  // llm_load_tensors: offloaded 32/33 layers to GPU
  const llamaNglRegex = /llm_load_tensors:\s+offloaded\s+(\d+)\/(\d+)\s+layers\s+to\s+GPU/i;
  const nglMatch = logs.match(llamaNglRegex);
  if (nglMatch) {
    result.ngl = parseInt(nglMatch[1], 10);
    detectedEngine = 'llama.cpp';
    matchCount++;
  }

  // D. Performance: Prompt evaluation speed & TTFT
  // prompt eval time =     432.50 ms /    32 tokens (   73.99 t/s)
  const llamaPromptEvalRegex = /prompt\s+eval\s+time\s*=\s*([\d\.]+)\s*ms\s*\/\s*(\d+)\s*tokens\s*\(.*?,?\s*([\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i;
  const promptMatch = logs.match(llamaPromptEvalRegex);
  if (promptMatch) {
    result.ttftMs = parseFloat(promptMatch[1]);
    result.promptTokens = parseInt(promptMatch[2], 10);
    result.promptTokensPerSec = parseFloat(promptMatch[3]);
    detectedEngine = 'llama.cpp';
    matchCount += 3;
  }

  // E. Performance: Token generation speed
  // eval time =    5240.10 ms /   256 runs   (   48.85 t/s)
  const llamaGenEvalRegex = /eval\s+time\s*=\s*([\d\.]+)\s*ms\s*\/\s*(\d+)\s*(?:runs|tokens)\s*\(.*?,?\s*([\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i;
  const genMatch = logs.match(llamaGenEvalRegex);
  if (genMatch) {
    result.tokensPerSec = parseFloat(genMatch[3]);
    result.generationTokens = parseInt(genMatch[2], 10);
    detectedEngine = 'llama.cpp';
    matchCount += 2;
  }

  // --------------------------------------------------------------------------
  // 2. VLLM ENGINE MATCHERS
  // --------------------------------------------------------------------------

  // A. Model Name
  // Initializing model meta-llama/Meta-Llama-3-8B-Instruct
  const vllmModelRegex1 = /Initializing\s+model\s+([a-zA-Z0-9_\-\.\/]+)/i;
  const vllmModelRegex2 = /model\s*=\s*['"]([^'"]+)['"]/i;
  const vllmModelMatch = logs.match(vllmModelRegex1) || logs.match(vllmModelRegex2);
  if (vllmModelMatch) {
    result.modelName = vllmModelMatch[1];
    detectedEngine = 'vLLM';
    matchCount++;
  }

  // B. GPU Count & Type
  // Found 2 NVIDIA GeForce RTX 4090 GPU(s)
  const vllmGpuRegex = /Found\s+(\d+)\s+([^G]+)\s*GPU/i;
  const vllmGpuMatch = logs.match(vllmGpuRegex);
  if (vllmGpuMatch) {
    result.gpuCount = parseInt(vllmGpuMatch[1], 10);
    result.gpuModel = vllmGpuMatch[2].trim();
    detectedEngine = 'vLLM';
    matchCount += 2;
  }

  // C. Context length
  // max_model_len=32768
  const vllmContextRegex = /max_model_len=(\d+)/i;
  const vllmContextMatch = logs.match(vllmContextRegex);
  if (vllmContextMatch) {
    result.contextLength = parseInt(vllmContextMatch[1], 10);
    detectedEngine = 'vLLM';
    matchCount++;
  }

  // D. Performance: Generation speed
  // Avg generation throughput: 82.3 tokens/s
  const vllmGenRegex = /Avg\s+generation\s+throughput:\s+([\d\.]+)\s+tokens\/s/i;
  const vllmGenMatch = logs.match(vllmGenRegex);
  if (vllmGenMatch) {
    result.tokensPerSec = parseFloat(vllmGenMatch[1]);
    detectedEngine = 'vLLM';
    matchCount++;
  }

  // --------------------------------------------------------------------------
  // 3. OLLAMA ENGINE MATCHERS
  // --------------------------------------------------------------------------

  // A. Prompt Eval time
  // prompt eval time: 1.2s
  const ollamaPromptRegex = /prompt\s+eval\s+time:\s*([\d\.]+)s/i;
  const ollamaPromptMatch = logs.match(ollamaPromptRegex);
  if (ollamaPromptMatch) {
    result.ttftMs = parseFloat(ollamaPromptMatch[1]) * 1000;
    detectedEngine = 'Ollama';
    matchCount++;
  }

  // B. Generation speed
  // eval time: 4.8s (38.5 tokens/s)
  const ollamaGenRegex = /eval\s+time:\s*([\d\.]+)s\s*\(\s*([\d\.]+)\s*tokens\/s\)/i;
  const ollamaGenMatch = logs.match(ollamaGenRegex);
  if (ollamaGenMatch) {
    result.tokensPerSec = parseFloat(ollamaGenMatch[2]);
    detectedEngine = 'Ollama';
    matchCount++;
  }

  // --------------------------------------------------------------------------
  // 4. EXLLAMAV2 ENGINE MATCHERS
  // --------------------------------------------------------------------------

  // A. Prompt Eval speed
  // Prompt processing: 2420.5 tokens/sec
  const exlPromptRegex = /Prompt\s+processing:\s*([\d\.]+)\s+tokens\/sec/i;
  const exlPromptMatch = logs.match(exlPromptRegex);
  if (exlPromptMatch) {
    result.promptTokensPerSec = parseFloat(exlPromptMatch[1]);
    detectedEngine = 'exllamav2';
    matchCount++;
  }

  // B. Generation speed
  // Token generation: 82.34 tokens/sec
  const exlGenRegex = /Token\s+generation:\s*([\d\.]+)\s+tokens\/sec/i;
  const exlGenMatch = logs.match(exlGenRegex);
  if (exlGenMatch) {
    result.tokensPerSec = parseFloat(exlGenMatch[1]);
    detectedEngine = 'exllamav2';
    matchCount++;
  }

  // --------------------------------------------------------------------------
  // 5. CLI & DOCKER CONFIGURE KEYS EXTRACER
  // --------------------------------------------------------------------------

  // A. Docker Env parameters
  const dockerModel = logs.match(/LLAMA_ARG_MODEL\s*:\s*["']?([^"'\n\s]+)/i);
  const dockerCtx = logs.match(/LLAMA_ARG_CTX_SIZE\s*:\s*["']?(\d+)/i);
  const dockerNgl = logs.match(/LLAMA_ARG_N_GPU_LAYERS\s*:\s*["']?(\d+)/i);
  const dockerThreads = logs.match(/LLAMA_ARG_THREADS\s*:\s*["']?(\d+)/i);
  const dockerBatch = logs.match(/LLAMA_ARG_BATCH_SIZE\s*:\s*["']?(\d+)/i);

  if (dockerModel) {
    result.modelName = dockerModel[1];
    matchCount++;
  }
  if (dockerCtx) {
    result.contextLength = parseInt(dockerCtx[1], 10);
    matchCount++;
  }
  if (dockerNgl) {
    result.ngl = parseInt(dockerNgl[1], 10);
    matchCount++;
  }
  if (dockerThreads) {
    result.numThreads = parseInt(dockerThreads[1], 10);
    matchCount++;
  }
  if (dockerBatch) {
    result.batchSize = parseInt(dockerBatch[1], 10);
    matchCount++;
  }

  // B. CLI command line arguments
  const cliModel = logs.match(/(?:-m|--model)\s+["']?([^"'\s\-\n]+)/i);
  const cliCtx = logs.match(/(?:-c|--ctx-size)\s+(\d+)/i);
  const cliNgl = logs.match(/(?:-ngl|--n-gpu-layers)\s+(\d+)/i);
  const cliThreads = logs.match(/(?:-t|--threads)\s+(\d+)/i);
  const cliBatch = logs.match(/(?:-b|--batch-size)\s+(\d+)/i);

  if (cliModel) {
    result.modelName = cliModel[1];
    matchCount++;
  }
  if (cliCtx) {
    result.contextLength = parseInt(cliCtx[1], 10);
    matchCount++;
  }
  if (cliNgl) {
    result.ngl = parseInt(cliNgl[1], 10);
    matchCount++;
  }
  if (cliThreads) {
    result.numThreads = parseInt(cliThreads[1], 10);
    matchCount++;
  }
  if (cliBatch) {
    result.batchSize = parseInt(cliBatch[1], 10);
    matchCount++;
  }

  // Flash Attention switch
  if (/--flash-attn/i.test(logs) || /flash-attention/i.test(logs)) {
    result.flashAttention = true;
    matchCount++;
  }

  // --------------------------------------------------------------------------
  // 6. MODERN OPTIMIZATION FEATURES EXTRACER
  // --------------------------------------------------------------------------

  // A. Multi-Head Latent Attention (MLA)
  // Activated by CLI switches or implicit if DeepSeek model family is loaded
  const hasMlaFlag = /--enable-flashinfer-mla/i.test(logs) || 
                     /--attention-backend\s+mla/i.test(logs) || 
                     /mla\s*=\s*true/i.test(logs);
  
  const isDeepSeek = (result.modelName || '').toLowerCase().includes('deepseek');
  
  if (hasMlaFlag || isDeepSeek) {
    result.mla = true;
    matchCount++;
  }

  // B. Chunked Prefill
  if (/--enable-chunked-prefill/i.test(logs) || 
      /--chunked-prefill-size/i.test(logs) || 
      /chunked_prefill\s*=\s*true/i.test(logs)) {
    result.chunkedPrefill = true;
    matchCount++;
  }

  // C. Precision: FP8 / load precision
  const kvFp8 = /--kv-cache-dtype\s+fp8/i.test(logs);
  const quantFp8 = /--quantization\s+fp8/i.test(logs);
  const hasFp8Keyword = /fp8|fp8-e4m3|fp8-e5m2/i.test(logs);

  if (kvFp8 || quantFp8 || hasFp8Keyword) {
    result.loadPrecision = 'fp8';
    matchCount++;
  }

  // D. Speculative Decoding
  const hasSpecFlag = /--speculative-model/i.test(logs) || 
                      /--speculative-draft/i.test(logs) ||
                      /speculative_method/i.test(logs);

  if (hasSpecFlag) {
    matchCount++;
    
    // Classify speculative method
    const textLower = logs.toLowerCase();
    if (textLower.includes('mtp')) {
      result.speculativeMethod = 'mtp';
    } else if (textLower.includes('dflash') || textLower.includes('diffusion')) {
      result.speculativeMethod = 'dflash';
    } else if (textLower.includes('eagle')) {
      result.speculativeMethod = 'eagle';
    } else {
      result.speculativeMethod = 'draft_model';
    }

    // Extract speculative tokens count
    const specTokensRegex = /(?:num-speculative-tokens|speculative-num-steps|num_speculative_tokens)\s+(\d+)/i;
    const specTokensMatch = logs.match(specTokensRegex);
    if (specTokensMatch) {
      result.numSpeculativeTokens = parseInt(specTokensMatch[1], 10);
      matchCount++;
    }
  }

  // Finalize engine type
  result.engine = detectedEngine || 'llama.cpp';

  // --------------------------------------------------------------------------
  // 7. TRUST RATING / CONFIDENCE SCORE ALGORITHM
  // --------------------------------------------------------------------------
  // We establish a base rating of 0.1 for parsing anything, adding 0.1 for 
  // every successfully parsed config field, capped at 1.0.
  const score = Math.min(0.1 + (matchCount * 0.1), 1.0);
  result.confidenceScore = Number(score.toFixed(2));

  return result as ParsedLogResult;
}
