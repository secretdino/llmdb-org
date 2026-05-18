/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import Module from 'module';
import { newDb } from 'pg-mem';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import realPg from 'pg';

// 1. Initialize pg-mem in-memory PostgreSQL engine
const dbMem = newDb();

// Register gen_random_uuid() mock
dbMem.public.registerFunction({
  name: 'gen_random_uuid',
  returns: 'uuid' as any,
  impure: true,
  implementation: () => {
    const u = crypto.randomUUID();
    console.log('DEBUG gen_random_uuid called, returning:', u);
    return u;
  },
});

// Create pg-compatible Pool and Client
const { Pool: MemPool, Client: MemClient } = dbMem.adapters.createPg();

// Expose dummy getTypeParser on both prototypes to satisfy Drizzle ORM and pg-mem's driver adapter
(MemPool.prototype as any).getTypeParser = (oid: number, format?: string) => (val: any) => val;
(MemClient.prototype as any).getTypeParser = (oid: number, format?: string) => (val: any) => val;

const originalQuery = MemClient.prototype.query;
MemClient.prototype.query = function (this: any, ...args: any[]) {
  const queryObj = args[0];
  let isRowModeArray = false;
  
  if (queryObj && typeof queryObj === 'object') {
    if (queryObj.types) {
      delete queryObj.types;
    }
    if (queryObj.rowMode === 'array') {
      isRowModeArray = true;
      delete queryObj.rowMode;
    }
  }
  
  const resultPromise = originalQuery.apply(this, args as any);
  
  if (isRowModeArray && resultPromise && typeof resultPromise.then === 'function') {
    return resultPromise.then((result: any) => {
      if (result && Array.isArray(result.rows)) {
        let fieldNames = Array.isArray(result.fields) ? result.fields.map((f: any) => f.name) : [];
        if (fieldNames.length === 0 && result.rows.length > 0 && result.rows[0] && typeof result.rows[0] === 'object') {
          fieldNames = Object.keys(result.rows[0]);
        }
        result.rows = result.rows.map((row: any) => {
          return fieldNames.map((name: string) => row[name]);
        });
      }
      return result;
    });
  }
  
  return resultPromise;
};

// 2. Intercept require('pg') globally before anything else loads
const originalRequire = Module.prototype.require;

// Make sure real pg types has a fallback getTypeParser
if (realPg && realPg.types) {
  (realPg.types as any).getTypeParser = (oid: number, format?: string) => (val: any) => val;
}

Module.prototype.require = function (...args: any[]) {
  const id = args[0];
  if (id === 'pg') {
    return {
      ...realPg,
      Pool: MemPool,
      Client: MemClient,
    };
  }
  return originalRequire.apply(this, args as any);
};

// 3. Load migration DDL statements into pg-mem
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

for (const file of migrationFiles) {
  const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  const statements = migrationSql.split('--> statement-breakpoint');
  for (const stmt of statements) {
    if (stmt.trim()) {
      dbMem.public.none(stmt);
    }
  }
}

console.log('✅ In-Memory PostgreSQL engine loaded and require("pg") successfully hijacked.');
export { dbMem };
