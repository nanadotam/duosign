"use client";

import { useState, useCallback, useRef } from "react";

export type TranslationPhase = "idle" | "translating" | "rule_based" | "llm_quality";
import {
  translateStream,
  translateFast,
  type TranslateApiResponse,
} from "@/shared/api/glossApi";
import type { GlossToken } from "@/entities/gloss/types";
import type { DebugInfo } from "@/features/translate-text/ui/DebugStats";

// Map internal IX markers → readable display forms
const IX_DISPLAY: Record<string, string> = {
  "IX-1": "I",
  "IX-2": "YOU",
  "IX-3": "HE/SHE",
  "IX-1+": "WE",
  "IX-3+": "THEY",
};

function expandFingerspelledTokens(tokens: string[]): string[] {
  return tokens.flatMap((token) => {
    const normalized = token.toUpperCase();
    if (normalized.startsWith("IX-")) return [token];

    const parts = normalized.split("-");
    const isFingerToken = parts.length > 1 && parts.every((part) => part.length === 1 && /^[A-Z]$/.test(part));
    return isFingerToken ? parts : [token];
  });
}

export function useTranslate() {
  const [inputText, setInputText] = useState("");
  const [glossTokens, setGlossTokens] = useState<GlossToken[]>([]);
  const [glossText, setGlossText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationPhase, setTranslationPhase] = useState<TranslationPhase>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const idCounter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  /** Convert API response tokens to GlossToken[] for chip display.
   *  Replaces IX-1/IX-2/IX-3 with I/YOU/HE-SHE for user-facing display. */
  const toGlossTokens = useCallback((tokens: string[]): GlossToken[] => {
    return expandFingerspelledTokens(tokens).map((t) => {
      const display = IX_DISPLAY[t] ?? t;
      return {
        id: `g-${idCounter.current++}`,
        text: display,
        // Fingerspelled = has hyphens but is NOT an IX marker ("H-E-L-L-O" yes, "HE/SHE" no)
        isSpelled: t.includes("-") && t.length > 1 && !(t in IX_DISPLAY),
        isActive: false,
      };
    });
  }, []);

  /** Main translate — uses SSE streaming for progressive updates */
  const translate = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsTranslating(true);
    setTranslationPhase("translating");
    setDebugInfo(null);

    const startTime = performance.now();
    const phases: DebugInfo["phases"] = [];

    try {
      for await (const event of translateStream(text, controller.signal)) {
        if (event.event === "done") break;

        const data = event.data as TranslateApiResponse;
        const elapsed = performance.now() - startTime;

        // Track phases for timeline
        phases.push({
          event: event.event,
          gloss: data.gloss,
          timestamp: elapsed,
        });

        // Update display text (triggers use-scramble animation)
        setGlossText(data.gloss);

        // Update token chips (IX markers → readable pronouns)
        setGlossTokens(toGlossTokens(data.tokens));

        // Track pipeline phase for UI status
        setTranslationPhase(event.event === "llm_quality" ? "llm_quality" : "rule_based");

        // Track rule-based result for comparison
        const ruleGloss = event.event === "rule_based" ? data.gloss : undefined;

        // Update debug info
        setDebugInfo((prev) => ({
          method: data.method,
          confidence: data.confidence,
          glossInternal: data.gloss_internal,
          glossDisplay: data.gloss,
          tokenCount: data.tokens.length,
          processingTimeMs: elapsed,
          inputWordCount: text.trim().split(/\s+/).length,
          availableGlosses: data.tokens.filter((t) => !t.startsWith("IX-") && t !== "NOT"),
          llmImproved: event.event === "llm_quality",
          ruleBasedGloss: ruleGloss ?? prev?.ruleBasedGloss,
          phases: [...phases],
        }));
      }
    } catch (err) {
      // If aborted (user typed new text), silently ignore
      if (err instanceof Error && err.name === "AbortError") return;

      // Network error → fall back to fast (non-streaming) endpoint
      console.warn("Stream failed, trying fast endpoint:", err);
      try {
        const data = await translateFast(text, controller.signal);
        const elapsed = performance.now() - startTime;

        setGlossText(data.gloss);
        setGlossTokens(toGlossTokens(data.tokens));
        setDebugInfo({
          method: data.method,
          confidence: data.confidence,
          glossInternal: data.gloss_internal,
          glossDisplay: data.gloss,
          tokenCount: data.tokens.length,
          processingTimeMs: elapsed,
          inputWordCount: text.trim().split(/\s+/).length,
          availableGlosses: data.tokens.filter((t) => !t.startsWith("IX-") && t !== "NOT"),
          phases: [{ event: "rule_based", gloss: data.gloss, timestamp: elapsed }],
        });
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error && fallbackErr.name === "AbortError") return;
        console.error("Translation failed:", fallbackErr);
        setGlossText("⚠ Translation unavailable — is the backend running?");
        setGlossTokens([]);
        setDebugInfo(null);
      }
    } finally {
      setIsTranslating(false);
      setActiveIndex(-1);
    }
  }, [inputText, toGlossTokens]);

  const clearInput = useCallback(() => {
    abortRef.current?.abort();
    setInputText("");
    setGlossTokens([]);
    setGlossText("");
    setActiveIndex(-1);
    setDebugInfo(null);
    setTranslationPhase("idle");
  }, []);

  return {
    inputText,
    setInputText,
    glossTokens,
    setGlossTokens,
    glossText,
    isTranslating,
    translationPhase,
    translate,
    clearInput,
    wordCount,
    charCount,
    activeIndex,
    setActiveIndex,
    debugInfo,
  };
}
