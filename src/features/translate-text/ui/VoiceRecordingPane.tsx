"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHRASES = [
  "Hello, how are you doing today?",
  "I need some help please.",
  "What is your name?",
  "Nice to meet you.",
  "Thank you very much.",
  "Can you help me understand this?",
];
const BARS = 42;

interface VoiceRecordingPaneProps {
  onDone: (text: string) => void;
  onTranslate: (text: string) => void;
  onClose: () => void;
}

export default function VoiceRecordingPane({ onDone, onTranslate, onClose }: VoiceRecordingPaneProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const barsRef = useRef<HTMLDivElement>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Animate bars when recording
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
      bars.forEach((b) => { b.style.height = "3px"; b.style.background = "var(--border-hi)"; });
    }
    return () => { if (waveTimerRef.current) clearInterval(waveTimerRef.current); };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setTranscript("");
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    let idx = 0;
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setTimeout(() => {
      typeTimerRef.current = setInterval(() => {
        if (idx < phrase.length) {
          setTranscript((prev) => prev + phrase[idx]);
          idx++;
        } else {
          clearInterval(typeTimerRef.current!);
          setIsRecording(false);
        }
      }, 60 + Math.random() * 45);
    }, 500);
  }, []);

  const stopRecording = useCallback(() => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setIsRecording(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Auto-start recording on mount
  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      // Small delay so bars DOM is ready
      setTimeout(() => startRecording(), 150);
    }
  }, [startRecording]);

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    };
  }, []);

  return (
    <div className="px-4 py-3 border-t border-border transition-colors duration-250">
      {/* Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={[
            "inline-flex items-center gap-[5px] px-2 py-[2px] rounded-pill text-[9px] font-bold tracking-[0.08em] uppercase font-mono border shadow-inset transition-all",
            isRecording
              ? "text-success bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--success)_30%,transparent)]"
              : transcript
                ? "text-accent bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-3))] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                : "text-text-3 bg-surface-3 border-border",
          ].join(" ")}>
            <span className={[
              "w-[4px] h-[4px] rounded-full",
              isRecording ? "bg-success shadow-[0_0_6px_var(--success)] animate-[blink_1s_infinite]" : "bg-border-hi",
            ].join(" ")} />
            {isRecording ? "Listening…" : transcript ? "Done" : "Ready"}
          </div>
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
      {transcript && (
        <div className="bg-surface-3 border border-border rounded-[10px] px-3 py-2 mb-2 text-[13px] text-text-1 leading-relaxed shadow-inset min-h-[32px]">
          {transcript}
          {isRecording && <span className="inline-block w-[2px] h-3.5 bg-accent align-middle ml-0.5 animate-[blink_0.8s_step-end_infinite]" />}
        </div>
      )}

      {/* Mic + action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleMic}
          className={[
            "w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150",
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

        {transcript && !isRecording && (
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
