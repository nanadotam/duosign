/**
 * animatePose — RAF-based frame playback loop
 * ==============================================
 * Ported from frontend/src/features/animate-avatar/lib/animatePose.ts
 * Drives frame-by-frame playback at the pose file's native FPS.
 */

/**
 * @typedef {Object} PoseAnimationOptions
 * @property {string} gloss
 * @property {Array} frames
 * @property {number} fps
 * @property {Function} onFrame - (frame, frameIndex) => void
 * @property {Function} [onComplete]
 */

/**
 * @typedef {Object} PoseAnimationHandle
 * @property {Promise<void>} promise
 * @property {Function} stop
 * @property {Function} pause
 * @property {Function} resume
 */

/**
 * Start a gloss animation, returning a controllable handle.
 * @param {PoseAnimationOptions} options
 * @returns {PoseAnimationHandle}
 */
function animatePoseVRM(options) {
  const { gloss, frames, fps, onFrame, onComplete } = options;

  let rafId = 0;
  let stopped = false;
  let paused = false;
  let pauseStartedAt = 0;
  let pausedDuration = 0;
  let startTimestamp = 0;
  let lastFrameIndex = -1;

  const frameDuration = 1000 / Math.max(fps, 1);
  const totalDuration = Math.max(frames.length - 1, 0) * frameDuration;

  const promise = new Promise((resolve) => {
    const finish = () => {
      if (stopped) return;
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      onComplete?.();
      resolve();
    };

    const tick = (timestamp) => {
      if (stopped) {
        resolve();
        return;
      }
      if (!startTimestamp) startTimestamp = timestamp;

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
    stop() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    },
    pause() {
      if (paused || stopped) return;
      paused = true;
      pauseStartedAt = performance.now();
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      pausedDuration += performance.now() - pauseStartedAt;
    },
  };
}

export { animatePoseVRM };
