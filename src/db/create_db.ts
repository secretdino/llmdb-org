import { Client } from 'pg';

async function main() {
  console.log('⚡ Initializing Database builder...');
  
  // Connect to default 'postgres' database which always exists
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to default PostgreSQL database.');

    // Query all database names
    const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'llmdb'");
    
    if (res.rows.length === 0) {
      console.log('⚠️ Database "llmdb" not found. Creating database "llmdb"...');
      // Create 'llmdb' database
      await client.query('CREATE DATABASE llmdb');
      console.log('🎉 Database "llmdb" created successfully!');
    } else {
      console.log('✅ Database "llmdb" already exists.');
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to check/create database:', errorMsg);
  } finally {
    await client.end();
  }
}

main();
