import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle ORM Configuration File
 * Configures Drizzle Kit for schema migrations, prototyping, and CLI management.
 */
export default defineConfig({
  // Path to our single-file or multi-file schema declarations
  schema: './src/db/schema.ts',
  
  // Destination directory where SQL migration files will be generated
  out: './src/db/migrations',
  
  // Database engine dialect (PostgreSQL is our target standard)
  dialect: 'postgresql',
  
  // Connection details pointing to our database
  dbCredentials: {
    // Falls back to standard local credentials if no environmental URI is set
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/llmdb',
  },
});
