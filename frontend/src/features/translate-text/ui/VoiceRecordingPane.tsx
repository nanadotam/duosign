"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/shared/constants";

const BARS = 42;

/** Pick the best audio MIME type the browser supports. */
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Map MIME type → filename extension so Groq can detect the format. */
function mimeToFilename(mimeType: string): string {
  if (mimeType.startsWith("audio/ogg")) return "recording.ogg";
  if (mimeType.startsWith("audio/mp4")) return "recording.mp4";
  return "recording.webm";
}

interface VoiceRecordingPaneProps {
  onDone: (text: string) => void;
  onTranslate: (text: string) => void;
  onClose: () => void;
}

export default function VoiceRecordingPane({ onDone, onTranslate, onClose }: VoiceRecordingPaneProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const barsRef = useRef<HTMLDivElement>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const hasAutoStarted = useRef(false);

  // Initialize bars
  useEffect(() => {
    if (barsRef.current && barsRef.current.children.length === 0) {
      for (let i = 0; i < BARS; i++) {
        const b = document.createElement("div");
        b.style.cssText = `width:2.5px;border-radius:2px;min-height:3px;height:3px;background:var(--border-hi);transition:height 80ms ease,background 100ms`;
        barsRef.current.appendChild(b);
      }
    }
  }, []);

  // Animate bars while recording; pulse accent color while transcribing
  useEffect(() => {
    if (!barsRef.current) return;
    const bars = Array.from(barsRef.current.children) as HTMLElement[];

    if (isRecording) {
      const mid = bars.length / 2;
      waveTimerRef.current = setInterval(() => {
        bars.forEach((b, i) => {
          const dist = Math.abs(i - mid) / mid;
          const h = Math.max(3, Math.round((1 - dist * 0.35) * Math.random() * 38));
          b.style.height = h + "px";
          b.style.background = "var(--accent)";
        });
      }, 85);
    } else {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      const color = isTranscribing ? "var(--accent)" : "var(--border-hi)";
      bars.forEach((b) => { b.style.height = "3px"; b.style.background = color; });
    }

    return () => { if (waveTimerRef.current) clearInterval(waveTimerRef.current); };
  }, [isRecording, isTranscribing]);

  /** Send recorded audio blob to Groq Whisper via the backend. */
  const sendToWhisper = useCallback(async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("audio", blob, mimeToFilename(mimeType));

      const res = await fetch(`${API_BASE_URL}/api/translate/audio`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const text: string = data.transcribed_text ?? "";

      if (!text) {
        setError("No speech detected. Please try again.");
      } else {
        setTranscript(text);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Transcription failed. Is the backend running?"
      );
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setTranscript("");
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        sendToWhisper(blob, mimeType);
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone access denied. Allow it in your browser and try again."
          : "Could not access the microphone.";
      setError(msg);
    }
  }, [sendToWhisper]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Auto-start on mount — pane opens because user clicked the mic button
  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      setTimeout(() => startRecording(), 150);
    }
  }, [startRecording]);

  // Cleanup mic stream + timers on unmount
  useEffect(() => {
    return () => {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Status badge
  const statusLabel = isRecording
    ? "Listening…"
    : isTranscribing
      ? "Processing…"
      : error
        ? "Error"
        : transcript
          ? "Done"
          : "Ready";

  const statusClass = isRecording
    ? "text-success bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--success)_30%,transparent)]"
    : isTranscribing
      ? "text-accent bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
      : error
        ? "text-error bg-[color-mix(in_srgb,var(--error)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--error)_30%,transparent)]"
        : transcript
          ? "text-accent bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
          : "text-text-3 bg-surface-3 border-border";

  const dotClass = isRecording
    ? "bg-success shadow-[0_0_6px_var(--success)] animate-[blink_1s_infinite]"
    : isTranscribing
      ? "bg-accent animate-[blink_0.6s_infinite]"
      : "bg-border-hi";

  return (
    <div className="px-4 py-3 border-t border-border transition-colors duration-250">
      {/* Status row */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={[
            "inline-flex items-center gap-[5px] px-2 py-[2px] rounded-pill text-[9px] font-bold tracking-[0.08em] uppercase font-mono border shadow-inset transition-all",
            statusClass,
          ].join(" ")}
        >
          <span className={["w-[4px] h-[4px] rounded-full", dotClass].join(" ")} />
          {statusLabel}
        </div>
        <button
          onClick={onClose}
          className="text-[11px] text-text-3 hover:text-text-1 cursor-pointer transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Waveform */}
      <div
        ref={barsRef}
        className="h-10 bg-surface-3 border border-border rounded-[10px] shadow-inset flex items-center justify-center gap-[2px] px-3 mb-2 overflow-hidden transition-all duration-250"
      />

      {/* Transcript */}
      {transcript && !error && (
        <div className="bg-surface-3 border border-border rounded-[10px] px-3 py-2 mb-2 text-[13px] text-text-1 leading-relaxed shadow-inset min-h-[32px]">
          {transcript}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-[color-mix(in_srgb,var(--error)_6%,var(--surface-3))] border border-[color-mix(in_srgb,var(--error)_30%,transparent)] rounded-[10px] px-3 py-2 mb-2 text-[12px] text-error leading-snug">
          {error}
        </div>
      )}

      {/* Mic + action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleMic}
          disabled={isTranscribing}
          className={[
            "w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
            isRecording
              ? "border-[color-mix(in_srgb,var(--error)_60%,var(--accent-dim))] bg-gradient-to-b from-[#F87171] to-[#DC4545] text-white animate-[mic-ring_1.4s_ease-in-out_infinite]"
              : "text-white hover:brightness-110 hover:shadow-[0_0_12px_var(--accent)] active:scale-[0.94]",
          ].join(" ")}
          style={isRecording ? undefined : {
            background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
            border: "1px solid var(--accent-dim)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {transcript && !isRecording && !isTranscribing && (
          <div className="flex gap-2">
            <button
              onClick={() => onDone(transcript)}
              className="px-4 py-1.5 rounded-btn border border-border-hi bg-surface-2 text-text-2 font-sans text-[12.5px] font-medium cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
            >
              Done
            </button>
            <button
              onClick={() => onTranslate(transcript)}
              className="px-4 py-1.5 rounded-btn text-white font-sans text-[12.5px] font-semibold cursor-pointer transition-all hover:brightness-110 active:translate-y-px active:brightness-[0.93]"
              style={{
                background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                border: "1px solid var(--accent-dim)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              → Translate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
