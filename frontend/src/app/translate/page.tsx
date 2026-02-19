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
import GlossChip from "@/shared/ui/GlossChip";
import Link from "next/link";

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
    glossText,
    isTranslating,
    translate,
    clearInput,
    wordCount,
    charCount,
    activeIndex,
    setActiveIndex,
    debugInfo,
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
      {/*
        MOBILE LAYOUT STRATEGY
        ─────────────────────────────────────────────────────
        The outer div is a tall flex column that allows natural
        page scroll. This means panels are NEVER clipped and
        keep their border-radius.

        The InputPanel sits at the BOTTOM of the flex column
        with `sticky bottom-3` so it pins to the viewport
        bottom as the user scrolls up through content above it.

        DESKTOP: a side-by-side 2-column grid inside <main>
        is used instead, with the same panels in normal order.
      */}
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <GuestBanner remaining={3} />

        {/* ═══════════════════════════════════
            DESKTOP LAYOUT (≥ 1024px)
        ═══════════════════════════════════ */}
        <main className="hidden lg:flex lg:flex-1 lg:flex-col">
          <div className="flex-1 grid grid-cols-2 gap-[18px] p-5 max-w-[1300px] w-full mx-auto">
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
                glossText={glossText}
                debugInfo={debugInfo}
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
          </div>
        </main>

        {/* ═══════════════════════════════════
            MOBILE LAYOUT (< 1024px)
            Scrollable column — panels keep
            their rounded corners. Input is
            sticky at the bottom.
        ═══════════════════════════════════ */}
        <div className="lg:hidden flex flex-col flex-1">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 flex flex-col gap-3">

            {/* Avatar Panel — full rounded corners */}
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

            {/* Gloss Output — card with rounded corners */}
            <div className="bg-surface border border-border rounded-panel shadow-raised px-3.5 py-3">
              <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2">
                ASL Gloss Output
              </div>
              <div className="flex flex-wrap gap-1.5">
                {glossTokens.length === 0 ? (
                  <div className="text-text-3 text-[11.5px] italic py-1">
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
                      onClick={() => setActiveIndex(i)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Recent Translations — mobile only */}
            {recentHistory.length > 0 && (
              <div className="bg-surface border border-border rounded-panel shadow-raised px-3.5 py-3">
                <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2">
                  Recent Translations
                </div>
                <div className="flex flex-col gap-2">
                  {recentHistory.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface-2 border border-border rounded-[12px] px-3 py-2.5 shadow-raised-sm transition-all duration-200 active:border-accent cursor-pointer"
                      onClick={() => setInputText(entry.inputText)}
                    >
                      <p className="text-[13px] text-text-1 leading-snug mb-1.5 line-clamp-2">
                        {entry.inputText}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {entry.glossTokens.slice(0, 5).map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-full border border-border-hi bg-surface-3 text-text-2 text-[10px] font-semibold font-mono tracking-[0.04em]"
                          >
                            {t.text}
                          </span>
                        ))}
                        {entry.glossTokens.length > 5 && (
                          <span className="text-[10px] text-text-3 self-center">
                            +{entry.glossTokens.length - 5}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-3 text-right">
                        {entry.relativeTime}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/history"
                  className="flex items-center justify-center gap-1.5 mt-2 py-1.5 text-[12px] font-semibold text-accent no-underline"
                >
                  View All History →
                </Link>
              </div>
            )}

            {/* Spacer so sticky input doesn't cover content */}
            <div className="h-24 shrink-0" />
          </div>

          {/* Sticky Input Panel — stays at bottom of viewport */}
          <div className="sticky bottom-0 px-3 pb-3 pt-1.5">
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
              glossText={glossText}
              debugInfo={debugInfo}
            />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
