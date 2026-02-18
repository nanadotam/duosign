"use client";

import { useState, useCallback, useRef } from "react";
import { GLOSS_MAP, STOP_WORDS } from "@/shared/constants";
import type { GlossToken } from "@/entities/gloss/types";

export function useTranslate() {
  const [inputText, setInputText] = useState("");
  const [glossTokens, setGlossTokens] = useState<GlossToken[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const idCounter = useRef(0);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  const toGloss = useCallback((text: string): GlossToken[] => {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    const tokens: GlossToken[] = [];
    words.forEach((w) => {
      if (GLOSS_MAP[w] != null) {
        tokens.push({
          id: `g-${idCounter.current++}`,
          text: GLOSS_MAP[w]!,
          isSpelled: false,
          isActive: false,
        });
      } else if (!STOP_WORDS.has(w) && w.length > 0) {
        tokens.push({
          id: `g-${idCounter.current++}`,
          text: w.toUpperCase(),
          isSpelled: w.length <= 4,
          isActive: false,
        });
      }
    });
    if (text.includes("?")) {
      tokens.push({
        id: `g-${idCounter.current++}`,
        text: "Q",
        isSpelled: false,
        isActive: false,
      });
    }
    return tokens.slice(0, 12);
  }, []);

  const translate = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setIsTranslating(true);
    // Simulate brief processing delay
    setTimeout(() => {
      const tokens = toGloss(text);
      setGlossTokens(tokens);
      setActiveIndex(-1);
      setIsTranslating(false);
    }, 300);
  }, [inputText, toGloss]);

  const clearInput = useCallback(() => {
    setInputText("");
    setGlossTokens([]);
    setActiveIndex(-1);
  }, []);

  return {
    inputText,
    setInputText,
    glossTokens,
    setGlossTokens,
    isTranslating,
    translate,
    clearInput,
    wordCount,
    charCount,
    activeIndex,
    setActiveIndex,
  };
}
