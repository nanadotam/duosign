"use client";

/**
 * SkeletonCanvas — 2D pose skeleton renderer
 * ============================================
 * Passes a stable drawFrame callback to useSkeletonPlayer so the RAF loop
 * draws directly to the canvas — no React state updates per animation frame.
 *
 * Playback is triggered only when playbackState or the gloss sequence
 * identity changes, not when internal player state changes, preventing the
 * infinite restart loop.
 */

import { useRef, useEffect, useCallback, useMemo } from "react";
import { drawSkeleton } from "../lib/skeletonRenderer";
import { useSkeletonPlayer } from "../model/useSkeletonPlayer";
import type { PoseHeaderModel, PoseBodyFrameModel } from "pose-format";
import type { PlaybackState } from "@/entities/avatar/types";

interface SkeletonCanvasProps {
  glossSequence: string[];
  playbackState: PlaybackState;
  loopCount?: number;
  onPlaybackComplete?: () => void;
  /** Receive current gloss label + loop progress for the parent's UI chip */
  onGlossChange?: (gloss: string, currentLoop: number, totalLoops: number) => void;
}

export default function SkeletonCanvas({
  glossSequence,
  playbackState,
  loopCount = 3,
  onPlaybackComplete,
  onGlossChange,
}: SkeletonCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Stable draw callback — RAF loop calls this directly, no state update ──
  const drawFrame = useCallback((
    frame: PoseBodyFrameModel,
    header: PoseHeaderModel,
  ) => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = container.getBoundingClientRect();
    drawSkeleton(ctx, frame, header, width, height);
  }, []);

  const { playSequence, stop, pause, resume, isPlaying, isPaused, currentGloss, currentLoop, totalLoops } =
    useSkeletonPlayer(drawFrame, onPlaybackComplete);

  // Notify parent when the current gloss or loop changes (for the signing chip)
  useEffect(() => {
    onGlossChange?.(currentGloss, currentLoop, totalLoops);
  }, [currentGloss, currentLoop, totalLoops, onGlossChange]);

  // ── Canvas resize — reset transform before scaling to prevent stacking ────
  const resizeCanvas = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width        = width  * dpr;
    canvas.height       = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scaling
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // ── Stable key so the play effect only fires when the sequence changes ─────
  // Using a string key avoids the effect re-running on every render even if
  // the array reference changed but the content is the same.
  const sequenceKey = useMemo(() => glossSequence.join(","), [glossSequence]);

  // ── Trigger playback — depends on playbackState + sequence content only ───
  // Intentionally excludes isPlaying/isPaused from deps to avoid the
  // infinite loop where setIsPlaying(true) re-triggers this effect.
  useEffect(() => {
    if (playbackState === "playing" && glossSequence.length > 0) {
      playSequence(glossSequence, loopCount);
    } else if (playbackState === "idle" || playbackState === "complete") {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState, sequenceKey]);

  // ── Pause / resume ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    if (playbackState === "paused" && !isPaused) pause();
    if (playbackState === "playing" && isPaused)  resume();
  }, [playbackState, isPlaying, isPaused, pause, resume]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
