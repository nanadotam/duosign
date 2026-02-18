"use client";

import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import GuestBanner from "@/widgets/guest-banner/GuestBanner";
import InputPanel from "@/widgets/input-panel/InputPanel";
import AvatarPanel from "@/widgets/avatar-panel/AvatarPanel";
import { ToastProvider } from "@/shared/ui/Toast";
import { useTranslate } from "@/features/translate-text/model/useTranslate";
import { usePlayback } from "@/features/animate-avatar/model/usePlayback";
import { useCallback } from "react";

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
    translate();
    // Start playback after translation finishes (wait for the 300ms simulation)
    setTimeout(() => {
      play();
    }, 350);
  }, [translate, play]);

  const handleClear = useCallback(() => {
    clearInput();
    reset();
  }, [clearInput, reset]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <GuestBanner remaining={3} />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[18px] p-5 max-w-[1300px] w-full mx-auto">
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
          />
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
