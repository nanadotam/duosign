import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-hi": "var(--border-hi)",
        "text-1": "var(--text-1)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
        "accent-btn-top": "var(--accent-btn-top)",
        teal: "var(--teal)",
        success: "var(--success)",
        error: "var(--error)",
      },
      borderRadius: {
        panel: "18px",
        btn: "9px",
        pill: "999px",
      },
      fontFamily: {
        serif: ["var(--font-dm-serif)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        inset: "var(--inset)",
        "inset-press": "var(--inset-press)",
        raised: "var(--raised)",
        "raised-sm": "var(--raised-sm)",
        "raised-press": "var(--raised-press)",
      },
      transitionDuration: {
        "120": "120ms",
      },
    },
  },
  plugins: [],
};
export default config;
