"use client";

import { useState, useCallback } from "react";
import type { PlaybackState, PlaybackSpeed } from "@/entities/avatar/types";
import { PLAYBACK_SPEEDS } from "@/shared/constants";

interface UsePlaybackOptions {
  totalTokens: number;
  onTokenChange?: (index: number) => void;
  onComplete?: () => void;
}

export function usePlayback({ totalTokens, onTokenChange, onComplete }: UsePlaybackOptions) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const setCurrentIndex = useCallback((index: number) => {
    const next = Math.min(Math.max(index, 0), Math.max(totalTokens - 1, 0));
    setCurrentIndexState(next);
    onTokenChange?.(next);
  }, [onTokenChange, totalTokens]);

  const play = useCallback(() => {
    if (totalTokens === 0) return;
    setState("playing");
  }, [totalTokens]);

  const pause = useCallback(() => {
    setState("paused");
  }, []);

  const complete = useCallback(() => {
    setState("complete");
    onComplete?.();
  }, [onComplete]);

  const togglePlay = useCallback(() => {
    setState((prev) => {
      if (prev === "playing") return "paused";
      if (prev === "complete") {
        setCurrentIndexState(0);
        onTokenChange?.(0);
      }
      return "playing";
    });
  }, [onTokenChange]);

  const prevToken = useCallback(() => {
    setCurrentIndex((currentIndex - 1 + totalTokens) % Math.max(totalTokens, 1));
  }, [currentIndex, setCurrentIndex, totalTokens]);

  const nextToken = useCallback(() => {
    setCurrentIndex((currentIndex + 1) % Math.max(totalTokens, 1));
  }, [currentIndex, setCurrentIndex, totalTokens]);

  const replay = useCallback(() => {
    setCurrentIndex(0);
    setState("playing");
  }, [setCurrentIndex]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = PLAYBACK_SPEEDS.indexOf(prev);
      return PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    });
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setCurrentIndex(0);
  }, [setCurrentIndex]);

  return {
    state,
    currentIndex,
    speed,
    play,
    pause,
    complete,
    setCurrentIndex,
    togglePlay,
    prevToken,
    nextToken,
    replay,
    cycleSpeed,
    reset,
  };
}
