import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { benchmarks, upvotes } from '../../../../../../db/schema';
import { authenticateRequest } from '../../../../../../utils/auth';

/**
 * ============================================================================
 * ROUTE: /api/v1/benchmarks/:id/upvote
 * ============================================================================
 * 
 * - POST: Toggles a helpful upvote on a benchmark for the signed-in user.
 *         Ensures idempotency (one upvote per user) and atomically increments/decrements
 *         the denormalized counter in a database transaction.
 */

/**
 * POST /api/v1/benchmarks/:id/upvote
 * Toggles upvote on/off for the authenticated user session.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const benchmarkId = params.id;
    if (!benchmarkId) {
      return NextResponse.json({ error: 'Benchmark ID is required.' }, { status: 400 });
    }

    // Resolve user credentials authentication session
    const context = await authenticateRequest(req);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized. Authenticated session required.' },
        { status: 401 }
      );
    }

    // Execute the upvote toggle atomically in a database transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.transaction(async (tx: any) => {
      // 1. Verify the target benchmark exists
      const run = await tx.query.benchmarks.findFirst({
        where: eq(benchmarks.id, benchmarkId),
      });

      if (!run) {
        throw new Error('NOT_FOUND');
      }

      // 2. Check if this user has already upvoted this benchmark
      const existingVote = await tx.query.upvotes.findFirst({
        where: and(
          eq(upvotes.benchmarkId, benchmarkId),
          eq(upvotes.userId, context.userId)
        ),
      });

      let updatedCount = run.upvotes;

      if (existingVote) {
        // --- DECREMENT PATH ---
        // User already voted; toggle off by deleting the upvote record
        await tx
          .delete(upvotes)
          .where(eq(upvotes.id, existingVote.id));

        // Decrement the denormalized counter (ensuring it never drops below 0)
        updatedCount = Math.max(0, run.upvotes - 1);
        await tx
          .update(benchmarks)
          .set({ upvotes: updatedCount, updatedAt: new Date() })
          .where(eq(benchmarks.id, benchmarkId));

        return { upvotes: updatedCount, userVoted: false };
      } else {
        // --- INCREMENT PATH ---
        // User hasn't voted yet; toggle on by creating a new upvote record
        await tx
          .insert(upvotes)
          .values({
            benchmarkId,
            userId: context.userId,
          });

        // Increment the denormalized counter
        updatedCount = run.upvotes + 1;
        await tx
          .update(benchmarks)
          .set({ upvotes: updatedCount, updatedAt: new Date() })
          .where(eq(benchmarks.id, benchmarkId));

        return { upvotes: updatedCount, userVoted: true };
      }
    });

    return NextResponse.json(
      { upvotes: result.upvotes, user_voted: result.userVoted },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Benchmark not found.' }, { status: 404 });
    }

    console.error('Failed to toggle upvote:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
