import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * TEXT NORMALIZATION FUNCTIONS (Deduplication Engine Spec)
 * ============================================================================
 */

export function normalizeGpuName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.toLowerCase();
  
  const fluff = ['geforce', 'graphics', 'edition', 'super', 'ti', 'pcie', 'active', 'ultra'];
  for (const word of fluff) {
    name = name.replace(new RegExp('\\b' + word + '\\b', 'g'), '');
  }
  
  name = name.replace(/[^a-z0-9\s.-]/g, '');
  name = name.replace(/\s+/g, '-');
  name = name.replace(/-+/g, '-');
  return name.trim().replace(/^-+|-+$/g, '');
}

export function normalizeModelName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.toLowerCase();
  
  name = name.replace(/\.gguf$/, '');
  name = name.replace(/\.llamafile$/, '');
  name = name.replace(/\//g, '-');
  
  name = name.replace(/[^a-z0-9\s.-]/g, '');
  name = name.replace(/\s+/g, '-');
  name = name.replace(/-+/g, '-');
  return name.trim().replace(/^-+|-+$/g, '');
}

export function normalizeBoolean(val: boolean | null | undefined): string {
  return val ? '1' : '0';
}

export function normalizeStringField(val: string | null | undefined): string {
  if (!val) return 'none';
  return val.trim().toLowerCase().replace(/\s+/g, '-');
}

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

/**
 * Classifies a raw hardware string into clean components: GPU model, count, VRAM, and CPU.
 */
function classifyGpu(hardwareStr: string): { gpuModel: string; gpuCount: number; gpuVram: string; cpu: string } {
  let raw = hardwareStr.trim();
  
  // Extract GPU Count
  let gpuCount = 1;
  const countMatch = raw.match(/^(\d+)x\s+/i);
  if (countMatch) {
    gpuCount = parseInt(countMatch[1]);
    raw = raw.replace(/^(\d+)x\s+/i, '');
  } else if (raw.toLowerCase().startsWith('dual ')) {
    gpuCount = 2;
    raw = raw.replace(/^dual\s+/i, '');
  }
  
  // Extract VRAM details inside parenthesis
  let gpuVram = 'none';
  const vramMatch = raw.match(/\(([^)]*vram[^)]*|[^)]*ram[^)]*|[\d]+gb[^)]*)\)/i);
  if (vramMatch) {
    gpuVram = vramMatch[1].trim();
    raw = raw.replace(/\(([^)]*vram[^)]*|[^)]*ram[^)]*|[\d]+gb[^)]*)\)/i, '');
  }
  
  // Split GPU / CPU
  let gpuModel = '';
  let cpu = 'none';
  
  if (raw.includes('/')) {
    const parts = raw.split('/');
    const isFirstCpu = /ryzen|core|threadripper|intel\s+i\d|ultra/i.test(parts[0]);
    if (isFirstCpu) {
      cpu = parts[0].trim();
      gpuModel = parts[1].trim();
    } else {
      gpuModel = parts[0].trim();
      cpu = parts[1].trim();
    }
  } else {
    gpuModel = raw.trim();
  }
  
  gpuModel = gpuModel.replace(/\s+/g, ' ').trim();
  cpu = cpu.replace(/\s+/g, ' ').trim();
  
  // Normalize GPU model to canonical names
  const lowerGpu = gpuModel.toLowerCase();
  if (lowerGpu.includes('5090')) gpuModel = 'NVIDIA GeForce RTX 5090';
  else if (lowerGpu.includes('4090')) gpuModel = 'NVIDIA GeForce RTX 4090';
  else if (lowerGpu.includes('3090 ti')) gpuModel = 'NVIDIA GeForce RTX 3090 Ti';
  else if (lowerGpu.includes('3090')) gpuModel = 'NVIDIA GeForce RTX 3090';
  else if (lowerGpu.includes('4080 mobile')) gpuModel = 'NVIDIA GeForce RTX 4080 Mobile';
  else if (lowerGpu.includes('4080')) gpuModel = 'NVIDIA GeForce RTX 4080';
  else if (lowerGpu.includes('3080 ti')) gpuModel = 'NVIDIA GeForce RTX 3080 Ti';
  else if (lowerGpu.includes('7900 xtx') || lowerGpu.includes('7900xtx')) gpuModel = 'AMD Radeon RX 7900 XTX';
  else if (lowerGpu.includes('7600 xt') || lowerGpu.includes('7600xt')) gpuModel = 'AMD Radeon RX 7600 XT';
  else if (lowerGpu.includes('480')) gpuModel = 'AMD Radeon RX 480';
  else if (lowerGpu.includes('9700')) gpuModel = 'AMD Radeon AI Pro 9700';
  else if (lowerGpu.includes('8060s') || lowerGpu.includes('strix halo')) gpuModel = 'AMD Radeon 8060S (Strix Halo)';
  else if (lowerGpu.includes('b70')) gpuModel = 'Intel Arc Pro B70';
  else if (lowerGpu.includes('b580')) gpuModel = 'Intel Arc B580';
  else if (lowerGpu.includes('a770')) gpuModel = 'Intel Arc A770';
  
  return { gpuModel, gpuCount, gpuVram, cpu };
}

/**
 * ============================================================================
 * PROGRAMMATIC STARTING DATA PARSER
 * ============================================================================
 */

interface ParsedBenchmark {
  title: string;
  modelName: string;
  modelQuant: string;
  engine: string;
  rawHardware: string;
  tokensPerSec: number;
  narrative: string;
  mla: boolean;
  speculativeMethod: string;
  numSpeculativeTokens: number;
  chunkedPrefill: boolean;
  flashAttention: boolean;
  confidenceScore: number;
  sourceUrl: string;
}

function parseStartingDataMarkdown(): ParsedBenchmark[] {
  const filePath = path.join(process.cwd(), 'docs/starting_data.md');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Docs starting_data.md not found at ${filePath}!`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  // Split by heading: '### '
  const parts = content.split('\n### ');
  const parsedRuns: ParsedBenchmark[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const lines = chunk.split('\n');
    const title = lines[0].trim().replace(/\r$/, '');
    if (!title) continue;
    
    let modelName = '';
    let modelQuant = 'none';
    let engine = '';
    let rawHardware = '';
    let tokensPerSec = 0;
    let narrative = '';
    let mla = false;
    let speculativeMethod = 'none';
    let numSpeculativeTokens = 0;
    let chunkedPrefill = false;
    let flashAttention = false;
    let confidenceScore = 0.9;
    let sourceUrl = '';
    
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j].trim();
      
      const modelMatch = line.match(/\*\*\s*Model\s*\*\*:\s*`?([^`\r\n]+)`?/i);
      if (modelMatch) {
        modelName = modelMatch[1].trim();
        continue;
      }
      
      const quantMatch = line.match(/\*\*\s*Quantization\s*\*\*:\s*`?([^`\r\n]+)`?/i);
      if (quantMatch) {
        modelQuant = quantMatch[1].trim();
        continue;
      }
      
      const engineMatch = line.match(/\*\*\s*Engine\s*\*\*:\s*`?([^`\r\n]+)`?/i);
      if (engineMatch) {
        engine = engineMatch[1].trim();
        continue;
      }
      
      const hwMatch = line.match(/\*\*\s*Hardware\s*\*\*:\s*([^\r\n]+)/i);
      if (hwMatch) {
        rawHardware = hwMatch[1].trim();
        continue;
      }
      
      const perfMatch = line.match(/\*\*\s*Performance\s*\*\*:\s*\*\*([\d\.]+)\s*tokens\/sec\*\*(?:\s*\*\(([^)]+)\)\*)?/i);
      if (perfMatch) {
        tokensPerSec = parseFloat(perfMatch[1]);
        narrative = perfMatch[2] ? perfMatch[2].trim() : '';
        continue;
      }
      
      const toggleMatch = line.match(/\*\*\s*Optimization Toggles\s*\*\*:\s*([^\r\n]+)/i);
      if (toggleMatch) {
        const togglesStr = toggleMatch[1];
        const mlaVal = togglesStr.match(/mla\s*=\s*(true|false)/i);
        mla = mlaVal ? mlaVal[1].toLowerCase() === 'true' : false;
        
        const specVal = togglesStr.match(/speculative_method\s*=\s*`?([a-zA-Z0-9_-]+)`?/i);
        speculativeMethod = specVal ? specVal[1].trim() : 'none';
        
        const tokensVal = togglesStr.match(/num_speculative_tokens\s*=\s*(\d+)/i);
        numSpeculativeTokens = tokensVal ? parseInt(tokensVal[1]) : 0;
        
        const chunkedVal = togglesStr.match(/chunked_prefill\s*=\s*(true|false)/i);
        chunkedPrefill = chunkedVal ? chunkedVal[1].toLowerCase() === 'true' : false;
        
        const flashVal = togglesStr.match(/flash_attention\s*=\s*(true|false)/i);
        flashAttention = flashVal ? flashVal[1].toLowerCase() === 'true' : false;
        continue;
      }
      
      const trustMatch = line.match(/\*\*\s*Confidence Trust Rating\s*\*\*:\s*`?([\d\.]+)`?/i);
      if (trustMatch) {
        confidenceScore = parseFloat(trustMatch[1]);
        continue;
      }
      
      const sourceMatch = line.match(/\*\*\s*Original Source\s*\*\*:\s*(.+)/i);
      if (sourceMatch) {
        const sourceText = sourceMatch[1].trim();
        const urlMatch = sourceText.match(/\((https?:\/\/[^\r\n)]+)\)/);
        sourceUrl = urlMatch ? urlMatch[1].trim() : sourceText;
        continue;
      }
    }
    
    if (modelName && rawHardware && tokensPerSec > 0) {
      parsedRuns.push({
        title,
        modelName,
        modelQuant,
        engine,
        rawHardware,
        tokensPerSec,
        narrative,
        mla,
        speculativeMethod,
        numSpeculativeTokens,
        chunkedPrefill,
        flashAttention,
        confidenceScore,
        sourceUrl
      });
    }
  }
  
  return parsedRuns;
}

/**
 * ============================================================================
 * MAIN SEEDING PIPELINE
 * ============================================================================
 */

async function main() {
  console.log('🚀 Initiating Programmatic Markdown LLMDB Seeding Pipeline...\n');
  
  // Parse starting data from markdown
  const parsedRuns = parseStartingDataMarkdown();
  console.log(`📝 Loaded and parsed ${parsedRuns.length} benchmarks from docs/starting_data.md.`);
  
  if (parsedRuns.length === 0) {
    console.error('❌ No valid benchmarks parsed. Aborting seed pipeline.');
    return;
  }

  // Extract unique canonical models and GPUs
  const uniqueGpus = new Set<string>();
  const uniqueModels = new Set<string>();
  
  const mappedRuns = parsedRuns.map(run => {
    const { gpuModel, gpuCount, gpuVram, cpu } = classifyGpu(run.rawHardware);
    uniqueGpus.add(gpuModel);
    uniqueModels.add(run.modelName);
    
    return {
      ...run,
      gpuModel,
      gpuCount,
      gpuVram,
      cpu
    };
  });

  const gpuIdMap = new Map<string, string>();
  const modelIdMap = new Map<string, string>();

  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/llmdb';
  console.log(`🔌 Connecting to PostgreSQL Database at ${dbUrl.replace(/:([^:@]+)@/, ':****@')}...\n`);
  
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool, { schema });

  try {
    // 1. Insert Canonical GPUs dynamically
    console.log(`📦 Seeding ${uniqueGpus.size} Canonical GPUs dynamically...`);
    for (const rawGpu of uniqueGpus) {
      const matchKey = normalizeGpuName(rawGpu);
      let memorySpecs = 'unknown VRAM';
      
      const firstMatch = mappedRuns.find(r => r.gpuModel === rawGpu);
      if (firstMatch) {
        memorySpecs = firstMatch.gpuVram !== 'none' ? firstMatch.gpuVram : 'Standard memory';
      }
      
      const inserted = await db.insert(schema.gpuCanonicalNames)
        .values({
          matchKey,
          canonicalName: rawGpu,
          memorySpecs,
          aliases: [matchKey, rawGpu.toLowerCase()]
        })
        .onConflictDoUpdate({
          target: schema.gpuCanonicalNames.matchKey,
          set: {
            canonicalName: rawGpu,
            memorySpecs,
            aliases: [matchKey, rawGpu.toLowerCase()]
          }
        })
        .returning();

      gpuIdMap.set(matchKey, inserted[0].id);
    }
    console.log(`✅ GPU Canonical dictionary complete (${gpuIdMap.size} entries).`);

    // 2. Insert Canonical Models dynamically
    console.log(`\n📦 Seeding ${uniqueModels.size} Canonical Models dynamically...`);
    for (const rawModel of uniqueModels) {
      const matchKey = normalizeModelName(rawModel);
      const paramMatch = rawModel.match(/(\d+B)/i);
      const parameterCount = paramMatch ? paramMatch[1] : 'unknown';
      
      const inserted = await db.insert(schema.modelCanonicalNames)
        .values({
          matchKey,
          canonicalName: rawModel,
          parameterCount,
          publisherHfId: rawModel.includes('/') ? rawModel : `unspecified/${rawModel}`,
          aliases: [matchKey, rawModel.toLowerCase()]
        })
        .onConflictDoUpdate({
          target: schema.modelCanonicalNames.matchKey,
          set: {
            canonicalName: rawModel,
            parameterCount,
            publisherHfId: rawModel.includes('/') ? rawModel : `unspecified/${rawModel}`,
            aliases: [matchKey, rawModel.toLowerCase()]
          }
        })
        .returning();

      modelIdMap.set(matchKey, inserted[0].id);
    }
    console.log(`✅ Model Canonical dictionary complete (${modelIdMap.size} entries).`);

    // 3. Insert and aggregate parsed benchmarks
    console.log(`\n🧬 Processing and importing ${mappedRuns.length} starting baseline runs...`);
    
    // Find or create admin user for the seeding ownership.
    // In production, ADMIN_SEED_PASSWORD env var is REQUIRED to prevent weak default credentials.
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || (
      process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('ADMIN_SEED_PASSWORD environment variable is required to seed in production.'); })()
        : 'adminpass'
    );
    const adminUser = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@llmdb.org')).limit(1);
    let userId: string;
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    if (adminUser.length === 0) {
      const newUser = await db.insert(schema.users)
        .values({
          email: 'admin@llmdb.org',
          displayName: 'LLMDB System Admin',
          role: 'admin',
          passwordHash: adminPasswordHash
        })
        .returning();
      userId = newUser[0].id;
    } else {
      userId = adminUser[0].id;
      // Ensure admin has the correct password hash
      await db.update(schema.users)
        .set({ passwordHash: adminPasswordHash })
        .where(eq(schema.users.id, userId));
    }

    for (const run of mappedRuns) {
      const normalizedGpuKey = normalizeGpuName(run.gpuModel);
      const normalizedModelKey = normalizeModelName(run.modelName);
      
      const gpuId = gpuIdMap.get(normalizedGpuKey) || null;
      const modelId = modelIdMap.get(normalizedModelKey) || null;

      const hash = calculateBenchmarkHash(run);

      // Query database for existing aggregate with this hash signature
      const existingAggregates = await db.select()
        .from(schema.canonicalBenchmarks)
        .where(eq(schema.canonicalBenchmarks.benchmarkHash, hash));

      let canonicalId: string;

      if (existingAggregates.length > 0) {
        // Multi-sample aggregation update
        const existing = existingAggregates[0];
        const newCount = existing.sampleRunCount + 1;
        const newAverageGen = (existing.averageGenerationTps * existing.sampleRunCount + run.tokensPerSec) / newCount;
        const newMinGen = Math.min(existing.minGenerationTps, run.tokensPerSec);
        const newMaxGen = Math.max(existing.maxGenerationTps, run.tokensPerSec);

        const updated = await db.update(schema.canonicalBenchmarks)
          .set({
            sampleRunCount: newCount,
            averageGenerationTps: newAverageGen,
            minGenerationTps: newMinGen,
            maxGenerationTps: newMaxGen,
            updatedAt: new Date()
          })
          .where(eq(schema.canonicalBenchmarks.id, existing.id))
          .returning();

        canonicalId = updated[0].id;
      } else {
        // Initial insert of parent canonical benchmark record
        const inserted = await db.insert(schema.canonicalBenchmarks)
          .values({
            benchmarkHash: hash,
            averageGenerationTps: run.tokensPerSec,
            minGenerationTps: run.tokensPerSec,
            maxGenerationTps: run.tokensPerSec,
            sampleRunCount: 1
          })
          .returning();

        canonicalId = inserted[0].id;
      }

      let formattedNarrative = run.narrative || 'Hardware benchmark timing run.';
      formattedNarrative += `\n\n⚠️ *Note: This baseline benchmark data was programmatically compiled by an AI assistant from community forum summaries and may be incomplete. Always refer to the original linked source for full context and untruncated details.*`;
      if (run.sourceUrl) {
        formattedNarrative += `\n\nSource: ${run.sourceUrl}`;
      }

      // Insert child run linked to solved parent canonical benchmark
      await db.insert(schema.benchmarks)
        .values({
          canonicalBenchmarkId: canonicalId,
          authorId: userId,
          title: run.title,
          narrative: formattedNarrative,
          status: 'approved',
          sourceUrl: run.sourceUrl,
          confidenceScore: run.confidenceScore,
          benchmarkHash: hash,
          
          // Mapped Canonical Links
          gpuModelId: gpuId,
          modelNameId: modelId,
          
          // Hardware fields
          gpuModel: run.gpuModel,
          gpuCount: run.gpuCount,
          gpuVram: run.gpuVram,
          cpu: run.cpu,
          
          // Software fields
          engine: run.engine,
          engineVersion: 'parsed',
          
          // Model fields
          modelName: run.modelName,
          modelQuant: run.modelQuant,
          
          // Optimizations
          flashAttention: run.flashAttention,
          mla: run.mla,
          speculativeMethod: run.speculativeMethod,
          numSpeculativeTokens: run.numSpeculativeTokens,
          chunkedPrefill: run.chunkedPrefill,
          
          // Performance Metrics
          tokensPerSec: run.tokensPerSec,
          
          // Tags
          tags: run.speculativeMethod !== 'none' ? ['speculative', run.speculativeMethod] : ['baseline']
        });
    }

    console.log(`\n🎉 Live seeding finished successfully! All ${mappedRuns.length} parsed records saved in PostgreSQL.`);
  } catch (error) {
    console.error('\n❌ Database operation failed during live seeding:', error);
  } finally {
    await pool.end();
  }
}

// Execute the main pipeline
main().catch((err) => {
  console.error('💥 Fatal error in seeding wrapper:', err);
});
