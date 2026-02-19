"use client";

import Link from "next/link";
import GlossChip from "@/shared/ui/GlossChip";
import type { GlossToken } from "@/entities/gloss/types";

interface RecentEntry {
  id: string;
  inputText: string;
  glossTokens: GlossToken[];
  relativeTime: string;
}

interface RecentTranslationsProps {
  entries: RecentEntry[];
  onDelete?: (id: string) => void;
}

export default function RecentTranslations({ entries, onDelete }: RecentTranslationsProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 transition-colors duration-250">
        Recent Translations
      </div>
      <div className="flex flex-col gap-2">
        {entries.slice(0, 3).map((entry) => (
          <div
            key={entry.id}
            className="bg-surface border border-border rounded-[12px] px-3 py-2.5 shadow-raised-sm transition-all duration-200 hover:border-border-hi hover:shadow-raised group cursor-pointer"
          >
            <p className="text-[13px] text-text-1 line-clamp-1 mb-1.5 leading-relaxed">
              {entry.inputText}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {entry.glossTokens.slice(0, 5).map((t) => (
                  <GlossChip key={t.id} text={t.text} isSpelled={t.isSpelled} delay={0} />
                ))}
                {entry.glossTokens.length > 5 && (
                  <span className="text-[10px] text-text-3 self-center ml-0.5">+{entry.glossTokens.length - 5}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-3 whitespace-nowrap">{entry.relativeTime}</span>
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    className="w-6 h-6 rounded-[6px] border border-border bg-surface-2 text-text-3 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150 hover:text-error hover:border-error/30 hover:shadow-[0_0_10px_rgba(248,113,113,0.25)] active:shadow-inset-press active:translate-y-px"
                    title="Delete"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/history"
        className="flex items-center justify-center gap-1.5 mt-2 py-1.5 text-[12px] font-medium text-accent hover:text-text-1 transition-colors no-underline"
      >
        View All History
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  );
}
