# Walkthrough — Dual Weight and KV Cache Precision Splits

## Summary
Resolved clarity ambiguity concerning weight loading precision by splitting it into two separate, explicit free-text input fields instead of a single constrained dropdown on the benchmark upload page:
1. **Weight Load Precision** (`loadPrecision`): Allowing free-text entries like `fp16`, `bf16`, `fp8`, `int4`, etc.
2. **KV Cache Precision** (`kvCacheDtype`): Supporting custom KV cache layouts like `f16`, `q4_0`, `q8_0`, etc.

Additionally, both fields are now rendered dynamically in the dashboard catalog's master-detail drawer when they are populated.

## Files Modified

### [src/app/submit/page.tsx](file:///c:/git-secretdino/llmdb/src/app/submit/page.tsx)
* Expanded `FormState` and payload submission to support `kvCacheDtype`.
* Replaced the select/dropdown element for `load_precision` with a flexible, clean text input.
* Added a dedicated text input for `kv_cache_dtype`.

### [src/app/page.tsx](file:///c:/git-secretdino/llmdb/src/app/page.tsx)
* Added rendering support under the drawer's **Runtime Parameters** spec matrix for both `loadPrecision` and `kvCacheDtype`.

### [src/i18n/en.json](file:///c:/git-secretdino/llmdb/src/i18n/en.json) | [es.json](file:///c:/git-secretdino/llmdb/src/i18n/es.json) | [de.json](file:///c:/git-secretdino/llmdb/src/i18n/de.json)
* Updated localized strings for `load_precision` in form & drawer scopes.
* Added new translations for `kv_cache_dtype` in form & drawer scopes.
* Synchronized the publish button (`btn_publish`) copy across languages to standard "PUBLISH BENCHMARK" (EN), "PUBLICAR BENCHMARK" (ES), and "BENCHMARK VERÖFFENTLICHEN" (DE).

---

## Verification

### Static Compilation Check
Ran:
```bash
npx tsc --noEmit
```
* **Result**: `Exit code: 0` (Compilation success). No type check errors.
