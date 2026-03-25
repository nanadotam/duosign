"use client";

/**
 * useVideoEngine — Real-time video → MediaPipe → VRM animation
 * ===============================================================
 * Loads sign language videos, processes frames through MediaPipe
 * Tasks Vision (HolisticLandmarker), and rigs the VRM avatar via
 * Kalidokit + vrmRigger.
 *
 * Uses @mediapipe/tasks-vision (modern API) instead of the deprecated
 * @mediapipe/holistic which has broken WASM on modern Chrome
 * (Module.arguments deprecation causes abort()).
 *
 * Singleton pattern: HolisticLandmarker can only initialize ONCE per page.
 * Stored on window to survive HMR reloads.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { VRM } from "@pixiv/three-vrm";
import type { AvatarDebugStats, ViewMode } from "@/entities/avatar/types";
import { rigUpperBody, rigHands, rigFace, resetPose, lerpToRestPose, setRenderVRM } from "../lib/vrmRigger";
import { enhanceHandWithSpread } from "../lib/fingerSpread";
import {
  fetchVideoBlobUrl,
  prefetchVideos,
  releaseVideoCache,
} from "@/shared/api/videoApi";

// ── Module-level state ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Kalidokit: any = null;
let holisticReady = false;
let holisticFailed = false;
let holisticInitPromise: Promise<boolean> | null = null;

// Declare window property for HMR survival
declare global {
  interface Window {
    __duosign_holistic__?: unknown;
  }
}

// ── Dependency Loaders ─────────────────────────────────────────────

export async function loadKalidokit() {
  if (Kalidokit) return Kalidokit;
  Kalidokit = await import("kalidokit");
  return Kalidokit;
}

/**
 * Initialize HolisticLandmarker — singleton, one-shot.
 * Returns true if ready, false if failed permanently.
 * Safe to call from anywhere — concurrent calls share the same Promise.
 */
export function initHolistic(): Promise<boolean> {
  // Check if already initialized (survives HMR via window)
  if (window.__duosign_holistic__ && holisticReady) return Promise.resolve(true);
  if (holisticFailed) return Promise.resolve(false);
  if (holisticInitPromise) return holisticInitPromise;

  holisticInitPromise = (async () => {
    try {
      console.log("[VideoEngine] Loading MediaPipe Tasks Vision...");

      const { FilesetResolver, HolisticLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const landmarker = await HolisticLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minFaceDetectionConfidence: 0.7,
        minFacePresenceConfidence: 0.7,
        minHandLandmarksConfidence: 0.7,
        minPoseDetectionConfidence: 0.7,
        minPosePresenceConfidence: 0.7,
      });

      window.__duosign_holistic__ = landmarker;
      holisticReady = true;
      console.log("[VideoEngine] HolisticLandmarker initialized successfully");
      return true;
    } catch (err) {
      holisticFailed = true;
      console.error("[VideoEngine] HolisticLandmarker init failed:", err);
      return false;
    }
  })();

  return holisticInitPromise;
}

// ── Hook Types ─────────────────────────────────────────────────────

interface UseVideoEngineOptions {
  vrm: VRM | null;
  viewMode: ViewMode;
  modelName: string;
  fps: number;
  /** Optional fallback for when video playback fails (e.g. pose engine's playGloss) */
  fallbackPlayGloss?: (gloss: string) => Promise<void>;
}

interface UseVideoEngineReturn {
  playGloss: (gloss: string) => Promise<void>;
  playSequence: (glosses: string[]) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  debugStats: AvatarDebugStats;
  currentGloss: string;
  progress: number;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useVideoEngine({
  vrm,
  viewMode,
  modelName,
  fps: rendererFps,
  fallbackPlayGloss,
}: UseVideoEngineOptions): UseVideoEngineReturn {
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
  const rafRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speedRef = useRef(1);
  const framesProcessedRef = useRef(0);
  const fpsStartRef = useRef(0);
  // Monotonicity guard: detectForVideo() requires timestamps to be strictly
  // increasing. On some platforms performance.now() can return the same value
  // twice (or even go backward during system sleep). This ref tracks the last
  // timestamp passed to detectForVideo and ensures we always advance by ≥1ms.
  const lastDetectTimestampRef = useRef(-1);

  // Refs for latest values (avoids stale closures in rAF loop)
  const vrmRef = useRef(vrm);
  const viewModeRef = useRef(viewMode);
  const modelNameRef = useRef(modelName);
  const rendererFpsRef = useRef(rendererFps);

  useEffect(() => { vrmRef.current = vrm; }, [vrm]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { modelNameRef.current = modelName; }, [modelName]);
  const fallbackRef = useRef(fallbackPlayGloss);
  useEffect(() => { fallbackRef.current = fallbackPlayGloss; }, [fallbackPlayGloss]);
  useEffect(() => { rendererFpsRef.current = rendererFps; }, [rendererFps]);

  // Create hidden video element on mount
  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.style.position = "absolute";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);
    videoRef.current = video;

    return () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      releaseVideoCache();
    };
  }, []);

  /**
   * Process a single video frame through HolisticLandmarker → Kalidokit → VRM.
   * Called synchronously (detectForVideo is sync, unlike old holistic.send()).
   */
  const processFrame = useCallback(() => {
    const currentVrm = vrmRef.current;
    const video = videoRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landmarker = window.__duosign_holistic__ as any;

    if (!currentVrm || !video || !landmarker || !Kalidokit) return;
    if (video.paused || video.ended) return;

    const startTime = performance.now();

    try {
      // detectForVideo is SYNCHRONOUS — no callback needed.
      // Guarantee strict monotonic timestamps — MediaPipe throws if the same
      // timestamp is passed twice (can happen on fast loops or some platforms).
      const detectNow = performance.now();
      const timestamp = Math.max(detectNow, lastDetectTimestampRef.current + 1);
      lastDetectTimestampRef.current = timestamp;
      const result = landmarker.detectForVideo(video, timestamp);

      const faceLandmarks = result.faceLandmarks?.[0];
      // poseWorldLandmarks = 3D landmarks (replaces old results.ea)
      const pose3DLandmarks = result.poseWorldLandmarks?.[0];
      const pose2DLandmarks = result.poseLandmarks?.[0];
      // Intentional swap — MediaPipe labels hands from image perspective (mirrored)
      const leftHandLandmarks = result.rightHandLandmarks?.[0];
      const rightHandLandmarks = result.leftHandLandmarks?.[0];

      // Face
      if (faceLandmarks) {
        const riggedFace = Kalidokit.Face.solve(faceLandmarks, {
          runtime: "mediapipe",
          video: video,
        });
        if (riggedFace) rigFace(currentVrm, riggedFace);
      }

      // Pose
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let riggedPose: any = undefined;
      if (pose2DLandmarks && pose3DLandmarks) {
        riggedPose = Kalidokit.Pose.solve(
          pose3DLandmarks,
          pose2DLandmarks,
          {
            runtime: "mediapipe",
            video: video,
          }
        );
        if (riggedPose) {
          rigUpperBody(currentVrm, riggedPose);
        }
      }

      // Left Hand
      if (leftHandLandmarks && riggedPose) {
        const rawLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
        // Augment with Y-axis spread from raw landmarks (partial Kalidokit mitigation)
        const riggedLeftHand = rawLeftHand
          ? enhanceHandWithSpread(rawLeftHand, leftHandLandmarks, "Left")
          : null;
        if (riggedLeftHand) {
          rigHands(currentVrm, riggedLeftHand, null, riggedPose);
        }
      }

      // Right Hand
      if (rightHandLandmarks && riggedPose) {
        const rawRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
        const riggedRightHand = rawRightHand
          ? enhanceHandWithSpread(rawRightHand, rightHandLandmarks, "Right")
          : null;
        if (riggedRightHand) {
          rigHands(currentVrm, null, riggedRightHand, riggedPose);
        }
      }

      // Track FPS
      framesProcessedRef.current++;
      const now = performance.now();
      if (now - fpsStartRef.current >= 1000) {
        const mpFps = framesProcessedRef.current;
        framesProcessedRef.current = 0;
        fpsStartRef.current = now;

        setDebugStats((prev) => ({
          ...prev,
          fps: rendererFpsRef.current,
          renderTimeMs: now - startTime,
          viewMode: viewModeRef.current,
          modelName: modelNameRef.current,
          poseConfidence: riggedPose ? 1 : 0,
          leftHandConfidence: leftHandLandmarks ? 1 : 0,
          rightHandConfidence: rightHandLandmarks ? 1 : 0,
          frameIndex: mpFps,
        }));
      }
    } catch {
      // Silently handle frame processing errors — don't break playback
    }
  }, []);

  // Frame processing loop
  const startFrameLoop = useCallback(() => {
    const loop = () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || !playingRef.current) return;
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (holisticReady) {
        processFrame();
      }

      // Update progress
      if (video.duration > 0) {
        setProgress(video.currentTime / video.duration);
      }

      if (playingRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  const stopFrameLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  // Play a single gloss video
  const playGloss = useCallback(
    async (gloss: string): Promise<void> => {
      if (!vrm || !videoRef.current) return;

      // Load dependencies (both are cached after first call)
      await loadKalidokit();
      const ready = await initHolistic();
      if (!ready) {
        console.warn(`[VideoEngine] HolisticLandmarker not available, skipping ${gloss}`);
        // Hold briefly so the sequence doesn't instant-skip
        await new Promise((r) => setTimeout(r, 400));
        return;
      }

      setCurrentGloss(gloss);
      setDebugStats((prev) => ({ ...prev, currentGloss: gloss }));

      const loadStart = performance.now();

      // Fetch video blob URL (cached after first fetch)
      const blobUrl = await fetchVideoBlobUrl(gloss);
      const loadTime = performance.now() - loadStart;
      setDebugStats((prev) => ({ ...prev, poseLoadTimeMs: loadTime }));

      // Play the video and process frames (with 30s safety timeout)
      return new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;
        stopFrameLoop();

        const timeout = setTimeout(() => {
          console.warn(`[VideoEngine] Timeout playing "${gloss}", moving on`);
          stopFrameLoop();
          video.pause();
          resolve();
        }, 30_000);

        video.src = blobUrl;
        video.playbackRate = speedRef.current;
        video.currentTime = 0;

        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              fpsStartRef.current = performance.now();
              framesProcessedRef.current = 0;
              startFrameLoop();
            })
            .catch((err) => { clearTimeout(timeout); reject(err); });
        };

        video.onended = () => {
          clearTimeout(timeout);
          stopFrameLoop();
          resolve();
        };

        video.onerror = (e) => {
          clearTimeout(timeout);
          stopFrameLoop();
          reject(new Error(`Video error for ${gloss}: ${e}`));
        };
      });
    },
    [vrm, startFrameLoop, stopFrameLoop]
  );

  // Play a sequence of glosses
  const playSequence = useCallback(
    (glosses: string[]) => {
      playingRef.current = true;
      pausedRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);

      setDebugStats((prev) => ({
        ...prev,
        totalGlosses: glosses.length,
      }));

      (async () => {
        await loadKalidokit();

        for (let i = 0; i < glosses.length; i++) {
          if (!playingRef.current) break;

          setDebugStats((prev) => ({
            ...prev,
            currentGlossIndex: i,
          }));

          // Prefetch the next video while current plays
          if (i + 1 < glosses.length) {
            prefetchVideos([glosses[i + 1]]);
          }

          try {
            await playGloss(glosses[i]);
          } catch (err) {
            console.warn(`[VideoEngine] Video failed for ${glosses[i]}:`, err);
            // Try pose engine fallback before skipping
            if (fallbackRef.current) {
              try {
                await fallbackRef.current(glosses[i]);
                continue; // Success via fallback, skip the transition gap
              } catch {
                console.warn(`[VideoEngine] Pose fallback also failed for ${glosses[i]}`);
              }
            }
            // Hold current pose briefly so the sequence doesn't appear to skip
            await new Promise((r) => setTimeout(r, 400));
          }

          // Brief pause between signs with rest pose interpolation
          if (playingRef.current && i < glosses.length - 1 && vrm) {
            await new Promise<void>((resolve) => {
              lerpToRestPose(vrm, 3, () => setTimeout(resolve, 20));
            });
          }
        }

        // Reset to rest pose after sequence
        if (vrm) resetPose(vrm);

        playingRef.current = false;
        setIsPlaying(false);
        setProgress(1);
        setCurrentGloss("");
      })();
    },
    [playGloss, vrm]
  );

  const stop = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = false;
    stopFrameLoop();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentGloss("");
    if (vrm) resetPose(vrm);
  }, [vrm, stopFrameLoop]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (videoRef.current) videoRef.current.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    if (videoRef.current) videoRef.current.play();
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, []);

  // Register VRM with the global render registry so useAvatarRenderer can
  // call vrm.update(delta) for spring physics (hair, cloth) every frame.
  useEffect(() => {
    setRenderVRM(vrm);
    return () => { setRenderVRM(null); };
  }, [vrm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    playGloss,
    playSequence,
    stop,
    pause,
    resume,
    setSpeed,
    isPlaying,
    isPaused,
    debugStats,
    currentGloss,
    progress,
  };
}
