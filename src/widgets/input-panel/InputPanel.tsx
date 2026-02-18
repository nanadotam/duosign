"use client";

import { MAX_INPUT_LENGTH } from "@/shared/constants";
import GlossChip from "@/shared/ui/GlossChip";
import type { GlossToken } from "@/entities/gloss/types";

interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  glossTokens: GlossToken[];
  activeIndex: number;
  wordCount: number;
  charCount: number;
  isTranslating: boolean;
  onTranslate: () => void;
  onClear: () => void;
  onChipClick?: (index: number) => void;
}

export default function InputPanel({
  inputText,
  onInputChange,
  glossTokens,
  activeIndex,
  wordCount,
  charCount,
  isTranslating,
  onTranslate,
  onClear,
  onChipClick,
}: InputPanelProps) {
  return (
    <div className="bg-surface border border-border rounded-panel shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)] flex flex-col overflow-hidden transition-all duration-250">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border transition-all duration-250">
        <div className="flex items-center gap-[7px] text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
          <div className="w-1.5 h-1.5 rounded-full bg-border-hi flex-shrink-0 transition-colors duration-250" />
          English Input
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-pill bg-surface-3 border border-border text-[11px] text-text-3 font-mono shadow-inset leading-snug transition-all duration-250">
            {wordCount} word{wordCount !== 1 ? "s" : ""}
          </span>
          <span className="px-2 py-0.5 rounded-pill bg-surface-3 border border-border text-[11px] text-text-3 font-mono shadow-inset leading-snug transition-all duration-250">
            {charCount} / {MAX_INPUT_LENGTH}
          </span>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 py-3.5 flex-1">
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value.slice(0, MAX_INPUT_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onTranslate();
            }
          }}
          placeholder="Type something to translate into American Sign Language..."
          rows={8}
          className="w-full min-h-[190px] bg-surface-3 border border-border rounded-[12px] px-3.5 py-3.5 text-text-1 font-sans text-[15px] leading-relaxed resize-none outline-none shadow-inset transition-all duration-150 placeholder:text-text-3 focus:border-accent/60 focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border transition-colors duration-250">
        <div className="flex gap-[7px]">
          {/* Mic button */}
          <button className="w-[37px] h-[37px] rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          {/* Clear button */}
          <button
            onClick={onClear}
            className="w-[37px] h-[37px] rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
            title="Clear input"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>

        {/* Translate button */}
        <button
          onClick={onTranslate}
          disabled={isTranslating || !inputText.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-btn border border-accent-dim bg-gradient-to-b from-accent-btn-top to-accent-dim text-white font-sans text-[13.5px] font-semibold cursor-pointer tracking-[0.01em] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_4px_14px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all duration-120 hover:brightness-110 active:translate-y-px active:brightness-[0.93] active:shadow-inset-press disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {isTranslating ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
          Translate
        </button>
      </div>

      {/* Gloss Strip */}
      <div className="px-4 py-3 border-t border-border transition-colors duration-250">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 transition-colors duration-250">
          ASL Gloss Output
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {glossTokens.length === 0 ? (
            <div className="text-text-3 text-xs italic py-1">
              Gloss tokens appear here after translation
            </div>
          ) : (
            glossTokens.map((token, i) => (
              <GlossChip
                key={token.id}
                text={token.text}
                isActive={i === activeIndex}
                isSpelled={token.isSpelled}
                delay={i * 55}
                onClick={() => onChipClick?.(i)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
