# Walkthrough — GPU VRAM Form Label Correction

## Summary
Corrected the GPU VRAM label in the benchmark upload form from "Total VRAM per Card" to "Total GPU VRAM" across all application languages (English, Spanish, German). This allows users who have multi-GPU setups or cards with different VRAM sizes to record the cumulative GPU VRAM accurately.

## Files Modified

### [src/i18n/en.json](file:///c:/git-secretdino/llmdb/src/i18n/en.json)
* Updated `"gpu_vram"` under the `"submit.form"` block:
  ```diff
  - "gpu_vram": "Total VRAM per Card",
  + "gpu_vram": "Total GPU VRAM",
  ```

### [src/i18n/es.json](file:///c:/git-secretdino/llmdb/src/i18n/es.json)
* Updated `"gpu_vram"` under the `"submit.form"` block:
  ```diff
  - "gpu_vram": "VRAM Total por Tarjeta",
  + "gpu_vram": "VRAM Total de GPU",
  ```

### [src/i18n/de.json](file:///c:/git-secretdino/llmdb/src/i18n/de.json)
* Updated `"gpu_vram"` under the `"submit.form"` block:
  ```diff
  - "gpu_vram": "VRAM pro Grafikkarte",
  + "gpu_vram": "Gesamter GPU-VRAM",
  ```

---

## Verification

### Build Verification
Ran full TypeScript static type compile check:
```bash
npx tsc --noEmit
```
* **Result**: `Exit code: 0` (Zero compiler errors). Confirmed that localized components map successfully without any regression.
