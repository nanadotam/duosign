"use client";

/**
 * StatsForNerds — Debug overlay panel
 * ====================================
 * Shows real-time avatar rendering statistics.
 * Togglable, semi-transparent overlay.
 */

import type { AvatarDebugStats } from "@/entities/avatar/types";

interface StatsForNerdsProps {
  stats: AvatarDebugStats;
  visible: boolean;
}

export default function StatsForNerds({ stats, visible }: StatsForNerdsProps) {
  if (!visible) return null;

  const rows = [
    ["FPS", stats.fps.toString()],
    ["Frame", `${stats.frameIndex} / ${stats.totalFrames}`],
    ["Render", `${stats.renderTimeMs.toFixed(1)}ms`],
    ["Pose Load", `${stats.poseLoadTimeMs.toFixed(0)}ms`],
    ["Gloss", stats.currentGloss || "—"],
    ["Gloss #", stats.totalGlosses > 0 ? `${stats.currentGlossIndex + 1} / ${stats.totalGlosses}` : "—"],
    ["Pose Conf", stats.poseConfidence.toFixed(2)],
    ["L Hand", stats.leftHandConfidence.toFixed(2)],
    ["R Hand", stats.rightHandConfidence.toFixed(2)],
    ["View", stats.viewMode],
    ["Model", stats.modelName || "—"],
  ];

  return (
    <div
      className="absolute top-2 right-2 z-20 pointer-events-none select-none"
      style={{
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(6px)",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 10px",
        minWidth: "160px",
      }}
    >
      <div
        className="text-[9px] font-bold tracking-[0.1em] uppercase mb-1.5"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        Stats for Nerds
      </div>
      <div className="flex flex-col gap-[2px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span
              className="font-mono text-[10px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {label}
            </span>
            <span
              className="font-mono text-[10px] text-right"
              style={{
                color:
                  label === "FPS"
                    ? stats.fps >= 30
                      ? "#4ade80"
                      : stats.fps >= 15
                      ? "#facc15"
                      : "#f87171"
                    : "rgba(255,255,255,0.75)",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
