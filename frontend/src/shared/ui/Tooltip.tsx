"use client";

import { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

/**
 * Lightweight CSS-only tooltip — no JS, no portal.
 * Wraps any element; shows a styled label on hover/focus-within.
 */
export function Tooltip({ label, children, side = "bottom" }: TooltipProps) {
  return (
    <div className="relative group/tip flex items-center justify-center">
      {children}
      <span
        role="tooltip"
        className={[
          // Layout & positioning
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-[999] whitespace-nowrap",
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
          // Appearance — matches app surface tokens
          "px-2 py-[5px] rounded-[7px] text-[10.5px] font-medium leading-none",
          "bg-[var(--surface-3)] border border-[var(--border-hi)] text-[var(--text-1)]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
          // Visibility
          "opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}
