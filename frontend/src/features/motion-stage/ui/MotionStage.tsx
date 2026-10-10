"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaybackState, PlaybackSpeed } from "@/entities/avatar/types";

/**
 * MotionStage — Motion stage renderer.
 * Hosts /motion/stage.html (baked duosign-motion clips on a three-vrm v3 avatar) in an iframe
 * and drives it with postMessage from the app's playback state.
 */
export type MotionCam = "sign" | "full" | "three" | "face";

interface MotionStageProps {
  glossSequence: string[];
  playbackState: PlaybackState;
  speed: PlaybackSpeed;
  avatarFile: string;
  cam: MotionCam;
  onProgress?: (index: number, gloss: string, total: number) => void;
  onPlaybackComplete?: () => void;
}

export default function MotionStage({
  glossSequence,
  playbackState,
  speed,
  avatarFile,
  cam,
  onProgress,
  onPlaybackComplete,
}: MotionStageProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // The translate page mounts a desktop and a mobile panel; only the visible one loads the stage.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const check = () => setVisible(!!wrapRef.current && wrapRef.current.offsetParent !== null);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const readyRef = useRef(false);
  const queueRef = useRef<object[]>([]);
  const prevStateRef = useRef<PlaybackState>("idle");
  const prevGlossKeyRef = useRef("");
  // Captured once when the stage mounts; later changes go over postMessage (no reload)
  const latest = useRef({ avatarFile, cam });
  latest.current = { avatarFile, cam };
  const [src, setSrc] = useState<string | null>(null);
  const cbRef = useRef({ onProgress, onPlaybackComplete });
  cbRef.current = { onProgress, onPlaybackComplete };

  const send = (msg: object) => {
    const win = frameRef.current?.contentWindow;
    if (!win || !readyRef.current) { queueRef.current.push(msg); return; }
    win.postMessage(msg, "*");
  };

  // Messages from this stage only (the page can mount more than one panel)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const m = e.data;
      if (!m || m.source !== "duosign-motion") return;
      if (m.type === "ready") {
        readyRef.current = true;
        const pending = queueRef.current; queueRef.current = [];
        pending.forEach((msg) => frameRef.current?.contentWindow?.postMessage(msg, "*"));
      } else if (m.type === "progress") {
        cbRef.current.onProgress?.(m.index, m.gloss, m.total);
      } else if (m.type === "ended") {
        cbRef.current.onPlaybackComplete?.();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Playback: start a sentence, pause, resume
  useEffect(() => {
    const prev = prevStateRef.current;
    const glossKey = glossSequence.join(" ");
    const changed = glossKey !== prevGlossKeyRef.current;
    prevStateRef.current = playbackState;
    if (playbackState === "playing") {
      if (prev === "paused" && !changed) send({ type: "resume" });
      else if (prev !== "playing" || changed) {
        prevGlossKeyRef.current = glossKey;
        send({ type: "play", glosses: glossSequence, speed });
      }
    } else if (playbackState === "paused" || playbackState === "idle") {
      send({ type: "pause" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState, glossSequence]);

  useEffect(() => { send({ type: "speed", speed }); }, [speed]);
  useEffect(() => { send({ type: "avatar", file: avatarFile }); }, [avatarFile]);
  useEffect(() => { send({ type: "cam", kind: cam }); }, [cam]);

  // Reset handshake whenever the iframe (re)mounts
  useEffect(() => {
    if (!visible) { readyRef.current = false; return; }
    const { avatarFile: file, cam: kind } = latest.current;
    setSrc(`/motion/stage.html?avatar=${encodeURIComponent(file)}&cam=${kind}`);
  }, [visible]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      {visible && src && (
        <iframe
          ref={frameRef}
          src={src}
          title="DuoSign Motion avatar"
          className="w-full h-full border-0 bg-transparent"
          allow="fullscreen"
        />
      )}
    </div>
  );
}
