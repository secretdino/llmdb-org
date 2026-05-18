"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  UploadCloud, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Gauge, 
  BookOpen
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/components/i18n-provider";

/**
 * ============================================================================
 * TIMING LOG INGESTION FORM & HARDWARE RIG PROFILE SAVER (FEAT-001)
 * ============================================================================
 * 
 * Provides an upload panel featuring real-time client-side regex parsing
 * to extract timings and parameters, pulse-highlights auto-filled fields,
 * and saves rigs profiles in LocalStorage.
 */

// Form inputs type definition
interface FormState {
  title: string;
  narrative: string;
  sourceUrl: string;
  
  gpuModel: string;
  gpuCount: number;
  gpuVram: string;
  cpu: string;
  ram: string;
  
  engine: "llama.cpp" | "vLLM" | "Ollama" | "TGI" | "exllamav2";
  engineVersion: string;
  os: string;
  
  modelName: string;
  modelParams: string;
  modelQuant: string;
  modelSource: string;
  
  contextLength: string;
  batchSize: string;
  numThreads: string;
  ngl: string;
  
  flashAttention: boolean;
  cudaGraphs: boolean;
  mla: boolean;
  chunkedPrefill: boolean;
  speculativeMethod: string;
  numSpeculativeTokens: string;
  loadPrecision: string;
  
  tokensPerSec: string;
  promptTokensPerSec: string;
  ttftMs: string;
}

// Hardware profile format
interface SavedRig {
  profileName: string;
  gpuModel: string;
  gpuCount: number;
  gpuVram: string;
  cpu: string;
  ram: string;
}

// Timing log templates for user copy-paste tests
const LOG_TEMPLATES = {
  "llama.cpp": `system_info: n_threads = 16 / 32 | AVX = 1 | AVX2 = 1 | CUDA = 1 | 
llama_model_loader: loaded model /models/Meta-Llama-3-8B-Instruct.Q4_K_M.gguf
llm_load_tensors: offloaded 33/33 layers to GPU
llama_print_timings: prompt eval time =     320.50 ms /   512 tokens ( 1597.50 t/s)
llama_print_timings:        eval time =    5240.10 ms /   256 runs   (   48.85 t/s)`,

  "vLLM": `Initializing model meta-llama/Meta-Llama-3-8B-Instruct
Found 2 NVIDIA GeForce RTX 4090 GPU(s)
max_model_len=32768
Avg generation throughput: 82.3 tokens/s`,

  "Ollama": `prompt eval time: 0.8s
eval time: 5.2s (49.2 tokens/s)`,

  "exllamav2": `Prompt processing: 2420.5 tokens/sec
Token generation: 82.34 tokens/sec`,

  "docker-compose": `LLAMA_ARG_MODEL : "meta-llama-3-8b.gguf"
LLAMA_ARG_CTX_SIZE : 8192
LLAMA_ARG_N_GPU_LAYERS : 33
LLAMA_ARG_THREADS : 16
--flash-attn`
};

export default function SubmitBenchmarkPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { status } = useSession();

  // Redirect if not signed in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/submit");
    }
  }, [status, router]);

  // Primary form input state
  const [form, setForm] = useState<FormState>({
    title: "",
    narrative: "",
    sourceUrl: "",
    gpuModel: "",
    gpuCount: 1,
    gpuVram: "",
    cpu: "",
    ram: "",
    engine: "llama.cpp",
    engineVersion: "",
    os: "Linux",
    modelName: "",
    modelParams: "",
    modelQuant: "",
    modelSource: "",
    contextLength: "",
    batchSize: "",
    numThreads: "",
    ngl: "",
    flashAttention: false,
    cudaGraphs: false,
    mla: false,
    chunkedPrefill: false,
    speculativeMethod: "none",
    numSpeculativeTokens: "",
    loadPrecision: "fp16",
    tokensPerSec: "",
    promptTokensPerSec: "",
    ttftMs: ""
  });

  // Raw copy-paste console area content
  const [rawLogs, setRawLogs] = useState("");
  
  // Flash animation pulse flags dictionary
  const [pulseFields, setPulseFields] = useState<Partial<Record<keyof FormState, boolean>>>({});
  
  // Local storage hardware rigs list state
  const [savedRigs, setSavedRigs] = useState<SavedRig[]>([]);
  const [newProfileName, setNewProfileName] = useState("");
  
  // Submission lifecycle states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");



  // Load hardware profiles on component mount
  useEffect(() => {
    const rawProfiles = localStorage.getItem("llmdb_hw_profiles");
    if (rawProfiles) {
      try {
        setSavedRigs(JSON.parse(rawProfiles));
      } catch (err) {
        console.error("Failed to parse saved rig profiles:", err);
      }
    }
  }, []);

  // Real-time client-side regex timing log parser trigger
  useEffect(() => {
    if (!rawLogs.trim()) return;

    // Trigger pulse-glow highlighting helper
    const triggerPulse = (field: keyof FormState) => {
      setPulseFields(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setPulseFields(prev => ({ ...prev, [field]: false }));
      }, 1500);
    };

    const updates: Partial<FormState> = {};

    // 1. LLAMA.CPP REGEX MATCHES
    const llamaThreadsRegex = /system_info:\s+n_threads\s*=\s*(\d+)/i;
    const tMatch = rawLogs.match(llamaThreadsRegex);
    if (tMatch) {
      updates.numThreads = tMatch[1];
      triggerPulse("numThreads");
    }

    const llamaModelRegex = /llama_model_loader:\s+loaded\s+model\s+([^\s\n]+)/i;
    const mMatch = rawLogs.match(llamaModelRegex);
    if (mMatch) {
      const fileName = mMatch[1].split(/[/\\]/).pop() || "";
      updates.modelName = fileName;
      updates.engine = "llama.cpp";
      triggerPulse("modelName");
      triggerPulse("engine");

      const quantRegex = /(Q\d_[K_a-zA-Z\d]+|FP16|BF16|IQ\d_[a-zA-Z\d]+|FP8)/i;
      const qMatch = fileName.match(quantRegex);
      if (qMatch) {
        updates.modelQuant = qMatch[1].toUpperCase();
        triggerPulse("modelQuant");
      }
    }

    const llamaNglRegex = /llm_load_tensors:\s+offloaded\s+(\d+)/i;
    const nglMatch = rawLogs.match(llamaNglRegex);
    if (nglMatch) {
      updates.ngl = nglMatch[1];
      triggerPulse("ngl");
    }

    const llamaPromptRegex = /prompt\s+eval\s+time\s*=\s*([\d\.]+)\s*ms\s*\/\s*(\d+)\s*tokens\s*\(.*?,?\s*([\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i;
    const pMatch = rawLogs.match(llamaPromptRegex);
    if (pMatch) {
      updates.ttftMs = pMatch[1];
      updates.promptTokensPerSec = pMatch[3];
      triggerPulse("ttftMs");
      triggerPulse("promptTokensPerSec");
    }

    const llamaGenRegex = /eval\s+time\s*=\s*([\d\.]+)\s*ms\s*\/\s*(\d+)\s*(?:runs|tokens)\s*\(.*?,?\s*([\d\.]+)\s*(?:t\/s|tokens\s+per\s+second)\)/i;
    const gMatch = rawLogs.match(llamaGenRegex);
    if (gMatch) {
      updates.tokensPerSec = gMatch[3];
      triggerPulse("tokensPerSec");
    }

    // 2. VLLM REGEX MATCHES
    const vllmModelRegex = /Initializing\s+model\s+([a-zA-Z0-9_\-\.\/]+)/i;
    const vmMatch = rawLogs.match(vllmModelRegex);
    if (vmMatch) {
      updates.modelName = vmMatch[1];
      updates.engine = "vLLM";
      triggerPulse("modelName");
      triggerPulse("engine");
    }

    const vllmGpuRegex = /Found\s+(\d+)\s+([^G]+)\s*GPU/i;
    const vgMatch = rawLogs.match(vllmGpuRegex);
    if (vgMatch) {
      updates.gpuCount = parseInt(vgMatch[1], 10);
      updates.gpuModel = vgMatch[2].trim();
      triggerPulse("gpuCount");
      triggerPulse("gpuModel");
    }

    const vllmContextRegex = /max_model_len=(\d+)/i;
    const vcMatch = rawLogs.match(vllmContextRegex);
    if (vcMatch) {
      updates.contextLength = vcMatch[1];
      triggerPulse("contextLength");
    }

    const vllmGenRegex = /Avg\s+generation\s+throughput:\s+([\d\.]+)\s+tokens\/s/i;
    const vgenMatch = rawLogs.match(vllmGenRegex);
    if (vgenMatch) {
      updates.tokensPerSec = vgenMatch[1];
      triggerPulse("tokensPerSec");
    }

    // 3. OLLAMA REGEX MATCHES
    const ollamaPromptRegex = /prompt\s+eval\s+time:\s*([\d\.]+)s/i;
    const opMatch = rawLogs.match(ollamaPromptRegex);
    if (opMatch) {
      updates.ttftMs = (parseFloat(opMatch[1]) * 1000).toString();
      updates.engine = "Ollama";
      triggerPulse("ttftMs");
      triggerPulse("engine");
    }

    const ollamaGenRegex = /eval\s+time:\s*([\d\.]+)s\s*\(\s*([\d\.]+)\s*tokens\/s\)/i;
    const ogenMatch = rawLogs.match(ollamaGenRegex);
    if (ogenMatch) {
      updates.tokensPerSec = ogenMatch[2];
      triggerPulse("tokensPerSec");
    }

    // 4. EXLLAMAV2 REGEX MATCHES
    const exlPromptRegex = /Prompt\s+processing:\s*([\d\.]+)\s+tokens\/sec/i;
    const expMatch = rawLogs.match(exlPromptRegex);
    if (expMatch) {
      updates.promptTokensPerSec = expMatch[1];
      updates.engine = "exllamav2";
      triggerPulse("promptTokensPerSec");
      triggerPulse("engine");
    }

    const exlGenRegex = /Token\s+generation:\s*([\d\.]+)\s+tokens\/sec/i;
    const exgMatch = rawLogs.match(exlGenRegex);
    if (exgMatch) {
      updates.tokensPerSec = exgMatch[1];
      triggerPulse("tokensPerSec");
    }

    // 5. DOCKER / CLI CONFIG MATCHES
    const dockerModel = rawLogs.match(/LLAMA_ARG_MODEL\s*:\s*["']?([^"'\n\s]+)/i);
    const dockerCtx = rawLogs.match(/LLAMA_ARG_CTX_SIZE\s*:\s*["']?(\d+)/i);
    const dockerNgl = rawLogs.match(/LLAMA_ARG_N_GPU_LAYERS\s*:\s*["']?(\d+)/i);
    const dockerThreads = rawLogs.match(/LLAMA_ARG_THREADS\s*:\s*["']?(\d+)/i);
    const dockerBatch = rawLogs.match(/LLAMA_ARG_BATCH_SIZE\s*:\s*["']?(\d+)/i);

    if (dockerModel) {
      updates.modelName = dockerModel[1];
      triggerPulse("modelName");
    }
    if (dockerCtx) {
      updates.contextLength = dockerCtx[1];
      triggerPulse("contextLength");
    }
    if (dockerNgl) {
      updates.ngl = dockerNgl[1];
      triggerPulse("ngl");
    }
    if (dockerThreads) {
      updates.numThreads = dockerThreads[1];
      triggerPulse("numThreads");
    }
    if (dockerBatch) {
      updates.batchSize = dockerBatch[1];
      triggerPulse("batchSize");
    }

    // CLI switches
    const cliCtx = rawLogs.match(/(?:-c|--ctx-size)\s+(\d+)/i);
    const cliNgl = rawLogs.match(/(?:-ngl|--n-gpu-layers)\s+(\d+)/i);
    const cliThreads = rawLogs.match(/(?:-t|--threads)\s+(\d+)/i);
    const cliBatch = rawLogs.match(/(?:-b|--batch-size)\s+(\d+)/i);

    if (cliCtx) {
      updates.contextLength = cliCtx[1];
      triggerPulse("contextLength");
    }
    if (cliNgl) {
      updates.ngl = cliNgl[1];
      triggerPulse("ngl");
    }
    if (cliThreads) {
      updates.numThreads = cliThreads[1];
      triggerPulse("numThreads");
    }
    if (cliBatch) {
      updates.batchSize = cliBatch[1];
      triggerPulse("batchSize");
    }

    if (/--flash-attn/i.test(rawLogs) || /flash-attention/i.test(rawLogs)) {
      updates.flashAttention = true;
      triggerPulse("flashAttention");
    }

    // Apply resolved updates
    if (Object.keys(updates).length > 0) {
      setForm(prev => ({ ...prev, ...updates }));
    }
  }, [rawLogs]);

  // Load a pre-set timing template into the log parser console
  const loadLogTemplate = (key: keyof typeof LOG_TEMPLATES) => {
    setRawLogs(LOG_TEMPLATES[key]);
  };

  // Add/Save current hardware config as a reusable profile in LocalStorage
  const saveHardwareProfile = () => {
    if (!newProfileName.trim()) {
      setErrorMessage(t("submit.alerts.profile_name_required"));
      return;
    }

    const newProfile: SavedRig = {
      profileName: newProfileName.trim(),
      gpuModel: form.gpuModel,
      gpuCount: form.gpuCount,
      gpuVram: form.gpuVram,
      cpu: form.cpu,
      ram: form.ram
    };

    const updated = [...savedRigs.filter(r => r.profileName !== newProfile.profileName), newProfile];
    setSavedRigs(updated);
    localStorage.setItem("llmdb_hw_profiles", JSON.stringify(updated));
    setNewProfileName("");
    setSuccessMessage(t("submit.alerts.profile_saved").replace("{name}", newProfile.profileName));
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Load a saved hardware profile into the form
  const loadHardwareProfile = (profile: SavedRig) => {
    const triggerSkyPulse = (field: keyof FormState) => {
      setPulseFields(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setPulseFields(prev => ({ ...prev, [field]: false }));
      }, 1500);
    };

    setForm(prev => ({
      ...prev,
      gpuModel: profile.gpuModel,
      gpuCount: profile.gpuCount,
      gpuVram: profile.gpuVram,
      cpu: profile.cpu,
      ram: profile.ram
    }));

    triggerSkyPulse("gpuModel");
    triggerSkyPulse("gpuCount");
    triggerSkyPulse("gpuVram");
    triggerSkyPulse("cpu");
    triggerSkyPulse("ram");
  };

  // Delete a saved hardware profile
  const deleteHardwareProfile = (name: string) => {
    const updated = savedRigs.filter(r => r.profileName !== name);
    setSavedRigs(updated);
    localStorage.setItem("llmdb_hw_profiles", JSON.stringify(updated));
  };

  // Post form values to Ingestion REST API endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    // Core timing speed validation check
    if (!form.tokensPerSec || parseFloat(form.tokensPerSec) <= 0) {
      setErrorMessage(t("submit.alerts.tps_required"));
      return;
    }
    if (!form.gpuModel.trim()) {
      setErrorMessage(t("submit.alerts.gpu_required"));
      return;
    }
    if (!form.modelName.trim()) {
      setErrorMessage(t("submit.alerts.model_required"));
      return;
    }

    setIsSubmitting(true);

    // Resolve payload mapping types
    const payload = {
      title: form.title || `Community ${form.gpuModel} running ${form.modelName}`,
      narrative: form.narrative || null,
      sourceUrl: form.sourceUrl || null,
      
      gpuModel: form.gpuModel,
      gpuCount: Number(form.gpuCount),
      gpuVram: form.gpuVram || null,
      cpu: form.cpu || null,
      ram: form.ram || null,
      
      engine: form.engine,
      engineVersion: form.engineVersion || null,
      os: form.os || null,
      
      modelName: form.modelName,
      modelParams: form.modelParams ? parseFloat(form.modelParams) : null,
      modelQuant: form.modelQuant || null,
      modelSource: form.modelSource || null,
      
      contextLength: form.contextLength ? parseInt(form.contextLength, 10) : null,
      batchSize: form.batchSize ? parseInt(form.batchSize, 10) : null,
      numThreads: form.numThreads ? parseInt(form.numThreads, 10) : null,
      ngl: form.ngl ? parseInt(form.ngl, 10) : null,
      
      flashAttention: form.flashAttention,
      cudaGraphs: form.cudaGraphs,
      mla: form.mla,
      chunkedPrefill: form.chunkedPrefill,
      speculativeMethod: form.speculativeMethod,
      numSpeculativeTokens: form.numSpeculativeTokens ? parseInt(form.numSpeculativeTokens, 10) : 0,
      loadPrecision: form.loadPrecision || null,
      
      tokensPerSec: parseFloat(form.tokensPerSec),
      promptTokensPerSec: form.promptTokensPerSec ? parseFloat(form.promptTokensPerSec) : null,
      ttftMs: form.ttftMs ? parseFloat(form.ttftMs) : null,
      
      rawLogContent: rawLogs || null
    };

    try {
      const response = await fetch("/api/v1/benchmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(t("submit.alerts.ingest_success").replace("{status}", result.moderation_status));
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setErrorMessage(result.error || t("submit.alerts.ingest_failed"));
        if (result.issues) {
          console.error("Zod Flattened Issues:", result.issues);
        }
      }
    } catch (err) {
      console.error("Inference Post Error:", err);
      setErrorMessage(t("submit.alerts.network_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state if session state is still undetermined
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface-0 text-accent-amber font-heading">
        <Gauge className="w-10 h-10 animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest font-bold">{t("global.loaders.auth_verifying")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col relative" id="submit_page_container">
      
      {/* Background glow canvas */}
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full glow-amber -z-10 pointer-events-none" id="submit_bg_glow_purple" />

      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-zinc-800 mb-6 gap-4" id="submit_header">
        <div className="flex items-center space-x-3" id="submit_header_info_group">
          <button
            id="btn_back_to_catalog"
            onClick={() => router.push("/")}
            title={t("submit.header.btn_back")}
            className="w-10 h-10 rounded-xl bg-surface-1 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-heading font-black tracking-tight text-white flex items-center gap-1.5">
              {t("submit.header.title")}
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">{t("submit.header.subtitle")}</span>
          </div>
        </div>
      </header>

      {/* ERROR & SUCCESS ALERTS PANEL */}
      {errorMessage && (
        <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-xs rounded-lg p-3 mb-6 flex items-start gap-2.5 animate-pulse" id="alert_error_box">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <span className="font-bold block">{t("submit.alerts.error_header")}</span>
            <span className="text-red-300/80 leading-relaxed">{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-teal-950/30 border border-teal-500/25 text-teal-200 text-xs rounded-lg p-3 mb-6 flex items-start gap-2.5" id="alert_success_box">
          <UploadCloud className="w-4 h-4 text-accent-teal shrink-0" />
          <div>
            <span className="font-bold block">{t("submit.alerts.success_header")}</span>
            <span className="text-teal-300/90">{successMessage}</span>
          </div>
        </div>
      )}

      {/* TWO COLUMN INTERACTION BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start" id="submit_interaction_board">
        
        {/* LEFT COLUMN: RAW TIMINGS TERMINAL DUMP (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4" id="submit_left_column">
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_terminal_dump_card">
            <div>
              <h3 className="text-xs font-heading font-black text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-accent-lavender" />
                {t("submit.panels.terminal_title")}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                {t("submit.panels.terminal_subtitle")}
              </p>
            </div>

            {/* Timing log template buttons */}
            <div className="flex flex-wrap gap-1.5" id="template_buttons_container">
              <span className="text-[10px] text-zinc-500 font-bold uppercase py-1 mr-1">{t("submit.panels.btn_load_demo")}:</span>
              {Object.keys(LOG_TEMPLATES).map((key) => (
                <button
                  key={key}
                  id={`btn_load_template_${key.replace("-", "_")}`}
                  type="button"
                  onClick={() => loadLogTemplate(key as keyof typeof LOG_TEMPLATES)}
                  className="px-2 py-1 bg-surface-1 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-mono transition duration-150"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Glowing Textarea timing console */}
            <div className="relative" id="submit_textarea_wrapper">
              <textarea
                id="textarea_raw_logs"
                rows={12}
                placeholder={`system_info: n_threads = 16 | AVX = 1...
llama_print_timings: prompt eval time = 312 ms
llama_print_timings:        eval time = 5240 ms...`}
                value={rawLogs}
                onChange={(e) => setRawLogs(e.target.value)}
                className="w-full glass-input rounded-lg p-3 text-[10px] font-mono cyber-scrollbar whitespace-pre placeholder-zinc-600 focus:border-amber-500/50"
              />
              {rawLogs && (
                <button
                  onClick={() => setRawLogs("")}
                  className="absolute right-3 top-3 text-[10px] text-zinc-500 hover:text-white bg-surface-0 px-2 py-0.5 rounded border border-zinc-800 font-mono"
                >
                  {t("submit.panels.clear_console")}
                </button>
              )}
            </div>
          </div>

          {/* LOCAL STORAGE HARDWARE RIG PROFILES MANAGER */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_rig_profiles_card">
            <div>
              <h3 className="text-xs font-heading font-black text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-400" />
                {t("submit.panels.profile_load")}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                {t("submit.panels.profile_save")}
              </p>
            </div>

            {/* Save Profile controls */}
            <div className="flex gap-2" id="submit_profile_save_controls_group">
              <input
                id="input_profile_name"
                type="text"
                placeholder={t("submit.panels.profile_name_placeholder")}
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="flex-1 glass-input rounded-md px-2.5 py-1.5 text-xs"
              />
              <button
                id="btn_save_profile"
                type="button"
                onClick={saveHardwareProfile}
                className="px-3.5 py-2 bg-accent-amber hover:bg-accent-amber-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                {t("submit.panels.btn_save")}
              </button>
            </div>

            {/* Reusable profiles lists */}
            {savedRigs.length > 0 ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/60 max-h-48 overflow-y-auto cyber-scrollbar" id="saved_rigs_container">
                {savedRigs.map((rig) => (
                  <div
                    key={rig.profileName}
                    className="flex justify-between items-center bg-surface-0/50 border border-zinc-800/80 rounded-xl p-2.5 text-[10px]"
                    id={`rig_profile_row_${rig.profileName.replace(/\s+/g, "_")}`}
                  >
                    <div>
                      <span className="font-bold text-white block">{rig.profileName}</span>
                      <span className="text-zinc-500 font-mono text-[9px]">
                        {rig.gpuCount}x {rig.gpuModel || "Generic GPU"} {rig.gpuVram && `• ${rig.gpuVram}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2" id={`rig_profile_actions_${rig.profileName.replace(/\s+/g, "_")}`}>
                      <button
                        type="button"
                        onClick={() => loadHardwareProfile(rig)}
                        className="px-2.5 py-1 bg-surface-1 hover:bg-amber-950/20 text-accent-amber hover:text-amber-300 border border-zinc-800 rounded-lg text-[9px] font-bold transition"
                      >
                        {t("submit.panels.load_rig")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHardwareProfile(rig.profileName)}
                        className="p-1 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-zinc-700/50 rounded-xl text-[10px] text-zinc-500" id="submit_no_saved_rigs_notice">
                {t("submit.panels.no_profiles")}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MANUAL OVERRIDE INGESTION FORM (3 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-4" id="submit_right_column">
          
          {/* Section: Basic context narrative info */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_narrative_metadata_card">
            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider pb-2 border-b border-zinc-800/60 font-heading">
              {t("submit.form.narrative_metadata")}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="submit_narrative_fields_grid">
              {/* Input: Submission Title */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_title_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.title")}</label>
                <input
                  id="form_title"
                  type="text"
                  placeholder={t("submit.form.title_placeholder")}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              {/* Input: Narrative Notes */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_narrative_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-accent-amber" />
                  {t("submit.form.narrative")}
                </label>
                <textarea
                  id="form_narrative"
                  rows={3}
                  placeholder={t("submit.form.narrative_placeholder")}
                  value={form.narrative}
                  onChange={(e) => setForm({ ...form, narrative: e.target.value })}
                  className="w-full glass-input rounded-lg p-2.5 text-xs cyber-scrollbar"
                />
              </div>

              {/* Input: Source origin URL */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_source_url_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.source_url")}</label>
                <input
                  id="form_sourceUrl"
                  type="url"
                  placeholder="e.g. https://github.com/ggerganov/llama.cpp/pull/123 (optional)..."
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Performance speed metrics */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_speeds_timings_card">
            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider pb-2 border-b border-zinc-800/60 font-heading">
              Inference Speeds & Timings
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="submit_speeds_fields_grid">
              {/* Input: Decoding Speed (Tokens/sec) */}
              <div className="flex flex-col" id="submit_field_gen_speed_group">
                <label className="text-[9px] uppercase font-bold text-accent-teal tracking-wider mb-1.5">{t("submit.form.gen_speed")} *</label>
                <input
                  id="form_tokensPerSec"
                  type="number"
                  step="any"
                  placeholder="e.g. 82.5"
                  required
                  value={form.tokensPerSec}
                  onChange={(e) => setForm({ ...form, tokensPerSec: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.tokensPerSec ? "pulse-fill text-accent-teal" : ""}`}
                />
              </div>

              {/* Input: Prompt Speed */}
              <div className="flex flex-col" id="submit_field_prompt_speed_group">
                <label className="text-[9px] uppercase font-bold text-accent-amber tracking-wider mb-1.5">{t("submit.form.prompt_speed")}</label>
                <input
                  id="form_promptTokensPerSec"
                  type="number"
                  step="any"
                  placeholder="e.g. 1597.5"
                  value={form.promptTokensPerSec}
                  onChange={(e) => setForm({ ...form, promptTokensPerSec: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.promptTokensPerSec ? "pulse-fill text-accent-amber" : ""}`}
                />
              </div>

              {/* Input: TTFT */}
              <div className="flex flex-col" id="submit_field_ttft_group">
                <label className="text-[9px] uppercase font-bold text-accent-lavender tracking-wider mb-1.5">{t("submit.form.ttft")}</label>
                <input
                  id="form_ttftMs"
                  type="number"
                  step="any"
                  placeholder="e.g. 45"
                  value={form.ttftMs}
                  onChange={(e) => setForm({ ...form, ttftMs: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.ttftMs ? "pulse-fill text-accent-lavender" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* Section: Hardware variables */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_hardware_settings_card">
            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider pb-2 border-b border-zinc-800/60 font-heading">
              {t("submit.form.hardware_settings")}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="submit_hardware_fields_grid">
              {/* Input: GPU Model */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_gpu_model_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.gpu_model")} *</label>
                <input
                  id="form_gpuModel"
                  type="text"
                  placeholder="e.g. NVIDIA GeForce RTX 4090"
                  required
                  value={form.gpuModel}
                  onChange={(e) => setForm({ ...form, gpuModel: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.gpuModel ? "pulse-fill text-teal-400" : ""}`}
                />
              </div>

              {/* Input: GPU Count */}
              <div className="flex flex-col" id="submit_field_gpu_count_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.gpu_count")}</label>
                <input
                  id="form_gpuCount"
                  type="number"
                  min={1}
                  required
                  value={form.gpuCount}
                  onChange={(e) => setForm({ ...form, gpuCount: parseInt(e.target.value) || 1 })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.gpuCount ? "pulse-fill text-teal-400" : ""}`}
                />
              </div>

              {/* Input: GPU VRAM */}
              <div className="flex flex-col" id="submit_field_gpu_vram_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.gpu_vram")}</label>
                <input
                  id="form_gpuVram"
                  type="text"
                  placeholder="e.g. 24GB GDDR6X"
                  value={form.gpuVram}
                  onChange={(e) => setForm({ ...form, gpuVram: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.gpuVram ? "pulse-fill text-teal-400" : ""}`}
                />
              </div>

              {/* Input: CPU Processor */}
              <div className="flex flex-col" id="submit_field_cpu_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.cpu_model")}</label>
                <input
                  id="form_cpu"
                  type="text"
                  placeholder="e.g. AMD Ryzen 9 7950X"
                  value={form.cpu}
                  onChange={(e) => setForm({ ...form, cpu: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.cpu ? "pulse-fill text-teal-400" : ""}`}
                />
              </div>

              {/* Input: System RAM */}
              <div className="flex flex-col" id="submit_field_ram_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.system_ram")}</label>
                <input
                  id="form_ram"
                  type="text"
                  placeholder="e.g. 64GB DDR5"
                  value={form.ram}
                  onChange={(e) => setForm({ ...form, ram: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.ram ? "pulse-fill text-teal-400" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* Section: Software & Model variables */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_software_model_card">
            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider pb-2 border-b border-zinc-800/60 font-heading">
              {t("submit.form.software_model_settings")}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="submit_software_model_fields_grid">
              {/* Select: Runtime engine */}
              <div className="flex flex-col" id="submit_field_engine_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.engine")}</label>
                <select
                  id="form_engine"
                  value={form.engine}
                  onChange={(e) => setForm({ ...form, engine: e.target.value as FormState["engine"] })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs cursor-pointer ${pulseFields.engine ? "pulse-fill text-accent-amber font-bold" : ""}`}
                >
                  <option value="llama.cpp">llama.cpp</option>
                  <option value="vLLM">vLLM</option>
                  <option value="Ollama">Ollama</option>
                  <option value="TGI">TGI</option>
                  <option value="exllamav2">exllamav2</option>
                </select>
              </div>

              {/* Input: Engine Version */}
              <div className="flex flex-col" id="submit_field_engine_version_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.engine_version")}</label>
                <input
                  id="form_engineVersion"
                  type="text"
                  placeholder="e.g. b3245"
                  value={form.engineVersion}
                  onChange={(e) => setForm({ ...form, engineVersion: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.engineVersion ? "pulse-fill" : ""}`}
                />
              </div>

              {/* Input: Host OS */}
              <div className="flex flex-col" id="submit_field_os_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.os")}</label>
                <input
                  id="form_os"
                  type="text"
                  placeholder="e.g. Linux Ubuntu, Windows"
                  value={form.os}
                  onChange={(e) => setForm({ ...form, os: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              {/* Input: Model Name */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_model_name_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.model_name")} *</label>
                <input
                  id="form_modelName"
                  type="text"
                  placeholder="e.g. meta-llama/Llama-3-8B-Instruct"
                  required
                  value={form.modelName}
                  onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.modelName ? "pulse-fill text-accent-amber" : ""}`}
                />
              </div>

              {/* Input: Model Params */}
              <div className="flex flex-col" id="submit_field_model_params_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.model_params")}</label>
                <input
                  id="form_modelParams"
                  type="number"
                  step="any"
                  placeholder="e.g. 8.0"
                  value={form.modelParams}
                  onChange={(e) => setForm({ ...form, modelParams: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              {/* Input: Model Quant */}
              <div className="flex flex-col" id="submit_field_model_quant_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.model_quant")}</label>
                <input
                  id="form_modelQuant"
                  type="text"
                  placeholder="e.g. Q4_K_M"
                  value={form.modelQuant}
                  onChange={(e) => setForm({ ...form, modelQuant: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.modelQuant ? "pulse-fill text-accent-amber" : ""}`}
                />
              </div>

              {/* Input: Weight Source */}
              <div className="flex flex-col sm:col-span-2" id="submit_field_model_source_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.model_source")}</label>
                <input
                  id="form_modelSource"
                  type="url"
                  placeholder="https://huggingface.co/meta-llama/Meta-Llama-3-8B"
                  value={form.modelSource}
                  onChange={(e) => setForm({ ...form, modelSource: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Advanced Run configurations */}
          <div className="glass-card rounded-lg p-3.5 border border-zinc-800 flex flex-col gap-4" id="submit_advanced_settings_card">
            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider pb-2 border-b border-zinc-800/60 font-heading">
              {t("submit.form.fine_tuned_settings")}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="submit_advanced_fields_grid">
              {/* Input: Context size */}
              <div className="flex flex-col" id="submit_field_context_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.context")}</label>
                <input
                  id="form_contextLength"
                  type="number"
                  placeholder="e.g. 4096"
                  value={form.contextLength}
                  onChange={(e) => setForm({ ...form, contextLength: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.contextLength ? "pulse-fill" : ""}`}
                />
              </div>

              {/* Input: Batch size */}
              <div className="flex flex-col" id="submit_field_batch_size_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.batch_size")}</label>
                <input
                  id="form_batchSize"
                  type="number"
                  placeholder="e.g. 512"
                  value={form.batchSize}
                  onChange={(e) => setForm({ ...form, batchSize: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.batchSize ? "pulse-fill" : ""}`}
                />
              </div>

              {/* Input: CPU Threads */}
              <div className="flex flex-col" id="submit_field_threads_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.threads")}</label>
                <input
                  id="form_numThreads"
                  type="number"
                  placeholder="e.g. 16"
                  value={form.numThreads}
                  onChange={(e) => setForm({ ...form, numThreads: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.numThreads ? "pulse-fill" : ""}`}
                />
              </div>

              {/* Input: NGL layer offload */}
              <div className="flex flex-col" id="submit_field_ngl_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.ngl")}</label>
                <input
                  id="form_ngl"
                  type="number"
                  placeholder="e.g. 33"
                  value={form.ngl}
                  onChange={(e) => setForm({ ...form, ngl: e.target.value })}
                  className={`glass-input rounded-md px-2.5 py-1.5 text-xs ${pulseFields.ngl ? "pulse-fill" : ""}`}
                />
              </div>
            </div>

            {/* Accel Optimization Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/40 text-[10px]" id="submit_optimizations_grid">
              <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 hover:text-white py-1" id="submit_label_flash_attn">
                <input
                  id="form_flashAttention"
                  type="checkbox"
                  checked={form.flashAttention}
                  onChange={(e) => setForm({ ...form, flashAttention: e.target.checked })}
                  className="rounded border-zinc-800 text-amber-600 focus:ring-amber-500/50 bg-surface-0 h-4 w-4 cursor-pointer"
                />
                <span className={pulseFields.flashAttention ? "text-accent-amber font-bold" : ""}>{t("submit.form.flash_attn")}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 hover:text-white py-1" id="submit_label_cuda_graphs">
                <input
                  id="form_cudaGraphs"
                  type="checkbox"
                  checked={form.cudaGraphs}
                  onChange={(e) => setForm({ ...form, cudaGraphs: e.target.checked })}
                  className="rounded border-zinc-800 text-amber-600 focus:ring-amber-500/50 bg-surface-0 h-4 w-4 cursor-pointer"
                />
                <span>{t("submit.form.cuda_graphs")}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 hover:text-white py-1" id="submit_label_mla">
                <input
                  id="form_mla"
                  type="checkbox"
                  checked={form.mla}
                  onChange={(e) => setForm({ ...form, mla: e.target.checked })}
                  className="rounded border-zinc-800 text-amber-600 focus:ring-amber-500/50 bg-surface-0 h-4 w-4 cursor-pointer"
                />
                <span>{t("submit.form.mla")}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 hover:text-white py-1" id="submit_label_prefill">
                <input
                  id="form_chunkedPrefill"
                  type="checkbox"
                  checked={form.chunkedPrefill}
                  onChange={(e) => setForm({ ...form, chunkedPrefill: e.target.checked })}
                  className="rounded border-zinc-800 text-amber-600 focus:ring-amber-500/50 bg-surface-0 h-4 w-4 cursor-pointer"
                />
                <span>{t("submit.form.prefill")}</span>
              </label>
            </div>

            {/* Speculative Decoding configurations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800/40" id="submit_speculative_grid">
              {/* Select: Speculative Method */}
              <div className="flex flex-col" id="submit_field_speculative_method_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.speculative_method")}</label>
                <select
                  id="form_speculativeMethod"
                  value={form.speculativeMethod}
                  onChange={(e) => setForm({ ...form, speculativeMethod: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs cursor-pointer"
                >
                  <option value="none">none</option>
                  <option value="mtp">MTP (Multi-Token)</option>
                  <option value="dflash">DFlash (Diffusion)</option>
                  <option value="eagle">EAGLE</option>
                  <option value="draft_model">Draft Model</option>
                </select>
              </div>

              {/* Input: Speculative Steps */}
              {form.speculativeMethod !== "none" && (
                <div className="flex flex-col" id="submit_field_speculative_tokens_group">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.speculative_tokens")}</label>
                  <input
                    id="form_numSpeculativeTokens"
                    type="number"
                    placeholder="e.g. 4"
                    value={form.numSpeculativeTokens}
                    onChange={(e) => setForm({ ...form, numSpeculativeTokens: e.target.value })}
                    className="glass-input rounded-md px-2.5 py-1.5 text-xs"
                  />
                </div>
              )}

              {/* Input: Weight load Precision */}
              <div className="flex flex-col" id="submit_field_load_precision_group">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">{t("submit.form.load_precision")}</label>
                <select
                  id="form_loadPrecision"
                  value={form.loadPrecision}
                  onChange={(e) => setForm({ ...form, loadPrecision: e.target.value })}
                  className="glass-input rounded-md px-2.5 py-1.5 text-xs cursor-pointer"
                >
                  <option value="fp16">fp16</option>
                  <option value="bf16">bf16</option>
                  <option value="fp8">fp8</option>
                  <option value="int4">int4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Action Submit trigger */}
          <button
            id="btn_submit_benchmark_form"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-widest rounded-xl border border-amber-500/20 shadow-lg shadow-amber-600/20 transition duration-150 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Gauge className="w-4 h-4 animate-spin" />
                {t("global.loaders.submitting")}
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                {t("submit.form.btn_publish")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
