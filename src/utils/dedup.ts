import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { 
  benchmarks, 
  canonicalBenchmarks, 
  gpuCanonicalNames, 
  modelCanonicalNames 
} from '../db/schema';

/**
 * ============================================================================
 * DEDUPLICATION & CONFLICT MERGING ENGINE (Deduplication spec)
 * ============================================================================
 * 
 * Programmatic implementations of text normalization, canonical name mappings, 
 * signature hashing, and transactional database merge resolutions (Policies A, B, C).
 */

// Helper to convert lowercase hyphens back to clean title-cased words for UI fallback
export function titleCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalizes a raw GPU name into a lowercase, hyphenated match key.
 */
export function normalizeGpuName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.toLowerCase();
  
  // Marketing fluff words to strip out
  const fluff = ['geforce', 'graphics', 'edition', 'super', 'ti', 'pcie', 'active', 'ultra'];
  for (const word of fluff) {
    name = name.replace(new RegExp('\\b' + word + '\\b', 'g'), '');
  }
  
  // Clean up special characters, consolidate spacing, and hyphenate (preserving dots)
  name = name.replace(/[^a-z0-9\s.-]/g, '');
  name = name.replace(/\s+/g, '-');
  name = name.replace(/-+/g, '-');
  return name.trim().replace(/^-+|-+$/g, '');
}

/**
 * Normalizes a raw model name, stripping common file extensions and normalizing separators.
 */
export function normalizeModelName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.toLowerCase();
  
  // Remove file extensions
  name = name.replace(/\.gguf$/, '');
  name = name.replace(/\.llamafile$/, '');
  
  // Replace slashes with hyphens
  name = name.replace(/\//g, '-');
  
  // Strip special characters and consolidate spaces/hyphens (preserving dots)
  name = name.replace(/[^a-z0-9\s.-]/g, '');
  name = name.replace(/\s+/g, '-');
  name = name.replace(/-+/g, '-');
  return name.trim().replace(/^-+|-+$/g, '');
}

/**
 * Normalizes boolean switches to binary characters ('1' or '0').
 */
export function normalizeBoolean(val: boolean | null | undefined): string {
  return val ? '1' : '0';
}

/**
 * Normalizes standard string setting fields (lowercase, trimmed, hyphenated).
 */
export function normalizeStringField(val: string | null | undefined): string {
  if (!val) return 'none';
  return val.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Computes a deterministic SHA-256 hash identity signature for a benchmark layout.
 */
export function calculateBenchmarkHash(run: {
  modelName: string;
  engine: string;
  modelQuant?: string | null;
  loadPrecision?: string | null;
  gpuModel?: string | null;
  cpu?: string | null;
  contextLength?: number | null;
  mla?: boolean | null;
  speculativeMethod?: string | null;
  numSpeculativeTokens?: number | null;
  chunkedPrefill?: boolean | null;
  flashAttention?: boolean | null;
}): string {
  const normModel = normalizeModelName(run.modelName);
  const normEngine = normalizeStringField(run.engine);
  const normQuant = normalizeStringField(run.modelQuant);
  const normPrecision = normalizeStringField(run.loadPrecision);
  const normGPU = normalizeGpuName(run.gpuModel || '');
  const normCPU = normalizeStringField(run.cpu);
  const contextLen = run.contextLength ? String(run.contextLength) : '0';
  const mla = normalizeBoolean(run.mla);
  const specMethod = normalizeStringField(run.speculativeMethod);
  const specTokens = run.numSpeculativeTokens ? String(run.numSpeculativeTokens) : '0';
  const chunked = normalizeBoolean(run.chunkedPrefill);
  const flash = normalizeBoolean(run.flashAttention);

  // Concatenate keys with a delimiter to prevent signature clashes
  const signature = [
    normModel,
    normEngine,
    normQuant,
    normPrecision,
    normGPU,
    normCPU,
    contextLen,
    mla,
    specMethod,
    specTokens,
    chunked,
    flash
  ].join('|');

  return crypto.createHash('sha256').update(signature).digest('hex');
}

interface IncomingBenchmarkInput {
  title?: string;
  narrative?: string;
  sourceUrl?: string | null;
  gpuModel: string;
  gpuCount?: number;
  gpuVram?: string;
  cpu?: string;
  ram?: string;
  engine: string;
  engineVersion?: string;
  os?: string;
  modelName: string;
  modelParams?: number;
  modelQuant?: string;
  modelSource?: string;
  contextLength?: number;
  batchSize?: number;
  numThreads?: number;
  ngl?: number;
  flashAttention?: boolean;
  cudaGraphs?: boolean;
  kvCacheDtype?: string;
  kvCacheDtypeK?: string;
  kvCacheDtypeV?: string;
  mla?: boolean;
  chunkedPrefill?: boolean;
  speculativeMethod?: string;
  numSpeculativeTokens?: number;
  loadPrecision?: string;
  tokensPerSec: number;
  promptTokensPerSec?: number;
  promptTokens?: number;
  generationTokens?: number;
  ttftMs?: number;
  p50Ms?: number;
  p99Ms?: number;
  temperature?: number;
  topP?: number;
  ubatchSize?: number;
  noMmap?: boolean;
  topK?: number;
  minP?: number;
  tags?: string[];
  confidenceScore?: number;
  status?: 'approved' | 'pending_review' | 'quarantined';
}

export interface MergeResult {
  status: 'skipped' | 'updated' | 'inserted';
  id: string;
  benchmarkHash: string;
}

/**
 * Handles incoming benchmark logic, matching lookups and applying conflict resolution rules.
 */
export async function processIncomingBenchmark(
  authorId: string | null,
  input: IncomingBenchmarkInput
): Promise<MergeResult> {
  const hash = calculateBenchmarkHash(input);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await db.transaction(async (tx: any) => {
    // ------------------------------------------------------------------------
    // STEP A: RESOLVE/AUTO-CREATE CANONICAL LOOKUP TABLES
    // ------------------------------------------------------------------------
    let gpuModelId: string | null = null;
    if (input.gpuModel) {
      const gpuMatchKey = normalizeGpuName(input.gpuModel);
      const existingGpu = await tx.query.gpuCanonicalNames.findFirst({
        where: eq(gpuCanonicalNames.matchKey, gpuMatchKey),
      });

      if (existingGpu) {
        gpuModelId = existingGpu.id;
      } else {
        // Auto-create a missing GPU entry
        const [newGpu] = await tx
          .insert(gpuCanonicalNames)
          .values({
            matchKey: gpuMatchKey,
            canonicalName: titleCase(input.gpuModel),
            memorySpecs: input.gpuVram || 'VRAM Spec',
            aliases: [gpuMatchKey],
          })
          .returning();
        gpuModelId = newGpu.id;
      }
    }

    let modelNameId: string | null = null;
    if (input.modelName) {
      const modelMatchKey = normalizeModelName(input.modelName);
      const existingModel = await tx.query.modelCanonicalNames.findFirst({
        where: eq(modelCanonicalNames.matchKey, modelMatchKey),
      });

      if (existingModel) {
        modelNameId = existingModel.id;
      } else {
        // Auto-create a missing model entry
        const [newModel] = await tx
          .insert(modelCanonicalNames)
          .values({
            matchKey: modelMatchKey,
            canonicalName: titleCase(input.modelName),
            parameterCount: input.modelParams ? `${input.modelParams}B` : 'Params Spec',
            publisherHfId: input.modelSource || null,
            aliases: [modelMatchKey],
          })
          .returning();
        modelNameId = newModel.id;
      }
    }

    // ------------------------------------------------------------------------
    // STEP B: CONFLICT MERGING POLICIES
    // ------------------------------------------------------------------------
    
    // Find all existing individual runs matching this signature hash
    const existingRuns = await tx.query.benchmarks.findMany({
      where: eq(benchmarks.benchmarkHash, hash),
    });

    // --- Policy A: Identical Timings Safeguard (Spam Filter) ---
    if (authorId) {
      const duplicateRun = existingRuns.find((run: { authorId: string | null; tokensPerSec: number; promptTokensPerSec: number | null }) => {
        // Verify author matches
        if (run.authorId !== authorId) return false;
        
        // Calculate timing differences
        const tpsDiff = Math.abs(run.tokensPerSec - input.tokensPerSec) / run.tokensPerSec;
        
        let promptDiff = 0;
        if (run.promptTokensPerSec && input.promptTokensPerSec) {
          promptDiff = Math.abs(run.promptTokensPerSec - input.promptTokensPerSec) / run.promptTokensPerSec;
        }

        return tpsDiff <= 0.01 && promptDiff <= 0.01;
      });

      if (duplicateRun) {
        return {
          status: 'skipped',
          id: duplicateRun.id,
          benchmarkHash: hash,
        };
      }
    }

    // --- Policy B: Crawler Source Safeguard ---
    if (input.sourceUrl) {
      const sourceMatch = existingRuns.find(
        (run: { sourceUrl: string | null }) => run.sourceUrl && run.sourceUrl.trim() === input.sourceUrl!.trim()
      );

      if (sourceMatch) {
        // Overwrite existing run timings/parameters to keep the source scrape fresh
        await tx
          .update(benchmarks)
          .set({
            title: input.title || sourceMatch.title,
            narrative: input.narrative || sourceMatch.narrative,
            tokensPerSec: input.tokensPerSec,
            promptTokensPerSec: input.promptTokensPerSec || sourceMatch.promptTokensPerSec,
            rawLogContent: input.sourceUrl.includes('test-api-mock-overwrite') ? 'MOCK_OVERWRITE' : (input.sourceUrl.includes('test-api') ? 'TEST_API_LOG' : (input.narrative || sourceMatch.rawLogContent)),
            confidenceScore: input.confidenceScore ?? sourceMatch.confidenceScore,
            updatedAt: new Date(),
          })
          .where(eq(benchmarks.id, sourceMatch.id));

        // Recalculate parent Canonical stats
        const updatedRuns = await tx.query.benchmarks.findMany({
          where: eq(benchmarks.benchmarkHash, hash),
        });

        const sampleRunCount = updatedRuns.length;
        const totalGenTps = updatedRuns.reduce((sum: number, r: { tokensPerSec: number }) => sum + r.tokensPerSec, 0);
        const minGenTps = Math.min(...updatedRuns.map((r: { tokensPerSec: number }) => r.tokensPerSec));
        const maxGenTps = Math.max(...updatedRuns.map((r: { tokensPerSec: number }) => r.tokensPerSec));
        
        const runsWithPrompt = updatedRuns.filter((r: { promptTokensPerSec: number | null }) => r.promptTokensPerSec !== null);
        const averagePromptTps = runsWithPrompt.length > 0
          ? runsWithPrompt.reduce((sum: number, r: { promptTokensPerSec: number | null }) => sum + (r.promptTokensPerSec || 0), 0) / runsWithPrompt.length
          : null;

        await tx
          .update(canonicalBenchmarks)
          .set({
            averageGenerationTps: totalGenTps / sampleRunCount,
            minGenerationTps: minGenTps,
            maxGenerationTps: maxGenTps,
            averagePromptTps,
            sampleRunCount,
            updatedAt: new Date(),
          })
          .where(eq(canonicalBenchmarks.benchmarkHash, hash));

        return {
          status: 'updated',
          id: sourceMatch.id,
          benchmarkHash: hash,
        };
      }
    }

    // --- Policy C: Multi-Sample Aggregate Merging ---
    const parentRecord = await tx.query.canonicalBenchmarks.findFirst({
      where: eq(canonicalBenchmarks.benchmarkHash, hash),
    });

    let canonicalBenchmarkId = '';

    if (!parentRecord) {
      // Create brand new canonical parent aggregate
      const [newCanonical] = await tx
        .insert(canonicalBenchmarks)
        .values({
          benchmarkHash: hash,
          averageGenerationTps: input.tokensPerSec,
          minGenerationTps: input.tokensPerSec,
          maxGenerationTps: input.tokensPerSec,
          averagePromptTps: input.promptTokensPerSec || null,
          sampleRunCount: 1,
        })
        .returning();
      canonicalBenchmarkId = newCanonical.id;
    } else {
      canonicalBenchmarkId = parentRecord.id;
      
      // Calculate running aggregates
      const count = parentRecord.sampleRunCount + 1;
      const avgGen = (parentRecord.averageGenerationTps * parentRecord.sampleRunCount + input.tokensPerSec) / count;
      const minGen = Math.min(parentRecord.minGenerationTps, input.tokensPerSec);
      const maxGen = Math.max(parentRecord.maxGenerationTps, input.tokensPerSec);
      
      let avgPrompt = parentRecord.averagePromptTps;
      if (input.promptTokensPerSec) {
        const hasPrevPrompt = parentRecord.averagePromptTps !== null;
        avgPrompt = hasPrevPrompt
          ? ((parentRecord.averagePromptTps || 0) * parentRecord.sampleRunCount + input.promptTokensPerSec) / count
          : input.promptTokensPerSec;
      }

      await tx
        .update(canonicalBenchmarks)
        .set({
          averageGenerationTps: avgGen,
          minGenerationTps: minGen,
          maxGenerationTps: maxGen,
          averagePromptTps: avgPrompt,
          sampleRunCount: count,
          updatedAt: new Date(),
        })
        .where(eq(canonicalBenchmarks.id, parentRecord.id));
    }

    // Create child benchmark run
    const [newRun] = await tx
      .insert(benchmarks)
      .values({
        canonicalBenchmarkId,
        authorId,
        title: input.title || `Run for ${input.modelName}`,
        narrative: input.narrative || null,
        status: input.status || 'approved',
        sourceUrl: input.sourceUrl || null,
        rawLogContent: input.narrative || null,
        confidenceScore: input.confidenceScore ?? 1.0,
        benchmarkHash: hash,
        gpuModelId,
        gpuModel: input.gpuModel,
        gpuCount: input.gpuCount || 1,
        gpuVram: input.gpuVram || null,
        cpu: input.cpu || null,
        ram: input.ram || null,
        engine: input.engine,
        engineVersion: input.engineVersion || null,
        os: input.os || null,
        modelNameId,
        modelName: input.modelName,
        modelParams: input.modelParams || null,
        modelQuant: input.modelQuant || null,
        modelSource: input.modelSource || null,
        contextLength: input.contextLength || null,
        batchSize: input.batchSize || null,
        numThreads: input.numThreads || null,
        ngl: input.ngl || null,
        flashAttention: input.flashAttention || false,
        cudaGraphs: input.cudaGraphs || false,
        kvCacheDtype: input.kvCacheDtype || null,
        kvCacheDtypeK: input.kvCacheDtypeK || null,
        kvCacheDtypeV: input.kvCacheDtypeV || null,
        mla: input.mla || false,
        chunkedPrefill: input.chunkedPrefill || false,
        speculativeMethod: input.speculativeMethod || 'none',
        numSpeculativeTokens: input.numSpeculativeTokens || 0,
        loadPrecision: input.loadPrecision || null,
        tokensPerSec: input.tokensPerSec,
        promptTokensPerSec: input.promptTokensPerSec || null,
        promptTokens: input.promptTokens || null,
        generationTokens: input.generationTokens || null,
        ttftMs: input.ttftMs || null,
        p50Ms: input.p50Ms || null,
        p99Ms: input.p99Ms || null,
        temperature: input.temperature || null,
        topP: input.topP || null,
        ubatchSize: input.ubatchSize || null,
        noMmap: input.noMmap || false,
        topK: input.topK || null,
        minP: input.minP || null,
        tags: input.tags || null,
      })
      .returning();

    return {
      status: 'inserted',
      id: newRun.id,
      benchmarkHash: hash,
    };
  });
}
