"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VRM } from "@pixiv/three-vrm";
import type { AvatarDebugStats, ViewMode } from "@/entities/avatar/types";
import { resetPose, setRenderVRM } from "../lib/vrmRigger";
import { loadPoseData } from "../lib/poseLoader";
import { animatePose, type PoseAnimationHandle } from "../lib/animatePose";
import { SignSequencer } from "../lib/signSequencer";
import { applyPoseToVRM } from "../lib/applyPose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Kalidokit: any = null;

async function loadKalidokit() {
  if (Kalidokit) return Kalidokit;
  Kalidokit = await import("kalidokit");
  return Kalidokit;
}

interface UsePosePlayerOptions {
  vrm: VRM | null;
  viewMode: ViewMode;
  modelName: string;
  fps: number;
}

interface UsePosePlayerReturn {
  playGloss: (gloss: string) => Promise<void>;
  playSequence: (glosses: string[]) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  debugStats: AvatarDebugStats;
  currentGloss: string;
  progress: number;
}

export function usePosePlayer({
  vrm,
  viewMode,
  modelName,
  fps: rendererFps,
}: UsePosePlayerOptions): UsePosePlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentGloss, setCurrentGloss] = useState("");
  const [progress, setProgress] = useState(0);
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

  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const currentAnimationRef = useRef<PoseAnimationHandle | null>(null);
  const sequencerRef = useRef<SignSequencer | null>(null);

  const fetchPose = useCallback(async (gloss: string) => {
    const loadStart = performance.now();
    const poseData = await loadPoseData(gloss);
    const loadTime = performance.now() - loadStart;

    setDebugStats((prev) => ({ ...prev, poseLoadTimeMs: loadTime }));

    if (!poseData) {
      console.warn("[PosePlayer] Missing pose, skipping gloss", { gloss });
      return null;
    }

    return poseData;
  }, []);

  const startGlossAnimation = useCallback(
    async (gloss: string, glossIndex: number): Promise<PoseAnimationHandle | null> => {
      if (!vrm) return null;

      await loadKalidokit();
      const poseData = await fetchPose(gloss);
      if (!poseData || poseData.frames.length === 0) {
        console.warn("[PosePlayer] No frames available", { gloss });
        return null;
      }

      setCurrentGloss(gloss);
      setProgress(0);

      const handle = animatePose({
        gloss,
        frames: poseData.frames,
        fps: poseData.fps,
        onFrame: (frame, frameIndex) => {
          if (!vrm || !Kalidokit) return;

          const renderTime = applyPoseToVRM(vrm, frame, Kalidokit, {
            smoothing: 0.8,
          });

          // Calculate confidence values for this frame (used in debug stats)
          const avgConfidence = (
            landmarks: Array<{ visibility?: number }> | null
          ): number => {
            if (!landmarks || landmarks.length === 0) return 0;
            const sum = landmarks.reduce((acc, lm) => acc + (lm.visibility ?? 0), 0);
            return sum / landmarks.length;
          };

          const poseConf  = avgConfidence(frame.poseLandmarks);
          const leftConf  = avgConfidence(frame.rightHandLandmarks);
          const rightConf = avgConfidence(frame.leftHandLandmarks);

          setDebugStats((prev) => ({
            ...prev,
            fps: rendererFps,
            frameIndex,
            totalFrames: poseData.frames.length,
            currentGloss: gloss,
            poseConfidence: poseConf,
            leftHandConfidence: leftConf,
            rightHandConfidence: rightConf,
            viewMode,
            modelName,
            renderTimeMs: renderTime ?? 0,
            currentGlossIndex: glossIndex,
          }));

          setProgress((frameIndex + 1) / poseData.frames.length);
        },
      });

      currentAnimationRef.current = handle;
      return handle;
    },
    [fetchPose, modelName, rendererFps, viewMode, vrm]
  );

  const playGloss = useCallback(
    async (gloss: string) => {
      const handle = await startGlossAnimation(gloss, 0);
      if (!handle) {
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        return;
      }

      await handle.promise;
    },
    [startGlossAnimation]
  );

  const stop = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = false;
    sequencerRef.current?.stop();
    currentAnimationRef.current?.stop();
    currentAnimationRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentGloss("");
    if (vrm) resetPose(vrm);
  }, [vrm]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    currentAnimationRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    currentAnimationRef.current?.resume();
    setIsPaused(false);
  }, []);

  const playSequence = useCallback(
    (glosses: string[]) => {
      stop();

      playingRef.current = true;
      pausedRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);
      setDebugStats((prev) => ({
        ...prev,
        totalGlosses: glosses.length,
        currentGlossIndex: 0,
      }));

      const sequencer = new SignSequencer();
      sequencerRef.current = sequencer;

      void (async () => {
        await loadKalidokit();

        await sequencer.play(
          glosses,
          async (gloss, index) => {
            if (!playingRef.current) return;

            setDebugStats((prev) => ({
              ...prev,
              totalGlosses: glosses.length,
              currentGlossIndex: index,
            }));

            const handle = await startGlossAnimation(gloss, index);
            if (!handle) {
              await new Promise((resolve) => window.setTimeout(resolve, 80));
              return;
            }

            if (pausedRef.current) {
              handle.pause();
            }

            await handle.promise;
          },
          {
            onGlossStart: (gloss, index) => {
              console.log("[PosePlayer] Gloss start", { gloss, index });
              setCurrentGloss(gloss);
            },
            onGlossComplete: (gloss, index) => {
              console.log("[PosePlayer] Gloss complete", { gloss, index });
            },
            onComplete: () => {
              currentAnimationRef.current = null;
              playingRef.current = false;
              pausedRef.current = false;
              setIsPlaying(false);
              setIsPaused(false);
              setProgress(1);
              setCurrentGloss("");
              if (vrm) resetPose(vrm);
            },
          },
          80
        );
      })();
    },
    [startGlossAnimation, stop, vrm]
  );

  // Register VRM with the global render registry so useAvatarRenderer can
  // call vrm.update(delta) for spring physics (hair, cloth) every frame.
  useEffect(() => {
    setRenderVRM(vrm);
    return () => { setRenderVRM(null); };
  }, [vrm]);

  useEffect(() => {
    return () => {
      sequencerRef.current?.stop();
      currentAnimationRef.current?.stop();
      playingRef.current = false;
    };
  }, []);

  return {
    playGloss,
    playSequence,
    stop,
    pause,
    resume,
    isPlaying,
    isPaused,
    debugStats,
    currentGloss,
    progress,
  };
}
