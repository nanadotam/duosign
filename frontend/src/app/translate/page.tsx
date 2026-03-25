"use client";

import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import GuestBanner from "@/widgets/guest-banner/GuestBanner";
import InputPanel from "@/widgets/input-panel/InputPanel";
import AvatarPanel from "@/widgets/avatar-panel/AvatarPanel";
import RecentTranslations from "@/widgets/recent-translations/RecentTranslations";
import { ToastProvider } from "@/shared/ui/Toast";
import { LoadingProvider } from "@/shared/providers/LoadingProvider";
import dynamic from "next/dynamic";

const ExportVideoModal = dynamic(
  () => import("@/features/animate-avatar/ui/ExportVideoModal"),
  { ssr: false }
);
import { useTranslate } from "@/features/translate-text/model/useTranslate";
import { usePlayback } from "@/features/animate-avatar/model/usePlayback";
import { useHistory } from "@/shared/hooks/useHistory";
import { useGuestLimit } from "@/shared/hooks/useGuestLimit";
import { useSettings } from "@/shared/hooks/useSettings";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { GlossToken } from "@/entities/gloss/types";
import type { AvatarDisplayMode } from "@/entities/avatar/types";
import GlossChip from "@/shared/ui/GlossChip";
import Link from "next/link";
import { useToast } from "@/shared/ui/Toast";
import { useSession } from "@/lib/auth-client";
import type { HistoryEntryType } from "@/shared/lib/history";

// Outer shell — provides context, then delegates to inner component
export default function TranslatePage() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <TranslatePageContent />
      </ToastProvider>
    </LoadingProvider>
  );
}

// Inner component — all logic lives here so it's inside ToastProvider context
function TranslatePageContent() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [displayMode, setDisplayMode] = useState<AvatarDisplayMode>("avatar");
  const [showExportModal, setShowExportModal] = useState(false);
  const searchParams = useSearchParams();
  const autoplayPending = useRef(false);
  const exportPending = useRef(false);
  const pendingPlayRef = useRef<{ text: string; type: HistoryEntryType } | null>(null);
  const lastHistoryEntryIdRef = useRef<string | null>(null);
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const { remaining: guestRemaining, consume } = useGuestLimit();

  // ─── Network connectivity detection ────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const {
    inputText,
    setInputText,
    glossTokens,
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
  } = useTranslate();

  const { addEntry, getRecent, deleteEntry, markExported } = useHistory();

  // Convert history entries to the format RecentTranslations expects
  const recentHistory = useMemo(() => {
    return getRecent(3).map((e) => ({
      id: e.id,
      inputText: e.text,
      glossTokens: e.glossTokens.map((t, i) => ({
        id: `${e.id}-${i}`,
        text: t,
        isSpelled: false,
      })) as GlossToken[],
      relativeTime: e.time,
    }));
  }, [getRecent]);

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
    complete,
    setCurrentIndex,
    reset,
  } = usePlayback({
    totalTokens: glossTokens.length,
    onTokenChange: handleTokenChange,
    onComplete: handleComplete,
  });

  const attemptTranslate = useCallback(async (rawText: string, type: HistoryEntryType) => {
    const text = rawText.trim();
    if (!text) return false;

    if (!isAuthenticated) {
      try {
        const guestUsage = await consume();
        if (!guestUsage.allowed) {
          showToast(
            guestUsage.message ?? "Guest limit reached. Create an account to continue translating.",
            "error"
          );
          return false;
        }
      } catch {
        showToast("Could not verify your guest translation limit right now.", "error");
        return false;
      }
    }

    reset();
    pendingPlayRef.current = { text, type };
    void translate(settings.translationEngine, text);
    return true;
  }, [consume, isAuthenticated, reset, settings.translationEngine, showToast, translate]);

  const handleOpenExport = useCallback(() => {
    if (lastHistoryEntryIdRef.current) {
      markExported(lastHistoryEntryIdRef.current);
    }
    setShowExportModal(true);
  }, [markExported]);

  // Read URL params: ?text=, ?autoplay=true, ?export=true
  useEffect(() => {
    const text = searchParams.get("text");
    const shouldAutoplay = searchParams.get("autoplay") === "true";
    const shouldExport = searchParams.get("export") === "true";
    if (text) {
      setInputText(decodeURIComponent(text));
      if (shouldAutoplay || shouldExport) autoplayPending.current = true;
      if (shouldExport) exportPending.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once inputText is set and autoplay/export is pending, trigger translate
  // (play is triggered by the glossTokens effect below, not a raw timeout)
  useEffect(() => {
    if (autoplayPending.current && inputText) {
      autoplayPending.current = false;
      void attemptTranslate(inputText, "typed");
    }
  }, [attemptTranslate, inputText]);

  // Once glossTokens are ready and export is pending, open the export modal
  useEffect(() => {
    if (exportPending.current && glossTokens.length > 0) {
      exportPending.current = false;
      setTimeout(() => handleOpenExport(), 800);
    }
  }, [glossTokens, handleOpenExport]);

  // ─── Network-aware playback trigger ────────────────────────────────────────
  // Online:  wait for llm_quality before signing (rule_based is just a preview)
  // Offline: sign as soon as rule_based arrives (LLM unreachable anyway)
  useEffect(() => {
    if (pendingPlayRef.current === null) return;
    if (glossTokens.length === 0) return;

    // Online and still waiting for LLM: hold off
    if (isOnline && translationPhase === "rule_based") return;

    // Either offline (sign with rule_based) or LLM arrived (sign with llm_quality)
    const pendingPlay = pendingPlayRef.current;
    pendingPlayRef.current = null;

    const entry = addEntry(pendingPlay.text, glossTokens.map((t) => t.text), pendingPlay.type);
    lastHistoryEntryIdRef.current = entry.id;
    play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glossTokens, translationPhase]);

  // ─── Fallback: stream ended without an LLM result (online but LLM skipped) ─
  useEffect(() => {
    if (isTranslating) return;                        // still in flight
    if (pendingPlayRef.current === null) return;      // already played
    if (glossTokens.length === 0) return;             // nothing to play

    const pendingPlay = pendingPlayRef.current;
    pendingPlayRef.current = null;

    const entry = addEntry(pendingPlay.text, glossTokens.map((t) => t.text), pendingPlay.type);
    lastHistoryEntryIdRef.current = entry.id;
    play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTranslating]);

  const handleTranslate = useCallback(() => {
    void attemptTranslate(inputText, "typed");
  }, [attemptTranslate, inputText]);

  const handleClear = useCallback(() => {
    clearInput();
    reset();
    pendingPlayRef.current = null;
  }, [clearInput, reset]);

  const handleDeleteRecent = useCallback((id: string) => {
    deleteEntry(id);
  }, [deleteEntry]);

  const handleVoiceDone = useCallback((text: string) => {
    setInputText(text);
  }, [setInputText]);

  const handleVoiceTranslate = useCallback((text: string) => {
    setInputText(text);
    void attemptTranslate(text, "voiced");
  }, [attemptTranslate, setInputText]);

  // ─── Loop & keyboard shortcuts ─────────────────────────────────────────────
  const handlePlaybackComplete = useCallback(() => {
    if (settings.loop) {
      replay();
    } else {
      complete();
      handleComplete();
    }
  }, [settings.loop, replay, complete, handleComplete]);

  useEffect(() => {
    if (!settings.keyboardShortcuts) return;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;

      if (e.code === "Space" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (glossTokens.length > 0) togglePlay();
      } else if (e.code === "Enter" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleTranslate();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboardShortcuts, togglePlay, handleTranslate, glossTokens.length]);

  // ─── Derive pipeline display phase for the status strip ────────────────────
  // "waiting_for_llm" = rule_based arrived but we're online and still enhancing
  const pipelineDisplayPhase: "idle" | "translating" | "waiting_for_llm" | "rule_based" | "llm_quality" =
    translationPhase === "idle" ? "idle"
    : translationPhase === "translating" ? "translating"
    : translationPhase === "rule_based" && isTranslating && isOnline ? "waiting_for_llm"
    : translationPhase === "rule_based" ? "rule_based"
    : "llm_quality";

  return (
    <>
      {showExportModal && glossTokens.length > 0 && (
        <ExportVideoModal
          glossSequence={glossTokens.map((t) => t.text)}
          onClose={() => setShowExportModal(false)}
        />
      )}
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
        {!isAuthenticated && <GuestBanner remaining={guestRemaining} />}

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
                pipelinePhase={pipelineDisplayPhase}
                pipelineTokenCount={glossTokens.length}
                isSigning={playbackState === "playing"}
                isOnline={isOnline}
                showGloss={settings.showGloss}
                autoPaste={settings.autoPaste}
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
              glossSequence={glossTokens.map((t) => t.text)}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onExport={handleOpenExport}
              onActiveGlossChange={(index) => {
                setCurrentIndex(index);
                setActiveIndex(index);
              }}
              onPlaybackComplete={handlePlaybackComplete}
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
              glossSequence={glossTokens.map((t) => t.text)}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onExport={handleOpenExport}
              onActiveGlossChange={(index) => {
                setCurrentIndex(index);
                setActiveIndex(index);
              }}
              onPlaybackComplete={handlePlaybackComplete}
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
              pipelinePhase={translationPhase}
              pipelineTokenCount={glossTokens.length}
              isSigning={playbackState === "playing"}
              isOnline={isOnline}
              autoPaste={settings.autoPaste}
            />
          </div>
        </div>
      </div>
    </>
  );
}
