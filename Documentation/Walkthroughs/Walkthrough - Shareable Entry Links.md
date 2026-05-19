# Walkthrough - Shareable Entry Links & URL State Sync (Fixed & Hardened)

We have successfully implemented shareable direct links for individual benchmark entries. When opening a benchmark details drawer, the browser URL query parameter `?run=id` is quietly synchronized. We resolved the sidebar flashing loop bug by switching from Next.js dynamic routing to standard browser History API state synchronization, completely preventing Next.js router from triggering Suspense unmount and remount sequences.

We have now **hardened** this state synchronization to resolve a first-render race condition where default filter initialization or initial active run state wiped out the deep-link parameter.

---

## 🛠️ Changes Implemented

### 1. State-Level Initialization (Race Condition Fix)
* **Root Cause**: Previously, `activeBenchmarkId` was initialized to `null`. On the very first render, before the mount `useEffect` could read `run` from the URL, the state-sync `useEffect` ran with `activeBenchmarkId === null` and immediately ran `params.delete("run")`, stripping the parameter from the URL.
* **Resolution**: Modified the state declaration of `activeBenchmarkId` inside **[page.tsx](file:///c:/git-secretdino/llmdb/src/app/page.tsx)** to initialize directly from `searchParams.get("run")`:
  ```typescript
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(searchParams.get("run"));
  ```
  This guarantees that on the very first render, the state is already correctly populated with the deep-linked run ID. The synchronization hooks recognize that it is set, preserving it without any deletion cycles. We removed the redundant mount `useEffect` completely.

### 2. Hardened Filter State URL Preservation
We modified the search/filter state synchronization effect inside **[page.tsx](file:///c:/git-secretdino/llmdb/src/app/page.tsx)**:
* **Starts from Active Query Parameters**: Instead of building query parameters from scratch (`const params = new URLSearchParams()`), the synchronization hook now starts from the active URL search parameters (`new URLSearchParams(window.location.search)`). This ensures that any non-filter query parameters (like `?run=id`) are **perfectly preserved** when filters initialize on mount or update.
* **Standardized History API**: Filter state sync now also uses `window.history.replaceState` instead of `router.replace`, which avoids Next.js dynamic page unmounting loops when changing filters.
* **Filtered List Fetches**: Catalog database requests (`fetchBenchmarks`) construct list filters without including the individual run detail parameter to optimize caching and DB execution.

### 3. Localization Dictionary Extensions
Added English, Spanish, and German translations for `share_entry` and `copied_link` keys to keep dynamic localization fully operational in the sliding drawer:
* **[en.json](file:///c:/git-secretdino/llmdb/src/i18n/en.json)**:
  - `"share_entry": "Share Entry"`
  - `"copied_link": "Link Copied!"`
* **[es.json](file:///c:/git-secretdino/llmdb/src/i18n/es.json)**:
  - `"share_entry": "Compartir entrada"`
  - `"copied_link": "¡Enlace copiado!"`
* **[de.json](file:///c:/git-secretdino/llmdb/src/i18n/de.json)**:
  - `"share_entry": "Eintrag teilen"`
  - `"copied_link": "Link kopiert!"`

### 4. Glassmorphic Share Button
Constructed a premium, responsive Share button right next to the Upvotes and Weights actions at the bottom of the details drawer.
* Uses the imported `Share2` icon from `lucide-react`.
* Triggers a clipboard write using the modern `navigator.clipboard.writeText` API to construct the full URL.
* Shows a micro-animated "Link Copied!" success check feedback indicator upon execution.
* Leverages DOM ID (`btn_share_entry`) to guarantee automated end-to-end testing stability.

---

## 🧪 Verification Results

### Production Compilation
* Executed the Next.js production build (`npm run build`) locally with full validation checks:
  ```powershell
  $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/llmdb"; $env:API_KEY_SALT="dummy_salt_value_at_least_32_characters"; $env:NEXTAUTH_SECRET="dummy_secret_value_at_least_32_characters"; $env:NEXTAUTH_URL="http://localhost:3000"; $env:GITHUB_ID="dummy_id"; $env:GITHUB_SECRET="dummy_secret"; npm run build
  ```
* **Status**: **PASSED successfully** (Exit code: 0).
* All route collections, type validations, and linter warnings succeeded.

---

## 🌟 Code Diffs

Here are the precise changes made to `src/app/page.tsx`:

```diff
   // Individual detail slide drawer states
-  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);
+  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(searchParams.get("run"));
```

```diff
   // URL-Shareable state synchronization: build path with parameters whenever filters update
   useEffect(() => {
-    const params = new URLSearchParams();
-    if (searchQuery) params.set("q", searchQuery);
-    if (selectedEngine && selectedEngine !== "all") params.set("engine", selectedEngine);
-    if (selectedQuant) params.set("quant", selectedQuant);
-    if (contextLengthFilter) params.set("context", contextLengthFilter);
-    if (minTpsFilter) params.set("min_tps", minTpsFilter);
-    if (selectedSort) params.set("sort", selectedSort);
-    if (selectedModel) params.set("model_name", selectedModel);
-    if (selectedGpu) params.set("gpu_model", selectedGpu);
-    if (selectedSpeculative) params.set("speculative_method", selectedSpeculative);
-    if (selectedVram) params.set("vram", selectedVram);
-
-    // Update browser URL query path quietly
-    const newQuery = params.toString();
-    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
-
-    // Trigger catalog refresh query
-    fetchBenchmarks(newQuery);
+    if (typeof window === "undefined") return;
+
+    // Start from window.location.search to preserve existing parameters (e.g. ?run=id)
+    const params = new URLSearchParams(window.location.search);
+
+    // Update or remove filter parameters based on current filter state
+    if (searchQuery) params.set("q", searchQuery); else params.delete("q");
+    if (selectedEngine && selectedEngine !== "all") params.set("engine", selectedEngine); else params.delete("engine");
+    if (selectedQuant) params.set("quant", selectedQuant); else params.delete("quant");
+    if (contextLengthFilter) params.set("context", contextLengthFilter); else params.delete("context");
+    if (minTpsFilter) params.set("min_tps", minTpsFilter); else params.delete("min_tps");
+    if (selectedSort) params.set("sort", selectedSort); else params.delete("sort");
+    if (selectedModel) params.set("model_name", selectedModel); else params.delete("model_name");
+    if (selectedGpu) params.set("gpu_model", selectedGpu); else params.delete("gpu_model");
+    if (selectedSpeculative) params.set("speculative_method", selectedSpeculative); else params.delete("speculative_method");
+    if (selectedVram) params.set("vram", selectedVram); else params.delete("vram");
+
+    // Update browser URL query path quietly using HTML5 History API to prevent Next.js unmounting loops
+    const newQuery = params.toString();
+    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
+    window.history.replaceState(null, "", newUrl);
+
+    // Trigger catalog refresh query (excluding the details run param)
+    const fetchParams = new URLSearchParams(params.toString());
+    fetchParams.delete("run");
+    fetchBenchmarks(fetchParams.toString());
   }, [
     searchQuery,
     selectedEngine,
@@ -261,8 +261,7 @@
     selectedGpu,
     selectedSpeculative,
     selectedVram,
-    pathname,
-    router
+    pathname
   ]);
```
