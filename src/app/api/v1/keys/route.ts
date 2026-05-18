import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { authenticateRequest, getOrCreateMockUser, generatePlaintextKey, hashApiKey } from '../../../../utils/auth';

/**
 * ============================================================================
 * ROUTE: /api/v1/keys
 * ============================================================================
 * 
 * - POST: Generates a new cryptographically secure API key.
 * - GET: Retrieves a metadata list of active API keys for the user.
 */

/**
 * POST /api/v1/keys
 * Generates a new API key for the caller.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    // Authenticate request context
    let context = await authenticateRequest(req);

    // Development auto-bootstrapping fallback
    if (!context) {
      if (process.env.NODE_ENV !== 'production') {
        context = await getOrCreateMockUser();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Authenticated session required.' },
          { status: 401 }
        );
      }
    }

    // Parse request body parameters
    let body: { name?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional, default to empty name if parsing fails
    }

    const keyName = (body.name || 'Unnamed Agent Key').substring(0, 100);

    // Generate plaintext key and hash it
    const plaintextKey = generatePlaintextKey();
    const keyHash = hashApiKey(plaintextKey);

    // Persist hashed token in database
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        userId: context.userId,
        keyHash,
        name: keyName,
      })
      .returning();

    // Return plaintext key ONCE to the caller
    return NextResponse.json(
      {
        id: insertedKey.id,
        name: insertedKey.name,
        key: plaintextKey,
        created_at: insertedKey.createdAt,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to create API key:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/keys
 * Lists all active keys belonging to the authenticated user.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    // Authenticate request context
    let context = await authenticateRequest(req);

    // Development auto-bootstrapping fallback
    if (!context) {
      if (process.env.NODE_ENV !== 'production') {
        context = await getOrCreateMockUser();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Authenticated session required.' },
          { status: 401 }
        );
      }
    }

    // Fetch user keys, selecting metadata columns only (never returning hashes)
    const userKeys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, context.userId),
      columns: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json({ keys: userKeys }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to list API keys:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
