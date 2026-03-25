"use client";

import { useEffect } from "react";
import { useSettings } from "@/shared/hooks/useSettings";

/**
 * Full per-accent theme — every CSS variable that references the brand color.
 * Changing accentColorIndex swaps the entire set atomically.
 *
 * Variables applied:
 *   --accent          base colour (interactive text, active indicators)
 *   --accent-dim      darker shade (button fill, active borders)
 *   --accent-glow     low-opacity rgba (focus rings, glow halos)
 *   --accent-btn-top  slightly lighter (top of button gradient)
 */
const ACCENT_THEMES = [
  // 0 — Blue (default)
  {
    accent:    "#5B8EF0",
    dim:       "#3b6bd0",
    glow:      "rgba(91,142,240,0.16)",
    btnTop:    "#6b9cf2",
  },
  // 1 — Teal
  {
    accent:    "#2DD4BF",
    dim:       "#0d9488",
    glow:      "rgba(45,212,191,0.16)",
    btnTop:    "#4de0cb",
  },
  // 2 — Green
  {
    accent:    "#4ADE80",
    dim:       "#16a34a",
    glow:      "rgba(74,222,128,0.16)",
    btnTop:    "#60e890",
  },
  // 3 — Purple
  {
    accent:    "#A78BFA",
    dim:       "#7c3aed",
    glow:      "rgba(167,139,250,0.16)",
    btnTop:    "#b59cfb",
  },
  // 4 — Orange
  {
    accent:    "#FB923C",
    dim:       "#c2410c",
    glow:      "rgba(251,146,60,0.16)",
    btnTop:    "#fc9f5a",
  },
] as const;

/** Flat accent hex list for swatch rendering in settings. */
export const ACCENT_COLORS = ACCENT_THEMES.map((t) => t.accent);

const CAPTION_SIZES: Record<string, string> = {
  Small:        "0.75rem",
  Medium:       "1rem",
  Large:        "1.25rem",
  "Extra Large": "1.5rem",
};

/**
 * SettingsApplicator — applies global CSS variables and classes from AppSettings.
 * Must be rendered inside <SettingsProvider>. Outputs no DOM — returns null.
 */
export function SettingsApplicator() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const theme = ACCENT_THEMES[settings.accentColorIndex] ?? ACCENT_THEMES[0];

    root.style.setProperty("--accent",         theme.accent);
    root.style.setProperty("--accent-dim",     theme.dim);
    root.style.setProperty("--accent-glow",    theme.glow);
    root.style.setProperty("--accent-btn-top", theme.btnTop);

    root.style.setProperty(
      "--caption-font-size",
      CAPTION_SIZES[settings.captionSize] ?? "1rem"
    );
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [
    settings.accentColorIndex,
    settings.captionSize,
    settings.highContrast,
    settings.reduceMotion,
  ]);

  return null;
}
