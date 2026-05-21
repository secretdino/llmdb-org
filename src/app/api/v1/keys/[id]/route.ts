import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db';
import { apiKeys } from '../../../../../db/schema';
import { authenticateRequest, getOrCreateMockUser } from '../../../../../utils/auth';

/**
 * ============================================================================
 * ROUTE: /api/v1/keys/:id
 * ============================================================================
 * 
 * - DELETE: Revokes (deletes) the specified API key.
 */

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required.' }, { status: 400 });
    }

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

    // Enforce role authorization: Only moderators and admins can manage API keys
    if (context.role !== 'admin' && context.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Forbidden. Only administrators and moderators can manage API keys.' },
        { status: 403 }
      );
    }

    // Find key in database
    const keyRecord = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, keyId),
    });

    if (!keyRecord) {
      return NextResponse.json({ error: 'API key not found.' }, { status: 404 });
    }

    // Authorization safeguard: Owner only (or administrators)
    if (keyRecord.userId !== context.userId && context.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. You do not own this API key.' },
        { status: 403 }
      );
    }

    // Revoke (hard delete) the API Key
    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to revoke API key:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { details: errorMsg } : {}) },
      { status: 500 }
    );
  }
}
