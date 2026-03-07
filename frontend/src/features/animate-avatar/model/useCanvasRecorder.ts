"use client";

/**
 * useCanvasRecorder — Capture a <canvas> to MP4
 * ================================================
 * Two recording paths depending on browser support:
 *   1. captureStream() + MediaRecorder → WebM blob → server converts to MP4
 *      (Chrome, Firefox, Edge)
 *   2. canvas.toDataURL() at ~15fps → JPEG frames array → server stitches MP4
 *      (Safari, iOS — captureStream not supported)
 *
 * Call startRecording(canvas) to begin, stopRecording() to finish.
 * The hook uploads to POST /api/export/video and returns a blob URL for download.
 */

import { useRef, useState, useCallback } from "react";

export type RecorderStage = "idle" | "recording" | "processing" | "done" | "error";

interface UseCanvasRecorderResult {
  stage: RecorderStage;
  progress: number;       // 0–100 during "processing"
  videoUrl: string | null;
  error: string | null;
  startRecording: (canvas: HTMLCanvasElement) => void;
  stopRecording: () => void;
  reset: () => void;
}

const CAPTURE_FPS = 30;
const SAFARI_FPS  = 15; // lower fps for frame-by-frame path

function getBestMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

function hasCaptureStream(canvas: HTMLCanvasElement): boolean {
  return typeof (canvas as unknown as { captureStream?: unknown }).captureStream === "function";
}

export function useCanvasRecorder(apiBase = ""): UseCanvasRecorderResult {
  const [stage, setStage]       = useState<RecorderStage>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const framesRef       = useRef<string[]>([]);
  const frameTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCaptureStream = useRef(false);

  const upload = useCallback(
    async (blob: Blob | null, frames: string[] | null) => {
      setStage("processing");
      setProgress(10);

      try {
        const form = new FormData();
        if (blob) {
          form.append("video", blob, "recording.webm");
        } else if (frames) {
          form.append("frames", JSON.stringify(frames));
          form.append("fps", String(SAFARI_FPS));
        } else {
          throw new Error("No recording data");
        }

        setProgress(30);
        const res = await fetch(`${apiBase}/api/export/video`, {
          method: "POST",
          body: form,
        });
        setProgress(80);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Server error ${res.status}`);
        }

        const mp4 = await res.blob();
        setProgress(100);
        const url = URL.createObjectURL(mp4);
        setVideoUrl(url);
        setStage("done");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Export failed";
        setError(msg);
        setStage("error");
      }
    },
    [apiBase]
  );

  const startRecording = useCallback(
    (canvas: HTMLCanvasElement) => {
      chunksRef.current = [];
      framesRef.current = [];
      setError(null);
      setVideoUrl(null);
      setProgress(0);
      setStage("recording");

      if (hasCaptureStream(canvas)) {
        // ── captureStream path (Chrome / Firefox / Edge) ──────────────
        isCaptureStream.current = true;
        const fn = (canvas as unknown as { captureStream: (fps: number) => MediaStream }).captureStream;
        const stream = fn.call(canvas, CAPTURE_FPS);
        const mimeType = getBestMimeType();
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 8_000_000, // 8 Mbps → good 720p quality
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          upload(blob, null);
        };

        recorder.start(200); // 200 ms timeslices
        recorderRef.current = recorder;
      } else {
        // ── frame-by-frame path (Safari / iOS) ───────────────────────
        isCaptureStream.current = false;
        const interval = Math.round(1000 / SAFARI_FPS);

        const tick = () => {
          framesRef.current.push(canvas.toDataURL("image/jpeg", 0.82));
          frameTimerRef.current = setTimeout(tick, interval);
        };
        frameTimerRef.current = setTimeout(tick, 0);
      }
    },
    [upload]
  );

  const stopRecording = useCallback(() => {
    if (isCaptureStream.current) {
      if (recorderRef.current?.state !== "inactive") {
        recorderRef.current?.stop();
      }
    } else {
      if (frameTimerRef.current !== null) {
        clearTimeout(frameTimerRef.current);
        frameTimerRef.current = null;
      }
      upload(null, framesRef.current);
    }
  }, [upload]);

  const reset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setStage("idle");
    setProgress(0);
    setVideoUrl(null);
    setError(null);
  }, [videoUrl]);

  return { stage, progress, videoUrl, error, startRecording, stopRecording, reset };
}
