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
  // Generation counter — incremented on every translate() call.
  // Any state update from a superseded call is discarded, even if stale SSE
  // bytes slip through the AbortController before it fully cancels.
  const generationRef = useRef(0);

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

  type TranslationEngine = "Hybrid (Rule + LLM)" | "Rule-based only" | "LLM only";

  /** Set state from a translateFast response (shared by rule-based path + fallback). */
  const applyFastResult = useCallback(
    (data: TranslateApiResponse, elapsed: number, text: string) => {
      setGlossText(data.gloss);
      setGlossTokens(toGlossTokens(data.tokens));
      setTranslationPhase("rule_based");
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
    },
    [toGlossTokens]
  );

  /** Main translate — engine param selects which backend path to use:
   *  - "Rule-based only"   → POST /api/translate/fast  (<50ms, no LLM)
   *  - "Hybrid (Rule+LLM)" → SSE stream, accept first result that arrives
   *  - "LLM only"          → SSE stream, skip rule_based events, wait for llm_quality
   */
  const translate = useCallback(async (engine: TranslationEngine = "Hybrid (Rule + LLM)") => {
    const text = inputText.trim();
    if (!text) return;

    // Stamp this call with a generation. Any state updates from an older
    // generation are silently dropped even if abort didn't fully stop them.
    const myGen = ++generationRef.current;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsTranslating(true);
    setTranslationPhase("translating");
    setDebugInfo(null);

    const startTime = performance.now();

    // ── Rule-based only: bypass SSE, use fast endpoint directly ──────────────
    if (engine === "Rule-based only") {
      try {
        const data = await translateFast(text, controller.signal);
        if (generationRef.current !== myGen) return;
        applyFastResult(data, performance.now() - startTime, text);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (generationRef.current !== myGen) return;
        console.error("Translation failed:", err);
        setGlossText("⚠ Translation unavailable — is the backend running?");
        setGlossTokens([]);
        setDebugInfo(null);
      } finally {
        if (generationRef.current === myGen) {
          setIsTranslating(false);
          setActiveIndex(-1);
        }
      }
      return;
    }

    // ── Hybrid / LLM only: use SSE stream ────────────────────────────────────
    const phases: DebugInfo["phases"] = [];

    try {
      for await (const event of translateStream(text, controller.signal)) {
        // Superseded by a newer translate() call — stop immediately
        if (generationRef.current !== myGen) break;
        if (event.event === "done") break;

        // LLM only mode: ignore the rule_based result, wait for llm_quality
        if (engine === "LLM only" && event.event === "rule_based") continue;

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
      // Also drop if superseded
      if (generationRef.current !== myGen) return;

      // Network error → fall back to fast (non-streaming) endpoint
      console.warn("Stream failed, trying fast endpoint:", err);
      try {
        const data = await translateFast(text, controller.signal);
        if (generationRef.current !== myGen) return; // Check again after await
        applyFastResult(data, performance.now() - startTime, text);
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error && fallbackErr.name === "AbortError") return;
        if (generationRef.current !== myGen) return;
        console.error("Translation failed:", fallbackErr);
        setGlossText("⚠ Translation unavailable — is the backend running?");
        setGlossTokens([]);
        setDebugInfo(null);
      }
    } finally {
      // Only update loading state for the current generation — a superseded
      // call setting isTranslating(false) would prematurely fire the fallback
      // play effect in page.tsx with stale tokens.
      if (generationRef.current === myGen) {
        setIsTranslating(false);
        setActiveIndex(-1);
      }
    }
  }, [inputText, toGlossTokens, applyFastResult]);

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
