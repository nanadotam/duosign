"use client";

import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import GuestBanner from "@/widgets/guest-banner/GuestBanner";
import InputPanel from "@/widgets/input-panel/InputPanel";
import AvatarPanel from "@/widgets/avatar-panel/AvatarPanel";
import RecentTranslations from "@/widgets/recent-translations/RecentTranslations";
import { ToastProvider } from "@/shared/ui/Toast";
import { useTranslate } from "@/features/translate-text/model/useTranslate";
import { usePlayback } from "@/features/animate-avatar/model/usePlayback";
import { useCallback, useState } from "react";
import type { GlossToken } from "@/entities/gloss/types";

interface HistoryEntry {
  id: string;
  inputText: string;
  glossTokens: GlossToken[];
  relativeTime: string;
}

export default function TranslatePage() {
  const {
    inputText,
    setInputText,
    glossTokens,
    isTranslating,
    translate,
    clearInput,
    wordCount,
    charCount,
    activeIndex,
    setActiveIndex,
  } = useTranslate();

  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);

  const handleTokenChange = useCallback(
    (index: number) => setActiveIndex(index),
    [setActiveIndex]
  );

  const handleComplete = useCallback(
    () => setActiveIndex(-1),
    [setActiveIndex]
  );

  const {
    state: playbackState,
    speed,
    togglePlay,
    prevToken,
    nextToken,
    replay,
    cycleSpeed,
    play,
    reset,
  } = usePlayback({
    totalTokens: glossTokens.length,
    onTokenChange: handleTokenChange,
    onComplete: handleComplete,
  });

  const handleTranslate = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    translate();
    // Add to recent history after a brief delay for the translation
    setTimeout(() => {
      setRecentHistory((prev) => {
        const newEntry: HistoryEntry = {
          id: `rh-${Date.now()}`,
          inputText: text,
          glossTokens: glossTokens.length > 0 ? glossTokens : [],
          relativeTime: "Just now",
        };
        return [newEntry, ...prev].slice(0, 3);
      });
      play();
    }, 350);
  }, [translate, play, inputText, glossTokens]);

  const handleClear = useCallback(() => {
    clearInput();
    reset();
  }, [clearInput, reset]);

  const handleDeleteRecent = useCallback((id: string) => {
    setRecentHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Voice recording handlers
  const handleVoiceDone = useCallback((text: string) => {
    setInputText(text);
  }, [setInputText]);

  const handleVoiceTranslate = useCallback((text: string) => {
    setInputText(text);
    setTimeout(() => {
      translate();
      setTimeout(() => play(), 350);
    }, 50);
  }, [setInputText, translate, play]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <GuestBanner remaining={3} />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[18px] p-5 max-w-[1300px] w-full mx-auto">
          <div className="flex flex-col">
            <InputPanel
              inputText={inputText}
              onInputChange={setInputText}
              glossTokens={glossTokens}
              activeIndex={activeIndex}
              wordCount={wordCount}
              charCount={charCount}
              isTranslating={isTranslating}
              onTranslate={handleTranslate}
              onClear={handleClear}
              onChipClick={(index) => setActiveIndex(index)}
              onVoiceDone={handleVoiceDone}
              onVoiceTranslate={handleVoiceTranslate}
            />
            <RecentTranslations
              entries={recentHistory}
              onDelete={handleDeleteRecent}
            />
          </div>
          <AvatarPanel
            playbackState={playbackState}
            speed={speed}
            onTogglePlay={togglePlay}
            onPrev={prevToken}
            onNext={nextToken}
            onReplay={replay}
            onCycleSpeed={cycleSpeed}
            hasTokens={glossTokens.length > 0}
          />
        </main>
      </div>
    </ToastProvider>
  );
}
