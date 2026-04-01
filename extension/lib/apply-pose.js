/**
 * applyPoseToVRM — Full pose → VRM application
 * ===============================================
 * Ported from frontend/src/features/animate-avatar/lib/applyPose.ts
 * Takes a PoseFrameData (MediaPipe landmarks) and applies it to the VRM
 * model using Kalidokit solvers and vrm-rigger functions.
 */

import * as THREE from "./vendor/three.module.js";
import { VRMSchema } from "./vendor/three-vrm.module.js";
import {
  rigUpperBody,
  rigHands,
  rigFace,
  effectiveLerp,
} from "./vrm-rigger.js";

// ── Constants ───────────────────────────────────────────────────────

const HAND_DEPTH_SCALE = 0.3;
const HAND_DEPTH_CLAMP = { min: -0.15, max: 0.15 };
const HIPS_Y_OFFSET = 1.0;

const BONE_CLAMPS = {
  LeftUpperArm: { zMin: -0.9, zMax: 1.6 },
  RightUpperArm: { zMin: -1.6, zMax: 0.9 },
  LeftLowerArm: { zMin: -2.5, zMax: 0.3 },
  RightLowerArm: { zMin: -0.3, zMax: 2.5 },
};

const UPPER_BODY_SCALE = {
  Chest: 0.25,
  Spine: 0.45,
  LeftUpperArm: 0.85,
  RightUpperArm: 0.85,
  LeftLowerArm: 0.9,
  RightLowerArm: 0.9,
  Head: 0.35,
};

// ── Helpers ─────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBoneNode(vrm, boneName) {
  const schema = VRMSchema.HumanoidBoneName[boneName];
  if (!schema) return null;
  return vrm.humanoid?.getBoneNode(schema) || null;
}

function lerpBone(vrm, boneName, target, smoothing) {
  const node = getBoneNode(vrm, boneName);
  if (!node) return;
  const euler = new THREE.Euler(target.x, target.y, target.z);
  const q = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(q, effectiveLerp(smoothing));
}

function scaleRotation(rotation, scale) {
  return {
    x: rotation.x * scale,
    y: rotation.y * scale,
    z: rotation.z * scale,
  };
}

function applyClamp(rotation, boneName) {
  const c = BONE_CLAMPS[boneName];
  if (!c) return rotation;
  return {
    x: rotation.x,
    y: rotation.y,
    z: clamp(rotation.z, c.zMin, c.zMax),
  };
}

// ── Finger application via raw landmarks ────────────────────────────

const FINGER_MAP = {
  Thumb: [1, 2, 3, 4],
  Index: [5, 6, 7, 8],
  Middle: [9, 10, 11, 12],
  Ring: [13, 14, 15, 16],
  Little: [17, 18, 19, 20],
};

function angleBetween(a, b, c) {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: (b.z || 0) - (a.z || 0) };
  const cb = { x: b.x - c.x, y: b.y - c.y, z: (b.z || 0) - (c.z || 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2 + cb.z ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  return Math.acos(clamp(dot / (magAB * magCB), -1, 1));
}

function applyFingers(vrm, landmarks, side) {
  if (!landmarks || landmarks.length < 21) return;

  const smoothing = 0.45;

  for (const [finger, indices] of Object.entries(FINGER_MAP)) {
    // Proximal
    const proxAngle =
      Math.PI -
      angleBetween(
        landmarks[indices[0]],
        landmarks[indices[1]],
        landmarks[indices[2]],
      );
    lerpBone(
      vrm,
      `${side}${finger}Proximal`,
      { x: proxAngle * 0.7, y: 0, z: 0 },
      smoothing,
    );

    // Intermediate
    const intAngle =
      Math.PI -
      angleBetween(
        landmarks[indices[1]],
        landmarks[indices[2]],
        landmarks[indices[3]],
      );
    lerpBone(
      vrm,
      `${side}${finger}Intermediate`,
      { x: intAngle * 0.8, y: 0, z: 0 },
      smoothing,
    );

    // Distal — inferred from intermediate
    lerpBone(
      vrm,
      `${side}${finger}Distal`,
      { x: intAngle * 0.5, y: 0, z: 0 },
      smoothing,
    );
  }
}

// ── Main apply function ─────────────────────────────────────────────

/**
 * Apply a complete pose frame to the VRM model.
 * @param {object} vrm — VRM instance
 * @param {object} frame — PoseFrameData { poseLandmarks, leftHandLandmarks, rightHandLandmarks, faceLandmarks }
 * @param {object} Kalidokit — Kalidokit module
 * @param {object} options — { smoothing, imageSize }
 * @returns {number} render time in ms
 */
function applyPoseToVRM(vrm, frame, Kalidokit, options = {}) {
  if (!vrm || !frame) return 0;
  const start = performance.now();

  const imageSize = options.imageSize || { width: 640, height: 480 };

  // ── Pose (body) ──────────────────────────────────────────────
  let riggedPose = null;
  if (frame.poseLandmarks) {
    // World landmarks should be metric-space; if absent, use flat z=0 approximation
    // (passing raw poseLandmarks Z values causes Kalidokit to return null — matches frontend fix)
    const worldLandmarks = frame.poseWorldLandmarks
      ?? frame.poseLandmarks.map((lm) => ({ ...lm, z: 0 }));

    riggedPose = Kalidokit.Pose.solve(
      worldLandmarks,
      frame.poseLandmarks,
      { runtime: "mediapipe", imageSize, enableLegs: false },
    );
    if (riggedPose) {
      rigUpperBody(vrm, riggedPose);
    }
  }

  // ── Face ──────────────────────────────────────────────────────
  if (frame.faceLandmarks) {
    const riggedFace = Kalidokit.Face.solve(frame.faceLandmarks, {
      runtime: "mediapipe",
      imageSize,
      smoothBlink: true,
      blinkSettings: [0.3, 0.7],
    });
    if (riggedFace) {
      rigFace(vrm, riggedFace);
    }
  }

  // Playback landmarks are from the camera/viewer perspective:
  // file's LEFT_HAND = signer's RIGHT hand (and vice versa). Swap before solving.
  const signerRightHandLandmarks = frame.leftHandLandmarks;
  const signerLeftHandLandmarks  = frame.rightHandLandmarks;

  // ── Right Hand (signer) ──────────────────────────────────────
  if (signerRightHandLandmarks && riggedPose) {
    const rawRightHand = Kalidokit.Hand.solve(signerRightHandLandmarks, "Right");
    if (rawRightHand) {
      rigHands(vrm, null, rawRightHand, riggedPose);
    }
    applyFingers(vrm, signerRightHandLandmarks, "Right");
  }

  // ── Left Hand (signer) ───────────────────────────────────────
  if (signerLeftHandLandmarks && riggedPose) {
    const rawLeftHand = Kalidokit.Hand.solve(signerLeftHandLandmarks, "Left");
    if (rawLeftHand) {
      rigHands(vrm, rawLeftHand, null, riggedPose);
    }
    applyFingers(vrm, signerLeftHandLandmarks, "Left");
  }

  return performance.now() - start;
}

export { applyPoseToVRM, applyFingers };
