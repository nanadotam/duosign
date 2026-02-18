"use client";

import GlossChip from "@/shared/ui/GlossChip";
import Badge from "@/shared/ui/Badge";
import type { GlossToken } from "@/entities/gloss/types";

interface HistoryCardProps {
  inputText: string;
  glossTokens: GlossToken[];
  source: "typed" | "voice";
  platform: "web" | "extension";
  relativeTime: string;
  onReplay?: () => void;
  onDelete?: () => void;
}

export default function HistoryCard({
  inputText,
  glossTokens,
  source,
  platform,
  relativeTime,
  onReplay,
  onDelete,
}: HistoryCardProps) {
  return (
    <div className="bg-surface border border-border rounded-panel shadow-raised-sm p-4 transition-all duration-250 hover:border-border-hi hover:shadow-raised group">
      {/* Input text (2-line truncate) */}
      <p className="text-sm text-text-1 line-clamp-2 mb-3 leading-relaxed">
        {inputText}
      </p>

      {/* Gloss strip (display only) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-3">
        {glossTokens.map((token) => (
          <GlossChip
            key={token.id}
            text={token.text}
            isSpelled={token.isSpelled}
            delay={0}
          />
        ))}
      </div>

      {/* Metadata row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Input method icon */}
          <div className="text-text-3">
            {source === "voice" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            )}
          </div>
          <Badge variant={platform} />
          <Badge variant={source} />
          <span className="text-[11px] text-text-3 ml-1">{relativeTime}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onReplay && (
            <button
              onClick={onReplay}
              className="w-7 h-7 rounded-btn border border-border bg-surface-2 text-text-3 flex items-center justify-center cursor-pointer hover:text-text-1 hover:border-border-hi transition-all shadow-raised-sm active:shadow-inset-press active:translate-y-px"
              title="Replay"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-btn border border-border bg-surface-2 text-text-3 flex items-center justify-center cursor-pointer hover:text-error hover:border-error/30 transition-all shadow-raised-sm active:shadow-inset-press active:translate-y-px"
              title="Delete"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
