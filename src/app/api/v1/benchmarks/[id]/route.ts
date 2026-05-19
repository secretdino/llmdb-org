import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../../db';
import { benchmarks, canonicalBenchmarks, users, gpuCanonicalNames, modelCanonicalNames, comments, upvotes } from '../../../../../db/schema';
import { authenticateRequest, getOrCreateMockUser } from '../../../../../utils/auth';
import { renderMarkdownToHtml } from '../../../../../utils/markdown';

/**
 * ============================================================================
 * ROUTE: /api/v1/benchmarks/:id
 * ============================================================================
 * 
 * - GET: Fetches timing and specs details for a specific benchmark run.
 * - PATCH: Updates narratives, tags, or performance metrics.
 * - DELETE: Soft-deletes a run (sets status to 'quarantined' to hide it).
 */

/**
 * GET /api/v1/benchmarks/:id
 * Retrieves precise specs details for an individual benchmark run.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const runId = params.id;
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required.' }, { status: 400 });
    }

    // Resolve user credentials context if available (to inspect owner-only quarantined drafts)
    const context = await authenticateRequest(req).catch(() => null);

    // Query record using explicit left joins
    const [run] = await db
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
        updatedAt: benchmarks.updatedAt,
        // Raw console logs for the detail drawer's log viewer
        rawLogContent: benchmarks.rawLogContent,
        authorId: benchmarks.authorId,
        
        // Joined details
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        canonicalGpuName: gpuCanonicalNames.canonicalName,
        canonicalModelName: modelCanonicalNames.canonicalName,
      })
      .from(benchmarks)
      .leftJoin(users, eq(benchmarks.authorId, users.id))
      .leftJoin(gpuCanonicalNames, eq(benchmarks.gpuModelId, gpuCanonicalNames.id))
      .leftJoin(modelCanonicalNames, eq(benchmarks.modelNameId, modelCanonicalNames.id))
      .where(eq(benchmarks.id, runId))
      .limit(1);

    if (!run) {
      return NextResponse.json({ error: 'Benchmark not found.' }, { status: 404 });
    }

    // Access control: quarantined runs can only be viewed by the original author or an admin
    const isQuarantined = run.status === 'quarantined';
    const isAuthorOrAdmin = context && (run.authorId === context.userId || context.role === 'admin');

    if (isQuarantined && !isAuthorOrAdmin) {
      return NextResponse.json({ error: 'Benchmark not found.' }, { status: 404 });
    }

    // Translate markdown notes block into clean static HTML structure on server side
    const renderedNarrative = renderMarkdownToHtml(run.narrative);

    // Query all comments for the benchmark run, joining author details
    const benchmarkComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        authorId: comments.authorId,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.benchmarkId, runId))
      .orderBy(comments.createdAt); // Chronological ascending comments flow

    // Check if the current authenticated user has already upvoted this benchmark (FEAT-006)
    let userVoted = false;
    if (context?.userId) {
      const [existingVote] = await db
        .select()
        .from(upvotes)
        .where(
          and(
            eq(upvotes.benchmarkId, runId),
            eq(upvotes.userId, context.userId)
          )
        )
        .limit(1);
      userVoted = !!existingVote;
    }

    return NextResponse.json(
      {
        benchmark: {
          ...run,
          renderedNarrative,
          comments: benchmarkComments,
          userVoted,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to query benchmark run details:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}


const benchmarkUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  narrative: z.string().optional(),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  tokensPerSec: z.number().positive().optional(),
  promptTokensPerSec: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Recalculates aggregates for a specific hash using all remaining active/approved runs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncCanonicalParent(tx: any, benchmarkHash: string) {
  const activeRuns = await tx.query.benchmarks.findMany({
    where: and(
      eq(benchmarks.benchmarkHash, benchmarkHash),
      eq(benchmarks.status, 'approved') // Only aggregate verified, approved runs
    ),
  });

  const parent = await tx.query.canonicalBenchmarks.findFirst({
    where: eq(canonicalBenchmarks.benchmarkHash, benchmarkHash),
  });

  if (!parent) return;

  if (activeRuns.length === 0) {
    // If no approved runs remain under this signature, delete parent aggregate
    await tx.delete(canonicalBenchmarks).where(eq(canonicalBenchmarks.id, parent.id));
  } else {
    // Recalculate aggregates
    const sampleRunCount = activeRuns.length;
    const totalGenTps = activeRuns.reduce((sum: number, r: { tokensPerSec: number }) => sum + r.tokensPerSec, 0);
    const minGenTps = Math.min(...activeRuns.map((r: { tokensPerSec: number }) => r.tokensPerSec));
    const maxGenTps = Math.max(...activeRuns.map((r: { tokensPerSec: number }) => r.tokensPerSec));
    
    const runsWithPrompt = activeRuns.filter((r: { promptTokensPerSec: number | null }) => r.promptTokensPerSec !== null);
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
      .where(eq(canonicalBenchmarks.id, parent.id));
  }
}

/**
 * PATCH /api/v1/benchmarks/:id
 * Updates specific columns of a benchmark.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const runId = params.id;
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required.' }, { status: 400 });
    }

    // Authenticate request context
    let context = await authenticateRequest(req);

    // Development auto-bootstrapping fallback
    if (!context) {
      const hasAuthHeader = req.headers.has('Authorization') || req.headers.has('X-Agent-API-Key');
      if (process.env.NODE_ENV !== 'production' && !hasAuthHeader) {
        context = await getOrCreateMockUser();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Authenticated session required.' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    let rawBody = {};
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const validationResult = benchmarkUpdateSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Execute in a transaction to guarantee aggregate integrity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedRun = await db.transaction(async (tx: any) => {
      // Find target record
      const run = await tx.query.benchmarks.findFirst({
        where: eq(benchmarks.id, runId),
      });

      if (!run) {
        throw new Error('NOT_FOUND');
      }

      // Authorization safeguard: Owner only (or admin)
      if (run.authorId !== context.userId && context.role !== 'admin') {
        throw new Error('FORBIDDEN');
      }

      // Update fields
      const [updated] = await tx
        .update(benchmarks)
        .set({
          title: updates.title !== undefined ? updates.title : run.title,
          narrative: updates.narrative !== undefined ? updates.narrative : run.narrative,
          sourceUrl: updates.sourceUrl !== undefined ? updates.sourceUrl : run.sourceUrl,
          tokensPerSec: updates.tokensPerSec !== undefined ? updates.tokensPerSec : run.tokensPerSec,
          promptTokensPerSec: updates.promptTokensPerSec !== undefined ? updates.promptTokensPerSec : run.promptTokensPerSec,
          tags: updates.tags !== undefined ? updates.tags : run.tags,
          updatedAt: new Date(),
        })
        .where(eq(benchmarks.id, runId))
        .returning();

      // If timings changed, sync the parent canonical aggregate metrics
      if (updates.tokensPerSec !== undefined || updates.promptTokensPerSec !== undefined) {
        await syncCanonicalParent(tx, run.benchmarkHash);
      }

      return updated;
    });

    return NextResponse.json({ message: 'Benchmark updated', benchmark: updatedRun }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Benchmark not found.' }, { status: 404 });
    }
    if (errorMsg === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Forbidden. You are not authorized to update this record.' },
        { status: 403 }
      );
    }
    console.error('Failed to update benchmark:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/benchmarks/:id
 * Performs soft-delete by quarantining the run.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const runId = params.id;
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required.' }, { status: 400 });
    }

    // Authenticate request context
    let context = await authenticateRequest(req);

    // Development auto-bootstrapping fallback
    if (!context) {
      const hasAuthHeader = req.headers.has('Authorization') || req.headers.has('X-Agent-API-Key');
      if (process.env.NODE_ENV !== 'production' && !hasAuthHeader) {
        context = await getOrCreateMockUser();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Authenticated session required.' },
          { status: 401 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.transaction(async (tx: any) => {
      // Find target record
      const run = await tx.query.benchmarks.findFirst({
        where: eq(benchmarks.id, runId),
      });

      if (!run) {
        throw new Error('NOT_FOUND');
      }

      // Authorization safeguard: Owner only (or admin)
      if (run.authorId !== context.userId && context.role !== 'admin') {
        throw new Error('FORBIDDEN');
      }

      // Soft delete: demote status to 'quarantined' to isolate it from catalogs
      await tx
        .update(benchmarks)
        .set({
          status: 'quarantined',
          canonicalBenchmarkId: null, // De-link from parent aggregate statistics
          updatedAt: new Date(),
        })
        .where(eq(benchmarks.id, runId));

      // Recalculate parent aggregates using remaining active runs
      await syncCanonicalParent(tx, run.benchmarkHash);
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Benchmark not found.' }, { status: 404 });
    }
    if (errorMsg === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Forbidden. You are not authorized to delete this record.' },
        { status: 403 }
      );
    }
    console.error('Failed to delete benchmark:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
