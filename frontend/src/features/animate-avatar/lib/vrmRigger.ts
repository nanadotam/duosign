/**
 * VRM 0.x Rigging Utilities
 * =========================
 * Ported from the standalone script.js prototype.
 * Uses @pixiv/three-vrm v0.6.x API (VRM 0.x spec):
 *   - VRMSchema.HumanoidBoneName enum
 *   - humanoid.getBoneNode()
 *   - blendShapeProxy + VRMSchema.BlendShapePresetName
 *   - lookAt.applyer.lookAt()
 *
 * Only upper-body rigging — legs/hips position are locked for ASL signing.
 */

import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";
import { VRMSchema } from "@pixiv/three-vrm";

// ── Animation Rig Configuration ─────────────────────────────────────
//
// All tunable parameters live here. Edit these values to change
// how the avatar moves — no other code changes needed.
//
// dampener: scales how much of the source motion transfers (0–1).
//   1.0 = full transfer, 0.5 = half amplitude, 0.25 = very subtle
// lerp: controls response speed (0–1).
//   0.1 = very slow/smooth, 0.5 = moderate, 0.9 = near-instant/crisp
//
// ASL signing context:
//   - Core body (hips/spine) should be slow and stable
//   - Arms need moderate response to follow arc paths naturally
//   - Hands/wrists need faster response to hit signing targets
//   - Fingers need the fastest response — handshapes are crisp, not blurry
//   - Head should be slow and deliberate (head nods in ASL are meaningful)

export const RIG_CONFIG = {
  hips: {
    dampener: 0.7,
    lerp: 0.12,      // very slow — core body barely moves during signing
  },
  chest: {
    dampener: 0.25,
    lerp: 0.15,      // subtle torso lean
  },
  spine: {
    dampener: 0.45,
    lerp: 0.15,
  },
  upperArm: {
    dampener: 1.0,
    lerp: 0.35,      // arms follow arc paths — moderate smoothing
  },
  lowerArm: {
    dampener: 1.0,
    lerp: 0.4,       // forearm slightly faster than upper arm
  },
  hand: {
    dampener: 1.0,
    lerp: 0.6,       // wrists respond faster — need to hit signing targets
  },
  finger: {
    dampener: 1.0,
    lerp: 0.75,      // fingers snap quickly — handshapes are crisp in ASL
  },
  thumb: {
    dampener: 1.0,
    lerp: 0.7,
  },
  neck: {
    dampener: 0.7,
    lerp: 0.15,      // head nods are slow and deliberate in ASL grammar
  },

  // Arm rotation limits (radians) — prevent arms crossing body center
  // These are anatomical limits derived from human range-of-motion.
  // Z axis on upper arms: negative = toward body center, positive = away
  // Tighten rightUpperArm.zMin if crossing still occurs
  // Loosen if head/chest-level signs look constrained
  armClamps: {
    rightUpperArm: { zMin: -0.35, zMax: Math.PI, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    leftUpperArm:  { zMin: -Math.PI, zMax: 0.35, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    rightLowerArm: { xMin: -Math.PI * 0.9, xMax: 0.1 },
    leftLowerArm:  { xMin: -Math.PI * 0.9, xMax: 0.1 },
  },
};

// Speed multiplier applied from user settings (animationSpeed / 100).
// Default is 1.0. At 0.5x speed, lerp values are halved (smoother).
// At 2.0x, lerp values are doubled (snappier).
// Clamped to [0.5, 2.0] to prevent extreme values.
export let speedMultiplier = 1.0;

export function setSpeedMultiplier(m: number): void {
  speedMultiplier = Math.max(0.5, Math.min(2.0, m));
}

/** Compute effective lerp amount for a region, scaled by speed multiplier */
function effectiveLerp(base: number): number {
  return Math.min(1.0, base * speedMultiplier);
}

function clampRotation(
  rotation: { x: number; y: number; z: number },
  boneName: string
): { x: number; y: number; z: number } {
  const clamps = RIG_CONFIG.armClamps as Record<string, {
    xMin?: number; xMax?: number;
    yMin?: number; yMax?: number;
    zMin?: number; zMax?: number;
  }>;

  // Convert PascalCase bone name to camelCase for lookup
  const key = boneName.charAt(0).toLowerCase() + boneName.slice(1);
  const c = clamps[key];
  if (!c) return rotation;

  return {
    x: c.xMin !== undefined ? Math.max(c.xMin, Math.min(c.xMax ?? Infinity, rotation.x)) : rotation.x,
    y: c.yMin !== undefined ? Math.max(c.yMin, Math.min(c.yMax ?? Infinity, rotation.y)) : rotation.y,
    z: c.zMin !== undefined ? Math.max(c.zMin, Math.min(c.zMax ?? Infinity, rotation.z)) : rotation.z,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Apply rotation to a VRM bone with dampening and interpolation.
 * VRM 0.x: uses VRMSchema.HumanoidBoneName + getBoneNode()
 */
export function rigRotation(
  vrm: VRM,
  boneName: string,
  rotation: { x: number; y: number; z: number },
  dampener = 1,
  lerpAmount = 0.3
): void {
  const boneKey = boneName as keyof typeof VRMSchema.HumanoidBoneName;
  const humanBoneName = VRMSchema.HumanoidBoneName[boneKey];
  if (!humanBoneName) return;

  const node = vrm.humanoid?.getBoneNode(humanBoneName);
  if (!node) return;

  // Scale by dampener first, then clamp to anatomical limits
  const scaled = {
    x: rotation.x * dampener,
    y: rotation.y * dampener,
    z: rotation.z * dampener,
  };
  const clamped = clampRotation(scaled, boneName);

  const euler = new THREE.Euler(clamped.x, clamped.y, clamped.z);
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(quaternion, effectiveLerp(lerpAmount));
}

/**
 * Apply position to a VRM bone with dampening and interpolation.
 * VRM 0.x: uses VRMSchema.HumanoidBoneName + getBoneNode()
 */
export function rigPosition(
  vrm: VRM,
  boneName: string,
  position: { x: number; y: number; z: number },
  dampener = 1,
  lerpAmount = 0.3
): void {
  const boneKey = boneName as keyof typeof VRMSchema.HumanoidBoneName;
  const humanBoneName = VRMSchema.HumanoidBoneName[boneKey];
  if (!humanBoneName) return;

  const node = vrm.humanoid?.getBoneNode(humanBoneName);
  if (!node) return;

  const vector = new THREE.Vector3(
    position.x * dampener,
    position.y * dampener,
    position.z * dampener
  );
  node.position.lerp(vector, lerpAmount);
}

// ── Upper Body Rig ──────────────────────────────────────────────────

interface RiggedPose {
  Hips: { rotation: { x: number; y: number; z: number }; position: { x: number; y: number; z: number } };
  Spine: { x: number; y: number; z: number };
  RightUpperArm: { x: number; y: number; z: number };
  RightLowerArm: { x: number; y: number; z: number };
  LeftUpperArm: { x: number; y: number; z: number };
  LeftLowerArm: { x: number; y: number; z: number };
  RightHand: { x: number; y: number; z: number };
  LeftHand: { x: number; y: number; z: number };
  [key: string]: unknown;
}

export function rigUpperBody(vrm: VRM, riggedPose: RiggedPose): void {
  rigRotation(vrm, "Hips",  riggedPose.Hips.rotation, RIG_CONFIG.hips.dampener,  RIG_CONFIG.hips.lerp);
  rigRotation(vrm, "Chest", riggedPose.Spine,          RIG_CONFIG.chest.dampener, RIG_CONFIG.chest.lerp);
  rigRotation(vrm, "Spine", riggedPose.Spine,          RIG_CONFIG.spine.dampener, RIG_CONFIG.spine.lerp);
  rigRotation(vrm, "RightUpperArm", riggedPose.RightUpperArm, RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "RightLowerArm", riggedPose.RightLowerArm, RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
  rigRotation(vrm, "LeftUpperArm",  riggedPose.LeftUpperArm,  RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "LeftLowerArm",  riggedPose.LeftLowerArm,  RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
}

// ── Hand Rig ────────────────────────────────────────────────────────

interface RiggedHand {
  [key: string]: { x: number; y: number; z: number };
}

const FINGER_BONES = [
  "RingProximal", "RingIntermediate", "RingDistal",
  "IndexProximal", "IndexIntermediate", "IndexDistal",
  "MiddleProximal", "MiddleIntermediate", "MiddleDistal",
  "ThumbProximal", "ThumbIntermediate", "ThumbDistal",
  "LittleProximal", "LittleIntermediate", "LittleDistal",
] as const;

/**
 * Apply hand articulation to VRM (full finger bones).
 */
export function rigHands(
  vrm: VRM,
  riggedLeftHand: RiggedHand | null,
  riggedRightHand: RiggedHand | null,
  riggedPose: RiggedPose
): void {
  if (riggedLeftHand) {
    rigRotation(vrm, "LeftHand", {
      z: riggedPose.LeftHand.z,
      y: riggedLeftHand.LeftWrist?.y ?? 0,
      x: riggedLeftHand.LeftWrist?.x ?? 0,
    }, RIG_CONFIG.hand.dampener, RIG_CONFIG.hand.lerp);

    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        // Thumbs use thumb lerp, all others use finger lerp
        const cfg = bone.startsWith("Thumb") ? RIG_CONFIG.thumb : RIG_CONFIG.finger;
        rigRotation(vrm, key, riggedLeftHand[key], cfg.dampener, cfg.lerp);
      }
    }
  }

  if (riggedRightHand) {
    rigRotation(vrm, "RightHand", {
      z: riggedPose.RightHand.z,
      y: riggedRightHand.RightWrist?.y ?? 0,
      x: riggedRightHand.RightWrist?.x ?? 0,
    }, RIG_CONFIG.hand.dampener, RIG_CONFIG.hand.lerp);

    for (const bone of FINGER_BONES) {
      const key = `Right${bone}`;
      if (riggedRightHand[key]) {
        const cfg = bone.startsWith("Thumb") ? RIG_CONFIG.thumb : RIG_CONFIG.finger;
        rigRotation(vrm, key, riggedRightHand[key], cfg.dampener, cfg.lerp);
      }
    }
  }
}

// ── Face Rig ────────────────────────────────────────────────────────

interface RiggedFace {
  head: { x: number; y: number; z: number };
  eye: { l: number; r: number };
  mouth: { shape: { A: number; E: number; I: number; O: number; U: number } };
  pupil: { x: number; y: number };
}

// Persistent lookTarget for pupil interpolation
const oldLookTarget = new THREE.Euler();

/**
 * Apply face rigging — head rotation + locked neutral expression.
 * VRM 0.x: uses blendShapeProxy with VRMSchema.BlendShapePresetName
 */
export function rigFace(vrm: VRM, riggedFace: RiggedFace): void {
  // Head rotation — slow and deliberate (ASL uses head nods grammatically)
  rigRotation(vrm, "Neck", riggedFace.head, RIG_CONFIG.neck.dampener, RIG_CONFIG.neck.lerp);

  // Lock expression to a neutral slight smile — no dynamic expressions
  // This is intentional: VRM facial blendshapes are a separate development track.
  // The avatar will tilt its head in the direction of the source signer
  // but always maintain a composed, neutral expression.
  const blendshape = vrm.blendShapeProxy;
  if (!blendshape) return;

  const PresetName = VRMSchema.BlendShapePresetName;

  // Gentle neutral smile — locked, never changes
  blendshape.setValue(PresetName.Joy, 0.15);

  // Eyes open — never blink during signing (prevents distraction)
  blendshape.setValue(PresetName.Blink, 0);
  blendshape.setValue(PresetName.BlinkL, 0);
  blendshape.setValue(PresetName.BlinkR, 0);

  // Mouth closed — no visemes during signing
  blendshape.setValue(PresetName.A, 0);
  blendshape.setValue(PresetName.I, 0);
  blendshape.setValue(PresetName.U, 0);
  blendshape.setValue(PresetName.E, 0);
  blendshape.setValue(PresetName.O, 0);
}

/**
 * Reset all bones to rest pose (T-pose or bind pose).
 * VRM 0.x: uses VRMSchema.HumanoidBoneName + getBoneNode()
 */
export function resetPose(vrm: VRM): void {
  const identity = new THREE.Quaternion();
  const bones = Object.values(VRMSchema.HumanoidBoneName);
  for (const boneName of bones) {
    const node = vrm.humanoid?.getBoneNode(boneName);
    if (node) {
      node.quaternion.slerp(identity, 0.15);
    }
  }
}

// ── Signing Rest Pose ────────────────────────────────────────────────

/**
 * Neutral ASL signing stance.
 * Arms relaxed at sides, not full T-pose extension.
 * Applied briefly between signs during inter-sign pauses.
 *
 * These values are in local bone space (relative to bind pose).
 * Tune if the rest pose looks stiff or unnatural.
 */
const SIGNING_REST_POSE: Record<string, { x: number; y: number; z: number }> = {
  RightUpperArm: { x: 0,    y: 0,    z: -0.4  }, // arms lowered to sides
  LeftUpperArm:  { x: 0,    y: 0,    z:  0.4  },
  RightLowerArm: { x: 0,    y: 0,    z: -0.1  },
  LeftLowerArm:  { x: 0,    y: 0,    z:  0.1  },
  RightHand:     { x: 0,    y: 0,    z:  0    },
  LeftHand:      { x: 0,    y: 0,    z:  0    },
  Spine:         { x: 0.02, y: 0,    z:  0    }, // very slight forward lean
  Hips:          { x: 0,    y: 0,    z:  0    },
};

/**
 * Lerp the avatar toward the neutral signing rest pose over `frames` frames.
 * Call between signs during the inter-sign pause window.
 *
 * @param vrm - The loaded VRM instance
 * @param frames - How many animation frames to spend lerping (default 3 ≈ 50ms at 60fps)
 * @param onSettled - Optional callback when lerp is complete
 */
export function lerpToRestPose(
  vrm: VRM,
  frames = 3,
  onSettled?: () => void
): void {
  let remaining = frames;

  const tick = () => {
    if (remaining <= 0) {
      onSettled?.();
      return;
    }

    for (const [boneName, target] of Object.entries(SIGNING_REST_POSE)) {
      rigRotation(vrm, boneName, target, 1.0, 0.35);
    }

    remaining--;
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
