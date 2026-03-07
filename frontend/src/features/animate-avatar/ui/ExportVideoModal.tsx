"use client";

/**
 * ExportVideoModal
 * ================
 * Self-contained modal that:
 *   1. Renders a mini AvatarCanvas (hidden behind stage UI until ready)
 *   2. Starts recording immediately once the canvas is ready
 *   3. Auto-plays the gloss sequence
 *   4. Uploads to the backend and converts to MP4
 *   5. Presents a download button
 *
 * Auto-starts recording + playback — the user just watches.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCanvasRecorder } from "../model/useCanvasRecorder";
import type { AvatarDebugStats } from "@/entities/avatar/types";
import { AVATAR_MODELS } from "@/shared/constants";

const AvatarCanvas = dynamic(
  () => import("./AvatarCanvas"),
  { ssr: false }
);

interface ExportVideoModalProps {
  glossSequence: string[];   // raw gloss tokens (e.g. ["I", "DOCTOR", "SEARCH"])
  avatarPath?: string;       // VRM model path — defaults to first AVATAR_MODELS entry
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Stage copy ────────────────────────────────────────────────────────────────

const STAGE_LABEL = {
  idle:       "Preparing avatar…",
  recording:  "Recording",
  processing: "Converting to MP4…",
  done:       "Ready to download",
  error:      "Export failed",
} as const;

export default function ExportVideoModal({
  glossSequence,
  avatarPath,
  onClose,
}: ExportVideoModalProps) {
  const modelPath = avatarPath ?? AVATAR_MODELS[0].path;

  // Normalise to the same format AvatarPanel uses
  const glossNames = useMemo(
    () => glossSequence.map((g) => g.toUpperCase().replace(/\s+/g, "_")),
    [glossSequence]
  );

  const { stage, progress, videoUrl, error, startRecording, stopRecording } =
    useCanvasRecorder(API_BASE);

  // Whether the avatar should be playing (set to true to kick off animation)
  const [isPlaying, setIsPlaying] = useState(false);

  // Ref to track whether we've started recording
  const recordingStartedRef = useRef(false);

  // Estimated recording duration: ~2.5 s per sign + 2 s buffer
  const recordDurationMs = useMemo(
    () => Math.max(glossNames.length * 2500 + 2000, 4000),
    [glossNames.length]
  );

  // Called by AvatarCanvas once the Three.js canvas element exists
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (recordingStartedRef.current) return;
      recordingStartedRef.current = true;

      // Small delay so the VRM fully initialises before first frame
      setTimeout(() => {
        startRecording(canvas);
        setIsPlaying(true);

        // Stop recording after estimated duration
        setTimeout(() => {
          setIsPlaying(false);
          stopRecording();
        }, recordDurationMs);
      }, 600);
    },
    [startRecording, stopRecording, recordDurationMs]
  );

  // Suppress unused onDebugStats callback (required by AvatarCanvas type)
  const handleDebugStats = useCallback((_stats: AvatarDebugStats) => {}, []);

  // Download helper
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "duosign-export.mp4";
    a.click();
  }, [videoUrl]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "recording" && stage !== "processing") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, stage]);

  const isLocked = stage === "recording" || stage === "processing";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={isLocked ? undefined : onClose}
    >
      {/* Modal card */}
      <div
        className="relative bg-surface border border-border rounded-panel shadow-[0_24px_64px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border">
          <div className="flex items-center gap-2">
            {/* REC dot */}
            {stage === "recording" && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-[blink_1s_ease-in-out_infinite]" />
            )}
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-text-2">
              {STAGE_LABEL[stage]}
            </span>
          </div>
          <button
            onClick={isLocked ? undefined : onClose}
            disabled={isLocked}
            className="w-7 h-7 rounded-full border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer transition-all hover:text-text-1 hover:border-border-hi disabled:opacity-30 disabled:cursor-not-allowed"
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Avatar Canvas ───────────────────────────────────────────── */}
        <div className="relative bg-surface" style={{ height: 280 }}>
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "var(--grid-fade)",
              WebkitMaskImage: "var(--grid-fade)",
            }}
          />

          {/* Three.js canvas */}
          <div className="absolute inset-0 z-[1]">
            <AvatarCanvas
              viewMode="interpreter"
              avatarPath={modelPath}
              glossSequence={glossNames}
              isPlaying={isPlaying}
              renderMode="avatar"
              onDebugStats={handleDebugStats}
              onCanvasReady={handleCanvasReady}
            />
          </div>

          {/* REC badge */}
          {stage === "recording" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-red-500/15 border border-red-500/30 text-[9px] font-bold tracking-[0.08em] uppercase text-red-400">
              <span className="w-[5px] h-[5px] rounded-full bg-red-500 animate-[blink_1s_infinite]" />
              REC
            </div>
          )}

          {/* Gloss sequence preview */}
          {(stage === "recording" || stage === "idle") && glossNames.length > 0 && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-pill border border-border-hi text-[10px] font-mono font-bold text-text-2 tracking-[0.05em] whitespace-nowrap overflow-hidden max-w-[90%] text-ellipsis"
              style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)", backdropFilter: "blur(6px)" }}
            >
              {glossNames.join(" · ")}
            </div>
          )}
        </div>

        {/* ── Footer / Status ─────────────────────────────────────────── */}
        <div className="px-4 py-4 flex flex-col gap-3">

          {/* Progress bar — shown while processing */}
          {stage === "processing" && (
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10.5px] text-text-3 text-center">
                Converting… this takes a few seconds
              </p>
            </div>
          )}

          {/* Recording state */}
          {stage === "recording" && (
            <p className="text-[11px] text-text-3 text-center">
              Recording in progress — please wait
            </p>
          )}

          {/* Idle / preparing */}
          {stage === "idle" && (
            <p className="text-[11px] text-text-3 text-center">
              Loading avatar, recording will start automatically…
            </p>
          )}

          {/* Error */}
          {stage === "error" && (
            <div className="bg-error/10 border border-error/30 rounded-[10px] px-3 py-2 text-center">
              <p className="text-[11px] text-error font-medium">
                {error ?? "Something went wrong"}
              </p>
              <p className="text-[10px] text-text-3 mt-1">
                Please try again or contact support.
              </p>
            </div>
          )}

          {/* Done — download button */}
          {stage === "done" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownload}
                className="w-full py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:brightness-110 active:brightness-90"
                style={{
                  background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                  border: "1px solid var(--accent-dim)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                Download MP4
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-[10px] text-[12px] font-medium text-text-3 border border-border bg-surface-2 hover:text-text-1 hover:border-border-hi transition-all"
              >
                Close
              </button>
            </div>
          )}

          {/* Close button for error state */}
          {stage === "error" && (
            <button
              onClick={onClose}
              className="w-full py-2 rounded-[10px] text-[12px] font-medium text-text-3 border border-border bg-surface-2 hover:text-text-1 hover:border-border-hi transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
