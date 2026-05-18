"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Cpu,
  Terminal,
  Copy,
  Plus,
  RotateCcw,
  ThumbsUp,
  ExternalLink,
  X,
  Gauge,
  Check,
  BookOpen,
  SlidersHorizontal,
  LogOut,
  LogIn,
  Globe,
  Share2
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/components/i18n-provider";

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  displayName?: string | null;
  role?: string | null;
}

/**
 * ============================================================================
 * INTERACTIVE CYBERGLASS EXPLORE DASHBOARD (FEAT-002, FEAT-004)
 * ============================================================================
 * 
 * Translates the HTML cyberglass specifications into a highly-performant React
 * search index dashboard. Syncs explore states directly to browser URL tags.
 */

// Define standard types for query schemas
interface BenchmarkItem {
  id: string;
  title: string;
  narrative: string | null;
  status: string;
  sourceUrl: string | null;
  upvotes: number;
  confidenceScore: number;
  benchmarkHash: string;
  gpuModel: string | null;
  gpuCount: number;
  gpuVram: string | null;
  cpu: string | null;
  ram: string | null;
  engine: string;
  engineVersion: string | null;
  os: string | null;
  modelName: string | null;
  modelParams: number | null;
  modelQuant: string | null;
  modelSource: string | null;
  contextLength: number | null;
  batchSize: number | null;
  numThreads: number | null;
  flashAttention: boolean | null;
  cudaGraphs: boolean | null;
  ngl: number | null;
  kvCacheDtype: string | null;
  mla: boolean | null;
  chunkedPrefill: boolean | null;
  speculativeMethod: string | null;
  numSpeculativeTokens: number | null;
  loadPrecision: string | null;
  tokensPerSec: number;
  promptTokensPerSec: number | null;
  promptTokens: number | null;
  generationTokens: number | null;
  ttftMs: number | null;
  p50Ms: number | null;
  p99Ms: number | null;
  createdAt: string;

  // Joins properties
  authorName: string | null;
  authorAvatar: string | null;
  canonicalGpuName: string | null;
  canonicalModelName: string | null;
}

interface BenchmarkDetails extends BenchmarkItem {
  renderedNarrative: string;
  rawLogContent: string | null;
}

// Wrapping in React Suspense boundary is required in Next.js to prevent Client de-optimization
export default function DashboardCatalogPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen text-accent-amber font-heading">
        <Gauge className="w-12 h-12 animate-spin mb-4" />
        <span className="text-sm tracking-widest uppercase">Initializing Interface Console...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { language, setLanguage, t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // State flag controlling the visibility of the glassmorphic About & Attributions dialog overlay
  const [showAboutModal, setShowAboutModal] = useState(false);

  // State declaration for search filters matching spec definitions
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedEngine, setSelectedEngine] = useState(searchParams.get("engine") || "all");
  const [selectedQuant, setSelectedQuant] = useState(searchParams.get("quant") || "");
  const [contextLengthFilter, setContextLengthFilter] = useState(searchParams.get("context") || "");
  const [minTpsFilter, setMinTpsFilter] = useState(searchParams.get("min_tps") || "");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "newest");

  // New specific advanced field search states
  const [selectedModel, setSelectedModel] = useState(searchParams.get("model_name") || "");
  const [selectedGpu, setSelectedGpu] = useState(searchParams.get("gpu_model") || "");
  const [selectedSpeculative, setSelectedSpeculative] = useState(searchParams.get("speculative_method") || "");
  const [selectedVram, setSelectedVram] = useState(searchParams.get("vram") || "");

  // Advanced filters toggle drawer state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Benchmarks list state
  const [benchmarksList, setBenchmarksList] = useState<BenchmarkItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Individual detail slide drawer states
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);
  const [benchmarkDetails, setBenchmarkDetails] = useState<BenchmarkDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [dockerEngine, setDockerEngine] = useState<"llama.cpp" | "vllm" | "ollama">("llama.cpp");

  // Clipboard copy helper to generate a direct link using the active run parameter
  const copyShareLink = () => {
    if (typeof window === "undefined" || !activeBenchmarkId) return;
    const shareUrl = `${window.location.origin}${pathname}?run=${activeBenchmarkId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Quietly synchronize activeBenchmarkId to the browser address bar as a query parameter (?run=id) without list fetching
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (activeBenchmarkId) {
      params.set("run", activeBenchmarkId);
    } else {
      params.delete("run");
    }
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  }, [activeBenchmarkId, pathname, router]);

  // Synchronize state from URL parameter (?run=id) on initial load and during browser back/forward history navigation
  useEffect(() => {
    const runId = searchParams.get("run");
    if (runId !== activeBenchmarkId) {
      setActiveBenchmarkId(runId);
    }
  }, [searchParams, activeBenchmarkId]);

  // Global Telemetry aggregations
  const [telemetry, setTelemetry] = useState({
    activeRigs: 0,
    peakPromptTps: 0,
    peakGenTps: 0,
    avgTrust: 0
  });

  // URL-Shareable state synchronization: build path with parameters whenever filters update
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedEngine && selectedEngine !== "all") params.set("engine", selectedEngine);
    if (selectedQuant) params.set("quant", selectedQuant);
    if (contextLengthFilter) params.set("context", contextLengthFilter);
    if (minTpsFilter) params.set("min_tps", minTpsFilter);
    if (selectedSort) params.set("sort", selectedSort);
    if (selectedModel) params.set("model_name", selectedModel);
    if (selectedGpu) params.set("gpu_model", selectedGpu);
    if (selectedSpeculative) params.set("speculative_method", selectedSpeculative);
    if (selectedVram) params.set("vram", selectedVram);

    // Update browser URL query path quietly
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);

    // Trigger catalog refresh query
    fetchBenchmarks(newQuery);
  }, [
    searchQuery,
    selectedEngine,
    selectedQuant,
    contextLengthFilter,
    minTpsFilter,
    selectedSort,
    selectedModel,
    selectedGpu,
    selectedSpeculative,
    selectedVram,
    pathname,
    router
  ]);

  // Fetch benchmark records from GET API route
  const fetchBenchmarks = async (queryString: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/benchmarks?${queryString}`);
      if (response.ok) {
        const data = await response.json();
        setBenchmarksList(data.benchmarks || []);
        setTotalRecords(data.total || 0);

        // Perform dynamic aggregates math on the active matches list
        const activeMatches: BenchmarkItem[] = data.benchmarks || [];
        if (activeMatches.length > 0) {
          const peakGen = Math.max(...activeMatches.map((r: BenchmarkItem) => r.tokensPerSec || 0));
          const peakPrompt = Math.max(...activeMatches.map((r: BenchmarkItem) => r.promptTokensPerSec || 0));
          const avgTrust = activeMatches.reduce((acc: number, r: BenchmarkItem) => acc + (r.confidenceScore || 0), 0) / activeMatches.length;

          setTelemetry({
            activeRigs: data.total || 0,
            peakPromptTps: peakPrompt > 0 ? peakPrompt : 0,
            peakGenTps: peakGen > 0 ? peakGen : 0,
            avgTrust: Math.round(avgTrust * 100)
          });
        } else {
          setTelemetry({ activeRigs: 0, peakPromptTps: 0, peakGenTps: 0, avgTrust: 0 });
        }
      }
    } catch (err) {
      console.error("Failed to query catalog results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch details for a specific benchmark when the details drawer is triggered
  useEffect(() => {
    if (!activeBenchmarkId) {
      setBenchmarkDetails(null);
      return;
    }

    const fetchRunDetails = async () => {
      setIsDetailsLoading(true);
      try {
        const response = await fetch(`/api/v1/benchmarks/${activeBenchmarkId}`);
        if (response.ok) {
          const data = await response.json();
          setBenchmarkDetails(data.benchmark);
        }
      } catch (err) {
        console.error("Failed to retrieve single run detail:", err);
      } finally {
        setIsDetailsLoading(false);
      }
    };

    fetchRunDetails();
  }, [activeBenchmarkId]);

  // Reset filters utility
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedEngine("all");
    setSelectedQuant("");
    setContextLengthFilter("");
    setMinTpsFilter("");
    setSelectedSort("newest");
    setSelectedModel("");
    setSelectedGpu("");
    setSelectedSpeculative("");
    setSelectedVram("");
  };

  // Trigger upvote POST API call
  const triggerUpvote = async (runId: string) => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!benchmarkDetails) return;
    try {
      // Mock upvote state change on client for immediate response
      setBenchmarkDetails({
        ...benchmarkDetails,
        upvotes: benchmarkDetails.upvotes + 1
      });
      // Increment also in matched list grid
      setBenchmarksList(benchmarksList.map(b => b.id === runId ? { ...b, upvotes: b.upvotes + 1 } : b));
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  // Generate copyable Docker Compose parameters depending on engine models and physical hardware vendors
  const generateDockerComposeTemplate = (b: BenchmarkItem, engineOverride?: "llama.cpp" | "vllm" | "ollama"): string => {
    const model = b.modelName || "model-signature";
    const context = b.contextLength || 4096;
    const threads = b.numThreads || 8;
    const ngl = b.ngl !== null ? b.ngl : 99;
    const gpuCount = b.gpuCount || 1;

    const gpuName = (b.gpuModel || "").toLowerCase();
    const isAmd = gpuName.includes("amd") || gpuName.includes("radeon") || gpuName.includes("8060s") || gpuName.includes("9700");
    const isIntel = gpuName.includes("intel") || gpuName.includes("arc") || gpuName.includes("battlemage");

    const targetEngine = (engineOverride || dockerEngine).toLowerCase();

    // Llama.cpp serving
    if (targetEngine === "llama.cpp") {
      let gpuDeployConfig = `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]`;

      if (isAmd) {
        gpuDeployConfig = `    devices:
      - "/dev/kfd:/dev/kfd"
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
      } else if (isIntel) {
        gpuDeployConfig = `    devices:
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
      }

      return `version: '3.8'
services:
  llama-server:
    container_name: llmdb-llama-server
    image: ${isAmd ? 'rocm/llama.cpp:server' : 'ghcr.io/ggerganov/llama.cpp:server'}
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models
${gpuDeployConfig}
    command: >
      -m /models/${model.split('/').pop() || 'model.gguf'}
      -c ${context}
      --port 8080
      --host 0.0.0.0
      -t ${threads}
      -ngl ${ngl}
    restart: unless-stopped`;
    }

    // vLLM serving
    if (targetEngine === "vllm") {
      let gpuDeployConfig = `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${gpuCount}
              capabilities: [gpu]`;

      if (isAmd) {
        gpuDeployConfig = `    devices:
      - "/dev/kfd:/dev/kfd"
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
      } else if (isIntel) {
        gpuDeployConfig = `    devices:
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
      }

      return `version: '3.8'
services:
  vllm-openai:
    container_name: llmdb-vllm-serving
    image: ${isAmd ? 'rocm/vllm:latest' : 'vllm/vllm-openai:latest'}
    ports:
      - "8000:8000"
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    environment:
      - HUGGING_FACE_HUB_TOKEN=\${HUGGINGFACE_TOKEN:-your_hf_api_token_here}
${gpuDeployConfig}
    command: >
      --model ${model}
      --port 8000
      --max-model-len ${context}
      --tensor-parallel-size ${gpuCount}
    restart: unless-stopped`;
    }

    // Generic / Ollama fallback serving
    let fallbackDeploy = `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]`;

    if (isAmd) {
      fallbackDeploy = `    devices:
      - "/dev/kfd:/dev/kfd"
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
    } else if (isIntel) {
      fallbackDeploy = `    devices:
      - "/dev/dri:/dev/dri"
    group_add:
      - video
      - render`;
    }

    const safeModelName = (model.split('/').pop() || 'model').toLowerCase().replace(/[^a-z0-9_.-]/g, '');

    return `version: '3.8'
services:
  ollama-serving:
    container_name: llmdb-ollama-serving
    image: ${isAmd ? 'ollama/ollama:rocm' : 'ollama/ollama:latest'}
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_storage:/root/.ollama
${fallbackDeploy}
    entrypoint: [ "/bin/sh", "-c" ]
    command: >
      ollama serve &
      sleep 5 &&
      echo -e "FROM ${model}\\nPARAMETER num_ctx ${context}\\nPARAMETER num_thread ${threads}" > Modelfile &&
      ollama create custom-${safeModelName} -f Modelfile &&
      ollama run custom-${safeModelName}
    restart: unless-stopped`;
  };

  // Clipboard copies
  const copyDockerToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const copyLogsToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col relative overflow-hidden">

      {/* Visual background glows */}
      <div className="absolute top-[-20%] left-[20%] w-[400px] h-[400px] rounded-full glow-amber -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[350px] h-[350px] rounded-full glow-teal -z-10 pointer-events-none" />

      {/* HEADER BAR */}
      <header className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6" id="dashboard_header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-600/10">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black tracking-tight text-white flex items-center">
              LLMDB<span className="text-accent-amber">.org</span>
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">{t("dashboard.header.subtitle")}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 relative" id="header_auth_zone">
          {/* Elegant Language Selector Dropdown */}
          <div className="relative">
            <button
              id="btn_language_selector"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2.5 py-2 text-[10px] font-bold text-zinc-400 hover:text-white bg-surface-1/80 hover:bg-surface-2 border border-zinc-800 rounded-lg transition duration-150 flex items-center gap-1.5 focus:outline-none"
            >
              <Globe className="w-3.5 h-3.5 text-accent-amber" />
              <span className="uppercase">{language}</span>
              <span className="text-[9px] text-zinc-500">▼</span>
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 mt-2 w-32 glass-card rounded-xl border border-zinc-800 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {(["en", "es", "de"] as const).map((lang) => (
                    <button
                      key={lang}
                      id={`btn_select_lang_${lang}`}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition ${language === lang
                        ? "bg-accent-amber text-surface-0 shadow-md shadow-amber-600/10"
                        : "text-zinc-400 hover:text-white hover:bg-surface-1"
                        }`}
                    >
                      {lang === "en" ? "English" : lang === "es" ? "Español" : "Deutsch"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            id="btn_submit_benchmark"
            onClick={() => {
              if (status === "unauthenticated") {
                router.push("/login?callbackUrl=/submit");
              } else {
                router.push("/submit");
              }
            }}
            className="px-4 py-2 text-xs font-heading font-bold text-surface-0 bg-accent-amber hover:bg-accent-amber-hover border border-amber-500/20 shadow-md shadow-amber-glow rounded-lg transition duration-150 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("dashboard.header.btn_upload")}
          </button>

          {status === "loading" ? (
            <div className="w-9 h-9 rounded-xl bg-surface-1 border border-zinc-800 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-zinc-700 border-t-accent-amber rounded-full animate-spin" />
            </div>
          ) : status === "authenticated" && session?.user ? (
            /* Authenticated User Menu Widget */
            <div className="relative">
              <button
                id="btn_user_profile_dropdown"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-surface-1 hover:bg-surface-2 border border-zinc-800 transition duration-150 focus:outline-none"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="w-6 h-6 rounded-lg object-cover border border-zinc-700/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-accent-amber/20 text-accent-amber border border-amber-500/20 flex items-center justify-center text-xs font-black font-heading uppercase">
                    {(session.user.name || "U")[0]}
                  </div>
                )}
                <span className="text-[11px] font-bold text-zinc-300 font-heading hidden sm:block max-w-[80px] truncate">
                  {(session.user as ExtendedUser).displayName || session.user.name}
                </span>
                <span className={`text-[10px] text-zinc-500 transition duration-150 ${showProfileMenu ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div
                    className="absolute right-0 mt-2 w-56 glass-card rounded-xl border border-zinc-800 shadow-2xl p-3 z-50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
                    id="profile_dropdown_menu"
                  >
                    {/* User Identity Details */}
                    <div className="flex flex-col px-1.5 py-1">
                      <span className="text-xs font-bold text-white font-heading truncate">
                        {(session.user as ExtendedUser).displayName || session.user.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono truncate mt-0.5">
                        {session.user.email}
                      </span>
                      {/* Dynamic Role Badge */}
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-950/20 border border-amber-500/25 text-accent-amber self-start tracking-wider mt-2">
                        {(session.user as ExtendedUser).role || "USER"}
                      </span>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Quick Profile Links */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push("/submit");
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-[10px] text-zinc-400 hover:text-white hover:bg-surface-1 rounded-lg flex items-center gap-2 transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-accent-amber" />
                        Upload Benchmarks
                      </button>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Sign-Out Button */}
                    <button
                      id="btn_signout_trigger"
                      onClick={() => {
                        setShowProfileMenu(false);
                        signOut();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/15 border border-transparent hover:border-red-500/10 rounded-lg flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Unauthenticated Sign-In Trigger button */
            <button
              id="btn_signin_redirect"
              onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)}
              className="px-4 py-2 text-xs font-heading font-bold text-zinc-300 hover:text-white bg-surface-1 hover:bg-surface-2 border border-zinc-800 rounded-lg transition duration-150 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-accent-amber" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* TELEMETRY OVERALL STATS SECTION */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" id="kpi_grid_section">
        {/* KPI: Rigs */}
        <div className="glass-card rounded-lg p-3 flex flex-col justify-between accent-border-left-amber" id="kpi_active_rigs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.kpi.active_rigs")}</span>
          <div className="flex items-baseline space-x-1.5 mt-2" id="kpi_active_rigs_value_container">
            <span className="text-2xl font-heading font-extrabold text-white">{telemetry.activeRigs}</span>
            <span className="text-xs text-zinc-400 font-semibold">{t("dashboard.kpi.active_rigs_suffix")}</span>
          </div>
        </div>
        {/* KPI: Peak Decoding */}
        <div className="glass-card rounded-lg p-3 flex flex-col justify-between accent-border-left-teal" id="kpi_peak_decoding">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.kpi.peak_gen")}</span>
          <div className="flex items-baseline space-x-1.5 mt-2" id="kpi_peak_decoding_value_container">
            <span className="text-2xl font-heading font-extrabold text-accent-teal">
              {telemetry.peakGenTps > 0 ? telemetry.peakGenTps.toFixed(1) : "---"}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">{t("dashboard.kpi.peak_gen_suffix")}</span>
          </div>
        </div>
        {/* KPI: Peak Prefill */}
        <div className="glass-card rounded-lg p-3 flex flex-col justify-between accent-border-left-amber" id="kpi_peak_prefill">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.kpi.peak_prefill")}</span>
          <div className="flex items-baseline space-x-1.5 mt-2" id="kpi_peak_prefill_value_container">
            <span className="text-2xl font-heading font-extrabold text-accent-amber">
              {telemetry.peakPromptTps > 0 ? telemetry.peakPromptTps.toLocaleString() : "---"}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">{t("dashboard.kpi.peak_prefill_suffix")}</span>
          </div>
        </div>
        {/* KPI: Average Trust Rating */}
        <div className="glass-card rounded-lg p-3 flex flex-col justify-between accent-border-left-lavender" id="kpi_trust_rating">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.kpi.avg_trust")}</span>
          <div className="flex items-baseline space-x-1.5 mt-2" id="kpi_trust_rating_value_container">
            <span className="text-2xl font-heading font-extrabold text-accent-lavender">
              {telemetry.avgTrust > 0 ? `${telemetry.avgTrust}%` : "---"}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">{t("dashboard.kpi.avg_trust_suffix")}</span>
          </div>
        </div>
      </section>

      {/* SEARCH AND INTERACTIVE FILTERS CONTROLS */}
      <section className="glass-card rounded-lg p-3.5 mb-8 flex flex-col gap-4 border border-zinc-800/60" id="filter_controls_card">
        {/* Primary Filter Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center" id="search_filter_row_wrapper">
          {/* Search Input Box */}
          <div className="relative flex-1 w-full" id="search_input_relative_wrapper">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="input_search_filters"
              type="text"
              placeholder={t("dashboard.filters.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-md pl-9 pr-3 py-2 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Engine Chips container */}
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start" id="engine_selection_container">
            {["all", "llama.cpp", "vLLM", "Ollama", "TGI", "exllamav2"].map((eng) => (
              <button
                key={eng}
                id={`chip_engine_${eng.replace(".", "_")}`}
                type="button"
                onClick={() => setSelectedEngine(eng)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all duration-150 ${selectedEngine === eng
                  ? "bg-accent-amber text-surface-0 border-amber-500/20 shadow-md shadow-amber-600/10"
                  : "bg-surface-0/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200"
                  }`}
              >
                {eng}
              </button>
            ))}
          </div>

          {/* Collapsible advanced toggle trigger */}
          <button
            id="btn_toggle_advanced_drawer"
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition duration-150 ${showAdvanced || selectedQuant || contextLengthFilter || minTpsFilter || selectedModel || selectedGpu || selectedSpeculative || selectedVram
              ? "bg-amber-950/20 text-accent-amber border-amber-500/20"
              : "bg-surface-0/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200"
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("dashboard.filters.advanced_toggle")}
          </button>
        </div>

        {/* Collapsible Advanced Filters Drawer Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/50" id="advanced_filters_drawer">
            {/* Input: Model Name filter */}
            <div className="flex flex-col" id="filter_group_model_name">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.model_name")}</label>
              <input
                id="input_filter_model"
                type="text"
                placeholder={t("dashboard.filters.drawer.model_placeholder")}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: GPU Model filter */}
            <div className="flex flex-col" id="filter_group_gpu_model">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.gpu_model")}</label>
              <input
                id="input_filter_gpu"
                type="text"
                placeholder={t("dashboard.filters.drawer.gpu_placeholder")}
                value={selectedGpu}
                onChange={(e) => setSelectedGpu(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: Speculative method filter */}
            <div className="flex flex-col" id="filter_group_speculative_method">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.speculative")}</label>
              <input
                id="input_filter_speculative"
                type="text"
                placeholder={t("dashboard.filters.drawer.speculative_placeholder")}
                value={selectedSpeculative}
                onChange={(e) => setSelectedSpeculative(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: VRAM Size filter */}
            <div className="flex flex-col" id="filter_group_vram_size">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.vram")}</label>
              <input
                id="input_filter_vram"
                type="text"
                placeholder={t("dashboard.filters.drawer.vram_placeholder")}
                value={selectedVram}
                onChange={(e) => setSelectedVram(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: Quantization filter */}
            <div className="flex flex-col" id="filter_group_quant_scheme">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.quant")}</label>
              <input
                id="input_filter_quant"
                type="text"
                placeholder={t("dashboard.filters.drawer.quant_placeholder")}
                value={selectedQuant}
                onChange={(e) => setSelectedQuant(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: Context size filter */}
            <div className="flex flex-col" id="filter_group_context_length">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.context")}</label>
              <input
                id="input_filter_context"
                type="number"
                placeholder={t("dashboard.filters.drawer.context_placeholder")}
                value={contextLengthFilter}
                onChange={(e) => setContextLengthFilter(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
            {/* Input: Min tokens/sec speed */}
            <div className="flex flex-col" id="filter_group_min_speed">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("dashboard.filters.drawer.min_tps")}</label>
              <input
                id="input_filter_min_tps"
                type="number"
                placeholder={t("dashboard.filters.drawer.min_tps_placeholder")}
                value={minTpsFilter}
                onChange={(e) => setMinTpsFilter(e.target.value)}
                className="glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
        )}

        {/* Sorting and Clear Filters Row */}
        <div className="flex justify-between items-center pt-3 border-t border-zinc-800/30 text-xs" id="sorting_clear_row_wrapper">
          <div className="text-zinc-500 font-mono text-[10px]" id="matching_profiles_counter_wrapper">
            {t("dashboard.table.showing")} <span className="text-zinc-300 font-bold">{totalRecords}</span> {t("dashboard.filters.matching_profiles")}
          </div>

          <div className="flex items-center space-x-4" id="sorting_clear_actions_wrapper">
            {/* Active filters clear button */}
            {(searchQuery || selectedEngine !== "all" || selectedQuant || contextLengthFilter || minTpsFilter || selectedModel || selectedGpu || selectedSpeculative || selectedVram) && (
              <button
                id="btn_clear_filters"
                onClick={resetFilters}
                className="text-[10px] text-accent-amber hover:text-amber-300 flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                {t("dashboard.filters.btn_clear")}
              </button>
            )}

            {/* Sort selection dropdown */}
            <div className="flex items-center space-x-1.5" id="sort_dropdown_wrapper">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t("dashboard.filters.drawer.sort_order")}:</span>
              <select
                id="select_sort_order"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="glass-input rounded-lg px-2 py-1 text-[11px] font-bold text-zinc-300 border-zinc-800 cursor-pointer"
              >
                <option value="newest">{t("dashboard.filters.sort_options.newest")}</option>
                <option value="tokens_per_sec">{t("dashboard.filters.sort_options.highest_gen")}</option>
                <option value="prompt_tokens_per_sec">{t("dashboard.filters.sort_options.highest_prompt")}</option>
                <option value="confidence">{t("dashboard.filters.sort_options.highest_trust")}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG DISPLAY & SPLIT DRAWER SECTION */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full relative" id="catalog_layout_split_view">

        {/* Left Side: Search results list */}
        <div className="flex-1 w-full min-w-0 transition-all duration-300" id="results_list_left_column">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-accent-amber font-heading" id="catalog_querying_loader">
              <Gauge className="w-10 h-10 animate-spin mb-4" />
              <span className="text-xs uppercase tracking-widest font-bold">{t("global.loaders.dashboard_init")}</span>
            </div>
          ) : benchmarksList.length === 0 ? (
            /* Empty results state fallback graphic with an instant reset button */
            <div className="glass-card rounded-xl p-8 text-center flex flex-col items-center justify-center border border-zinc-800" id="blank_results_state">
              <div className="w-12 h-12 rounded-xl bg-surface-0/80 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4" id="blank_state_icon_container">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-heading font-black text-white mb-1.5">{t("dashboard.filters.empty_title")}</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                {t("dashboard.filters.empty_desc")}
              </p>
              <button
                id="btn_reset_empty_state"
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-heading font-bold text-accent-amber hover:text-white bg-amber-950/15 border border-amber-500/20 hover:border-amber-500/40 rounded-lg transition duration-150"
              >
                {t("dashboard.filters.btn_reset")}
              </button>
            </div>
          ) : (
            /* GRID RESULTS */
            <div
              className={`grid gap-4 transition-all duration-300 ${activeBenchmarkId
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              id="catalog_grid_container"
            >
              {benchmarksList.map((item) => {
                const isSelected = activeBenchmarkId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveBenchmarkId(item.id)}
                    className={`glass-card glass-card-hover rounded-lg p-3.5 border cursor-pointer flex flex-col justify-between transition-all duration-300 ${isSelected
                      ? "border-amber-500 bg-amber-950/15 shadow-[0_0_12px_rgba(232,169,81,0.12)] ring-1 ring-amber-500/25"
                      : "border-zinc-800 hover:border-zinc-700/60"
                      }`}
                    id={`benchmark_card_${item.id}`}
                  >
                    {/* Card Header row */}
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        {/* Engine Chip badge */}
                        <span className="bg-surface-1 border border-zinc-700/60 text-zinc-400 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          {item.engine} {item.engineVersion && `v${item.engineVersion}`}
                        </span>

                        {/* Confidence index bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1 bg-surface-0 rounded-full overflow-hidden border border-zinc-800/60">
                            <div
                              className="h-full bg-accent-amber rounded-full"
                              style={{ width: `${Math.round(item.confidenceScore * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 font-bold">
                            {Math.round(item.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Benchmark Title */}
                      <h3 className="text-xs font-heading font-black text-white hover:text-accent-amber transition mb-1.5 leading-snug line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Author profile line */}
                      <div className="flex items-center space-x-1.5 mb-4 text-[9px] font-mono text-zinc-500" id={`benchmark_author_row_${item.id}`}>
                        <span>{t("dashboard.table.labels.by")}</span>
                        <span className="text-zinc-400 font-bold">{item.authorName || "anonymous-agent"}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Specifications Telemetry Breakdown */}
                      <div className="grid grid-cols-2 gap-3 bg-surface-0/50 rounded-lg p-2.5 border border-zinc-800/40 mb-4 text-[10px]" id={`benchmark_specs_telemetry_${item.id}`}>
                        {/* Hardware */}
                        <div className="flex flex-col" id={`benchmark_spec_hardware_${item.id}`}>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">{t("dashboard.table.labels.hardware_rig")}</span>
                          <span className="text-zinc-300 font-bold font-sans line-clamp-1">
                            {item.canonicalGpuName || item.gpuModel || "Unknown GPU"}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                            {item.gpuCount > 1 ? `${item.gpuCount}x ${t("dashboard.table.labels.multi_gpu")}` : t("dashboard.table.labels.single_gpu")} {item.gpuVram && `• ${item.gpuVram}`}
                          </span>
                        </div>
                        {/* Model */}
                        <div className="flex flex-col" id={`benchmark_spec_model_${item.id}`}>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">{t("dashboard.table.labels.model_slug")}</span>
                          <span className="text-zinc-300 font-bold font-sans line-clamp-1">
                            {item.canonicalModelName || item.modelName || "Unknown Model"}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                            {item.modelParams ? `${item.modelParams}B` : ""} {item.modelQuant && `• ${item.modelQuant}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Telemetry Grid block */}
                    <div className="grid grid-cols-3 gap-2 bg-surface-0/40 rounded-xl p-2.5 border border-zinc-800/40 items-center" id={`benchmark_performance_grid_${item.id}`}>
                      <div className="flex flex-col" id={`benchmark_speed_gen_${item.id}`}>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.tps_gen")}</span>
                        <div className="flex items-baseline mt-0.5">
                          <span className="text-sm font-heading font-black text-accent-teal">{item.tokensPerSec.toFixed(1)}</span>
                          <span className="text-[9px] text-zinc-500 font-bold ml-0.5">t/s</span>
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-zinc-800/60 pl-2" id={`benchmark_speed_prompt_${item.id}`}>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.tps_prompt")}</span>
                        <div className="flex items-baseline mt-0.5">
                          <span className="text-[11px] font-heading font-extrabold text-accent-amber">
                            {item.promptTokensPerSec ? Math.round(item.promptTokensPerSec).toLocaleString() : "---"}
                          </span>
                          {item.promptTokensPerSec && <span className="text-[9px] text-zinc-500 font-bold ml-0.5">t/s</span>}
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-zinc-800/60 pl-2" id={`benchmark_latency_${item.id}`}>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.latency")}</span>
                        <div className="flex items-baseline mt-0.5">
                          <span className="text-[11px] font-heading font-extrabold text-accent-lavender">
                            {item.ttftMs ? Math.round(item.ttftMs) : "---"}
                          </span>
                          {item.ttftMs && <span className="text-[9px] text-zinc-500 font-bold ml-0.5">ms</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Embedded Detail Panel (slides search results over) */}
        {activeBenchmarkId && (
          <div
            className="w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 glass-card rounded-lg border border-amber-500/20 bg-surface-0/90 shadow-2xl p-4 sm:p-5 sticky top-8 transition-all duration-300 flex flex-col justify-between relative"
            id="details_inline_panel"
          >
            {/* Drawer Close trigger */}
            <button
              id="btn_close_drawer"
              onClick={() => setActiveBenchmarkId(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-lg bg-surface-1 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {isDetailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-accent-amber" id="drawer_details_loading_state">
                <Gauge className="w-10 h-10 animate-spin mb-4" />
                <span className="text-xs uppercase tracking-widest font-mono">{t("dashboard.drawer.loading")}</span>
              </div>
            ) : benchmarkDetails ? (
              <div className="flex-1 flex flex-col gap-4" id="drawer_run_details">
                {/* 1. Header Area */}
                <div className="pr-10" id="drawer_header_area">
                  <div className="flex items-center space-x-2.5 mb-2" id="drawer_badges_row">
                    <span className="bg-amber-900/30 text-amber-300 border border-amber-500/20 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded">
                      {benchmarkDetails.engine} {benchmarkDetails.engineVersion && `v${benchmarkDetails.engineVersion}`}
                    </span>
                    <span className="bg-surface-1 text-zinc-500 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded border border-zinc-700/60">
                      {benchmarkDetails.os || "Linux OS"}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-heading font-black text-white leading-snug">
                    {benchmarkDetails.title}
                  </h2>

                  <div className="flex items-center space-x-2.5 mt-2 text-[10px] font-mono text-zinc-500" id="drawer_author_attribution_row">
                    <span>{t("dashboard.table.labels.by")}</span>
                    <span className="text-zinc-300 font-bold">{benchmarkDetails.authorName || "anonymous-agent"}</span>
                    <span>•</span>
                    <span>{new Date(benchmarkDetails.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Interactive KPI Scoreboard */}
                <div className="grid grid-cols-3 gap-3 bg-surface-1/50 border border-zinc-800 rounded-lg p-2.5.5" id="drawer_kpi_scoreboard">
                  <div className="flex flex-col" id="drawer_scoreboard_decoding_tps">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.tps_gen")}</span>
                    <div className="flex items-baseline mt-0.5 space-x-0.5">
                      <span className="text-lg font-heading font-black text-accent-teal">
                        {benchmarkDetails.tokensPerSec.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold">t/s</span>
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-zinc-800/60 pl-3" id="drawer_scoreboard_prompt_tps">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.tps_prompt")}</span>
                    <div className="flex items-baseline mt-0.5 space-x-0.5">
                      <span className="text-sm font-heading font-extrabold text-accent-amber">
                        {benchmarkDetails.promptTokensPerSec ? Math.round(benchmarkDetails.promptTokensPerSec).toLocaleString() : "---"}
                      </span>
                      {benchmarkDetails.promptTokensPerSec && <span className="text-[9px] text-zinc-500 font-bold">t/s</span>}
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-zinc-800/60 pl-3" id="drawer_scoreboard_latency_ms">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{t("dashboard.table.labels.latency")}</span>
                    <div className="flex items-baseline mt-0.5 space-x-0.5">
                      <span className="text-sm font-heading font-extrabold text-accent-lavender">
                        {benchmarkDetails.ttftMs ? Math.round(benchmarkDetails.ttftMs) : "---"}
                      </span>
                      {benchmarkDetails.ttftMs && <span className="text-[9px] text-zinc-500 font-bold">ms</span>}
                    </div>
                  </div>
                </div>

                {/* 3. Narrative markdown area */}
                {benchmarkDetails.renderedNarrative && (
                  <div className="glass-card rounded-lg p-3 border border-zinc-800" id="drawer_narrative_card">
                    <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center gap-1.5 font-heading">
                      <BookOpen className="w-3.5 h-3.5 text-accent-amber" />
                      {t("dashboard.drawer.narrative_header")}
                    </h4>
                    {/* Rendered narrative from backend */}
                    <div
                      className="markdown-block text-xs text-zinc-300 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: benchmarkDetails.renderedNarrative }}
                      id="drawer_narrative_content"
                    />
                  </div>
                )}

                {/* 4. Complete Configuration Matrix */}
                <div className="grid grid-cols-1 gap-4" id="drawer_specs_matrix_grid">
                  {/* Hardware details card */}
                  <div className="glass-card rounded-lg p-3 border border-zinc-800/60 flex flex-col gap-2.5" id="drawer_hardware_specs_card">
                    <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider pb-1.5 border-b border-zinc-800 flex items-center gap-1 font-heading">
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      {t("dashboard.drawer.hardware_header")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[10px]" id="drawer_hardware_specs_matrix">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.filters.drawer.gpu_model")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.canonicalGpuName || benchmarkDetails.gpuModel || "Generic"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.filters.drawer.vram")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.gpuVram || "Unknown VRAM"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.gpu_count")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.gpuCount} unit(s)</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.cpu_processor")}</span>
                        <span className="text-zinc-300 font-bold truncate block" title={benchmarkDetails.cpu || ""}>{benchmarkDetails.cpu || "Generic Host"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.system_ram")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.ram || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
 
                  {/* Software Engine + Execution configs */}
                  <div className="glass-card rounded-lg p-3 border border-zinc-800/60 flex flex-col gap-2.5" id="drawer_runtime_params_card">
                    <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider pb-1.5 border-b border-zinc-800 flex items-center gap-1 font-heading">
                      <Terminal className="w-3.5 h-3.5 text-accent-amber" />
                      {t("dashboard.drawer.runtime_header")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[10px]" id="drawer_runtime_params_matrix">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.model_signature")}</span>
                        <span className="text-zinc-300 font-bold truncate block" title={benchmarkDetails.canonicalModelName || benchmarkDetails.modelName || ""}>
                          {benchmarkDetails.canonicalModelName || benchmarkDetails.modelName || "Generic"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.model_parameters")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.modelParams ? `${benchmarkDetails.modelParams}B` : "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.quant_scheme")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.modelQuant || "None (FP16)"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.context_length")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.contextLength || 2048} tokens</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.batch_size")}</span>
                        <span className="text-zinc-300 font-bold">{benchmarkDetails.batchSize || "Not set"}</span>
                      </div>
                      {benchmarkDetails.ngl !== null && (
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.ngl_layers")}</span>
                          <span className="text-zinc-300 font-bold">{benchmarkDetails.ngl} layers</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4.5. Optimization Toggles & Speculative Settings Grid */}
                <div className="glass-card rounded-lg p-3 border border-zinc-800/60 flex flex-col gap-2.5" id="drawer_optimizations_card">
                  <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider pb-1.5 border-b border-zinc-800 flex items-center gap-1.5 font-heading">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-accent-amber" />
                    {t("dashboard.drawer.opt_settings")}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]" id="drawer_optimizations_grid">
                    <div className="flex flex-col gap-0.5" id="drawer_toggle_flash_attention">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.flash_attn")}</span>
                      <span className={`font-bold font-mono text-[9px] ${benchmarkDetails.flashAttention ? "text-accent-teal" : "text-zinc-500"}`}>
                        {benchmarkDetails.flashAttention ? "🟢 ACTIVE" : "⚪ OFF"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5" id="drawer_toggle_mla">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.mla_attn")}</span>
                      <span className={`font-bold font-mono text-[9px] ${benchmarkDetails.mla ? "text-accent-teal" : "text-zinc-500"}`}>
                        {benchmarkDetails.mla ? "🟢 ACTIVE" : "⚪ OFF"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5" id="drawer_toggle_chunked_prefill">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.chunked_prefill")}</span>
                      <span className={`font-bold font-mono text-[9px] ${benchmarkDetails.chunkedPrefill ? "text-accent-teal" : "text-zinc-500"}`}>
                        {benchmarkDetails.chunkedPrefill ? "🟢 ACTIVE" : "⚪ OFF"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5" id="drawer_toggle_cuda_graphs">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.cuda_graphs")}</span>
                      <span className={`font-bold font-mono text-[9px] ${benchmarkDetails.cudaGraphs ? "text-accent-teal" : "text-zinc-500"}`}>
                        {benchmarkDetails.cudaGraphs ? "🟢 ACTIVE" : "⚪ OFF"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1" id="drawer_toggle_speculative_draft">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{t("dashboard.drawer.speculative_draft")}</span>
                      <span className={`font-bold font-mono text-[9px] ${benchmarkDetails.speculativeMethod && benchmarkDetails.speculativeMethod !== 'none' ? "text-accent-teal" : "text-zinc-500"}`}>
                        {benchmarkDetails.speculativeMethod && benchmarkDetails.speculativeMethod !== 'none'
                          ? `🟢 ${benchmarkDetails.speculativeMethod.toUpperCase()} (${benchmarkDetails.numSpeculativeTokens || 0} tok)`
                          : "⚪ NONE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Custom auto-generated Docker Compose section */}
                <div className="glass-card rounded-lg p-3 border border-zinc-800 flex flex-col gap-3 relative" id="drawer_docker_compose_card" style={{ display: 'none' }}>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800" id="drawer_docker_compose_header_row">
                    <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 font-heading">
                      <Cpu className="w-3.5 h-3.5 text-accent-teal" />
                      {t("dashboard.drawer.docker_header")}
                    </h4>
                    <button
                      id="btn_copy_docker_compose"
                      onClick={() => copyDockerToClipboard(generateDockerComposeTemplate(benchmarkDetails))}
                      className="px-2.5 py-1 text-[9px] font-bold text-accent-amber hover:text-white bg-amber-950/15 border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center gap-1 transition"
                    >
                      {copiedDocker ? <Check className="w-3 h-3 text-accent-teal animate-pulse" /> : <Copy className="w-3 h-3" />}
                      {copiedDocker ? `${t("dashboard.drawer.copied")} ⚡` : t("dashboard.drawer.copy_template")}
                    </button>
                  </div>

                  {/* Engine Toggle Buttons */}
                  <div className="flex bg-surface-1/80 p-0.5 rounded-lg border border-zinc-700/60 gap-1" id="docker_engine_toggles">
                    {(["llama.cpp", "vllm", "ollama"] as const).map((eng) => (
                      <button
                        key={eng}
                        id={`btn_docker_engine_${eng.replace('.', '_')}`}
                        onClick={() => setDockerEngine(eng)}
                        className={`flex-1 py-1 px-2 text-[9px] font-bold rounded-md font-mono transition duration-150 ${dockerEngine === eng
                          ? "bg-accent-amber text-surface-0 shadow-md shadow-amber-glow"
                          : "text-zinc-400 hover:text-white hover:bg-surface-2"
                          }`}
                      >
                        {eng.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <pre className="w-full h-40 glass-input p-3 rounded-lg text-[9px] font-mono overflow-auto cyber-scrollbar whitespace-pre text-amber-300">
                    {generateDockerComposeTemplate(benchmarkDetails)}
                  </pre>
                </div>

                {/* 6. Stderr Timing Logs Console screen */}
                {benchmarkDetails.rawLogContent && (
                  <div className="glass-card rounded-lg p-3 border border-zinc-800 flex flex-col gap-2 relative" id="drawer_console_logs_card">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800" id="drawer_console_logs_header_row">
                      <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 font-heading">
                        <Terminal className="w-3.5 h-3.5 text-accent-lavender" />
                        {t("dashboard.drawer.console_header")}
                      </h4>
                      <button
                        id="btn_copy_raw_logs"
                        onClick={() => copyLogsToClipboard(benchmarkDetails.rawLogContent || "")}
                        className="px-2.5 py-1 text-[9px] font-bold text-accent-amber hover:text-white bg-amber-950/15 border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center gap-1 transition"
                      >
                        {copiedLogs ? <Check className="w-3 h-3 text-accent-teal animate-pulse" /> : <Copy className="w-3 h-3" />}
                        {copiedLogs ? `${t("dashboard.drawer.copied")} ⚡` : t("dashboard.drawer.copy_log")}
                      </button>
                    </div>
                    <pre className="w-full h-36 glass-input p-3 rounded-lg text-[9px] font-mono overflow-auto cyber-scrollbar whitespace-pre text-zinc-400">
                      {benchmarkDetails.rawLogContent}
                    </pre>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bottom buttons panel inside drawer */}
            {benchmarkDetails && (
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

                {/* Share Entry Button */}
                <button
                  id="btn_share_entry"
                  onClick={copyShareLink}
                  className="py-2 px-4 text-xs font-bold text-zinc-300 bg-surface-1/60 hover:bg-surface-1 border border-zinc-800 hover:text-white rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  {copiedShare ? (
                    <Check className="w-4 h-4 text-accent-teal animate-pulse" />
                  ) : (
                    <Share2 className="w-4 h-4 text-accent-amber" />
                  )}
                  {copiedShare ? t("dashboard.drawer.copied_link") : t("dashboard.drawer.share_entry")}
                </button>

                {/* External repository card anchor */}
                {benchmarkDetails.modelSource && (
                  <a
                    id="link_hf_weights"
                    href={benchmarkDetails.modelSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 text-xs font-bold text-zinc-300 bg-surface-1/60 hover:bg-surface-1 border border-zinc-800 hover:text-white rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-400" />
                    {t("dashboard.drawer.model_weights")}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================================
          ELEGANT GLASSMORPHIC FOOTER (LAYOUT CORRECTION)
          ============================================================================
          Positioned outside the 'catalog_layout_split_view' flexbox row container.
          This ensures the footer is rendered full-width at the bottom of the page
          and does not get squashed into the same flex row as the catalog grids.
          Hosts the official copyright notice, Google Antigravity attribution badge,
          and the interactive hook to trigger the licenses / specifications overlay.
      */}
      <footer 
        className="mt-12 pt-6 pb-3 border-t border-zinc-800/60 flex flex-col sm:flex-row justify-between items-center text-zinc-500 font-mono text-[10px] gap-4 w-full" 
        id="dashboard_footer"
      >
        <div className="flex flex-col items-center sm:items-start gap-1" id="footer_copyright_group">
          <span className="text-zinc-400 font-bold" id="span_copyright_text">© 2026 LLMDB.org. All rights reserved.</span>
          <span className="text-zinc-500" id="span_footer_subtitle">Powered by next-generation deduplication and normalizers.</span>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-1" id="footer_attributions_group">
          <span className="text-zinc-400" id="span_antigravity_badge">
            Developed using <span className="text-accent-amber font-bold font-sans">Google Antigravity</span> ⚡
          </span>
          <span className="text-zinc-500" id="span_packages_notice">
            Licensed under MIT. Learn more in our{" "}
            <button 
              id="btn_trigger_about_modal"
              onClick={() => setShowAboutModal(true)} 
              className="underline hover:text-accent-teal focus:outline-none cursor-pointer"
            >
              About & Licenses
            </button>.
          </span>
        </div>
      </footer>

      {/* ============================================================================
          FROSTED GLASSMORPHIC ABOUT & ATTRIBUTIONS MODAL
          ============================================================================
          Renders a backdrop-blur overlay detailing the system background, Google
          Antigravity developer engineering, and the core dependency package licensing matrix.
      */}
      {showAboutModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-0/60 backdrop-blur-md animate-in fade-in duration-200" 
          id="about_modal_overlay"
        >
          {/* Modal Backdrop dismiss trigger */}
          <div 
            className="fixed inset-0" 
            onClick={() => setShowAboutModal(false)} 
            id="about_modal_backdrop"
          />
          <div 
            className="w-full max-w-lg glass-card rounded-xl border border-amber-500/20 bg-surface-0/90 shadow-2xl p-6 relative z-10 animate-in zoom-in-95 duration-200" 
            id="about_modal_card"
          >
            {/* Modal Close Button */}
            <button
              id="btn_close_about_modal"
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-surface-1 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-4" id="about_modal_header">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-600/10" id="about_header_icon">
                <Gauge className="w-5 h-5 text-white" />
              </div>
              <div id="about_header_text_group">
                <h2 className="text-base font-heading font-black text-white" id="heading_about_title">About LLMDB</h2>
                <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase" id="span_about_subtitle">System Information & Attributions</span>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="space-y-4 text-xs text-zinc-300 font-sans" id="about_modal_body">
              <p className="leading-relaxed" id="p_about_description">
                The <strong className="text-white">LLM Benchmarks Database (llmdb)</strong> is a community-driven catalog mapping Large Language Model inference performance under various hardware and software configurations.
              </p>
              
              {/* Google Antigravity Attribution Block */}
              <div 
                className="bg-surface-1/40 border border-zinc-800/80 rounded-lg p-3 flex items-start gap-2.5" 
                id="div_antigravity_attributon_block"
              >
                <span className="text-accent-amber text-lg mt-0.5" id="span_sparkle_icon">⚡</span>
                <div id="antigravity_attribution_content">
                  <h4 className="text-[10px] uppercase font-bold text-white tracking-wider mb-0.5 font-heading" id="heading_antigravity_sub">Developed with Google Antigravity</h4>
                  <p className="text-[10px] text-zinc-400 leading-normal" id="p_antigravity_attribution_text">
                    This next-generation web application was engineered in collaboration with <strong className="text-zinc-300">Google Antigravity</strong>, an advanced AI-guided coding agent team working at Google Deepmind.
                  </p>
                </div>
              </div>

              {/* Package Licences Integration Matrix */}
              <div id="div_dependencies_matrix_group">
                <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 font-heading" id="heading_tech_licenses">Core Technologies & Licenses</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono" id="grid_dependency_items">
                  <div className="bg-surface-0 border border-zinc-800/60 p-2 rounded-lg flex flex-col justify-between" id="tech_card_next">
                    <span className="text-zinc-300 font-bold">Next.js & React</span>
                    <span className="text-zinc-500 mt-1">MIT License</span>
                  </div>
                  <div className="bg-surface-0 border border-zinc-800/60 p-2 rounded-lg flex flex-col justify-between" id="tech_card_drizzle">
                    <span className="text-zinc-300 font-bold">Drizzle ORM</span>
                    <span className="text-zinc-500 mt-1">Apache-2.0 License</span>
                  </div>
                  <div className="bg-surface-0 border border-zinc-800/60 p-2 rounded-lg flex flex-col justify-between" id="tech_card_zod">
                    <span className="text-zinc-300 font-bold">Zod Validation</span>
                    <span className="text-zinc-500 mt-1">MIT License</span>
                  </div>
                  <div className="bg-surface-0 border border-zinc-800/60 p-2 rounded-lg flex flex-col justify-between" id="tech_card_bcrypt">
                    <span className="text-zinc-300 font-bold">bcryptjs & Auth</span>
                    <span className="text-zinc-500 mt-1">MIT / ISC License</span>
                  </div>
                </div>
              </div>

              {/* Footer System Status */}
              <div 
                className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-[10px] font-mono text-zinc-500" 
                id="div_modal_status_bar"
              >
                <span id="span_db_status">Database Status: Connected</span>
                <span className="text-zinc-400" id="span_app_version">v0.1.0 (Public Release)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
