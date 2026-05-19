import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { comments, users } from '../../../../../../db/schema';
import { authenticateRequest } from '../../../../../../utils/auth';

/**
 * ============================================================================
 * ROUTE: /api/v1/benchmarks/:id/comments
 * ============================================================================
 * 
 * - GET: Fetches chronologically ordered comments for a specific benchmark.
 * - POST: Allows logged-in users to submit a comment under the benchmark.
 */

// Zod schema to enforce comment text length validation
const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content cannot be empty.")
    .max(1000, "Comment cannot exceed 1000 characters."),
});

/**
 * GET /api/v1/benchmarks/:id/comments
 * Retrieves all comments for a benchmark run, joining author profiles.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const benchmarkId = params.id;
    if (!benchmarkId) {
      return NextResponse.json({ error: 'Benchmark ID is required.' }, { status: 400 });
    }

    // Query all comments for the benchmark with left joined user credentials details
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
      .where(eq(comments.benchmarkId, benchmarkId))
      .orderBy(comments.createdAt); // Ascending order maps perfectly to a chronological conversation flow

    return NextResponse.json({ comments: benchmarkComments }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to query comments:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/benchmarks/:id/comments
 * Submits a new comment for the benchmark. Requires standard NextAuth session credentials.
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

    // Safely parse JSON body payload
    let rawBody = {};
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Validate body payload against comment schema
    const validationResult = commentCreateSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Insert new comment record into PostgreSQL database
    const [newComment] = await db
      .insert(comments)
      .values({
        benchmarkId,
        authorId: context.userId,
        content,
      })
      .returning();

    // Query user profile details for immediate frontend response hydration
    const author = await db.query.users.findFirst({
      where: eq(users.id, context.userId),
    });

    return NextResponse.json(
      {
        comment: {
          ...newComment,
          authorName: author?.displayName || context.email.split('@')[0],
          authorAvatar: author?.avatarUrl || null,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to create comment:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
