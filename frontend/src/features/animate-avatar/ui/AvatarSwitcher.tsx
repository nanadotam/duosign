"use client";

/**
 * AvatarSwitcher — Quick-access avatar selection panel
 * =====================================================
 * Row of avatar thumbnails, expandable on demand.
 * Part of the hideable overlay system.
 */

import { useState } from "react";
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

  if (!visible) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20">
      {expanded ? (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[12px] border border-border-hi backdrop-blur-[12px]"
          style={{
            background: "color-mix(in srgb, var(--surface) 85%, transparent)",
            boxShadow: "var(--raised)",
          }}
        >
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model);
                setExpanded(false);
              }}
              className={[
                "w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-150",
                "hover:scale-110 active:scale-95",
                model.id === currentModelId
                  ? "border-accent shadow-[0_0_8px_var(--accent-glow)]"
                  : "border-border-hi hover:border-text-3",
              ].join(" ")}
              style={{
                background: "linear-gradient(135deg, var(--surface-2), var(--surface-3))",
              }}
              title={model.name}
            >
              <span className="text-[11px] font-bold text-text-2">
                {model.name.charAt(0)}
              </span>
            </button>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="w-7 h-7 rounded-full border border-border bg-surface-2 text-text-3 flex items-center justify-center cursor-pointer hover:text-text-1 ml-1"
            title="Close"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill border border-border-hi backdrop-blur-[10px] cursor-pointer shadow-raised-sm transition-all duration-150 hover:border-text-3 active:scale-95"
          style={{
            background: "color-mix(in srgb, var(--surface) 85%, transparent)",
          }}
          title="Switch Avatar"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-3"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-semibold text-text-3 tracking-wide">
            Avatars
          </span>
        </button>
      )}
    </div>
  );
}
