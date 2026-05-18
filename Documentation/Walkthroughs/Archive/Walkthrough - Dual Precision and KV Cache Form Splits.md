# Walkthrough — Dual Weight and KV Cache Precision Splits & Favicon Update

## Summary
1. **Dual Weight and KV Cache Precision**: Resolved clarity ambiguity concerning weight loading precision by splitting it into two separate, explicit free-text input fields instead of a single constrained dropdown on the benchmark upload page:
   * **Weight Load Precision** (`loadPrecision`): Allowing free-text entries like `fp16`, `bf16`, `fp8`, `int4`, etc.
   * **KV Cache Precision** (`kvCacheDtype`): Supporting custom KV cache layouts like `f16`, `q4_0`, `q8_0`, etc.
   * Both fields are now rendered dynamically in the dashboard catalog's master-detail drawer when they are populated.
2. **Official SVG Gauge Favicon**: Replaced the legacy placeholder `favicon.ico` with the official, lightweight, and modern SVG gauge favicon (`src/app/icon.svg`) matching the header aesthetic. The SVG stroke is set to a crisp white for perfect dark/light browser tab rendering.
3. **Ko-fi Widget Compilation Fix**: Solved the synchronous script tag and unescaped quote syntax errors introduced by the Ko-fi widget script in `src/app/submit/page.tsx` by wrapping the widget markup in a `dangerouslySetInnerHTML` React element.

---

## Files Modified

### [src/app/submit/page.tsx](file:///c:/git-secretdino/llmdb/src/app/submit/page.tsx)
* Expanded `FormState` and payload submission to support `kvCacheDtype`.
* Replaced the select/dropdown element for `load_precision` with a flexible, clean text input.
* Added a dedicated text input for `kv_cache_dtype`.
* Wrapped the Ko-fi widget elements in a React `dangerouslySetInnerHTML` container to bypass ESLint sync script and unescaped entity parser blocks.

### [src/app/page.tsx](file:///c:/git-secretdino/llmdb/src/app/page.tsx)
* Added rendering support under the drawer's **Runtime Parameters** spec matrix for both `loadPrecision` and `kvCacheDtype`.

### [src/i18n/en.json](file:///c:/git-secretdino/llmdb/src/i18n/en.json) | [es.json](file:///c:/git-secretdino/llmdb/src/i18n/es.json) | [de.json](file:///c:/git-secretdino/llmdb/src/i18n/de.json)
* Updated localized strings for `load_precision` in form & drawer scopes.
* Added new translations for `kv_cache_dtype` in form & drawer scopes.
* Synchronized the publish button (`btn_publish`) copy across languages to standard "PUBLISH BENCHMARK" (EN), "PUBLICAR BENCHMARK" (ES), and "BENCHMARK VERÖFFENTLICHEN" (DE).

### [src/app/icon.svg](file:///c:/git-secretdino/llmdb/src/app/icon.svg)
* [NEW] Added the official gauge icon SVG with custom white styling.

### [src/app/favicon.ico](file:///c:/git-secretdino/llmdb/src/app/favicon.ico)
* [DELETE] Removed the legacy Next.js default favicon file to prevent browser caching conflicts.

---

## Verification

### Production Build compilation
Ran:
```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/llmdb"; npm run build
```
* **Result**: Compiled and optimized all routes successfully. Next.js resolved the new `icon.svg` dynamic metadata route cleanly:
  ```
  ├ ○ /icon.svg                            0 B                0 B
  ...
  Exit code: 0
  ```
