"use client";

import { useState, useEffect, useRef } from "react";
import { useLoading, type LoadingStep } from "@/shared/providers/LoadingProvider";

const SUBTITLES = [
  "Warming up the sign language engine...",
  "Downloading hand tracking models...",
  "Teaching the avatar to sign...",
  "Loading MediaPipe vision \u2014 this takes a moment...",
  "Almost there \u2014 calibrating finger tracking...",
  "Preparing the 3D avatar stage...",
  "Fetching sign language data...",
  "Setting up pose estimation...",
];

function StepRow({ step }: { step: LoadingStep }) {
  const icon =
    step.status === "ready" ? (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--success, #22c55e)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : step.status === "error" ? (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--danger, #ef4444)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ) : step.status === "loading" ? (
      <div
        className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        style={{ color: "var(--accent, #6366f1)" }}
      />
    ) : (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-30" />
    );

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-shrink-0">{icon}</div>
      <span
        className={[
          "text-[12px] font-medium transition-colors duration-200",
          step.status === "ready"
            ? "text-text-1"
            : step.status === "error"
              ? "text-[var(--danger,#ef4444)]"
              : step.status === "loading"
                ? "text-text-2"
                : "text-text-3",
        ].join(" ")}
      >
        {step.label}
      </span>
    </div>
  );
}

export default function LoadingOverlay() {
  const { steps, overallReady } = useLoading();
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Rotate subtitles every 3s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % SUBTITLES.length);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Fade out when ready
  useEffect(() => {
    if (overallReady) {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [overallReady]);

  if (!visible) return null;

  const readyCount = steps.filter(
    (s) => s.status === "ready" || s.status === "error"
  ).length;
  const progressPct = (readyCount / steps.length) * 100;

  return (
    <div
      className={[
        "absolute inset-0 z-20 flex flex-col items-center justify-center",
        "transition-opacity duration-500",
        overallReady ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
      style={{
        background:
          "color-mix(in srgb, var(--surface, #0f0f10) 92%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Title */}
      <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-text-3 mb-5">
        Preparing DuoSign
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-2.5 mb-5 min-w-[180px]">
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-[200px] h-[3px] rounded-full bg-surface-3 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: "var(--accent, #6366f1)",
          }}
        />
      </div>

      {/* Rotating subtitle */}
      <p
        className="text-[11px] text-text-3 italic text-center max-w-[260px] transition-opacity duration-300"
        key={subtitleIndex}
      >
        {SUBTITLES[subtitleIndex]}
      </p>
    </div>
  );
}
