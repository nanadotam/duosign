"use client";

import { useState } from "react";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import { SPEED_LABELS } from "@/shared/constants";
import type { PlaybackState, PlaybackSpeed } from "@/entities/avatar/types";
import type { AvatarDisplayMode } from "@/entities/avatar/types";

interface AvatarPanelProps {
  playbackState: PlaybackState;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onCycleSpeed: () => void;
  hasTokens: boolean;
}

export default function AvatarPanel({
  playbackState,
  speed,
  onTogglePlay,
  onPrev,
  onNext,
  onReplay,
  onCycleSpeed,
  hasTokens,
}: AvatarPanelProps) {
  const [displayMode, setDisplayMode] = useState<AvatarDisplayMode>("avatar");
  const isLive = playbackState === "playing";
  const isReady = hasTokens;

  const statusText = {
    idle: "Avatar — Idle",
    playing: "Avatar — Signing",
    paused: "Avatar — Paused",
    complete: "Avatar — Complete",
  }[playbackState];

  return (
    <div className="bg-surface border border-border rounded-panel shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)] flex flex-col overflow-hidden transition-all duration-250">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border transition-all duration-250">
        <div className="flex items-center gap-[7px] text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
          <div
            className={[
              "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-250",
              isLive
                ? "bg-success shadow-[0_0_6px_var(--success)] animate-[blink_1.8s_ease-in-out_infinite]"
                : "bg-border-hi",
            ].join(" ")}
          />
          {statusText}
        </div>
        <div className="flex items-center gap-[7px]">
          <SegmentedControl
            options={["Avatar", "Skeleton"]}
            value={displayMode === "avatar" ? "Avatar" : "Skeleton"}
            onChange={(val) => setDisplayMode(val === "Avatar" ? "avatar" : "skeleton")}
            size="sm"
          />
          <button
            className="w-[27px] h-[27px] rounded-[7px] border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-100 hover:text-text-1 hover:border-border-hi active:shadow-inset-press active:translate-y-px"
            title="Fullscreen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Avatar Canvas Area */}
      <div className="flex-1 flex items-center justify-center relative min-h-[420px] overflow-hidden transition-all duration-250"
        style={{ background: "var(--av-glow), var(--surface)" }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 transition-opacity duration-250"
          style={{
            backgroundImage: "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "var(--grid-fade)",
            WebkitMaskImage: "var(--grid-fade)",
          }}
        />

        {/* Ghost Avatar Placeholder */}
        <div
          className={[
            "flex flex-col items-center gap-4 z-[1] transition-opacity duration-300",
            isLive ? "opacity-[0.22]" : "opacity-100",
          ].join(" ")}
        >
          <div className="w-[110px] h-[150px] bg-gradient-to-b from-surface-3 to-surface-2 rounded-[55px_55px_38px_38px] border border-border-hi shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.04)] relative overflow-hidden transition-all duration-250">
            {/* Head */}
            <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-surface-3 border border-border-hi" />
            {/* Body */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[74px] h-[55px] rounded-t-[37px] bg-surface-3 border border-border-hi" />
          </div>
          <div className="text-text-3 text-[12.5px] text-center max-w-[190px] leading-relaxed transition-colors duration-250">
            Your sign language animation will appear here
          </div>
        </div>

        {/* Now Signing Badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-success/10 border border-success/25 text-[10px] font-bold tracking-[0.08em] uppercase text-success">
            <div className="w-[5px] h-[5px] rounded-full bg-success animate-[blink_1s_infinite]" />
            Now Signing
          </div>
        )}

        {/* Playback Bar */}
        <div
          className={[
            "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-[7px]",
            "px-2.5 py-1 rounded-pill border border-border-hi backdrop-blur-[10px]",
            "shadow-raised transition-all duration-200",
            isReady
              ? "opacity-100 pointer-events-auto"
              : "opacity-[0.35] pointer-events-none",
          ].join(" ")}
          style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}
        >
          {/* Prev */}
          <button
            onClick={onPrev}
            className="w-[30px] h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
            title="Previous"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full border border-accent-dim bg-gradient-to-b from-accent-btn-top to-accent-dim text-white flex items-center justify-center cursor-pointer shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_3px_10px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-all duration-120 hover:brightness-110 active:shadow-inset-press active:brightness-[0.92] active:scale-[0.94]"
          >
            {playbackState === "playing" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            className="w-[30px] h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
            title="Next"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-[18px] bg-border mx-px" />

          {/* Replay */}
          <button
            onClick={onReplay}
            className="w-[30px] h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
            title="Replay"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
          </button>

          {/* Speed Chip */}
          <button
            onClick={onCycleSpeed}
            className="px-2 py-0.5 rounded-[5px] font-mono text-[10px] font-medium bg-surface-3 border border-border text-text-3 cursor-pointer shadow-inset transition-all duration-100 hover:text-text-2 active:shadow-inset-press active:translate-y-px"
          >
            {SPEED_LABELS[speed]}
          </button>
        </div>
      </div>
    </div>
  );
}
