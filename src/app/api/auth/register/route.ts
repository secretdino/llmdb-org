import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * EMAIL & PASSWORD SELF-REGISTRATION ENDPOINT
 * ============================================================================
 * 
 * Processes incoming registration requests.
 * Hashes passwords securely at rest, and guards against duplicate emails.
 * Rate-limited to prevent brute-force registration spam.
 */

// ── Simple In-Memory Rate Limiter ────────────────────────────────────────
// Tracks IP → [timestamps] for a sliding window. Serverless-safe: each cold
// start gets a fresh map, so this is a best-effort defense layer.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;            // max 5 registrations per window
const rateLimitMap = new Map<string, number[]>();

/**
 * Returns true if the given IP has exceeded the rate limit.
 * Cleans up stale entries on each check to prevent memory growth.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Remove timestamps outside the sliding window
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Record this request
  recent.push(now);
  return false;
}

export async function POST(req: Request) {
  // Extract client IP from standard headers (Vercel sets x-forwarded-for)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // Enforce rate limit
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': '900' }, // 15 minutes in seconds
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' }, 
        { status: 400 }
      );
    }

    const { email, password, displayName } = body;

    // 1. Basic validation rules
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required.' }, 
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required.' }, 
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' }, 
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // 2. Duplication check
    const existingUserList = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUserList.length > 0) {
      return NextResponse.json(
        { error: 'This email address is already registered. Please sign in instead.' }, 
        { status: 400 }
      );
    }

    // 3. Salt and hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Provision new user profile in Drizzle
    const insertedUsers = await db
      .insert(users)
      .values({
        email: sanitizedEmail,
        displayName: displayName?.trim() || sanitizedEmail.split('@')[0],
        passwordHash,
        role: 'user', // Defaults to standard community credentials tier
      })
      .returning();

    const createdUser = insertedUsers[0];

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account registered successfully!', 
        user: { 
          id: createdUser.id, 
          email: createdUser.email,
          displayName: createdUser.displayName
        } 
      }, 
      { status: 201 }
    );
  } catch (err) {
    console.error('Self-registration API endpoint failure:', err);
    return NextResponse.json(
      { error: 'An unexpected database error occurred. Please try again later.' }, 
      { status: 500 }
    );
  }
}
