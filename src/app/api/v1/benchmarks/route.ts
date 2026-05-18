import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, gte, lte, sql, ilike, desc, or } from 'drizzle-orm';
import { db } from '../../../../db';
import { benchmarks, gpuCanonicalNames, modelCanonicalNames, users } from '../../../../db/schema';
import { authenticateRequest, getOrCreateMockUser } from '../../../../utils/auth';
import { parseInferenceLogs } from '../../../../utils/logParser';
import { processIncomingBenchmark } from '../../../../utils/dedup';

/**
 * ============================================================================
 * ROUTE: /api/v1/benchmarks
 * ============================================================================
 * 
 * - GET: Retrieves a paginated list of public approved benchmarks with filter scopes.
 * - POST: Ingests a new benchmark run. Supports raw log parsing and deduplication.
 */

/**
 * GET /api/v1/benchmarks
 * Fetches all public benchmarks matching optional query parameter filters.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse filter query parameters
    const q = searchParams.get('q');
    const gpuModel = searchParams.get('gpu_model');
    const engine = searchParams.get('engine');
    const modelName = searchParams.get('model_name');
    const quant = searchParams.get('quant');
    const speculativeMethod = searchParams.get('speculative_method');
    const vram = searchParams.get('vram');
    
    const contextLengthStr = searchParams.get('context_length');
    const contextLength = contextLengthStr ? parseInt(contextLengthStr) : null;
    
    const minTpsStr = searchParams.get('min_tokens_per_sec');
    const minTps = minTpsStr ? parseFloat(minTpsStr) : null;
    
    const maxTpsStr = searchParams.get('max_tokens_per_sec');
    const maxTps = maxTpsStr ? parseFloat(maxTpsStr) : null;
    
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Construct query condition arrays
    const conditions = [];
    
    // Enforce that only approved or pending review runs are visible to the public browse catalog
    conditions.push(or(
      eq(benchmarks.status, 'approved'),
      eq(benchmarks.status, 'pending_review')
    ));
    
    // Global keyword query search: AND of space-separated tokens matching OR of columns
    if (q) {
      const tokens = q.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        conditions.push(or(
          ilike(benchmarks.gpuModel, `%${token}%`),
          ilike(gpuCanonicalNames.canonicalName, `%${token}%`),
          sql`${gpuCanonicalNames.aliases}::text ILIKE ${`%${token}%`}`,
          ilike(benchmarks.modelName, `%${token}%`),
          ilike(modelCanonicalNames.canonicalName, `%${token}%`),
          sql`${modelCanonicalNames.aliases}::text ILIKE ${`%${token}%`}`,
          ilike(benchmarks.title, `%${token}%`),
          ilike(benchmarks.narrative, `%${token}%`)
        ));
      }
    }
    
    // Match GPU model against raw text, canonical name, or registered aliases
    if (gpuModel) {
      conditions.push(or(
        ilike(benchmarks.gpuModel, `%${gpuModel}%`),
        ilike(gpuCanonicalNames.canonicalName, `%${gpuModel}%`),
        sql`${gpuCanonicalNames.aliases}::text ILIKE ${`%${gpuModel}%`}`
      ));
    }
    
    // Case-insensitive framework engine matching
    if (engine && engine !== 'all') {
      conditions.push(ilike(benchmarks.engine, engine));
    }
    
    // Match model signature against raw text, canonical name, or registered aliases
    if (modelName) {
      conditions.push(or(
        ilike(benchmarks.modelName, `%${modelName}%`),
        ilike(modelCanonicalNames.canonicalName, `%${modelName}%`),
        sql`${modelCanonicalNames.aliases}::text ILIKE ${`%${modelName}%`}`
      ));
    }
    
    // Quantization keyword match
    if (quant) {
      conditions.push(ilike(benchmarks.modelQuant, `%${quant}%`));
    }

    // Speculative method filter
    if (speculativeMethod) {
      conditions.push(ilike(benchmarks.speculativeMethod, `%${speculativeMethod}%`));
    }

    // VRAM capacity filter
    if (vram) {
      conditions.push(ilike(benchmarks.gpuVram, `%${vram}%`));
    }
    
    // Exact context length filter
    if (contextLength !== null && !isNaN(contextLength)) {
      conditions.push(eq(benchmarks.contextLength, contextLength));
    }
    
    // Generation speed ranges
    if (minTps !== null && !isNaN(minTps)) {
      conditions.push(gte(benchmarks.tokensPerSec, minTps));
    }
    if (maxTps !== null && !isNaN(maxTps)) {
      conditions.push(lte(benchmarks.tokensPerSec, maxTps));
    }
    
    // Determine sort ordering logic
    let orderBySql = desc(benchmarks.createdAt);
    if (sort === 'tokens_per_sec') {
      orderBySql = desc(benchmarks.tokensPerSec);
    } else if (sort === 'prompt_tokens_per_sec') {
      orderBySql = desc(sql`COALESCE(${benchmarks.promptTokensPerSec}, 0)`);
    } else if (sort === 'confidence') {
      orderBySql = desc(benchmarks.confidenceScore);
    }
    
    const whereClause = and(...conditions);
    
    // Fetch matched list with joins to resolve author names and canonical titles
    const results = await db
      .select({
        id: benchmarks.id,
        title: benchmarks.title,
        narrative: benchmarks.narrative,
        status: benchmarks.status,
        sourceUrl: benchmarks.sourceUrl,
        upvotes: benchmarks.upvotes,
        confidenceScore: benchmarks.confidenceScore,
        benchmarkHash: benchmarks.benchmarkHash,
        gpuModel: benchmarks.gpuModel,
        gpuCount: benchmarks.gpuCount,
        gpuVram: benchmarks.gpuVram,
        cpu: benchmarks.cpu,
        ram: benchmarks.ram,
        engine: benchmarks.engine,
        engineVersion: benchmarks.engineVersion,
        os: benchmarks.os,
        modelName: benchmarks.modelName,
        modelParams: benchmarks.modelParams,
        modelQuant: benchmarks.modelQuant,
        modelSource: benchmarks.modelSource,
        contextLength: benchmarks.contextLength,
        batchSize: benchmarks.batchSize,
        numThreads: benchmarks.numThreads,
        flashAttention: benchmarks.flashAttention,
        cudaGraphs: benchmarks.cudaGraphs,
        ngl: benchmarks.ngl,
        kvCacheDtype: benchmarks.kvCacheDtype,
        kvCacheDtypeK: benchmarks.kvCacheDtypeK,
        kvCacheDtypeV: benchmarks.kvCacheDtypeV,
        mla: benchmarks.mla,
        chunkedPrefill: benchmarks.chunkedPrefill,
        speculativeMethod: benchmarks.speculativeMethod,
        numSpeculativeTokens: benchmarks.numSpeculativeTokens,
        loadPrecision: benchmarks.loadPrecision,
        tokensPerSec: benchmarks.tokensPerSec,
        promptTokensPerSec: benchmarks.promptTokensPerSec,
        promptTokens: benchmarks.promptTokens,
        generationTokens: benchmarks.generationTokens,
        ttftMs: benchmarks.ttftMs,
        p50Ms: benchmarks.p50Ms,
        p99Ms: benchmarks.p99Ms,
        temperature: benchmarks.temperature,
        topP: benchmarks.topP,
        ubatchSize: benchmarks.ubatchSize,
        noMmap: benchmarks.noMmap,
        topK: benchmarks.topK,
        minP: benchmarks.minP,
        createdAt: benchmarks.createdAt,
        
        // Author metadata joins
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        // Canonical resolved names
        canonicalGpuName: gpuCanonicalNames.canonicalName,
        canonicalModelName: modelCanonicalNames.canonicalName,
      })
      .from(benchmarks)
      .leftJoin(users, eq(benchmarks.authorId, users.id))
      .leftJoin(gpuCanonicalNames, eq(benchmarks.gpuModelId, gpuCanonicalNames.id))
      .leftJoin(modelCanonicalNames, eq(benchmarks.modelNameId, modelCanonicalNames.id))
      .where(whereClause)
      .orderBy(orderBySql)
      .limit(limit)
      .offset(offset);
      
    // Fetch total matching items count for frontend pagination telemetry
    const [countResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(benchmarks)
      .leftJoin(gpuCanonicalNames, eq(benchmarks.gpuModelId, gpuCanonicalNames.id))
      .leftJoin(modelCanonicalNames, eq(benchmarks.modelNameId, modelCanonicalNames.id))
      .where(whereClause);
      
    return NextResponse.json(
      {
        benchmarks: results,
        total: countResult?.count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to query benchmarks database:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}


// Zod validation schema for incoming benchmark ingestion requests
const benchmarkIngestSchema = z.object({
  title: z.string().max(200).optional(),
  narrative: z.string().optional(),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  
  gpuModel: z.string().min(1, 'GPU model name is required'),
  gpuCount: z.number().int().min(1).default(1),
  gpuVram: z.string().max(50).optional(),
  cpu: z.string().max(200).optional(),
  ram: z.string().max(50).optional(),
  
  engine: z.enum(['llama.cpp', 'vLLM', 'TGI', 'Ollama', 'exllamav2']),
  engineVersion: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  
  modelName: z.string().min(1, 'Model name is required'),
  modelParams: z.number().positive().optional(),
  modelQuant: z.string().max(50).optional(),
  modelSource: z.string().max(300).optional(),
  
  contextLength: z.number().int().positive().optional(),
  batchSize: z.number().int().positive().optional(),
  numThreads: z.number().int().positive().optional(),
  ngl: z.number().int().nonnegative().optional(),
  
  flashAttention: z.boolean().default(false),
  cudaGraphs: z.boolean().default(false),
  kvCacheDtype: z.string().max(20).optional(),
  kvCacheDtypeK: z.string().max(20).optional(),
  kvCacheDtypeV: z.string().max(20).optional(),
  mla: z.boolean().default(false),
  chunkedPrefill: z.boolean().default(false),
  speculativeMethod: z.string().max(50).default('none'),
  numSpeculativeTokens: z.number().int().nonnegative().default(0),
  loadPrecision: z.string().max(20).optional(),
  
  tokensPerSec: z.number().positive('Tokens per second must be greater than 0'),
  promptTokensPerSec: z.number().positive().optional(),
  promptTokens: z.number().int().positive().optional(),
  generationTokens: z.number().int().positive().optional(),
  ttftMs: z.number().positive().optional(),
  p50Ms: z.number().positive().optional(),
  p99Ms: z.number().positive().optional(),
  temperature: z.number().nonnegative().optional(),
  topP: z.number().nonnegative().optional(),
  ubatchSize: z.number().int().positive().optional(),
  noMmap: z.boolean().default(false),
  topK: z.number().int().nonnegative().optional(),
  minP: z.number().nonnegative().optional(),
  
  tags: z.array(z.string()).optional(),
  rawLogContent: z.string().optional().nullable(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    // 1. Authenticate user/agent session
    let context = await authenticateRequest(req);

    // Development auto-bootstrapping fallback
    if (!context) {
      const hasAuthHeader = req.headers.has('Authorization') || req.headers.has('X-Agent-API-Key');
      if (process.env.NODE_ENV !== 'production' && !hasAuthHeader) {
        context = await getOrCreateMockUser();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Valid session or API key required.' },
          { status: 401 }
        );
      }
    }

    // 2. Parse request payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawBody: any = {};
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // 3. Process logs if present
    const rawLog = rawBody.rawLogContent;
    let parsedLogs = null;
    let confidenceScore = 1.0;
    let status: 'approved' | 'pending_review' | 'quarantined' = 'approved';

    if (rawLog && typeof rawLog === 'string' && rawLog.trim()) {
      parsedLogs = parseInferenceLogs(rawLog);
      if (parsedLogs) {
        confidenceScore = parsedLogs.confidenceScore;
        
        // Merge parsed data into the body, letting logs override or augment empty values
        rawBody.engine = rawBody.engine || parsedLogs.engine;
        rawBody.tokensPerSec = rawBody.tokensPerSec || parsedLogs.tokensPerSec;
        rawBody.promptTokensPerSec = rawBody.promptTokensPerSec || parsedLogs.promptTokensPerSec;
        rawBody.gpuModel = rawBody.gpuModel || parsedLogs.gpuModel;
        rawBody.gpuCount = rawBody.gpuCount || parsedLogs.gpuCount;
        rawBody.modelName = rawBody.modelName || parsedLogs.modelName;
        rawBody.modelQuant = rawBody.modelQuant || parsedLogs.modelQuant;
        rawBody.contextLength = rawBody.contextLength || parsedLogs.contextLength;
        rawBody.numThreads = rawBody.numThreads || parsedLogs.numThreads;
        rawBody.ngl = rawBody.ngl || parsedLogs.ngl;
        rawBody.flashAttention = rawBody.flashAttention !== undefined ? rawBody.flashAttention : parsedLogs.flashAttention;
        rawBody.mla = rawBody.mla !== undefined ? rawBody.mla : parsedLogs.mla;
        rawBody.chunkedPrefill = rawBody.chunkedPrefill !== undefined ? rawBody.chunkedPrefill : parsedLogs.chunkedPrefill;
        rawBody.speculativeMethod = rawBody.speculativeMethod || parsedLogs.speculativeMethod;
        rawBody.numSpeculativeTokens = rawBody.numSpeculativeTokens || parsedLogs.numSpeculativeTokens;
        rawBody.loadPrecision = rawBody.loadPrecision || parsedLogs.loadPrecision;
        rawBody.kvCacheDtypeK = rawBody.kvCacheDtypeK || parsedLogs.kvCacheDtypeK;
        rawBody.kvCacheDtypeV = rawBody.kvCacheDtypeV || parsedLogs.kvCacheDtypeV;
        rawBody.ubatchSize = rawBody.ubatchSize || parsedLogs.ubatchSize;
        rawBody.noMmap = rawBody.noMmap !== undefined ? rawBody.noMmap : parsedLogs.noMmap;
        rawBody.temperature = rawBody.temperature || parsedLogs.temperature;
        rawBody.topP = rawBody.topP || parsedLogs.topP;
        rawBody.topK = rawBody.topK || parsedLogs.topK;
        rawBody.minP = rawBody.minP || parsedLogs.minP;
        rawBody.ttftMs = rawBody.ttftMs || parsedLogs.ttftMs;
        rawBody.promptTokens = rawBody.promptTokens || parsedLogs.promptTokens;
        rawBody.generationTokens = rawBody.generationTokens || parsedLogs.generationTokens;

        // Apply automated quarantine trust gates (FEAT-012)
        if (confidenceScore >= 0.85) {
          status = 'approved';
        } else if (confidenceScore >= 0.70) {
          status = 'pending_review';
        } else {
          status = 'quarantined';
        }
      }
    } else {
      // If no logs are provided, quarantine the run by default as unverified
      confidenceScore = 0.0;
      status = 'quarantined';
    }

    // 4. Validate resolved fields with Zod
    const validationResult = benchmarkIngestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedInput = validationResult.data;

    // 5. Ingest using deduplication merge resolver
    const mergeResult = await processIncomingBenchmark(context.userId, {
      ...validatedInput,
      confidenceScore,
      status,
    });

    return NextResponse.json(
      {
        message: 'Benchmark processed successfully',
        status: mergeResult.status,
        id: mergeResult.id,
        hash: mergeResult.benchmarkHash,
        confidence: confidenceScore,
        moderation_status: status,
      },
      { status: mergeResult.status === 'inserted' ? 201 : 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to ingest benchmark:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
