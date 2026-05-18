import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { db } from '../db';
import { apiKeys, users } from '../db/schema';
import { authOptions } from './authOptions';

/**
 * ============================================================================
 * CRYPTOGRAPHIC API KEY & SESSION AUTHENTICATION HELPER (FEAT-005)
 * ============================================================================
 * 
 * Manages secure API key verification using salted SHA-256 hashing.
 * Provides fallback mock authentication hooks for local testing and developer environments.
 */

// Secret cryptographic salt used to protect tokens at rest.
// MUST be set via environment variable in production — the fallback is dev-only.
const API_KEY_SALT = process.env.API_KEY_SALT || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('API_KEY_SALT environment variable is required in production.'); })()
    : 'llmdb_secure_fallback_salt_2026'
);

export interface AuthContext {
  userId: string;
  role: 'user' | 'moderator' | 'admin';
  email: string;
}

/**
 * Deterministically computes the SHA-256 hash of a key combined with our salt.
 */
export function hashApiKey(plaintextKey: string): string {
  return crypto
    .createHash('sha256')
    .update(plaintextKey + API_KEY_SALT)
    .digest('hex');
}

/**
 * Generates a cryptographically secure, high-entropy plaintext API key.
 * Returned only once to the client upon creation.
 */
export function generatePlaintextKey(): string {
  // 32 random bytes => 64 hex characters
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `llmdb_${randomBytes}`;
}

/**
 * Resolves or creates a development/mock user in the database.
 * Extremely useful for bootstrapping local tests before clerk/NextAuth configuration.
 */
export async function getOrCreateMockUser(
  email = 'dev-admin@llmdb.org',
  role: 'user' | 'moderator' | 'admin' = 'admin'
): Promise<AuthContext> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // If roles changed, update it to match the header request
    if (existingUser.role !== role) {
      await db.update(users).set({ role }).where(eq(users.id, existingUser.id));
      return { userId: existingUser.id, role, email };
    }
    return {
      userId: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
    };
  }

  // Create a brand new developer profile
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      displayName: email.split('@')[0],
      role,
    })
    .returning();

  return {
    userId: newUser.id,
    role: newUser.role,
    email: newUser.email,
  };
}

/**
 * Validates request authentication. Checks Bearer token and X-Agent-API-Key.
 * Backed by development mock overrides.
 */
export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  // 1. Authenticate using active NextAuth cookie-based session if present
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const user = session.user as {
      id?: string;
      role?: 'user' | 'moderator' | 'admin';
      email?: string | null;
    };
    if (user.id) {
      return {
        userId: user.id,
        role: user.role || 'user',
        email: user.email || '',
      };
    }
  }

  const headers = req.headers;

  // --------------------------------------------------------------------------
  // DEVELOPMENT MOCKING HOOKS
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const mockEmail = headers.get('X-Mock-User-Email');
    const mockRole = headers.get('X-Mock-User-Role') as 'user' | 'moderator' | 'admin' | null;
    
    if (mockEmail) {
      return await getOrCreateMockUser(mockEmail, mockRole || 'admin');
    }
  }

  // Extract keys from standard Bearer header or custom agent header
  let plaintextKey = '';
  const authHeader = headers.get('Authorization');
  const agentHeader = headers.get('X-Agent-API-Key');

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    plaintextKey = authHeader.substring(7).trim();
  } else if (agentHeader) {
    plaintextKey = agentHeader.trim();
  }

  if (!plaintextKey) {
    return null;
  }

  // Compute salted hash of the incoming key
  const targetHash = hashApiKey(plaintextKey);

  // Look up hashed token in the database
  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, targetHash),
  });

  if (!keyRecord) {
    return null;
  }

  // Load key owner details
  const owner = await db.query.users.findFirst({
    where: eq(users.id, keyRecord.userId),
  });

  if (!owner) {
    return null;
  }

  // Proactively update lastUsedAt timestamp in background (non-blocking)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id))
    .execute()
    .catch((err: Error) => {
      console.error('Failed to update API key lastUsedAt timestamp:', err);
    });

  return {
    userId: owner.id,
    role: owner.role,
    email: owner.email,
  };
}
