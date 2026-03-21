"use client";

import { useState } from "react";

export interface DebugInfo {
  method: string;
  confidence: number;
  glossInternal: string;
  glossDisplay: string;
  tokenCount: number;
  processingTimeMs: number;
  inputWordCount: number;
  availableGlosses: string[];
  llmReason?: string;
  llmImproved?: boolean;
  ruleBasedGloss?: string;
  phases: { event: string; gloss: string; timestamp: number }[];
}

interface DebugStatsProps {
  info: DebugInfo | null;
}

/**
 * DebugStats — collapsible "Stats for Nerds" panel.
 * Shows translation pipeline diagnostics for development.
 */
export default function DebugStats({ info }: DebugStatsProps) {
  const [open, setOpen] = useState(false);

  if (!info) return null;

  const confidencePct = Math.round(info.confidence * 100);
  const confidenceColor =
    confidencePct >= 80
      ? "text-[var(--success)]"
      : confidencePct >= 50
        ? "text-yellow-400"
        : "text-[var(--error)]";

  const methodLabel =
    info.method === "rule_based"
      ? "Rule-based"
      : info.method === "llm_quality"
        ? "LLM Enhanced"
        : "LLM Fallback";

  const methodColor =
    info.method === "rule_based"
      ? "bg-teal/[0.15] text-teal border-teal/30"
      : info.method === "llm_quality"
        ? "bg-accent/[0.15] text-accent border-accent/30"
        : "bg-yellow-500/[0.15] text-yellow-400 border-yellow-500/30";

  // Compression ratio: how much shorter the gloss is vs input
  const compressionRatio =
    info.inputWordCount > 0
      ? Math.round((info.tokenCount / info.inputWordCount) * 100)
      : 100;

  return (
    <div className="border-t border-border transition-colors duration-250">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 hover:text-text-2 transition-colors duration-150 cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Stats for Nerds
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="px-4 pb-3 animate-[chip-in_0.15s_ease]">
          <div className="bg-surface-3 border border-border rounded-[10px] p-3 font-mono text-[11px] leading-[1.7] shadow-inset">
            {/* Method + Confidence + Speed row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`inline-flex px-2 py-0.5 rounded-pill border text-[10px] font-bold tracking-wide ${methodColor}`}
              >
                {methodLabel}
              </span>
              <span className={`font-bold ${confidenceColor}`}>
                {confidencePct}% confidence
              </span>
              <span className="text-text-3 ml-auto">
                {info.processingTimeMs.toFixed(0)}ms
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-text-2">
              {/* Input → Output summary */}
              <span className="text-text-3">input</span>
              <span>
                {info.inputWordCount} words → {info.tokenCount} gloss tokens
                <span className="text-text-3 ml-1">({compressionRatio}% ratio)</span>
              </span>

              {/* Display gloss */}
              <span className="text-text-3">display</span>
              <span className="text-accent break-all font-bold">{info.glossDisplay}</span>

              {/* Internal form (IX markers) */}
              <span className="text-text-3">internal</span>
              <span className="text-text-2 break-all">{info.glossInternal}</span>

              {/* Available glosses */}
              <span className="text-text-3">vocab</span>
              <span>
                {info.availableGlosses.length} token{info.availableGlosses.length !== 1 ? "s" : ""} matched
                <span className="text-text-3 ml-1">
                  [{info.availableGlosses.join(", ")}]
                </span>
              </span>

              {/* LLM info */}
              {info.llmReason && (
                <>
                  <span className="text-text-3">llm trigger</span>
                  <span className="text-yellow-400">{info.llmReason}</span>
                </>
              )}

              {info.llmImproved && info.ruleBasedGloss && (
                <>
                  <span className="text-text-3">rule → llm</span>
                  <span>
                    <span className="text-text-3 line-through">{info.ruleBasedGloss}</span>
                    <span className="text-text-3 mx-1">→</span>
                    <span className="text-accent">{info.glossDisplay}</span>
                  </span>
                </>
              )}

              {info.llmImproved && !info.ruleBasedGloss && (
                <>
                  <span className="text-text-3">llm</span>
                  <span className="text-accent">✓ improved result</span>
                </>
              )}
            </div>

            {/* Phase timeline */}
            {info.phases.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-[9px] text-text-3 uppercase tracking-wider mb-1">
                  Pipeline Timeline
                </div>
                {info.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-text-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        p.event === "rule_based" ? "bg-teal" : "bg-accent"
                      }`}
                    />
                    <span className="w-4 flex-shrink-0 text-text-3">
                      {p.event === "rule_based" ? (
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" className="text-teal">
                          <path d="M7 1L2 7h4l-1 4 5-6H6L7 1z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" className="text-accent">
                          <circle cx="6" cy="6" r="2" />
                          <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.93 2.93l1.06 1.06M8.01 8.01l1.06 1.06M2.93 9.07l1.06-1.06M8.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        </svg>
                      )}
                    </span>
                    <span className="text-text-2 truncate flex-1">{p.gloss}</span>
                    <span className="text-text-3 text-[10px] tabular-nums">
                      +{Math.round(p.timestamp)}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
