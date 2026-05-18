# LLMDB Style Guide & Reusable Components Specification

This document defines the **Cyberglass Dark-Mode Design System** and provides exact specifications for reusable components across the **LLM Benchmarks Database (llmdb)**. Use this specification to ensure complete visual cohesion when building pages or translating HTML mockups into React/Next.js component trees.

---

## 🎨 1. Core Visual Tokens & Colors

Our design system utilizes a high-reflectivity, semi-transparent "cyberglass" aesthetic laid over a deep radial starry dark backdrop.

### A. Color Palette

| Token | CSS Variable / Tailwind | Hex Value | Purpose / Context |
| :--- | :--- | :--- | :--- |
| **Deep Space (BG)** | `bg-slate-950` / Radial Gradient | `#030712` to `#111827` | Main page background |
| **Glass Backdrop** | `rgba(15, 23, 42, 0.45)` | `#0f172a` @ 45% opacity | Card, modal, and panel backdrops |
| **Glass Input** | `rgba(3, 7, 18, 0.60)` | `#030712` @ 60% opacity | Search inputs, form text fields |
| **Cyber Indigo** | `from-indigo-600 to-violet-600` | `#4f46e5` to `#7c3aed` | Branding accents, Primary CTAs, Prompt Eval stats |
| **Neon Emerald** | `text-emerald-400` | `#34d399` | Token generation speed stats, Success indicator rings |
| **Bright Violet** | `text-violet-400` | `#a78bfa` | Latency (TTFT) metrics, Trust rating bars |
| **Sky Blue** | `text-sky-400` | `#38bdf8` | Hardware config loaded signals, Chunked prefill indicators |
| **Soft Border** | `rgba(255, 255, 255, 0.05)` | `#ffffff` @ 5% opacity | Default card and button outlines |

### B. Glassmorphism Core Classes
Ensure these classes are declared globally in `index.css`:
```css
/* Semi-transparent panel with reflective outline */
.glass-card {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Slick inputs with darker glass and focus outline */
.glass-input {
  background: rgba(3, 7, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}
.glass-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.6);
  background: rgba(3, 7, 18, 0.8);
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
}
```

---

## 📐 2. Typography

We enforce a dual-font scale: **Outfit** for clean, futuristic sci-fi headings and branding, and **Inter** for high-readability telemetry digits and code.

*   **Primary Font (Inter)**: Body text, description copy, metadata blocks, and raw logs.
*   **Heading Font (Outfit)**: Dashboard headings, section numbers, performance metrics, and landing banner titles.

---

## 🧩 3. Reusable UI Components

### A. KPI Telemetry Summary Card
Displays key statistics at the top of landing or exploration views.
```html
<div class="glass-card rounded-2xl p-4 flex flex-col justify-between">
  <!-- Title label -->
  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Peak Token Gen</span>
  <!-- Telemetry Value -->
  <div class="flex items-baseline space-x-1.5 mt-2">
    <span class="text-2xl font-heading font-extrabold text-emerald-400">342.5</span>
    <span class="text-xs text-slate-400 font-semibold">tok/s</span>
  </div>
</div>
```

### B. Interactive Engine Selection Chip
Toggles active runtime runtime filters.
*   **Active State**: `bg-indigo-600 text-white border-indigo-500/20 shadow-indigo-600/10`
*   **Inactive State**: `bg-slate-900 text-slate-400 border-slate-800`
```html
<button 
  type="button" 
  class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition-all"
>
  llama.cpp
</button>
```

### C. Inference Performance Grid Block
Standard 3-column performance metrics block displayed inside benchmark cards.
```html
<div class="grid grid-cols-3 gap-3 bg-slate-950/30 rounded-xl p-3 border border-slate-900/40">
  <div class="flex flex-col">
    <span class="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Gen Speed</span>
    <div class="flex items-baseline space-x-0.5 mt-0.5">
      <span class="text-lg font-heading font-black text-emerald-400">82.5</span>
      <span class="text-[9px] text-slate-500 font-bold">t/s</span>
    </div>
  </div>
  <div class="flex flex-col">
    <span class="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Prompt Eval</span>
    <div class="flex items-baseline space-x-0.5 mt-0.5">
      <span class="text-sm font-heading font-extrabold text-indigo-400">1,637</span>
      <span class="text-[9px] text-slate-500 font-bold">t/s</span>
    </div>
  </div>
  <div class="flex flex-col">
    <span class="text-[8px] uppercase font-bold text-slate-500 tracking-wider">TTFT Latency</span>
    <div class="flex items-baseline space-x-0.5 mt-0.5">
      <span class="text-sm font-heading font-extrabold text-violet-400">45</span>
      <span class="text-[9px] text-slate-500 font-bold">ms</span>
    </div>
  </div>
</div>
```

### D. Cyber-Toggle Switch
Sleek toggle switch representing binary acceleration settings (e.g. MLA, Flash Attention).
```html
<label class="flex items-center space-x-2.5 cursor-pointer py-1.5 text-xs text-slate-300 hover:text-white select-none">
  <input 
    type="checkbox" 
    class="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500/50 bg-slate-950 h-4 w-4 cursor-pointer"
  >
  <span>MLA Attention</span>
</label>
```

### E. Trust Score Bar
Visual representation of benchmark confidence level.
```html
<div class="flex items-center gap-1.5">
  <div class="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
    <div class="h-full bg-indigo-500 rounded-full" style="width: 90%"></div>
  </div>
  <span class="text-[9px] font-mono text-slate-500 font-bold">90% Trust</span>
</div>
```

### F. Terminal Log Console Screen
Highly detailed stderr timing console viewer.
```html
<pre class="w-full h-52 glass-input p-4 rounded-xl text-[10px] font-mono overflow-auto cyber-scrollbar whitespace-pre text-slate-300">
system_info: n_threads = 16 / 32 | AVX = 1 | AVX2 = 1 | CUDA = 1 | 
llama_print_timings: prompt eval time =     312.80 ms /   512 tokens
llama_print_timings:        eval time =    3102.50 ms /   256 runs
</pre>
```

---

## 💫 4. Micro-Animations & Visual Cues

To keep the database interface alive and responsive, use these animation definitions:

### A. Auto-Fill Pulse Outline
Flashes a glowing ring when variables are populated from copy-pasted logs.
```css
.pulse-fill {
  animation: fieldPulse 1s ease-in-out infinite alternate;
}

@keyframes fieldPulse {
  0% {
    box-shadow: 0 0 4px rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }
  100% {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
    border-color: rgba(99, 102, 241, 0.6);
  }
}
```

### B. Explore Card Lift
Smoothly lifts and glows community cards upon mouse hover.
```css
.glass-card-hover {
  transition: all 0.30s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-card-hover:hover {
  transform: translateY(-4px);
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.25);
}
```
