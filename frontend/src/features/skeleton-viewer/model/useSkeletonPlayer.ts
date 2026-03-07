"use client";

/**
 * useSkeletonPlayer — Play .pose files as 2D skeleton animation
 * ==============================================================
 * Fetches binary .pose files, parses them with the pose-format library
 * (Pose.from(buffer)), and drives frame-by-frame playback on a canvas
 * via requestAnimationFrame.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Buffer } from "buffer";
import type {
  PoseHeaderModel,
  PoseBodyFrameModel,
} from "pose-format";
import type { AvatarDebugStats } from "@/entities/avatar/types";

interface ParsedPose {
  gloss: string;
  header: PoseHeaderModel;
  frameCount: number;
  fps: number;
  getFrame: (i: number) => PoseBodyFrameModel;
}

export interface UseSkeletonPlayerReturn {
  playSequence: (glosses: string[]) => void;
  stop: () => void;
  isPlaying: boolean;
  debugStats: AvatarDebugStats;
  /** Current frame data + header for the renderer */
  currentFrame: PoseBodyFrameModel | null;
  currentHeader: PoseHeaderModel | null;
}

export function useSkeletonPlayer(): UseSkeletonPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<PoseBodyFrameModel | null>(null);
  const [currentHeader, setCurrentHeader] = useState<PoseHeaderModel | null>(null);
  const [debugStats, setDebugStats] = useState<AvatarDebugStats>({
    fps: 0,
    frameIndex: 0,
    totalFrames: 0,
    currentGloss: "",
    poseConfidence: 0,
    leftHandConfidence: 0,
    rightHandConfidence: 0,
    viewMode: "interpreter",
    modelName: "Skeleton 2D",
    renderTimeMs: 0,
    poseLoadTimeMs: 0,
    totalGlosses: 0,
    currentGlossIndex: 0,
  });

  const playingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const poseCache = useRef<Map<string, ParsedPose>>(new Map());

  // Dynamically import pose-format to avoid SSR issues with Buffer
  const parsePoseBuffer = useCallback(async (buffer: ArrayBuffer, gloss: string): Promise<ParsedPose | null> => {
    try {
      const { Pose } = await import("pose-format");
      const buf = Buffer.from(buffer);
      const pose = Pose.from(buf);

      return {
        gloss,
        header: pose.header,
        frameCount: pose.body.frames.length ?? pose.body._frames,
        fps: pose.body.fps,
        getFrame: (i: number) => pose.body.frames[i],
      };
    } catch (err) {
      console.warn(`Failed to parse .pose file for ${gloss}:`, err);
      return null;
    }
  }, []);

  const fetchPose = useCallback(async (gloss: string): Promise<ParsedPose | null> => {
    const cached = poseCache.current.get(gloss);
    if (cached) return cached;

    try {
      const loadStart = performance.now();
      const response = await fetch(`/api/pose/${encodeURIComponent(gloss)}`);
      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      const parsed = await parsePoseBuffer(buffer, gloss);
      const loadTime = performance.now() - loadStart;

      if (parsed) {
        poseCache.current.set(gloss, parsed);
        setDebugStats((prev) => ({ ...prev, poseLoadTimeMs: loadTime }));
      }
      return parsed;
    } catch (err) {
      console.warn(`Failed to fetch pose for ${gloss}:`, err);
      return null;
    }
  }, [parsePoseBuffer]);

  const playGloss = useCallback(async (gloss: string): Promise<void> => {
    const poseData = await fetchPose(gloss);
    if (!poseData || poseData.frameCount === 0) return;

    setCurrentHeader(poseData.header);

    const msPerFrame = 1000 / poseData.fps;

    return new Promise<void>((resolve) => {
      let frameIdx = 0;
      let lastFrameTime = performance.now();

      const tick = () => {
        if (!playingRef.current) {
          resolve();
          return;
        }

        const now = performance.now();
        if (now - lastFrameTime >= msPerFrame) {
          if (frameIdx < poseData.frameCount) {
            const frame = poseData.getFrame(frameIdx);
            setCurrentFrame(frame);

            setDebugStats((prev) => ({
              ...prev,
              frameIndex: frameIdx,
              totalFrames: poseData.frameCount,
              currentGloss: gloss,
              fps: poseData.fps,
            }));

            frameIdx++;
            lastFrameTime = now;
          } else {
            resolve();
            return;
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }, [fetchPose]);

  const playSequence = useCallback((glosses: string[]) => {
    // Stop any existing playback
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);

    // Start new playback
    playingRef.current = true;
    setIsPlaying(true);

    setDebugStats((prev) => ({
      ...prev,
      totalGlosses: glosses.length,
    }));

    (async () => {
      for (let i = 0; i < glosses.length; i++) {
        if (!playingRef.current) break;

        setDebugStats((prev) => ({
          ...prev,
          currentGlossIndex: i,
        }));

        await playGloss(glosses[i]);

        // Brief pause between signs
        if (playingRef.current && i < glosses.length - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      playingRef.current = false;
      setIsPlaying(false);
    })();
  }, [playGloss]);

  const stop = useCallback(() => {
    playingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setCurrentFrame(null);
    setCurrentHeader(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    playSequence,
    stop,
    isPlaying,
    debugStats,
    currentFrame,
    currentHeader,
  };
}
