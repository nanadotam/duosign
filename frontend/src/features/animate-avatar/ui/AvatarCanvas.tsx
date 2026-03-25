"use client";

/**
 * AvatarCanvas — Three.js VRM rendering component
 * =================================================
 * Mounts the Three.js renderer, loads the VRM model,
 * and plays pose/video sequences. Supports two render modes:
 *   - "avatar" (video engine): video → MediaPipe → Kalidokit → VRM
 *   - "skeleton" (pose engine): .pose binary → Kalidokit → VRM
 * Resizes to fit parent container.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAvatarRenderer } from "../model/useAvatarRenderer";
import { useVRM } from "../model/useVRM";
import { usePosePlayer } from "../model/usePosePlayer";
import { useVideoEngine } from "../model/useVideoEngine";
import { syncRigSpeed } from "../lib/rigConfigSync";
import { useSettings } from "@/shared/hooks/useSettings";
import { BoneDebugOverlay } from "./BoneDebugOverlay";
import type {
  ViewMode,
  AvatarDebugStats,
  AvatarDisplayMode,
  PlaybackState,
} from "@/entities/avatar/types";

interface AvatarCanvasProps {
  viewMode: ViewMode;
  avatarPath: string;
  glossSequence: string[];
  playbackState: PlaybackState;
  renderMode: AvatarDisplayMode;
  /** Playback speed multiplier (0.5 | 1 | 1.5 | 2) from the speed cycle button */
  speed?: number;
  /** Solid background color for the Three.js scene (e.g. "#1a1a1a"). Null/undefined = transparent. */
  backgroundColor?: string | null;
  onDebugStats?: (stats: AvatarDebugStats) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  /** Fires once — after Three.js canvas exists AND VRM has fully loaded */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  /** Fires when the gloss sequence finishes playing (engine stops naturally) */
  onPlaybackComplete?: () => void;
  className?: string;
}

export default function AvatarCanvas({
  viewMode,
  avatarPath,
  glossSequence,
  playbackState,
  renderMode = "avatar",
  speed = 1,
  backgroundColor,
  onDebugStats,
  onCanvasReady,
  onPlaybackComplete,
  className = "",
}: AvatarCanvasProps) {
  const canvasReadyFiredRef = useRef(false);
  const engineWasPlayingRef = useRef(false);
  const { settings } = useSettings();
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

  // Pose engine (skeleton mode)
  const posePlayer = usePosePlayer({
    vrm,
    viewMode: currentViewMode,
    modelName,
    fps,
  });

  // Video engine (avatar mode) — falls back to pose engine when video is missing
  const videoEngine = useVideoEngine({
    vrm,
    viewMode: currentViewMode,
    modelName,
    fps,
    fallbackPlayGloss: posePlayer.playGloss,
  });

  // Pick active engine based on render mode
  const activeEngine = renderMode === "avatar" ? videoEngine : posePlayer;

  // Sync animation speed from settings into the rig config whenever it changes
  useEffect(() => {
    syncRigSpeed(settings.animationSpeed);
  }, [settings.animationSpeed]);

  // Sync speed from playback bar cycle button into both engines
  useEffect(() => {
    videoEngine.setSpeed(speed);
    syncRigSpeed(speed * 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  // Set Three.js scene background for export recording (null = transparent)
  useEffect(() => {
    if (!scene) return;
    if (backgroundColor) {
      scene.background = new THREE.Color(backgroundColor);
    } else {
      scene.background = null;
    }
  }, [scene, backgroundColor]);

  const debugBonesEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "bones";

  // Fire onCanvasReady once BOTH the Three.js canvas exists AND the VRM is loaded.
  // Waiting for vrm prevents starting recording while the avatar is in T-pose.
  useEffect(() => {
    if (!onCanvasReady || canvasReadyFiredRef.current) return;
    if (isLoading || !vrm) return; // VRM not ready yet
    const canvas = (containerRef.current as HTMLDivElement | null)?.querySelector("canvas");
    if (canvas) {
      canvasReadyFiredRef.current = true;
      onCanvasReady(canvas as HTMLCanvasElement);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCanvasReady, vrm, isLoading]);

  // Detect when the engine finishes playing naturally (sequence complete)
  useEffect(() => {
    if (!onPlaybackComplete) return;
    if (engineWasPlayingRef.current && !activeEngine.isPlaying && playbackState === "playing") {
      onPlaybackComplete();
    }
    engineWasPlayingRef.current = activeEngine.isPlaying;
  }, [activeEngine.isPlaying, onPlaybackComplete, playbackState]);

  // Sync view mode from parent
  useEffect(() => {
    if (viewMode !== currentViewMode) {
      setViewMode(viewMode);
    }
  }, [viewMode, currentViewMode, setViewMode]);

  // Report debug stats from the active engine to parent
  useEffect(() => {
    onDebugStats?.(activeEngine.debugStats);
  }, [activeEngine.debugStats, onDebugStats]);

  // Handle playback trigger
  useEffect(() => {
    if (playbackState === "playing" && glossSequence.length > 0 && vrm && !activeEngine.isPlaying) {
      activeEngine.playSequence(glossSequence);
    } else if (playbackState === "paused" && activeEngine.isPlaying && !activeEngine.isPaused) {
      activeEngine.pause();
    } else if (playbackState === "playing" && activeEngine.isPlaying && activeEngine.isPaused) {
      activeEngine.resume();
    } else if ((playbackState === "idle" || playbackState === "complete") && activeEngine.isPlaying) {
      activeEngine.stop();
    }
  }, [activeEngine, glossSequence, playbackState, vrm]);

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

      {/* Bone debug overlay — enabled by ?debug=bones */}
      <BoneDebugOverlay vrm={vrm} enabled={debugBonesEnabled} />
    </div>
  );
}
