"use client";

/**
 * useSkeletonPlayer — Play .pose files as 2D skeleton animation
 * ==============================================================
 * Drives frame-by-frame playback via requestAnimationFrame.
 * Calls onFrame(frame, header) directly in the RAF loop — no React
 * state updates per frame, so the canvas renders at full speed without
 * triggering component re-renders on every tick.
 *
 * React state only changes at sign boundaries and play/stop/pause events.
 * playSequence(glosses, loopCount) repeats the full sequence loopCount times.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Buffer } from "buffer";
import type { PoseHeaderModel, PoseBodyFrameModel } from "pose-format";

interface ParsedPose {
  gloss: string;
  header: PoseHeaderModel;
  frameCount: number;
  fps: number;
  getFrame: (i: number) => PoseBodyFrameModel;
}

export interface UseSkeletonPlayerReturn {
  playSequence: (glosses: string[], loopCount?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentGloss: string;
  currentGlossIndex: number;
  totalGlosses: number;
  currentLoop: number;
  totalLoops: number;
}

export function useSkeletonPlayer(
  onFrame: (frame: PoseBodyFrameModel, header: PoseHeaderModel) => void,
  onComplete?: () => void,
): UseSkeletonPlayerReturn {
  // Coarse React state — only at sign/loop boundaries, never per frame
  const [isPlaying,         setIsPlaying]        = useState(false);
  const [isPaused,          setIsPaused]          = useState(false);
  const [currentGloss,      setCurrentGloss]      = useState("");
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [totalGlosses,      setTotalGlosses]      = useState(0);
  const [currentLoop,       setCurrentLoop]       = useState(0);
  const [totalLoops,        setTotalLoops]        = useState(0);

  // RAF control — no re-renders
  const playingRef = useRef(false);
  const pausedRef  = useRef(false);
  const rafRef     = useRef<number>(0);

  // Pose cache
  const poseCache = useRef<Map<string, ParsedPose>>(new Map());

  // Stable callback refs so RAF closures always use latest functions
  const onFrameRef    = useRef(onFrame);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onFrameRef.current    = onFrame;    }, [onFrame]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const parsePoseBuffer = useCallback(async (
    buffer: ArrayBuffer,
    gloss: string,
  ): Promise<ParsedPose | null> => {
    try {
      const { Pose } = await import("pose-format");
      const pose = Pose.from(Buffer.from(buffer));
      return {
        gloss,
        header:     pose.header,
        frameCount: pose.body.frames.length ?? pose.body._frames,
        fps:        pose.body.fps,
        getFrame:   (i: number) => pose.body.frames[i],
      };
    } catch (err) {
      console.warn(`[SkeletonPlayer] parse failed for ${gloss}:`, err);
      return null;
    }
  }, []);

  const fetchPose = useCallback(async (gloss: string): Promise<ParsedPose | null> => {
    const cached = poseCache.current.get(gloss);
    if (cached) return cached;
    try {
      const res = await fetch(`/api/pose/${encodeURIComponent(gloss)}`);
      if (!res.ok) return null;
      const parsed = await parsePoseBuffer(await res.arrayBuffer(), gloss);
      if (parsed) poseCache.current.set(gloss, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[SkeletonPlayer] fetch failed for ${gloss}:`, err);
      return null;
    }
  }, [parsePoseBuffer]);

  const playGloss = useCallback((poseData: ParsedPose): Promise<void> => {
    const msPerFrame = 1000 / poseData.fps;
    return new Promise<void>((resolve) => {
      let frameIdx = 0;
      let lastTick = performance.now();

      const tick = (now: number) => {
        if (!playingRef.current) { resolve(); return; }
        if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }

        if (now - lastTick >= msPerFrame) {
          if (frameIdx >= poseData.frameCount) { resolve(); return; }
          const frame = poseData.getFrame(frameIdx);
          if (frame) onFrameRef.current(frame, poseData.header);
          frameIdx++;
          lastTick = now;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }, []);

  const prefetch = useCallback((gloss: string) => {
    if (!poseCache.current.has(gloss)) fetchPose(gloss);
  }, [fetchPose]);

  const playSequence = useCallback((glosses: string[], loopCount = 3) => {
    playingRef.current = false;
    pausedRef.current  = false;
    cancelAnimationFrame(rafRef.current);

    playingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    setTotalGlosses(glosses.length);
    setTotalLoops(loopCount);
    setCurrentLoop(1);

    (async () => {
      for (let loop = 1; loop <= loopCount; loop++) {
        if (!playingRef.current) break;
        setCurrentLoop(loop);

        for (let i = 0; i < glosses.length; i++) {
          if (!playingRef.current) break;

          // Prefetch next in sequence
          if (i + 1 < glosses.length) prefetch(glosses[i + 1]);

          const poseData = await fetchPose(glosses[i]);
          if (!playingRef.current) break;

          if (!poseData || poseData.frameCount === 0) {
            console.warn(`[SkeletonPlayer] skipping missing gloss: ${glosses[i]}`);
            continue;
          }

          setCurrentGloss(glosses[i]);
          setCurrentGlossIndex(i);

          await playGloss(poseData);

          // Brief hold between signs (not after last sign in a loop)
          if (playingRef.current && i < glosses.length - 1) {
            await new Promise<void>((r) => setTimeout(r, 80));
          }
        }

        // Pause between loops (longer gap so it reads as a repeat)
        if (playingRef.current && loop < loopCount) {
          await new Promise<void>((r) => setTimeout(r, 400));
        }
      }

      if (playingRef.current) {
        playingRef.current = false;
        setIsPlaying(false);
        setCurrentGloss("");
        onCompleteRef.current?.();
      }
    })();
  }, [fetchPose, playGloss, prefetch]);

  const stop = useCallback(() => {
    playingRef.current = false;
    pausedRef.current  = false;
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentGloss("");
    setCurrentLoop(0);
  }, []);

  const pause = useCallback(() => {
    if (!playingRef.current) return;
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!playingRef.current) return;
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    playSequence, stop, pause, resume,
    isPlaying, isPaused,
    currentGloss, currentGlossIndex, totalGlosses,
    currentLoop, totalLoops,
  };
}
