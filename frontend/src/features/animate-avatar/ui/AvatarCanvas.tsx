"use client";

/**
 * AvatarCanvas — Three.js VRM rendering component
 * =================================================
 * Mounts the Three.js renderer, loads the VRM model,
 * and plays pose sequences. Resizes to fit parent container.
 */

import { useEffect } from "react";
import { useAvatarRenderer } from "../model/useAvatarRenderer";
import { useVRM } from "../model/useVRM";
import { usePosePlayer } from "../model/usePosePlayer";
import type { ViewMode, AvatarDebugStats } from "@/entities/avatar/types";

interface AvatarCanvasProps {
  viewMode: ViewMode;
  avatarPath: string;
  glossSequence: string[];
  isPlaying: boolean;
  onDebugStats?: (stats: AvatarDebugStats) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
}

export default function AvatarCanvas({
  viewMode,
  avatarPath,
  glossSequence,
  isPlaying,
  onDebugStats,
  className = "",
}: AvatarCanvasProps) {
  const {
    containerRef,
    scene,
    viewMode: currentViewMode,
    setViewMode,
    fps,
  } = useAvatarRenderer();

  const { vrm, isLoading, error, modelName } = useVRM({
    scene,
    initialPath: avatarPath,
  });

  const posePlayer = usePosePlayer({
    vrm,
    viewMode: currentViewMode,
    modelName,
    fps,
  });

  // Sync view mode from parent
  useEffect(() => {
    if (viewMode !== currentViewMode) {
      setViewMode(viewMode);
    }
  }, [viewMode, currentViewMode, setViewMode]);

  // Report debug stats to parent
  useEffect(() => {
    onDebugStats?.(posePlayer.debugStats);
  }, [posePlayer.debugStats, onDebugStats]);

  // Handle playback trigger
  useEffect(() => {
    if (isPlaying && glossSequence.length > 0 && vrm && !posePlayer.isPlaying) {
      posePlayer.playSequence(glossSequence);
    } else if (!isPlaying && posePlayer.isPlaying) {
      posePlayer.stop();
    }
  }, [isPlaying, glossSequence, vrm, posePlayer]);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`w-full h-full ${className}`}
      style={{ position: "relative" }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
            <span className="text-[11px] text-text-3 font-medium">Loading avatar…</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-error/10 border border-error/30 rounded-[10px] px-4 py-3 max-w-[200px] text-center">
            <span className="text-[11px] text-error font-medium">
              ⚠ {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
