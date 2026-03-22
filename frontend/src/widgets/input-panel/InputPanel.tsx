"use client";

import { useRef } from "react";
import { useState } from "react";
import { MAX_INPUT_LENGTH } from "@/shared/constants";
import GlossChip from "@/shared/ui/GlossChip";
import VoiceRecordingPane from "@/features/translate-text/ui/VoiceRecordingPane";
import GlossDisplay from "@/features/translate-text/ui/GlossDisplay";
import DebugStats from "@/features/translate-text/ui/DebugStats";
import type { GlossToken } from "@/entities/gloss/types";
import type { DebugInfo } from "@/features/translate-text/ui/DebugStats";

type PipelineDisplayPhase = "idle" | "translating" | "waiting_for_llm" | "rule_based" | "llm_quality";

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
  onVoiceDone?: (text: string) => void;
  onVoiceTranslate?: (text: string) => void;
  glossText?: string;
  debugInfo?: DebugInfo | null;
  pipelinePhase?: PipelineDisplayPhase;
  pipelineTokenCount?: number;
  isSigning?: boolean;
  isOnline?: boolean;
}

// TODO: Guest User - Input English text (up to 500 characters) and receive a corresponding ASL avatar animation.
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
  onVoiceDone,
  onVoiceTranslate,
  glossText = "",
  debugInfo = null,
  pipelinePhase = "idle",
  pipelineTokenCount = 0,
  isSigning = false,
  isOnline = true,
}: InputPanelProps) {
  const [micActive, setMicActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize textarea on mobile */
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, MAX_INPUT_LENGTH);
    onInputChange(val);
    const el = e.target;
    // reset then grow
    el.style.height = "42px";
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(scrollH, 120)}px`;
  }

  return (
    <div className="
      bg-surface border border-border rounded-panel
      shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)]
      flex flex-col overflow-hidden transition-all duration-250
    ">
      {/* Panel Header — hidden on mobile (compact bar needs no header) */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border transition-all duration-250">
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
      <div className="px-2.5 py-2 lg:px-4 lg:py-3.5 flex-1">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onTranslate();
            }
          }}
          placeholder="Type to translate into ASL..."
          rows={1}
          className="
            w-full bg-surface-3 border border-border rounded-[10px] lg:rounded-[12px]
            px-3 py-2.5 lg:px-3.5 lg:py-3.5
            text-text-1 font-sans text-[14px] lg:text-[15px] leading-relaxed
            resize-none outline-none shadow-inset
            transition-all duration-150 placeholder:text-text-3
            focus:border-accent/60 focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]
            /* mobile: min 42px, grows up to 120px */
            min-h-[42px] lg:min-h-[190px]
            overflow-y-auto lg:overflow-y-hidden
          "
          style={{ height: "42px" }}
        />
      </div>

      {/* Controls Row — swaps with VoiceRecordingPane when mic is active */}
      {micActive ? (
        <VoiceRecordingPane
          onDone={(text) => {
            onVoiceDone?.(text);
            setMicActive(false);
          }}
          onTranslate={(text) => {
            onVoiceTranslate?.(text);
            setMicActive(false);
          }}
          onClose={() => setMicActive(false)}
        />
      ) : (
        <div className="flex items-center justify-between px-2.5 py-1.5 lg:px-4 lg:py-2.5 border-t border-border transition-colors duration-250">
          <div className="flex gap-1.5 lg:gap-[7px]">
            {/* Mic button */}
            <button
              onClick={() => setMicActive(true)}
              className="w-[34px] h-[34px] lg:w-[37px] lg:h-[37px] rounded-[8px] lg:rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-accent hover:border-accent/40 hover:shadow-[var(--raised-sm),0_0_12px_var(--accent-glow)] active:shadow-inset-press active:translate-y-px"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            {/* Clear button */}
            <button
              onClick={onClear}
              className="w-[34px] h-[34px] lg:w-[37px] lg:h-[37px] rounded-[8px] lg:rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-error hover:border-error/40 hover:shadow-[var(--raised-sm),0_0_12px_rgba(248,113,113,0.25)] active:shadow-inset-press active:translate-y-px"
              title="Clear input"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="flex items-center gap-1.5 lg:gap-2 px-4 py-2 lg:px-5 lg:py-2 rounded-[8px] lg:rounded-btn text-white font-sans text-[13px] lg:text-[13.5px] font-semibold cursor-pointer tracking-[0.01em] transition-all duration-120 hover:brightness-110 active:translate-y-px active:brightness-[0.93] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            style={{
              background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
              border: "1px solid var(--accent-dim)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)",
            }}
          >
            {isTranslating ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
            Translate
          </button>
        </div>
      )}

      {/* Pipeline Status Strip — desktop only */}
      {(pipelinePhase !== "idle" || !isOnline) && (
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 border-t border-border bg-surface-2/40 transition-all duration-200">
          {/* Offline badge — always visible when disconnected */}
          {!isOnline && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold tracking-[0.04em] flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Offline
            </span>
          )}

          {pipelinePhase === "translating" && (
            <>
              <div className="w-2.5 h-2.5 border-[1.5px] border-accent border-t-transparent rounded-full animate-[spin_0.7s_linear_infinite] flex-shrink-0" />
              <span className="text-[11px] text-text-2 font-medium">
                {isOnline ? "Translating…" : "Translating (offline — rule-based only)…"}
              </span>
            </>
          )}

          {pipelinePhase === "waiting_for_llm" && (
            <>
              <div className="w-2.5 h-2.5 border-[1.5px] border-accent border-t-transparent rounded-full animate-[spin_0.7s_linear_infinite] flex-shrink-0" />
              <span className="text-[11px] text-text-2 font-medium">AI enhancing…</span>
              <span className="text-[10px] text-text-3 font-mono">rule-based ready, waiting for model</span>
            </>
          )}

          {pipelinePhase === "rule_based" && (
            <>
              <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="text-[11px] text-text-2 font-medium">
                Rule-based · {pipelineTokenCount} sign{pipelineTokenCount !== 1 ? "s" : ""}
              </span>
              {isSigning && (
                <span className="ml-auto text-[11px] text-teal-400 font-semibold tracking-[0.02em] animate-pulse">
                  Signing…
                </span>
              )}
            </>
          )}

          {pipelinePhase === "llm_quality" && (
            <>
              <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 shadow-[0_0_6px_var(--accent-glow)]" />
              <span className="text-[11px] text-text-2 font-medium">
                AI-enhanced · {pipelineTokenCount} sign{pipelineTokenCount !== 1 ? "s" : ""}
              </span>
              {isSigning && (
                <span className="ml-auto text-[11px] text-accent font-semibold tracking-[0.02em] animate-pulse">
                  Signing…
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Gloss Display — scramble animation — desktop only */}
      <div className="hidden lg:block">
        <GlossDisplay glossText={glossText} />
      </div>

      {/* Gloss Strip — token chips — desktop only */}
      <div className="hidden lg:block px-4 py-3 border-t border-border transition-colors duration-250">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 transition-colors duration-250">
          Gloss Tokens
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

      {/* Debug Stats — collapsible — desktop only */}
      <div className="hidden lg:block">
        <DebugStats info={debugInfo} />
      </div>
    </div>
  );
}
