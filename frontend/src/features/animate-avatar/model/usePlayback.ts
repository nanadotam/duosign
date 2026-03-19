"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PlaybackState, PlaybackSpeed } from "@/entities/avatar/types";
import { PLAYBACK_SPEEDS } from "@/shared/constants";

interface UsePlaybackOptions {
  totalTokens: number;
  onTokenChange?: (index: number) => void;
  onComplete?: () => void;
}

// TODO: Guest User - Control playback with pause, resume, previous/next token navigation, replay, and adjustable speed (0.5x, 1x, 1.5x, 2x).
export function usePlayback({ totalTokens, onTokenChange, onComplete }: UsePlaybackOptions) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback((idx: number, spd: PlaybackSpeed) => {
    if (stateRef.current !== "playing") return;
    if (idx < totalTokens) {
      setCurrentIndex(idx);
      onTokenChange?.(idx);
      const delay = 900 * (1 / spd);
      timerRef.current = setTimeout(() => tick(idx + 1, spd), delay);
    } else {
      setState("complete");
      onComplete?.();
    }
  }, [totalTokens, onTokenChange, onComplete]);

  const play = useCallback(() => {
    if (totalTokens === 0) return;
    setState("playing");
    // Will start ticking from currentIndex via useEffect
  }, [totalTokens]);

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const togglePlay = useCallback(() => {
    if (state === "playing") {
      pause();
    } else {
      if (state === "complete") setCurrentIndex(0);
      play();
    }
  }, [state, play, pause]);

  const prevToken = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.max(0, prev - 1);
      onTokenChange?.(next);
      return next;
    });
  }, [onTokenChange]);

  const nextToken = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(totalTokens - 1, prev + 1);
      onTokenChange?.(next);
      return next;
    });
  }, [totalTokens, onTokenChange]);

  const replay = useCallback(() => {
    clearTimer();
    setCurrentIndex(0);
    setState("playing");
  }, [clearTimer]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = PLAYBACK_SPEEDS.indexOf(prev);
      return PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    });
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
    setCurrentIndex(0);
  }, [clearTimer]);

  // Trigger tick when state becomes "playing"
  useEffect(() => {
    if (state === "playing") {
      clearTimer();
      tick(currentIndex, speed);
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, speed]);

  return {
    state,
    currentIndex,
    speed,
    play,
    pause,
    togglePlay,
    prevToken,
    nextToken,
    replay,
    cycleSpeed,
    reset,
  };
}
