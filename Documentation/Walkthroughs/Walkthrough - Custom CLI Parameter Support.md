# Walkthrough - Custom CLI Parameter Support

We have successfully fully implemented support for the new custom llama.cpp CLI parameters: Micro-batch size (`ubatchSize`), MMAP optimization disablement (`noMmap`), and the standard Sampling parameters (Temperature, Top-P, Top-K, Min-P). All modifications have been compiled and verified successfully.

---

## 🛠️ Summary of Changes

### 1. Internationalization Sync (`src/i18n/`)
- **[MODIFY] [de.json](file:///c:/git-secretdino/llmdb/src/i18n/de.json)**: Added German localized keys for `ubatch_size`, `no_mmap`, `temperature`, `top_p`, `top_k`, and `min_p` under both the `"dashboard.drawer"` and `"submit.form"` scopes.
- **[MODIFY] [en.json](file:///c:/git-secretdino/llmdb/src/i18n/en.json)**: Added English localized keys for the same parameters under `"dashboard.drawer"`.
- **[MODIFY] [es.json](file:///c:/git-secretdino/llmdb/src/i18n/es.json)**: Added Spanish localized keys for the same parameters under `"dashboard.drawer"`.

### 2. Form Submission Enhancements (`src/app/submit/page.tsx`)
- **State Integration**: Extended the `FormState` interface and defaults to support the new fields:
  - `ubatchSize` (string)
  - `noMmap` (boolean)
  - `temperature` (string)
  - `topP` (string)
  - `topK` (string)
  - `minP` (string)
- **Advanced Log Parser**: Hardened the client-side parsing regex inside the raw log copy-paste area:
  - Supports `--ubatch-size`, `--ubatch_size`
  - Supports `-fa [on|off|true|false|1|0]`
  - Supports `--no-mmap`, `--no_mmap`
  - Supports `--temp`, `--temperature`, `--top-p`, `--top-k`, `--min-p`
  - Properly matches separated KV Cache key and value precisions (`--cache-type-k`, `--cache-type-v`) and triggers active pulse highlight animations for all parsed parameters.
- **Form Controls UI**:
  - Embedded **Micro-Batch size** in a sleek, responsive 5-column layout inside the Advanced Settings grid.
  - Implemented the **Disable MMAP** checkbox switch in the Inferences Optimization row.
  - Crafted an elegant **Sampling Parameters configurations** grid for `Temperature`, `Top-P`, `Top-K`, and `Min-P`.
- **Payload API Mapping**: Ensured that the standard HTTP submit request payload safely parses and delivers integers, floats, and booleans for all 6 parameters.

### 3. Explore Drawer UI Sync (`src/app/page.tsx`)
- **Types definition**: Expanded the `BenchmarkItem` type schema.
- **Metadata Details rendering**:
  - Rendered `ubatchSize` next to the main Batch size label inside the Details drawer matrix when present.
  - Displayed `noMmap` status cleanly under the Optimization Toggles grid list.
  - Designed a premium, dedicated **Sampling Parameters** glassmorphic card section displaying `Temperature`, `Top-P`, `Top-K`, and `Min-P` values dynamically if active.

---

## 🧪 Verification & Compile Results

### 1. Build Compilation
We executed the Next.js production bundler verification locally:
```bash
npm run build
```
- **Result**: **SUCCESSFUL COMPILE** (`Exit code: 0`). Zero compilation, linting, or routing type checks issues. All dynamically rendered drawer and submission structures compiled perfectly under strict TypeScript modes.
