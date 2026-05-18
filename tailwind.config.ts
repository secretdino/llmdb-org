import type { Config } from "tailwindcss";

/**
 * Tailwind Configuration — Premium Editorial Design System
 * Extends the default theme with custom color tokens, shadow
 * elevations, and font family mappings for the LLMDB dashboard.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* Custom color tokens for the premium warm/cool palette */
      colors: {
        background: "var(--surface-0)",
        foreground: "var(--foreground)",
        /* Surface elevation scale */
        "surface-0": "#09090b",
        "surface-1": "#111114",
        "surface-2": "#18181c",
        "surface-3": "#1f1f24",
        /* Accent palette */
        "accent-amber": "#e8a951",
        "accent-amber-hover": "#f0b96a",
        "accent-teal": "#2dd4bf",
        "accent-lavender": "#c4b5fd",
      },
      /* Premium card elevation shadow system */
      boxShadow: {
        "card-sm": "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 1px 3px 0 rgba(0,0,0,0.3)",
        "card-md": "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 4px 16px -4px rgba(0,0,0,0.4)",
        "card-lg": "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -8px rgba(0,0,0,0.5)",
        "amber-glow": "0 0 20px rgba(232,169,81,0.1)",
        "teal-glow": "0 0 20px rgba(45,212,191,0.08)",
      },
      /* Font family mapping for heading vs body */
      fontFamily: {
        heading: ["var(--font-outfit)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
