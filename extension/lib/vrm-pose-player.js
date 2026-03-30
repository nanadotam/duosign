/**
 * VRM Pose Player — Drives the VRM avatar with .pose binary data
 * ================================================================
 * Combines the pose-parser (binary reader), animate-pose (RAF loop),
 * and apply-pose (VRM rigging) to play gloss sequences on the 3D avatar.
 *
 * This is the VRM equivalent of the 2D pose-player.js.
 */

import { applyPoseToVRM } from "./apply-pose.js";
import { animatePoseVRM } from "./animate-pose.js";
import { SignSequencer } from "./sign-sequencer.js";
import { setRenderVRM, resetPose, lerpToRestPose } from "./vrm-rigger.js";

const API_BASE_URL = "https://duosign.onrender.com";

// In-memory pose cache
const poseCache = new Map();

// Lazy-loaded Kalidokit
let Kalidokit = null;

async function loadKalidokit() {
  if (Kalidokit) return Kalidokit;
  Kalidokit = await import("https://esm.sh/kalidokit@1.1.5");
  return Kalidokit;
}

/**
 * Parse binary .pose data into PoseFrameData array.
 * Uses the existing pose-parser.js (loaded as a script tag, window.parsePose).
 */
function parsePoseToFrames(buffer) {
  const parsed = window.parsePose(buffer);
  const frames = [];

  for (let i = 0; i < parsed.frameCount; i++) {
    const raw = parsed.getFrame(i);
    if (!raw || !raw.people || raw.people.length === 0) continue;

    const person = raw.people[0];
    frames.push({
      poseLandmarks: toLandmarks(person.POSE_LANDMARKS),
      poseWorldLandmarks: toLandmarks(person.POSE_WORLD_LANDMARKS),
      leftHandLandmarks: toLandmarks(person.LEFT_HAND_LANDMARKS),
      rightHandLandmarks: toLandmarks(person.RIGHT_HAND_LANDMARKS),
      faceLandmarks: toLandmarks(person.FACE_LANDMARKS),
    });
  }

  return { frames, fps: parsed.fps, frameCount: parsed.frameCount };
}

function toLandmarks(points) {
  if (!points || points.length === 0) return null;
  const landmarks = points.map((p) => ({
    x: p.X ?? 0,
    y: p.Y ?? 0,
    z: p.Z ?? 0,
    visibility: p.C ?? 0,
  }));
  return landmarks.some((lm) => (lm.visibility ?? 0) > 0) ? landmarks : null;
}

/**
 * Fetch and cache a .pose file.
 */
async function fetchPoseData(gloss) {
  const key = gloss.trim().replace(/\s+/g, "_").toUpperCase();
  if (poseCache.has(key)) return poseCache.get(key);

  const promise = (async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/pose/${encodeURIComponent(key)}`,
      );
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength === 0) return null;
      return parsePoseToFrames(buffer);
    } catch {
      return null;
    }
  })();

  poseCache.set(key, promise);
  return promise;
}

class VRMPosePlayer {
  constructor() {
    /** @type {import("@pixiv/three-vrm").VRM|null} */
    this.vrm = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentGloss = "";
    this.progress = 0;
    this._currentAnimation = null;
    this._sequencer = null;
    this._onStateChange = null;
  }

  /** Set the VRM model to drive */
  setVRM(vrm) {
    this.vrm = vrm;
    setRenderVRM(vrm);
  }

  /** Register a callback for state changes */
  onStateChange(fn) {
    this._onStateChange = fn;
  }

  _notify() {
    this._onStateChange?.({
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentGloss: this.currentGloss,
      progress: this.progress,
    });
  }

  /** Play a single gloss */
  async playGloss(gloss) {
    if (!this.vrm) return;
    await loadKalidokit();

    const poseData = await fetchPoseData(gloss);
    if (!poseData || poseData.frames.length === 0) {
      await new Promise((r) => setTimeout(r, 80));
      return;
    }

    this.currentGloss = gloss;
    this.progress = 0;
    this._notify();

    const handle = animatePoseVRM({
      gloss,
      frames: poseData.frames,
      fps: poseData.fps,
      onFrame: (frame, index) => {
        if (!this.vrm || !Kalidokit) return;
        applyPoseToVRM(this.vrm, frame, Kalidokit, { smoothing: 0.8 });
        this.progress = (index + 1) / poseData.frames.length;
        this._notify();
      },
    });

    this._currentAnimation = handle;
    await handle.promise;
  }

  /** Play a sequence of glosses */
  playSequence(glosses) {
    this.stop();
    this.isPlaying = true;
    this.isPaused = false;
    this._notify();

    const sequencer = new SignSequencer();
    this._sequencer = sequencer;

    (async () => {
      await loadKalidokit();

      await sequencer.play(
        glosses,
        async (gloss) => {
          if (!this.isPlaying) return;
          await this.playGloss(gloss);
        },
        {
          onGlossStart: (gloss) => {
            this.currentGloss = gloss;
            this._notify();
          },
          onComplete: () => {
            this._currentAnimation = null;
            this.isPlaying = false;
            this.isPaused = false;
            this.progress = 1;
            this.currentGloss = "";
            if (this.vrm) resetPose(this.vrm);
            this._notify();
          },
        },
        80,
      );
    })();
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this._sequencer?.stop();
    this._currentAnimation?.stop();
    this._currentAnimation = null;
    this.progress = 0;
    this.currentGloss = "";
    if (this.vrm) resetPose(this.vrm);
    this._notify();
  }

  pause() {
    this.isPaused = true;
    this._currentAnimation?.pause();
    this._notify();
  }

  resume() {
    this.isPaused = false;
    this._currentAnimation?.resume();
    this._notify();
  }
}

export { VRMPosePlayer, fetchPoseData };
