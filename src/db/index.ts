import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * ============================================================================
 * DATABASE CLIENT & POOL INITIALIZATION (Dual-Driver Architecture)
 * ============================================================================
 * 
 * Supports two connection strategies controlled by the DB_DRIVER env var:
 * 
 *   DB_DRIVER=neon  →  Neon serverless HTTP driver (recommended for Vercel)
 *   DB_DRIVER=pg    →  Traditional pg Pool with persistent TCP connections
 * 
 * Defaults to 'pg' for local development, 'neon' for production on Vercel.
 * Reuses a single Pool/client instance across hot-reloads in development
 * to prevent connection exhaustion (a common Next.js fast-refresh issue).
 */

// Global type augmentation to cache the database instances in development
const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drizzleInstance: any | undefined;
};

// Extract database connection string from environment
const connectionString = process.env.DATABASE_URL;

// Validate critical env vars in production
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is not defined in production environment.');
}

/**
 * Determine which driver to use:
 * - Explicit DB_DRIVER env var takes priority
 * - Falls back to 'neon' in production, 'pg' in development
 */
const driverMode = process.env.DB_DRIVER || (process.env.NODE_ENV === 'production' ? 'neon' : 'pg');

/**
 * Initializes and returns the appropriate Drizzle ORM client.
 * Caches the instance globally to prevent duplicate connections during hot-reload.
 */
function createDrizzleClient() {
  // Return cached instance if available (prevents hot-reload leaks)
  if (globalForDb.drizzleInstance) {
    return globalForDb.drizzleInstance;
  }

  if (driverMode === 'neon') {
    // ── Neon Serverless HTTP Driver ──────────────────────────────────
    // Uses HTTP-based queries over fetch(), ideal for Vercel Edge/Serverless.
    // No persistent TCP connections — each query is a stateless HTTP request.
    neonConfig.fetchConnectionCache = true;

    const sql = neon(connectionString!);
    const client = drizzleNeonHttp(sql, { schema });

    // Cache in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.drizzleInstance = client;
    }

    console.log('[DB] Initialized with Neon HTTP driver');
    return client;
  } else {
    // ── Traditional pg Pool Driver ──────────────────────────────────
    // Uses persistent TCP connections via connection pooling.
    // Best for local development or self-hosted PostgreSQL instances.
    const pool = globalForDb.pgPool ?? new Pool({
      connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/llmdb',
      // Maximum pool connections active concurrently
      max: 15,
      // Automatically close connections that have been idle for more than 30s
      idleTimeoutMillis: 30000,
      // Maximum duration (2s) to wait for a connection before throwing a timeout
      connectionTimeoutMillis: 2000,
    });

    // Cache pool in global namespace for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.pgPool = pool;
    }

    const client = drizzleNodePg(pool, { schema });

    // Cache in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.drizzleInstance = client;
    }

    console.log('[DB] Initialized with pg Pool driver');
    return client;
  }
}

// Export the Drizzle ORM client instance
export const db = createDrizzleClient();
