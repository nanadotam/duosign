"use client";

/**
 * usePosePlayer — Play .pose files on a VRM avatar
 * ==================================================
 * Fetches binary .pose files, parses landmark data frame by frame,
 * uses Kalidokit to solve bone rotations, and drives the VRM.
 *
 * Supports:
 * - Single gloss playback
 * - Sequential gloss sequence with interpolation between signs
 * - Fingerspelling fallback (for missing glosses)
 * - Upper-body only processing (lower body discarded)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { VRM } from "@pixiv/three-vrm";
import type { AvatarDebugStats, ViewMode } from "@/entities/avatar/types";
import { rigUpperBody, rigHands, rigFace, resetPose } from "../lib/vrmRigger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Kalidokit: any = null;

async function loadKalidokit() {
  if (Kalidokit) return Kalidokit;
  Kalidokit = await import("kalidokit");
  return Kalidokit;
}

// ── Pose format constants ───────────────────────────────────────────
const TARGET_FPS = 30;

interface PoseData {
  gloss: string;
  frames: PoseFrame[];
  fps: number;
}

interface PoseFrame {
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null;
  leftHandLandmarks: Array<{ x: number; y: number; z: number }> | null;
  rightHandLandmarks: Array<{ x: number; y: number; z: number }> | null;
  faceLandmarks: Array<{ x: number; y: number; z: number }> | null;
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
  progress: number; // 0-1
}

/**
 * Parse a .pose binary buffer into frame arrays.
 *
 * The .pose format (from pose-format library) is a binary file containing:
 * - Header with component info (which landmarks are present)
 * - Body data as masked numpy arrays (frames × people × landmarks × dimensions)
 *
 * Since we can't use the Python pose-format reader in the browser,
 * we use a simplified binary parser that extracts the raw landmark data.
 *
 * IMPORTANT: This is a simplified parser. For production, the pose-format
 * JS library should be used. This parser handles the common MediaPipe
 * Holistic output format.
 */
async function parsePoseFile(buffer: ArrayBuffer, gloss: string): Promise<PoseData> {
  // The .pose format has a specific binary structure:
  // We'll try to parse it, but if we can't, we'll return empty frames
  // so the system gracefully falls back to fingerspelling
  try {
    const view = new DataView(buffer);
    let offset = 0;

    // Read header
    // Skip header version float
    offset += 4;

    // Read number of components
    const numComponents = view.getInt16(offset, true); offset += 2;

    const components: Array<{
      name: string;
      format: string;
      numPoints: number;
      numDims: number;
      pointNames: string[];
    }> = [];

    for (let c = 0; c < numComponents; c++) {
      // Component name length + name
      const nameLen = view.getInt16(offset, true); offset += 2;
      const nameBytes = new Uint8Array(buffer, offset, nameLen);
      const name = new TextDecoder().decode(nameBytes); offset += nameLen;

      // Format string
      const fmtLen = view.getInt16(offset, true); offset += 2;
      const fmtBytes = new Uint8Array(buffer, offset, fmtLen);
      const format = new TextDecoder().decode(fmtBytes); offset += fmtLen;

      // Number of points and dimensions
      const numPoints = view.getInt16(offset, true); offset += 2;
      const numDims = view.getInt16(offset, true); offset += 2;

      // Read point names
      const pointNames: string[] = [];
      for (let p = 0; p < numPoints; p++) {
        const pNameLen = view.getInt16(offset, true); offset += 2;
        const pNameBytes = new Uint8Array(buffer, offset, pNameLen);
        pointNames.push(new TextDecoder().decode(pNameBytes)); offset += pNameLen;
      }

      // Read limb connections count and data
      const numLimbs = view.getInt16(offset, true); offset += 2;
      offset += numLimbs * 4; // Each limb is 2 x int16

      // Read color data if present (3 ints per limb)
      // Colors might or might not be present depending on version

      components.push({ name, format, numPoints, numDims, pointNames });
    }

    // Read body data
    // Body shape: (frames, people, total_points, dims)
    const numFrames = view.getInt16(offset, true); offset += 2;

    // For very short reads, pad
    if (numFrames <= 0) {
      return { gloss, frames: [], fps: TARGET_FPS };
    }

    const numPeople = view.getInt16(offset, true); offset += 2;

    const totalPoints = components.reduce((sum, c) => sum + c.numPoints, 0);
    const dims = components[0]?.numDims ?? 3;

    // Read the actual float data
    const dataSize = numFrames * numPeople * totalPoints * dims;
    const bodyData = new Float32Array(dataSize);

    for (let i = 0; i < dataSize && offset + 4 <= buffer.byteLength; i++) {
      bodyData[i] = view.getFloat32(offset, true);
      offset += 4;
    }

    // Read confidence/mask data if present
    const confSize = numFrames * numPeople * totalPoints;
    const confidence = new Float32Array(confSize);
    for (let i = 0; i < confSize && offset + 4 <= buffer.byteLength; i++) {
      confidence[i] = view.getFloat32(offset, true);
      offset += 4;
    }

    // Build component index mapping
    const compRanges: Record<string, [number, number]> = {};
    let cursor = 0;
    for (const comp of components) {
      compRanges[comp.name] = [cursor, cursor + comp.numPoints];
      cursor += comp.numPoints;
    }

    // Extract frames
    const frames: PoseFrame[] = [];

    for (let f = 0; f < numFrames; f++) {
      const personIdx = 0; // First person only
      const baseIdx = (f * numPeople * totalPoints + personIdx * totalPoints) * dims;
      const confBaseIdx = f * numPeople * totalPoints + personIdx * totalPoints;

      const extractLandmarks = (
        compName: string
      ): Array<{ x: number; y: number; z: number; visibility?: number }> | null => {
        const range = compRanges[compName];
        if (!range) return null;

        const [start, end] = range;
        const landmarks: Array<{ x: number; y: number; z: number; visibility?: number }> = [];
        let hasAny = false;

        for (let p = start; p < end; p++) {
          const idx = baseIdx + p * dims;
          const confIdx = confBaseIdx + p;
          const conf = confidence[confIdx] ?? 0;

          if (conf > 0) hasAny = true;

          landmarks.push({
            x: bodyData[idx] ?? 0,
            y: bodyData[idx + 1] ?? 0,
            z: bodyData[idx + 2] ?? 0,
            visibility: conf,
          });
        }

        return hasAny ? landmarks : null;
      };

      frames.push({
        poseLandmarks: extractLandmarks("POSE_LANDMARKS"),
        leftHandLandmarks: extractLandmarks("LEFT_HAND_LANDMARKS"),
        rightHandLandmarks: extractLandmarks("RIGHT_HAND_LANDMARKS"),
        faceLandmarks: extractLandmarks("FACE_LANDMARKS"),
      });
    }

    // Determine FPS from file or default
    const fileFps = numFrames > 0 ? TARGET_FPS : TARGET_FPS;

    return { gloss, frames, fps: fileFps };
  } catch (err) {
    console.warn(`Failed to parse .pose file for ${gloss}:`, err);
    return { gloss, frames: [], fps: TARGET_FPS };
  }
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
  const rafRef = useRef<number>(0);
  const poseCache = useRef<Map<string, PoseData>>(new Map());

  // Fetch and cache a pose file
  const fetchPose = useCallback(async (gloss: string): Promise<PoseData | null> => {
    // Check cache first
    const cached = poseCache.current.get(gloss);
    if (cached) return cached;

    try {
      const loadStart = performance.now();
      const response = await fetch(`/api/pose/${encodeURIComponent(gloss)}`);
      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      const poseData = await parsePoseFile(buffer, gloss);
      const loadTime = performance.now() - loadStart;

      // Update debug stats with load time
      setDebugStats((prev) => ({ ...prev, poseLoadTimeMs: loadTime }));

      // Cache it
      poseCache.current.set(gloss, poseData);
      return poseData;
    } catch (err) {
      console.warn(`Failed to fetch pose for ${gloss}:`, err);
      return null;
    }
  }, []);

  // Play a single frame on the VRM
  const applyFrame = useCallback(
    (frame: PoseFrame) => {
      if (!vrm) return;

      const startTime = performance.now();

      try {
        // We need Kalidokit to solve landmarks → rotations
        if (!Kalidokit) return;

        // Solve pose
        if (frame.poseLandmarks) {
          const riggedPose = Kalidokit.Pose.solve(
            frame.poseLandmarks,
            frame.poseLandmarks,
            { runtime: "mediapipe" }
          );
          if (riggedPose) {
            rigUpperBody(vrm, riggedPose);

            // Solve and apply hands
            const leftHand = frame.rightHandLandmarks
              ? Kalidokit.Hand.solve(frame.rightHandLandmarks, "Left")
              : null;
            const rightHand = frame.leftHandLandmarks
              ? Kalidokit.Hand.solve(frame.leftHandLandmarks, "Right")
              : null;

            rigHands(vrm, leftHand, rightHand, riggedPose);
          }
        }

        // Solve face
        if (frame.faceLandmarks) {
          const riggedFace = Kalidokit.Face.solve(frame.faceLandmarks, {
            runtime: "mediapipe",
          });
          if (riggedFace) {
            rigFace(vrm, riggedFace);
          }
        }
      } catch {
        // Silently handle frame errors — don't break playback
      }

      const renderTime = performance.now() - startTime;
      return renderTime;
    },
    [vrm]
  );

  // Play a single gloss
  const playGloss = useCallback(
    async (gloss: string) => {
      if (!vrm) return;

      // Load Kalidokit
      await loadKalidokit();

      setCurrentGloss(gloss);

      const poseData = await fetchPose(gloss);
      if (!poseData || poseData.frames.length === 0) {
        // No pose data — skip (fingerspelling handled by caller)
        return;
      }

      const msPerFrame = 1000 / poseData.fps;

      return new Promise<void>((resolve) => {
        let frameIdx = 0;
        let lastFrameTime = performance.now();

        const playFrame = () => {
          if (!playingRef.current) {
            resolve();
            return;
          }

          if (pausedRef.current) {
            rafRef.current = requestAnimationFrame(playFrame);
            return;
          }

          const now = performance.now();
          const elapsed = now - lastFrameTime;

          if (elapsed >= msPerFrame) {
            if (frameIdx < poseData.frames.length) {
              const renderTime = applyFrame(poseData.frames[frameIdx]) ?? 0;

              // Update debug stats
              setDebugStats((prev) => ({
                ...prev,
                frameIndex: frameIdx,
                totalFrames: poseData.frames.length,
                currentGloss: gloss,
                renderTimeMs: renderTime,
                viewMode,
                modelName,
                fps: rendererFps,
              }));

              setProgress(frameIdx / poseData.frames.length);
              frameIdx++;
              lastFrameTime = now;
            } else {
              resolve();
              return;
            }
          }

          rafRef.current = requestAnimationFrame(playFrame);
        };

        rafRef.current = requestAnimationFrame(playFrame);
      });
    },
    [vrm, fetchPose, applyFrame, viewMode, modelName, rendererFps]
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

          await playGloss(glosses[i]);

          // Brief pause between signs (100ms transition gap)
          if (playingRef.current && i < glosses.length - 1) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        // Reset to rest pose after sequence
        if (vrm) resetPose(vrm);

        playingRef.current = false;
        setIsPlaying(false);
        setProgress(1);
      })();
    },
    [playGloss, vrm]
  );

  const stop = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (vrm) resetPose(vrm);
  }, [vrm]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  // Cleanup
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
    isPlaying,
    isPaused,
    debugStats,
    currentGloss,
    progress,
  };
}
