"use client";

/**
 * SkeletonCanvas — 2D pose skeleton renderer
 * ============================================
 * Renders .pose files as colored joints & bones on an HTML5 canvas,
 * matching the default pose-format visualizer style.
 */

import { useRef, useEffect, useCallback } from "react";
import { drawSkeleton } from "../lib/skeletonRenderer";
import { useSkeletonPlayer } from "../model/useSkeletonPlayer";
import type { AvatarDebugStats } from "@/entities/avatar/types";

interface SkeletonCanvasProps {
  glossSequence: string[];
  isPlaying: boolean;
  onDebugStats?: (stats: AvatarDebugStats) => void;
}

export default function SkeletonCanvas({
  glossSequence,
  isPlaying,
  onDebugStats,
}: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { playSequence, stop, isPlaying: playerIsPlaying, debugStats, currentFrame, currentHeader } =
    useSkeletonPlayer();

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Start/stop playback when isPlaying or glossSequence changes
  useEffect(() => {
    if (isPlaying && glossSequence.length > 0) {
      playSequence(glossSequence);
    } else if (!isPlaying && playerIsPlaying) {
      stop();
    }
  }, [isPlaying, glossSequence, playSequence, stop, playerIsPlaying]);

  // Report debug stats up
  useEffect(() => {
    onDebugStats?.(debugStats);
  }, [debugStats, onDebugStats]);

  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (currentFrame && currentHeader) {
      drawSkeleton(ctx, currentFrame, currentHeader, rect.width, rect.height);
    } else {
      // Clear to white when no frame
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [currentFrame, currentHeader]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
