import type { PoseFrameData } from "./poseReader";

export interface PoseAnimationOptions {
  gloss: string;
  frames: PoseFrameData[];
  fps: number;
  onFrame: (frame: PoseFrameData, frameIndex: number) => void;
  onComplete?: () => void;
}

export interface PoseAnimationHandle {
  promise: Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function animatePose({
  gloss,
  frames,
  fps,
  onFrame,
  onComplete,
}: PoseAnimationOptions): PoseAnimationHandle {
  let rafId = 0;
  let stopped = false;
  let paused = false;
  let pauseStartedAt = 0;
  let pausedDuration = 0;
  let startTimestamp = 0;
  let lastFrameIndex = -1;

  const frameDuration = 1000 / Math.max(fps, 1);
  const totalDuration = Math.max(frames.length - 1, 0) * frameDuration;

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      if (stopped) return;
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      console.log("[PoseAnimation] Completed", { gloss, frames: frames.length, fps });
      onComplete?.();
      resolve();
    };

    const tick = (timestamp: number) => {
      if (stopped) {
        resolve();
        return;
      }

      if (!startTimestamp) {
        startTimestamp = timestamp;
        console.log("[PoseAnimation] Started", { gloss, frames: frames.length, fps });
      }

      if (paused) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const elapsed = timestamp - startTimestamp - pausedDuration;
      const frameIndex =
        frames.length <= 1
          ? 0
          : Math.min(Math.floor(elapsed / frameDuration), frames.length - 1);

      if (frameIndex !== lastFrameIndex && frames[frameIndex]) {
        onFrame(frames[frameIndex], frameIndex);
        lastFrameIndex = frameIndex;
      }

      if (elapsed >= totalDuration) {
        finish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  });

  return {
    promise,
    stop: () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    },
    pause: () => {
      if (paused || stopped) return;
      paused = true;
      pauseStartedAt = performance.now();
      console.log("[PoseAnimation] Paused", { gloss, frameIndex: lastFrameIndex });
    },
    resume: () => {
      if (!paused || stopped) return;
      paused = false;
      pausedDuration += performance.now() - pauseStartedAt;
      console.log("[PoseAnimation] Resumed", { gloss, frameIndex: lastFrameIndex });
    },
  };
}
