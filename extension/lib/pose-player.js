/**
 * PosePlayer — Class-based pose animation player for the extension
 * =================================================================
 * Ported from useSkeletonPlayer.ts React hook to a vanilla JS class.
 * Drives frame-by-frame playback via requestAnimationFrame.
 *
 * Usage:
 *   const player = new PosePlayer({
 *     onFrame: (frame, header) => drawSkeleton(ctx, frame, header, w, h),
 *     onGlossChange: (gloss, index, total) => { ... },
 *     onComplete: () => { ... },
 *     onStateChange: (state) => { ... },  // "playing" | "paused" | "idle"
 *   });
 *   player.playSequence(["HELLO", "WORLD"], 3);
 *   player.pause();
 *   player.resume();
 *   player.stop();
 */

// URL is set by lib/config.js (loaded before this file)
const API_BASE_URL = window.DUOSIGN_API_URL ?? "https://duosign.onrender.com";

class PosePlayer {
  constructor({ onFrame, onGlossChange, onComplete, onStateChange } = {}) {
    this._onFrame = onFrame || (() => {});
    this._onGlossChange = onGlossChange || (() => {});
    this._onComplete = onComplete || (() => {});
    this._onStateChange = onStateChange || (() => {});

    this._playing = false;
    this._paused = false;
    this._rafId = 0;
    this._poseCache = new Map();
    this._speedMultiplier = 1;

    // Public state
    this.currentGloss = "";
    this.currentGlossIndex = 0;
    this.totalGlosses = 0;
    this.currentLoop = 0;
    this.totalLoops = 0;
  }

  get isPlaying() {
    return this._playing;
  }
  get isPaused() {
    return this._paused;
  }

  set speed(val) {
    this._speedMultiplier = Math.max(0.25, Math.min(4, val));
  }
  get speed() {
    return this._speedMultiplier;
  }

  // ── Pose parsing ──────────────────────────────────────────────────

  async _parsePoseBuffer(buffer, gloss) {
    try {
      // Use the pose-parser that's loaded globally
      const parsed = window.parsePose(buffer);
      return {
        gloss,
        header: parsed.header,
        frameCount: parsed.frameCount,
        fps: parsed.fps,
        getFrame: (i) => parsed.getFrame(i),
      };
    } catch (err) {
      console.warn(`[PosePlayer] parse failed for ${gloss}:`, err);
      return null;
    }
  }

  async _fetchPose(gloss) {
    const cached = this._poseCache.get(gloss);
    if (cached) return cached;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`,
      );
      if (!res.ok) return null;
      const parsed = await this._parsePoseBuffer(
        await res.arrayBuffer(),
        gloss,
      );
      if (parsed) this._poseCache.set(gloss, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[PosePlayer] fetch failed for ${gloss}:`, err);
      return null;
    }
  }

  _prefetch(gloss) {
    if (!this._poseCache.has(gloss)) this._fetchPose(gloss);
  }

  // ── Playback ──────────────────────────────────────────────────────

  _playGloss(poseData) {
    const msPerFrame = 1000 / poseData.fps / this._speedMultiplier;
    return new Promise((resolve) => {
      let frameIdx = 0;
      let lastTick = performance.now();

      const tick = (now) => {
        if (!this._playing) {
          resolve();
          return;
        }
        if (this._paused) {
          this._rafId = requestAnimationFrame(tick);
          return;
        }

        if (now - lastTick >= msPerFrame) {
          if (frameIdx >= poseData.frameCount) {
            resolve();
            return;
          }
          const frame = poseData.getFrame(frameIdx);
          if (frame) this._onFrame(frame, poseData.header);
          frameIdx++;
          lastTick = now;
        }
        this._rafId = requestAnimationFrame(tick);
      };

      this._rafId = requestAnimationFrame(tick);
    });
  }

  async playSequence(glosses, loopCount = 3) {
    // Stop any current playback
    this._playing = false;
    this._paused = false;
    cancelAnimationFrame(this._rafId);

    this._playing = true;
    this.totalGlosses = glosses.length;
    this.totalLoops = loopCount;
    this.currentLoop = 1;
    this._onStateChange("playing");

    for (let loop = 1; loop <= loopCount; loop++) {
      if (!this._playing) break;
      this.currentLoop = loop;

      for (let i = 0; i < glosses.length; i++) {
        if (!this._playing) break;

        // Prefetch next in sequence
        if (i + 1 < glosses.length) this._prefetch(glosses[i + 1]);

        const poseData = await this._fetchPose(glosses[i]);
        if (!this._playing) break;

        if (!poseData || poseData.frameCount === 0) {
          console.warn(`[PosePlayer] skipping missing gloss: ${glosses[i]}`);
          continue;
        }

        this.currentGloss = glosses[i];
        this.currentGlossIndex = i;
        this._onGlossChange(glosses[i], i, glosses.length);

        await this._playGloss(poseData);

        // Brief hold between signs
        if (this._playing && i < glosses.length - 1) {
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      // Pause between loops
      if (this._playing && loop < loopCount) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (this._playing) {
      this._playing = false;
      this.currentGloss = "";
      this._onStateChange("idle");
      this._onComplete();
    }
  }

  stop() {
    this._playing = false;
    this._paused = false;
    cancelAnimationFrame(this._rafId);
    this.currentGloss = "";
    this.currentLoop = 0;
    this._onStateChange("idle");
  }

  pause() {
    if (!this._playing) return;
    this._paused = true;
    this._onStateChange("paused");
  }

  resume() {
    if (!this._playing) return;
    this._paused = false;
    this._onStateChange("playing");
  }

  destroy() {
    this.stop();
    this._poseCache.clear();
  }
}

// Make available globally
window.PosePlayer = PosePlayer;
