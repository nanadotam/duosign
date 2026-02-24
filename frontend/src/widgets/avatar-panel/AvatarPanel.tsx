"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import { SPEED_LABELS, AVATAR_MODELS } from "@/shared/constants";
import type {
  PlaybackState,
  PlaybackSpeed,
  ViewMode,
  AvatarDebugStats,
  AvatarModel,
  AvatarDisplayMode,
} from "@/entities/avatar/types";

// Dynamic imports for Three.js components (avoid SSR)
const AvatarCanvas = dynamic(
  () => import("@/features/animate-avatar/ui/AvatarCanvas"),
  { ssr: false }
);
const StatsForNerds = dynamic(
  () => import("@/features/animate-avatar/ui/StatsForNerds"),
  { ssr: false }
);
const AvatarSwitcher = dynamic(
  () => import("@/features/animate-avatar/ui/AvatarSwitcher"),
  { ssr: false }
);

interface AvatarPanelProps {
  playbackState: PlaybackState;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onCycleSpeed: () => void;
  hasTokens: boolean;
  glossSequence?: string[];
}

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  interpreter: "Close-up",
  fullbody: "Full Body",
  world: "3D World",
};

export default function AvatarPanel({
  playbackState,
  speed,
  onTogglePlay,
  onPrev,
  onNext,
  onReplay,
  onCycleSpeed,
  hasTokens,
  glossSequence = [],
}: AvatarPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("interpreter");
  const [renderMode, setRenderMode] = useState<AvatarDisplayMode>("avatar");
  const [currentModel, setCurrentModel] = useState<AvatarModel>(AVATAR_MODELS[0]);
  const [showStats, setShowStats] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugStats, setDebugStats] = useState<AvatarDebugStats>({
    fps: 0,
    frameIndex: 0,
    totalFrames: 0,
    currentGloss: "",
    poseConfidence: 0,
    leftHandConfidence: 0,
    rightHandConfidence: 0,
    viewMode: "interpreter",
    modelName: "",
    renderTimeMs: 0,
    poseLoadTimeMs: 0,
    totalGlosses: 0,
    currentGlossIndex: 0,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const isLive = playbackState === "playing";
  const isReady = hasTokens;

  const statusText = {
    idle: "Avatar — Idle",
    playing: "Avatar — Signing",
    paused: "Avatar — Paused",
    complete: "Avatar — Complete",
  }[playbackState];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") {
        setOverlayVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!panelRef.current) return;
    if (!document.fullscreenElement) {
      panelRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleDebugStats = useCallback((stats: AvatarDebugStats) => {
    setDebugStats(stats);
  }, []);

  const handleModelSelect = useCallback((model: AvatarModel) => {
    setCurrentModel(model);
  }, []);

  // Memoize gloss names from sequence
  const glossNames = useMemo(
    () => glossSequence.map((g) => g.toUpperCase().replace(/\s+/g, "_")),
    [glossSequence]
  );

  return (
    <div
      ref={panelRef}
      className={[
        "bg-surface border border-border rounded-panel",
        "shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)]",
        "flex flex-col overflow-hidden transition-all duration-250",
        isFullscreen ? "!fixed !inset-0 !z-50 !rounded-none !border-none" : "",
      ].join(" ")}
    >
      {/* Panel Header — part of overlay */}
      {overlayVisible && (
        <div className="flex items-center justify-between px-3 py-2 lg:px-4 lg:py-3 bg-surface-2 border-b border-border transition-all duration-250">
          <div className="flex items-center gap-[5px] lg:gap-[7px] text-[9.5px] lg:text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
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
          <div className="flex items-center gap-[5px] lg:gap-[7px]">
            {/* View Mode Toggle */}
            <SegmentedControl
              options={["Close-up", "Full Body", "3D World"]}
              value={VIEW_MODE_LABELS[viewMode]}
              onChange={(val) => {
                const mode = Object.entries(VIEW_MODE_LABELS).find(
                  ([, label]) => label === val
                )?.[0] as ViewMode;
                if (mode) setViewMode(mode);
              }}
              size="sm"
            />

            {/* Stats toggle */}
            <button
              onClick={() => setShowStats((prev) => !prev)}
              className={[
                "w-[24px] h-[24px] lg:w-[27px] lg:h-[27px] rounded-[6px] lg:rounded-[7px] border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-100 hover:text-text-1 hover:border-border-hi active:shadow-inset-press active:translate-y-px",
                showStats ? "!border-accent !text-accent" : "",
              ].join(" ")}
              title="Stats for Nerds"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </button>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="w-[24px] h-[24px] lg:w-[27px] lg:h-[27px] rounded-[6px] lg:rounded-[7px] border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-100 hover:text-text-1 hover:border-border-hi active:shadow-inset-press active:translate-y-px"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Avatar Canvas Area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden transition-all duration-250"
        style={{
          background: "var(--av-glow), var(--surface)",
          minHeight: isFullscreen ? "100vh" : "min(50dvh, 55vh)",
        }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 transition-opacity duration-250"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "var(--grid-fade)",
            WebkitMaskImage: "var(--grid-fade)",
          }}
        />

        {/* Three.js Canvas */}
        <div className="absolute inset-0 z-[1]">
          <AvatarCanvas
            viewMode={viewMode}
            avatarPath={currentModel.path}
            glossSequence={glossNames}
            isPlaying={isLive}
            renderMode={renderMode}
            onDebugStats={handleDebugStats}
          />
        </div>

        {/* Stats for Nerds overlay */}
        <StatsForNerds stats={debugStats} visible={showStats} />

        {/* Avatar Switcher — part of overlay */}
        <AvatarSwitcher
          models={AVATAR_MODELS}
          currentModelId={currentModel.id}
          onSelect={handleModelSelect}
          visible={overlayVisible}
        />

        {/* Now Signing Badge — part of overlay */}
        {isLive && overlayVisible && (
          <div className="absolute top-2 left-2 lg:top-3 lg:left-3 flex items-center gap-1.5 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-pill bg-success/10 border border-success/25 text-[9px] lg:text-[10px] font-bold tracking-[0.08em] uppercase text-success z-10">
            <div className="w-[5px] h-[5px] rounded-full bg-success animate-[blink_1s_infinite]" />
            Now Signing
          </div>
        )}

        {/* Render Mode Toggle — Avatar vs Skeleton */}
        {overlayVisible && (
          <div className="absolute top-2 right-10 z-10 flex gap-1">
            {(["avatar", "skeleton"] as AvatarDisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRenderMode(mode)}
                className={[
                  "text-[9px] lg:text-[10px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-pill border transition-all duration-150 cursor-pointer",
                  renderMode === mode
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border-hi text-text-3 bg-surface-2/80 hover:text-text-1",
                ].join(" ")}
              >
                {mode === "avatar" ? "Avatar" : "Skeleton"}
              </button>
            ))}
          </div>
        )}

        {/* Gloss Subtitle Bar — part of overlay */}
        {debugStats.currentGloss && overlayVisible && (
          <div className="absolute bottom-14 lg:bottom-16 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-pill border border-border-hi backdrop-blur-[8px]"
            style={{ background: "color-mix(in srgb, var(--surface) 80%, transparent)" }}
          >
            <span className="font-mono text-[12px] lg:text-[14px] font-bold text-text-1 tracking-[0.05em]">
              {debugStats.currentGloss}
            </span>
          </div>
        )}

        {/* Overlay toggle — always visible */}
        <button
          onClick={() => setOverlayVisible((prev) => !prev)}
          className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full border border-border-hi bg-surface-2/80 backdrop-blur-[4px] text-text-3 flex items-center justify-center cursor-pointer transition-all duration-150 hover:text-text-1 hover:bg-surface-3"
          title={overlayVisible ? "Hide overlay (H)" : "Show overlay (H)"}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {overlayVisible ? (
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
        </button>

        {/* Playback Bar — part of overlay */}
        {overlayVisible && (
          <div
            className={[
              "absolute bottom-2 lg:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-[5px] lg:gap-[7px]",
              "px-1.5 py-0.5 lg:px-2.5 lg:py-1 rounded-pill border border-border-hi backdrop-blur-[10px]",
              "shadow-raised transition-all duration-200 z-10",
              isReady
                ? "opacity-100 pointer-events-auto"
                : "opacity-[0.35] pointer-events-none",
            ].join(" ")}
            style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}
          >
            {/* Prev */}
            <button
              onClick={onPrev}
              className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
              title="Previous"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-[30px] h-[30px] lg:w-9 lg:h-9 rounded-full text-white flex items-center justify-center cursor-pointer transition-all duration-120 hover:brightness-110 active:brightness-[0.92] active:scale-[0.94]"
              style={{
                background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                border: "1px solid var(--accent-dim)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              {playbackState === "playing" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
              title="Next"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-[14px] lg:h-[18px] bg-border mx-px" />

            {/* Replay */}
            <button
              onClick={onReplay}
              className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.93]"
              title="Replay"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4" />
              </svg>
            </button>

            {/* Speed Chip */}
            <button
              onClick={onCycleSpeed}
              className="px-1.5 py-0.5 rounded-[5px] font-mono text-[9px] lg:text-[10px] font-medium bg-surface-3 border border-border text-text-3 cursor-pointer shadow-inset transition-all duration-100 hover:text-text-2 active:shadow-inset-press active:translate-y-px"
            >
              {SPEED_LABELS[speed]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
