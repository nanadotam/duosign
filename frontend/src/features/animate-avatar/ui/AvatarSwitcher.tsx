"use client";

/**
 * AvatarSwitcher — inline avatar picker for the playback bar
 * ===========================================================
 * Renders as a compact button inside the playback bar.
 * Expands into a floating model picker above the bar on click.
 */

import { useState, useEffect, useRef } from "react";
import type { AvatarModel } from "@/entities/avatar/types";

interface AvatarSwitcherProps {
  models: AvatarModel[];
  currentModelId: string;
  onSelect: (model: AvatarModel) => void;
  visible: boolean;
}

export default function AvatarSwitcher({
  models,
  currentModelId,
  onSelect,
  visible,
}: AvatarSwitcherProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expanded]);

  if (!visible) return null;

  const current = models.find((m) => m.id === currentModelId) ?? models[0];

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Compact trigger button — matches playback bar button style */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={[
          "w-[26px] h-[26px] lg:w-[30px] lg:h-[30px] rounded-full border flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 active:shadow-inset-press active:scale-[0.93]",
          expanded
            ? "border-accent text-accent bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-2))]"
            : "border-border-hi bg-surface-2 text-text-2 hover:text-text-1 hover:bg-surface-3",
        ].join(" ")}
        title="Switch avatar"
      >
        <span className="text-[9px] lg:text-[10px] font-bold leading-none select-none">
          {current.name.charAt(0)}
        </span>
      </button>

      {/* Expanded picker — floats above the bar */}
      {expanded && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 flex items-center gap-1.5 px-2.5 py-2 rounded-[12px] border border-border-hi backdrop-blur-[12px] shadow-raised"
          style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)" }}
        >
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model);
                setExpanded(false);
              }}
              className={[
                "w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95",
                model.id === currentModelId
                  ? "border-accent shadow-[0_0_8px_var(--accent-glow)]"
                  : "border-border-hi hover:border-text-3",
              ].join(" ")}
              style={{ background: "linear-gradient(135deg, var(--surface-2), var(--surface-3))" }}
              title={model.name}
            >
              <span className="text-[11px] font-bold text-text-2 select-none">
                {model.name.charAt(0)}
              </span>
            </button>
          ))}
          {/* Arrow pointing down */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b border-border-hi -mt-1"
            style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)" }}
          />
        </div>
      )}
    </div>
  );
}
