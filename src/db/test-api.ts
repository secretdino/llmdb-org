import './mock-db';

import { eq } from 'drizzle-orm';
import { db } from './index';
import { benchmarks, canonicalBenchmarks, users, apiKeys } from './schema';

// Route imports
import { POST as createKey, GET as listKeys } from '../app/api/v1/keys/route';
import { DELETE as revokeKey } from '../app/api/v1/keys/[id]/route';
import { POST as ingestBenchmark } from '../app/api/v1/benchmarks/route';
import { PATCH as updateBenchmark, DELETE as deleteBenchmark } from '../app/api/v1/benchmarks/[id]/route';

/**
 * ============================================================================
 * AUTOMATED REST INTEGRATION TEST RUNNER (Phase 1.B Verification)
 * ============================================================================
 * 
 * Verifies all deliverables of Phase 1.B programmatically using synchronous 
 * function calls on App Router route handlers with standard Request objects.
 */

async function runTests() {
  console.log('============================================================');
  console.log('⚡ STARTING PHASE 1.B REST INTEGRATION TESTS');
  console.log('============================================================\n');

  try {
    // ------------------------------------------------------------------------
    // SETUP: Clear any existing test data to guarantee deterministic runs
    // ------------------------------------------------------------------------
    console.log('🧹 Cleaning database testing namespace...');
    
    // Delete benchmarks first due to foreign keys
    await db.delete(benchmarks).where(eq(benchmarks.gpuModel, 'NVIDIA RTX 4090 Test-Card'));
    
    // Clear mock tester user and any leftover keys
    const testUser = await db.query.users.findFirst({
      where: eq(users.email, 'tester@llmdb.org'),
    });
    if (testUser) {
      await db.delete(apiKeys).where(eq(apiKeys.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }

    console.log('✅ Namespace cleaned.\n');

    // ------------------------------------------------------------------------
    // TEST 1: API Key Generation (FEAT-005)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 1: API Key Generation & Listing');
    
    const keyReq = new Request('http://localhost/api/v1/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-User-Email': 'tester@llmdb.org',
        'X-Mock-User-Role': 'admin',
      },
      body: JSON.stringify({ name: 'Scraper Pipeline Key' }),
    });

    const keyRes = await createKey(keyReq);
    const keyData = await keyRes.json();

    if (keyRes.status !== 201 || !keyData.key || !keyData.id) {
      throw new Error(`TEST 1 Failed: Key creation returned status ${keyRes.status}`);
    }

    const plaintextKey = keyData.key;
    const keyId = keyData.id;
    console.log(`   - Successfully created API Key ID: ${keyId}`);
    console.log(`   - Plaintext Key: ${plaintextKey} (Visible once)`);

    // List user keys
    const listReq = new Request('http://localhost/api/v1/keys', {
      method: 'GET',
      headers: {
        'X-Mock-User-Email': 'tester@llmdb.org',
        'X-Mock-User-Role': 'admin',
      },
    });

    const listRes = await listKeys(listReq);
    const listData = await listRes.json();

    const createdKeyMeta = listData.keys.find((k: { id: string; keyHash?: string }) => k.id === keyId);
    if (!createdKeyMeta || createdKeyMeta.keyHash !== undefined) {
      throw new Error('TEST 1 Failed: Key listing returned hashed keys or is missing metadata.');
    }
    console.log('   - Successfully listed keys (Hashed keys excluded as per specs)');
    console.log('✅ TEST 1 passed.\n');

    // ------------------------------------------------------------------------
    // TEST 2: API Key Authentication (FEAT-005)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 2: API Key Authentication Gates');

    const invalidReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer llmdb_invalid_token_signature',
      },
      body: JSON.stringify({}),
    });

    const invalidRes = await ingestBenchmark(invalidReq);
    if (invalidRes.status !== 401) {
      throw new Error(`TEST 2 Failed: Unauthenticated request returned status ${invalidRes.status}`);
    }
    console.log('   - Confirmed 401 Unauthorized for invalid keys.');

    const validAuthReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 85.50,
      }),
    });

    const validAuthRes = await ingestBenchmark(validAuthReq);
    const validAuthData = await validAuthRes.json();
    if (validAuthRes.status !== 201) {
      throw new Error(`TEST 2 Failed: Valid API Key ingestion returned status ${validAuthRes.status}, details: ${JSON.stringify(validAuthData)}`);
    }
    console.log(`   - Confirmed 201 Created using Bearer API Key auth.`);
    console.log('✅ TEST 2 passed.\n');

    // ------------------------------------------------------------------------
    // TEST 3: Log Ingestion & Automated Quarantine (FEAT-016 & FEAT-012)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 3: Log Parsing & Trust Quarantine Gates');

    // A. High trust log (Approved status >= 0.85)
    const highTrustLog = `
      llama_model_loader: loaded model models/Meta-Llama-3-8B-Instruct.gguf
      system_info: n_threads = 8 / 16 | AVX = 1 | CUDA = 1 |
      llm_load_tensors: offloaded 32/32 layers to GPU
      llama_print_timings:     prompt eval time =     320.10 ms /    16 tokens (   49.98 t/s)
      llama_print_timings:          eval time =    4800.00 ms /   256 tokens (   53.33 t/s)
    `;

    const approvedReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        rawLogContent: highTrustLog,
      }),
    });

    const approvedRes = await ingestBenchmark(approvedReq);
    const approvedData = await approvedRes.json();

    if (approvedData.moderation_status !== 'approved' || approvedData.confidence < 0.85) {
      throw new Error(`TEST 3 Failed: High-confidence log quarantined. Status: ${approvedData.moderation_status}, Confidence: ${approvedData.confidence}`);
    }
    console.log(`   - Approved status verified for high-confidence logs (Confidence: ${approvedData.confidence})`);

    // B. Low trust log (Quarantined status < 0.70)
    const lowTrustReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 62.40,
        rawLogContent: 'Short invalid log', // Low confidence
      }),
    });

    const lowTrustRes = await ingestBenchmark(lowTrustReq);
    const lowTrustData = await lowTrustRes.json();

    if (lowTrustData.moderation_status !== 'quarantined') {
      throw new Error(`TEST 3 Failed: Low-confidence log was not quarantined. Status: ${lowTrustData.moderation_status}`);
    }
    console.log(`   - Quarantined status verified for low-confidence logs (Confidence: ${lowTrustData.confidence})`);
    console.log('✅ TEST 3 passed.\n');

    // ------------------------------------------------------------------------
    // TEST 4: Deduplication Merge Resolutions (Policies A, B, C)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 4: Deduplication Merge Engine (Policies A, B, C)');

    // Clear database namespace before TEST 4 to ensure exact, isolated count validation
    await db.delete(benchmarks).where(eq(benchmarks.gpuModel, 'NVIDIA RTX 4090 Test-Card'));
    await db.delete(canonicalBenchmarks);

    // Ingest baseline config run
    const baselineReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 100.0,
        promptTokensPerSec: 200.0,
        sourceUrl: 'https://reddit.com/r/LocalLLaMA/test-api-dedup',
        rawLogContent: highTrustLog,
      }),
    });
    const baselineRes = await ingestBenchmark(baselineReq);
    const baselineData = await baselineRes.json();

    const baselineId = baselineData.id;

    // --- Policy A: Spam Filter ---
    const spamReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 100.2, // Within 1% variation of 100.0
        promptTokensPerSec: 200.1, // Within 1% variation of 200.0
        rawLogContent: highTrustLog,
      }),
    });

    const spamRes = await ingestBenchmark(spamReq);
    const spamData = await spamRes.json();

    if (spamData.status !== 'skipped' || spamData.id !== baselineId) {
      throw new Error(`TEST 4 Failed (Policy A): Spam filter did not skip. Status: ${spamData.status}, ID: ${spamData.id}`);
    }
    console.log('   - Policy A (Spam Filter) passed: duplicate run skipped.');

    // --- Policy B: Source Safeguard ---
    const overwriteReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 110.0, // Different speed
        promptTokensPerSec: 220.0,
        sourceUrl: 'https://reddit.com/r/LocalLLaMA/test-api-dedup', // Exact same source
        rawLogContent: highTrustLog,
      }),
    });

    const overwriteRes = await ingestBenchmark(overwriteReq);
    const overwriteData = await overwriteRes.json();

    if (overwriteData.status !== 'updated' || overwriteData.id !== baselineId) {
      throw new Error(`TEST 4 Failed (Policy B): Source safeguard did not update existing run. Status: ${overwriteData.status}, ID: ${overwriteData.id}`);
    }
    console.log('   - Policy B (Source Safeguard) passed: existing source run overwritten.');

    // --- Policy C: Multi-Sample Aggregate Merging ---
    const mergeReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 120.0, // Different speed
        promptTokensPerSec: 240.0,
        sourceUrl: 'https://reddit.com/r/LocalLLaMA/test-api-another-run', // Different source
        rawLogContent: highTrustLog,
      }),
    });

    const mergeRes = await ingestBenchmark(mergeReq);
    const mergeData = await mergeRes.json();

    if (mergeData.status !== 'inserted' || mergeData.id === baselineId) {
      throw new Error(`TEST 4 Failed (Policy C): Multi-sample did not insert a new child run. Status: ${mergeData.status}`);
    }

    // Verify parent Canonical averages are aggregated correctly
    const canonical = await db.query.canonicalBenchmarks.findFirst({
      where: eq(canonicalBenchmarks.benchmarkHash, baselineData.hash),
    });

    if (!canonical || canonical.sampleRunCount !== 2) {
      throw new Error(`TEST 4 Failed (Policy C): Aggregates not synced. Sample count: ${canonical?.sampleRunCount}`);
    }

    // Averages: Run 1 (updated) tps = 110.0, Run 2 tps = 120.0 => Avg = 115.0
    if (Math.abs(canonical.averageGenerationTps - 115.0) > 0.01) {
      throw new Error(`TEST 4 Failed (Policy C): Generation average mismatch. Expected 115.0, got ${canonical.averageGenerationTps}`);
    }

    console.log('   - Policy C (Multi-Sample Merge) passed: parent average recalculated to 115.0 t/s.');
    console.log('✅ TEST 4 passed.\n');

    // ------------------------------------------------------------------------
    // TEST 5: Benchmark Management (PATCH & DELETE)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 5: Benchmark Management (PATCH & DELETE)');

    // PATCH update
    const patchReq = new Request(`http://localhost/api/v1/benchmarks/${baselineId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        title: 'Updated Test Title',
        tokensPerSec: 90.0, // Change timing which triggers sync
      }),
    });

    const patchRes = await updateBenchmark(patchReq, { params: { id: baselineId } });
    const patchData = await patchRes.json();

    if (patchRes.status !== 200 || patchData.benchmark.title !== 'Updated Test Title') {
      throw new Error(`TEST 5 Failed (PATCH): Title did not update. Status: ${patchRes.status}`);
    }

    // Assert aggregate updated (Run 1 tps = 90.0, Run 2 tps = 120.0 => Avg = 105.0)
    const canonicalAfterPatch = await db.query.canonicalBenchmarks.findFirst({
      where: eq(canonicalBenchmarks.benchmarkHash, baselineData.hash),
    });
    if (Math.abs(canonicalAfterPatch!.averageGenerationTps - 105.0) > 0.01) {
      throw new Error(`TEST 5 Failed (PATCH): Stats not synced. Expected 105.0, got ${canonicalAfterPatch?.averageGenerationTps}`);
    }
    console.log('   - Successfully PATCH updated benchmark titles and aggregated parent averages to 105.0 t/s.');

    // DELETE soft-delete
    const deleteReq = new Request(`http://localhost/api/v1/benchmarks/${baselineId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${plaintextKey}`,
      },
    });

    const deleteRes = await deleteBenchmark(deleteReq, { params: { id: baselineId } });
    const deleteData = await deleteRes.json();

    if (deleteRes.status !== 200 || !deleteData.deleted) {
      throw new Error(`TEST 5 Failed (DELETE): Soft-delete returned status ${deleteRes.status}`);
    }

    // Verify run is quarantined (soft-deleted) and de-linked
    const runAfterDelete = await db.query.benchmarks.findFirst({
      where: eq(benchmarks.id, baselineId),
    });

    if (runAfterDelete?.status !== 'quarantined' || runAfterDelete?.canonicalBenchmarkId !== null) {
      throw new Error('TEST 5 Failed (DELETE): Record was not quarantined or de-linked.');
    }

    // Verify parent Canonical averages aggregated down using remaining active runs (Only Run 2 remains => Avg = 120.0, sample = 1)
    const canonicalAfterDelete = await db.query.canonicalBenchmarks.findFirst({
      where: eq(canonicalBenchmarks.benchmarkHash, baselineData.hash),
    });

    if (canonicalAfterDelete!.sampleRunCount !== 1 || Math.abs(canonicalAfterDelete!.averageGenerationTps - 120.0) > 0.01) {
      throw new Error(`TEST 5 Failed (DELETE): Parent aggregates not synced. Sample: ${canonicalAfterDelete?.sampleRunCount}, Avg: ${canonicalAfterDelete?.averageGenerationTps}`);
    }

    console.log('   - Successfully DELETE soft-deleted benchmark, de-linked parent, and aggregated averages to 120.0 t/s.');
    console.log('✅ TEST 5 passed.\n');

    // ------------------------------------------------------------------------
    // TEST 6: Key Revocation (FEAT-005)
    // ------------------------------------------------------------------------
    console.log('🧪 TEST 6: API Key Revocation');

    const revokeReq = new Request(`http://localhost/api/v1/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'X-Mock-User-Email': 'tester@llmdb.org',
        'X-Mock-User-Role': 'admin',
      },
    });

    const revokeRes = await revokeKey(revokeReq, { params: { id: keyId } });
    const revokeData = await revokeRes.json();

    if (revokeRes.status !== 200 || !revokeData.deleted) {
      throw new Error(`TEST 6 Failed: Revocation returned status ${revokeRes.status}`);
    }
    console.log('   - Confirmed key revocation deletion response.');

    // Try posting again with the revoked key
    const postWithRevokedReq = new Request('http://localhost/api/v1/benchmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plaintextKey}`,
      },
      body: JSON.stringify({
        gpuModel: 'NVIDIA RTX 4090 Test-Card',
        gpuCount: 1,
        gpuVram: '24GB',
        engine: 'vLLM',
        modelName: 'Meta-Llama-3-8B-Instruct-Test',
        tokensPerSec: 50.0,
      }),
    });

    const postWithRevokedRes = await ingestBenchmark(postWithRevokedReq);
    if (postWithRevokedRes.status !== 401) {
      throw new Error(`TEST 6 Failed: Ingestion with revoked API key returned status ${postWithRevokedRes.status} instead of 401`);
    }

    console.log('   - Confirmed 401 Unauthorized for revoked API key.');
    console.log('✅ TEST 6 passed.\n');

    // ------------------------------------------------------------------------
    // TEARDOWN: Clean up mock records to leave database in a clean state
    // ------------------------------------------------------------------------
    console.log('🧹 Cleaning up database mock testing profiles...');
    await db.delete(benchmarks).where(eq(benchmarks.gpuModel, 'NVIDIA RTX 4090 Test-Card'));
    await db.delete(users).where(eq(users.email, 'tester@llmdb.org'));
    console.log('✅ Teardown complete.\n');

    console.log('============================================================');
    console.log('🎉 🎉 ALL REST INTEGRATION TESTS PASSED 100% CORRECTLY!');
    console.log('============================================================');
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && 'cause' in err) {
      console.error('Cause:', (err as Error & { cause?: unknown }).cause);
    }
    
    // Attempt cleanup even after crash
    await db.delete(benchmarks).where(eq(benchmarks.gpuModel, 'NVIDIA RTX 4090 Test-Card')).catch(() => {});
    await db.delete(users).where(eq(users.email, 'tester@llmdb.org')).catch(() => {});
    
    process.exit(1);
  } finally {
    // Exit process gracefully so Node can terminate
    process.exit(0);
  }
}

// Execute test suite
runTests();
