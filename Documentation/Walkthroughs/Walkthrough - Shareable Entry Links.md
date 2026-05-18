# Walkthrough - Shareable Entry Links & URL State Sync (Fixed)

We have successfully implemented shareable direct links for individual benchmark entries. When opening a benchmark details drawer, the browser URL query parameter `?run=id` is quietly synchronized. We resolved the sidebar flashing loop bug by switching from Next.js dynamic routing to standard browser History API state synchronization, completely preventing Next.js router from triggering Suspense unmount and remount sequences.

---

## 🛠️ Changes Implemented

### 1. Localization Dictionary Extensions
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

### 2. Client-Side State Synchronization (Suspense Loop Fix)
We updated the state synchronization hooks in the client entry point **[page.tsx](file:///c:/git-secretdino/llmdb/src/app/page.tsx)**:
* **HTML5 History API Sync**: When `activeBenchmarkId` changes, we quietly write to the browser address bar using `window.history.replaceState` instead of Next.js `router.replace`. Standard history state writes do not notify Next.js dynamic page navigation pipelines, meaning the `<Suspense>` boundary is **never triggered** and the component tree **never unmounts**. This resolves the flashing loop completely.
* **Initial Mount Loader**: On first page load, we check `window.location.search` for a `?run=uuid` parameter and set it as the initial benchmark ID, preserving shareable links and deep linking functionality.
* **History Navigation Listener**: A `popstate` event listener updates `activeBenchmarkId` whenever the user navigates through browser history (e.g., clicking Back or Forward), keeping the UI completely in sync with browser state.

### 3. Glassmorphic Share Button
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
-import {
-  Search,
-  Cpu,
-  Terminal,
-  Copy,
-  Plus,
-  RotateCcw,
-  ThumbsUp,
-  ExternalLink,
-  X,
-  Gauge,
-  Check,
-  BookOpen,
-  SlidersHorizontal,
-  LogOut,
-  LogIn,
-  Globe
-} from "lucide-react";
+import {
+  Search,
+  Cpu,
+  Terminal,
+  Copy,
+  Plus,
+  RotateCcw,
+  ThumbsUp,
+  ExternalLink,
+  X,
+  Gauge,
+  Check,
+  BookOpen,
+  SlidersHorizontal,
+  LogOut,
+  LogIn,
+  Globe,
+  Share2
+} from "lucide-react";
```

```diff
   const [copiedDocker, setCopiedDocker] = useState(false);
   const [copiedLogs, setCopiedLogs] = useState(false);
+  const [copiedShare, setCopiedShare] = useState(false);
   const [dockerEngine, setDockerEngine] = useState<"llama.cpp" | "vllm" | "ollama">("llama.cpp");
 
+  // Clipboard copy helper to generate a direct link using the active run parameter
+  const copyShareLink = () => {
+    if (typeof window === "undefined" || !activeBenchmarkId) return;
+    const shareUrl = `${window.location.origin}${pathname}?run=${activeBenchmarkId}`;
+    navigator.clipboard.writeText(shareUrl);
+    setCopiedShare(true);
+    setTimeout(() => setCopiedShare(false), 2000);
+  };
+
+  // Quietly synchronize activeBenchmarkId to the browser address bar as a query parameter (?run=id) using HTML5 History API
+  // This completely avoids Next.js App Router navigation triggers, preventing Suspense unmounting loops
+  useEffect(() => {
+    if (typeof window === "undefined") return;
+    const params = new URLSearchParams(window.location.search);
+    if (activeBenchmarkId) {
+      params.set("run", activeBenchmarkId);
+    } else {
+      params.delete("run");
+    }
+    const newQuery = params.toString();
+    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
+    window.history.replaceState(null, "", newUrl);
+  }, [activeBenchmarkId, pathname]);
+
+  // Read the initial run ID from the URL search parameters on mount only
+  useEffect(() => {
+    if (typeof window === "undefined") return;
+    const params = new URLSearchParams(window.location.search);
+    const runId = params.get("run");
+    if (runId) {
+      setActiveBenchmarkId(runId);
+    }
+  }, []);
+
+  // Listen for browser popstate events to synchronize state correctly during back/forward navigation
+  useEffect(() => {
+    if (typeof window === "undefined") return;
+    const handlePopState = () => {
+      const params = new URLSearchParams(window.location.search);
+      const runId = params.get("run");
+      setActiveBenchmarkId(runId);
+    };
+    window.addEventListener("popstate", handlePopState);
+    return () => window.removeEventListener("popstate", handlePopState);
+  }, []);
```

```diff
               <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-4" id="drawer_bottom_buttons">
                 {/* Social upvotes button */}
                 <button
                   id="btn_upvote_run"
                   onClick={() => triggerUpvote(benchmarkDetails.id)}
                   className="flex-1 py-2 text-xs font-bold text-white bg-surface-1 border border-zinc-800 hover:border-amber-500/25 hover:bg-surface-0 rounded-lg transition flex items-center justify-center gap-2"
                 >
                   <ThumbsUp className="w-4 h-4 text-accent-amber" />
                   {t("dashboard.drawer.helpful_submission")} ({benchmarkDetails.upvotes})
                 </button>
 
+                {/* Share Entry Button */}
+                <button
+                  id="btn_share_entry"
+                  onClick={copyShareLink}
+                  className="py-2 px-4 text-xs font-bold text-zinc-300 bg-surface-1/60 hover:bg-surface-1 border border-zinc-800 hover:text-white rounded-lg transition flex items-center justify-center gap-1.5"
+                >
+                  {copiedShare ? (
+                    <Check className="w-4 h-4 text-accent-teal animate-pulse" />
+                  ) : (
+                    <Share2 className="w-4 h-4 text-accent-amber" />
+                  )}
+                  {copiedShare ? t("dashboard.drawer.copied_link") : t("dashboard.drawer.share_entry")}
+                </button>
+
                 {/* External repository card anchor */}
                 {benchmarkDetails.modelSource && (
```
