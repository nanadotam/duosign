"use client";

/**
 * ExportVideoModal
 * ================
 * Records the avatar signing the gloss sequence and exports as MP4.
 *
 * UX goal: the user should feel like the app is *composing* the video
 * intelligently — not "screen recording". Cycle through witty status
 * messages while the avatar plays, keep the canvas visible and prominent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCanvasRecorder } from "../model/useCanvasRecorder";
import type { AvatarDebugStats } from "@/entities/avatar/types";
import { AVATAR_MODELS } from "@/shared/constants";

const AvatarCanvas = dynamic(() => import("./AvatarCanvas"), { ssr: false });

interface ExportVideoModalProps {
  glossSequence: string[];
  avatarPath?: string;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Status messages per phase ─────────────────────────────────────────────────

const MESSAGES_PREPARING = [
  "Loading the signer…",
  "Initialising avatar model…",
  "Calibrating hand landmarks…",
];

const MESSAGES_COMPOSING = [
  "Pulling signs from the lexicon…",
  "Assembling ASL sequence…",
  "Synchronising joint rotations…",
  "Mapping handshapes to phonology…",
  "Composing sign morphemes…",
  "Rendering bone kinematics…",
  "Timing the movement holds…",
  "Aligning non-manual markers…",
  "Blending transition frames…",
  "Cross-referencing WLASL dataset…",
  "Calculating wrist trajectories…",
  "Signing as fast as I can…",
];

const MESSAGES_PACKAGING = [
  "Stitching frames together…",
  "Encoding motion into video…",
  "Compressing sign data…",
  "Optimising for playback…",
  "Packaging your export…",
  "Almost done — hang tight…",
  "Finalising the handoff…",
];

// ── Cycling message hook ──────────────────────────────────────────────────────

function useCyclingMessage(messages: string[], intervalMs = 2400, active = true) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active || messages.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, messages, intervalMs]);

  // Reset when messages pool changes
  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [messages]);

  return { message: messages[index] ?? messages[0], visible };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportVideoModal({
  glossSequence,
  avatarPath,
  onClose,
}: ExportVideoModalProps) {
  const modelPath = avatarPath ?? AVATAR_MODELS[0].path;

  const glossNames = useMemo(
    () => glossSequence.map((g) => g.toUpperCase().replace(/\s+/g, "_")),
    [glossSequence]
  );

  const { stage, progress, videoUrl, error, startRecording, stopRecording } =
    useCanvasRecorder(API_BASE);

  const [isPlaying, setIsPlaying] = useState(false);
  const recordingStartedRef = useRef(false);

  // Crawls 0 → 54 % at ~1 %/s; jumps to 55 % when playback completes,
  // then server processing drives 55 → 100 %.
  const [recordProgress, setRecordProgress] = useState(0);
  const recordProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgressSimulation = useCallback(() => {
    let value = 0;
    recordProgressRef.current = setInterval(() => {
      value = Math.min(value + 1, 54); // never reach 55 — jumps there on complete
      setRecordProgress(value);
    }, 900);
  }, []);

  // Unified progress: recording phase = 0–55, processing phase = 55–100
  const displayProgress =
    stage === "recording" ? recordProgress
    : stage === "processing" ? 55 + Math.round(progress * 0.45)
    : stage === "done" ? 100
    : 0;

  // Message pool based on current stage
  const messagePool =
    stage === "idle" ? MESSAGES_PREPARING
    : stage === "recording" ? MESSAGES_COMPOSING
    : MESSAGES_PACKAGING;

  const { message, visible: msgVisible } = useCyclingMessage(
    messagePool,
    2400,
    stage !== "done" && stage !== "error"
  );

  // Called once VRM is fully loaded — safe to start recording.
  // We start the recorder first and wait 400 ms for the codec to
  // establish clean keyframes (eliminating the initial scratch/blur),
  // then kick off playback.
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (recordingStartedRef.current) return;
      recordingStartedRef.current = true;
      startRecording(canvas);
      startProgressSimulation();
      setTimeout(() => setIsPlaying(true), 400);
    },
    [startRecording, startProgressSimulation]
  );

  // Called when the sequence finishes playing — stop recording cleanly
  const handlePlaybackComplete = useCallback(() => {
    setIsPlaying(false);
    setRecordProgress(55);
    if (recordProgressRef.current) clearInterval(recordProgressRef.current);
    // 400 ms hold so the final pose frame is captured
    setTimeout(() => stopRecording(), 400);
  }, [stopRecording]);

  const handleDebugStats = useCallback((_stats: AvatarDebugStats) => {}, []);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "duosign-export.mp4";
    a.click();
  }, [videoUrl]);

  // Close on Escape (only when not in progress)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "recording" && stage !== "processing") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, stage]);

  // Cleanup progress interval on unmount
  useEffect(() => () => {
    if (recordProgressRef.current) clearInterval(recordProgressRef.current);
  }, []);

  const isLocked = stage === "recording" || stage === "processing";
  const isDone   = stage === "done";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={isLocked ? undefined : onClose}
    >
      <div
        className="relative bg-surface border border-border rounded-panel overflow-hidden w-full max-w-2xl shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div
              className={[
                "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300",
                isDone
                  ? "bg-success shadow-[0_0_6px_var(--success)]"
                  : isLocked
                  ? "bg-accent shadow-[0_0_6px_var(--accent)] animate-[blink_1.8s_ease-in-out_infinite]"
                  : "bg-border-hi",
              ].join(" ")}
            />
            <span className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
              {isDone ? "Export Ready" : "Exporting Sign Video"}
            </span>
          </div>
          <button
            onClick={isLocked ? undefined : onClose}
            disabled={isLocked}
            className="w-7 h-7 rounded-full border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer transition-all hover:text-text-1 hover:border-border-hi disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Avatar Canvas ─────────────────────────────────────────── */}
        {/*
          Native 16:9 canvas — no CSS transforms. Three.js renders at the
          true container size. On a 672px modal that's ~672×378px display;
          with devicePixelRatio=2 the backing canvas is 1344×756px which
          FFmpeg scales to a crisp 1280×720 output.
        */}
        <div className="relative" style={{ aspectRatio: "16/9" }}>
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

          {/* Three.js canvas — fills the container naturally */}
          <div className="absolute inset-0">
            <AvatarCanvas
              viewMode="interpreter"
              avatarPath={modelPath}
              glossSequence={glossNames}
              isPlaying={isPlaying}
              renderMode="avatar"
              onDebugStats={handleDebugStats}
              onCanvasReady={handleCanvasReady}
              onPlaybackComplete={handlePlaybackComplete}
            />
          </div>

          {/* Done overlay — semi-transparent success tint */}
          {isDone && (
            <div
              className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2"
              style={{ background: "color-mix(in srgb, var(--surface) 55%, transparent)" }}
            >
              <div className="w-12 h-12 rounded-full border-2 border-success bg-success/10 flex items-center justify-center shadow-[0_0_24px_var(--success)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-success">Video ready</span>
            </div>
          )}

          {/* Error overlay */}
          {stage === "error" && (
            <div
              className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 px-6 text-center"
              style={{ background: "color-mix(in srgb, var(--surface) 65%, transparent)" }}
            >
              <div className="w-10 h-10 rounded-full border border-error/30 bg-error/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-error">
                  <line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
              </div>
              <p className="text-[11px] text-error font-medium leading-snug">
                {error ?? "Export failed"}
              </p>
              <p className="text-[10px] text-text-3">
                Check that the backend is running.
              </p>
            </div>
          )}
        </div>

        {/* ── Status bar ───────────────────────────────────────────── */}
        {!isDone && stage !== "error" && (
          <div className="px-4 pt-3 pb-1">
            {/* Cycling message */}
            <p
              className="text-[11.5px] text-text-2 font-medium text-center transition-all duration-300 h-5 leading-5"
              style={{ opacity: msgVisible ? 1 : 0, transform: msgVisible ? "translateY(0)" : "translateY(4px)" }}
            >
              {message}
            </p>
          </div>
        )}

        {/* ── Progress bar ─────────────────────────────────────────── */}
        {!isDone && stage !== "error" && (
          <div className="px-4 pt-2 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${displayProgress}%`,
                    background: "linear-gradient(90deg, var(--accent-dim), var(--accent))",
                    boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 60%, transparent)",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-3 w-7 text-right tabular-nums">
                {displayProgress}%
              </span>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
          {isDone && (
            <>
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
            </>
          )}

          {stage === "error" && (
            <button
              onClick={onClose}
              className="w-full py-2 rounded-[10px] text-[12px] font-medium text-text-3 border border-border bg-surface-2 hover:text-text-1 hover:border-border-hi transition-all"
            >
              Close
            </button>
          )}

          {isLocked && (
            <p className="text-[10px] text-text-3 text-center pb-0.5">
              Please wait — this only takes a moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
