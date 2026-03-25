"use client";

import { useEffect, useState, useCallback } from "react";

export interface TestingToastData {
  id: string;
  content: string;
  hint?: string;
  actionLabel?: string;
  secondaryLabel?: string;
  onAction?: () => void;
  onSecondary?: () => void;
  onDismiss?: (by: "auto" | "user") => void;
  duration?: number; // ms, default 8000
  variant?: "default" | "warning";
}

export function TestingToastItem({
  toast,
  onRemove,
}: {
  toast: TestingToastData;
  onRemove: (id: string) => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 8000;

  const dismiss = useCallback(
    (by: "auto" | "user") => {
      if (leaving) return;
      setLeaving(true);
      toast.onDismiss?.(by);
      setTimeout(() => onRemove(toast.id), 300);
    },
    [leaving, toast, onRemove]
  );

  useEffect(() => {
    const timer = setTimeout(() => dismiss("auto"), duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  const borderColor =
    toast.variant === "warning"
      ? "border-yellow-500/40"
      : "border-accent/30";

  const accentBar =
    toast.variant === "warning"
      ? "bg-yellow-500"
      : "bg-[var(--accent)]";

  return (
    <div
      className={[
        "pointer-events-auto relative overflow-hidden",
        "bg-surface border rounded-panel shadow-raised",
        borderColor,
        "max-w-sm w-full",
        leaving
          ? "animate-[toast-out_0.3s_ease_forwards]"
          : "animate-[toast-in_0.3s_ease_forwards]",
      ].join(" ")}
    >
      {/* Accent bar at top */}
      <div className={`h-[2px] ${accentBar} w-full`} />

      <div className="px-4 py-3">
        {/* Content */}
        <p className="text-sm text-text-1 leading-relaxed">{toast.content}</p>

        {/* Hint */}
        {toast.hint && (
          <p className="text-xs text-text-3 italic mt-1.5">{toast.hint}</p>
        )}

        {/* Actions */}
        {(toast.actionLabel || toast.secondaryLabel) && (
          <div className="flex items-center gap-2 mt-3">
            {toast.actionLabel && (
              <button
                onClick={() => {
                  toast.onAction?.();
                  dismiss("user");
                }}
                className="px-3 py-1.5 rounded-btn text-xs font-semibold text-white cursor-pointer transition-all hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            {toast.secondaryLabel && (
              <button
                onClick={() => {
                  toast.onSecondary?.();
                  dismiss("user");
                }}
                className="px-3 py-1.5 rounded-btn text-xs font-medium text-text-3 hover:text-text-1 cursor-pointer transition-colors"
              >
                {toast.secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => dismiss("user")}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-surface-2 transition-all cursor-pointer"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
