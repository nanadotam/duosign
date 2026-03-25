"use client";

import { useTestingMode } from "../model/TestingModeProvider";

interface ResearchBadgeProps {
  onEndSession: () => void;
}

export default function ResearchBadge({ onEndSession }: ResearchBadgeProps) {
  const { isTestingMode, session } = useTestingMode();

  if (!isTestingMode || !session) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[280] flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border shadow-raised-sm">
      <span className="text-xs">🔬</span>
      <span className="text-[11px] font-medium text-text-2">
        Research Mode
      </span>
      <button
        onClick={onEndSession}
        className="text-[11px] font-medium text-error hover:underline cursor-pointer ml-1"
      >
        End Session
      </button>
    </div>
  );
}
