"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/shared/ui/Button";
import {
  DUOSIGN_VERSION,
  getResearchVideoCaptionsUrl,
} from "../lib/researchConfig";

interface ResearchIntroScreenProps {
  onProceed: () => void;
}

const PROCEED_UNLOCK_SECONDS = 110;
const LOCAL_VIDEO_URL = "/research/Duosign-Intro-Demo-web.mp4";

export default function ResearchIntroScreen({
  onProceed,
}: ResearchIntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionsUrl = getResearchVideoCaptionsUrl();
  const [hasWatched, setHasWatched] = useState(false);
  const [playbackRatio, setPlaybackRatio] = useState(0);
  const [captionLine, setCaptionLine] = useState(
    "Captions will appear here during playback."
  );
  const [videoFailed, setVideoFailed] = useState(false);

  const canProceed = hasWatched && !videoFailed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !captionsUrl) return;

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
  }, [captionsUrl]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(91,142,240,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#0f1219_0%,#151925_100%)] text-text-1">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--accent)_22%,var(--border-hi))] bg-[linear-gradient(180deg,rgba(22,26,38,0.95),rgba(16,19,28,0.98))] shadow-[0_32px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="border-b border-[color-mix(in_srgb,var(--accent)_18%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] px-5 py-5 sm:px-8 sm:py-7">
            <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.24em] text-accent/90">
              {DUOSIGN_VERSION}
            </p>
            <h1 className="mt-2 font-[var(--font-instrument)] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Welcome to DuoSign
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:rgba(232,236,244,0.76)] sm:text-[15px]">
              Welcome to the research preview. You&apos;re about to step into an
              early look at the translation experience and help shape how it
              feels before wider rollout.
            </p>
            <p className="mt-2 text-sm font-medium text-[color:rgba(232,236,244,0.92)]">
              Watch this video onboarding before entering the app.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-8 sm:py-7">
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
                  poster="/og-image.png"
                  src={LOCAL_VIDEO_URL}
                  onLoadedData={() => setVideoFailed(false)}
                  onError={() => setVideoFailed(true)}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    const ratio =
                      video.duration > 0 ? video.currentTime / video.duration : 0;
                    setPlaybackRatio(ratio);
                    if (video.currentTime >= PROCEED_UNLOCK_SECONDS) {
                      setHasWatched(true);
                    }
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

              {videoFailed && (
                <div className="rounded-[18px] border border-[color-mix(in_srgb,var(--error)_24%,transparent)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] px-4 py-3 text-sm text-error">
                  The onboarding video could not load. Refresh the page and try
                  again.
                </div>
              )}

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

            <div className="mt-6 flex items-center justify-end">
              <Button size="lg" onClick={onProceed} disabled={!canProceed}>
                Proceed to App
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
