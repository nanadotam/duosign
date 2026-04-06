"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/shared/ui/Button";
import {
  DUOSIGN_VERSION,
  getResearchVideoCaptionsUrl,
  getResearchVideoSource,
} from "../lib/researchConfig";

interface ResearchIntroScreenProps {
  onProceed: () => void;
}

export default function ResearchIntroScreen({
  onProceed,
}: ResearchIntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoSource = getResearchVideoSource();
  const captionsUrl = getResearchVideoCaptionsUrl();
  const [hasWatched, setHasWatched] = useState(false);
  const [playbackRatio, setPlaybackRatio] = useState(0);
  const [captionLine, setCaptionLine] = useState("Captions will appear here during playback.");

  const isDirectVideo = videoSource?.type === "video";
  const canProceed = useMemo(() => {
    if (!videoSource) return false;
    if (!isDirectVideo) return false;
    return hasWatched;
  }, [hasWatched, isDirectVideo, videoSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !captionsUrl) return;

    const syncTrack = () => {
      const track = Array.from(video.textTracks).find(
        (item) => item.kind === "captions" || item.kind === "subtitles"
      );
      if (!track) return;
      track.mode = "hidden";

      const handleCueChange = () => {
        const cue = track.activeCues?.[0] as VTTCue | undefined;
        setCaptionLine(cue?.text ?? " ");
      };

      handleCueChange();
      track.addEventListener("cuechange", handleCueChange);
      return () => track.removeEventListener("cuechange", handleCueChange);
    };

    const cleanup = syncTrack();
    return () => {
      cleanup?.();
    };
  }, [captionsUrl]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(91,142,240,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#0f1219_0%,#151925_100%)] text-text-1">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--accent)_22%,var(--border-hi))] bg-[linear-gradient(180deg,rgba(22,26,38,0.95),rgba(16,19,28,0.98))] shadow-[0_32px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="border-b border-[color-mix(in_srgb,var(--accent)_18%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.24em] text-accent/90">
                  {DUOSIGN_VERSION}
                </p>
                <h1 className="mt-2 font-[var(--font-instrument)] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                  Welcome to DuoSign
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:rgba(232,236,244,0.76)] sm:text-[15px]">
                  Welcome to the research preview. You&apos;re about to step into
                  an early look at the translation experience and help shape how
                  it feels before wider rollout.
                </p>
                <p className="mt-2 text-sm font-medium text-[color:rgba(232,236,244,0.92)]">
                  Watch this video onboarding before entering the app.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-8 sm:py-7">
            {videoSource?.type === "iframe" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[26px] border border-border-hi bg-black shadow-[0_12px_48px_rgba(0,0,0,0.28)]">
                  <iframe
                    src={videoSource.src}
                    title="DuoSign onboarding video"
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-text-3">
                  Use a direct video source instead of an iframe if you want the
                  app to unlock automatically after the video finishes.
                </p>
              </div>
            )}

            {videoSource?.type === "video" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[26px] border border-border-hi bg-black shadow-[0_12px_48px_rgba(0,0,0,0.28)]">
                  <video
                    ref={videoRef}
                    className="aspect-video w-full"
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    src={videoSource.src}
                    onTimeUpdate={(event) => {
                      const video = event.currentTarget;
                      const ratio =
                        video.duration > 0 ? video.currentTime / video.duration : 0;
                      setPlaybackRatio(ratio);
                    }}
                    onEnded={() => {
                      setPlaybackRatio(1);
                      setHasWatched(true);
                    }}
                  >
                    {captionsUrl && (
                      <track
                        kind="captions"
                        src={captionsUrl}
                        srcLang="en"
                        label="English captions"
                        default
                      />
                    )}
                  </video>
                </div>

                <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--accent)_16%,transparent)] bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.18em] text-text-3">
                      Playback progress
                    </p>
                    <p className="text-xs font-medium text-text-2">
                      {Math.round(playbackRatio * 100)}%
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#8db3ff)] transition-[width] duration-300"
                      style={{ width: `${Math.max(4, playbackRatio * 100)}%` }}
                    />
                  </div>
                  <div className="mt-4 rounded-[18px] border border-white/6 bg-black/20 px-4 py-3">
                    <p className="mb-2 font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.18em] text-text-3">
                      Captions
                    </p>
                    <p className="min-h-[3rem] text-sm leading-6 text-[color:rgba(242,245,251,0.88)]">
                      {captionLine}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!videoSource && (
              <div className="flex aspect-video flex-col items-center justify-center rounded-[26px] border border-dashed border-border-hi bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-6 text-center">
                <p className="font-[var(--font-instrument)] text-2xl text-white">
                  Add the onboarding video to continue
                </p>
                <p className="mt-3 max-w-lg text-sm leading-6 text-text-3">
                  Set <code>NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_URL</code> and,
                  optionally, <code>NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_CAPTIONS_URL</code>.
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end">
              <Button size="lg" onClick={onProceed} disabled={!canProceed}>
                Proceed to Platform
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
