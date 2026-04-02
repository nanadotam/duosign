/**
 * landmarkSmoother — Exponential moving average filter for MediaPipe landmarks
 * ==============================================================================
 * Reduces frame-to-frame jitter in raw MediaPipe hand/pose landmarks before
 * they reach the IK solver. Without this, finger tips and wrist positions can
 * jump erratically between frames, causing the avatar's hands to vibrate.
 *
 * Uses a simple EMA: smoothed[i] = alpha * raw[i] + (1 - alpha) * smoothed[i-1]
 *
 * Alpha controls responsiveness vs smoothness:
 *   0.3 = very smooth (more lag)
 *   0.5 = balanced
 *   0.7 = responsive (less smoothing)
 */

export interface SmoothableLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export class LandmarkSmoother {
  private previous: SmoothableLandmark[] | null = null;
  private readonly alpha: number;

  /**
   * @param alpha EMA factor (0–1). Higher = more responsive, lower = smoother.
   */
  constructor(alpha = 0.5) {
    this.alpha = Math.max(0.1, Math.min(1.0, alpha));
  }

  /**
   * Smooth a frame of landmarks using EMA.
   * Returns a new array — does not mutate the input.
   * Resets state if landmark count changes (hand lost/regained).
   */
  smooth(landmarks: SmoothableLandmark[]): SmoothableLandmark[] {
    if (!this.previous || this.previous.length !== landmarks.length) {
      // First frame or landmark count changed — no smoothing possible
      this.previous = landmarks.map((lm) => ({ ...lm }));
      return this.previous;
    }

    const smoothed: SmoothableLandmark[] = new Array(landmarks.length);
    const a = this.alpha;
    const oneMinusA = 1 - a;

    for (let i = 0; i < landmarks.length; i++) {
      const curr = landmarks[i];
      const prev = this.previous[i];

      smoothed[i] = {
        x: a * curr.x + oneMinusA * prev.x,
        y: a * curr.y + oneMinusA * prev.y,
        z: a * curr.z + oneMinusA * prev.z,
        visibility: curr.visibility,
      };
    }

    this.previous = smoothed;
    return smoothed;
  }

  /** Reset smoothing state (call when hand tracking is lost). */
  reset(): void {
    this.previous = null;
  }
}
