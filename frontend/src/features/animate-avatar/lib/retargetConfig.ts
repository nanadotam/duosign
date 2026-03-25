/**
 * retargetConfig — Re-exports from vrmRigger.ts
 * ================================================
 * This file derives all animation config from RIG_CONFIG in vrmRigger.ts.
 * Do NOT define config values here — edit RIG_CONFIG in vrmRigger.ts instead.
 *
 * This layer exists to preserve the import paths used by applyPose.ts and
 * other consumers without requiring a wide refactor. Every value here is
 * computed from RIG_CONFIG so that changing one value in vrmRigger.ts
 * propagates to both the video engine and the pose engine paths.
 */

import * as THREE from "three";
import { RIG_CONFIG } from "./vrmRigger";

// ── BoneClamp ────────────────────────────────────────────────────────

export interface BoneClamp {
  x?: [min: number, max: number];
  y?: [min: number, max: number];
  z?: [min: number, max: number];
}

/**
 * Per-bone rotation limits derived from RIG_CONFIG.armClamps.
 * Keys use camelCase to match BONE_NAME_MAP in applyPose.ts.
 */
export const BONE_CLAMPS: Record<string, BoneClamp> = {
  rightUpperArm: {
    z: [RIG_CONFIG.armClamps.rightUpperArm.zMin, RIG_CONFIG.armClamps.rightUpperArm.zMax],
    x: [RIG_CONFIG.armClamps.rightUpperArm.xMin, RIG_CONFIG.armClamps.rightUpperArm.xMax],
  },
  leftUpperArm: {
    z: [RIG_CONFIG.armClamps.leftUpperArm.zMin, RIG_CONFIG.armClamps.leftUpperArm.zMax],
    x: [RIG_CONFIG.armClamps.leftUpperArm.xMin, RIG_CONFIG.armClamps.leftUpperArm.xMax],
  },
  rightLowerArm: {
    x: [RIG_CONFIG.armClamps.rightLowerArm.xMin, RIG_CONFIG.armClamps.rightLowerArm.xMax],
  },
  leftLowerArm: {
    x: [RIG_CONFIG.armClamps.leftLowerArm.xMin, RIG_CONFIG.armClamps.leftLowerArm.xMax],
  },
};

// ── Smoothing ────────────────────────────────────────────────────────

/**
 * Per-region lerp amounts derived from RIG_CONFIG.
 * Used by applyPose.ts (pose engine path) for lerpBone() calls.
 *
 * NOTE: hand/finger/thumb values are derived from RIG_CONFIG and must
 * remain at 1.0 dampener equivalent — see RIG_CONFIG comments for why.
 */
export const SMOOTHING = {
  hips:     RIG_CONFIG.hips.lerp,
  spine:    RIG_CONFIG.spine.lerp,
  upperArm: RIG_CONFIG.upperArm.lerp,
  lowerArm: RIG_CONFIG.lowerArm.lerp,
  hand:     RIG_CONFIG.hand.lerp,
  thumb:    RIG_CONFIG.thumb.lerp,
  fingers:  RIG_CONFIG.finger.lerp,
  head:     RIG_CONFIG.head.lerp,
  face:     RIG_CONFIG.face.lerp,
};

// ── Proportion Scale ─────────────────────────────────────────────────

export const PROPORTION_SCALE = RIG_CONFIG.proportionScale;

// ── Rest Pose ────────────────────────────────────────────────────────

/**
 * Signing rest pose in camelCase keys for use by applyPose.ts's lerpBone().
 * Values are mirrored from RIG_CONFIG (defined in vrmRigger.ts) which uses
 * PascalCase. Both must stay in sync — only edit vrmRigger.ts's SIGNING_REST_POSE.
 */
export const SIGNING_REST_POSE: Record<string, { x: number; y: number; z: number }> = {
  rightUpperArm: { x: 0,    y: 0,    z: -1.2  },
  leftUpperArm:  { x: 0,    y: 0,    z:  1.2  },
  rightLowerArm: { x: 0,    y: 0,    z:  0    },
  leftLowerArm:  { x: 0,    y: 0,    z:  0    },
  rightHand:     { x: 0,    y: 0,    z:  0    },
  leftHand:      { x: 0,    y: 0,    z:  0    },
  spine:         { x: 0.02, y: 0,    z:  0    },
  hips:          { x: 0,    y: 0,    z:  0    },
};

// ── Timing / Offsets ─────────────────────────────────────────────────

export const HIPS_Y_OFFSET         = RIG_CONFIG.hipsYOffset;
export const REST_POSE_SMOOTHING   = RIG_CONFIG.restPoseSmoothing;
export const REST_POSE_FRAMES      = RIG_CONFIG.restPoseFrames;
export const INTER_SIGN_SETTLE_MS  = RIG_CONFIG.interSignSettleMs;
export const PALM_PRONATION_SCALE  = RIG_CONFIG.palmOrientation.pronationScale;
export const HAND_DEPTH_SCALE      = RIG_CONFIG.handDepth.scale;
export const HAND_DEPTH_CLAMP      = RIG_CONFIG.handDepth.clamp;

// ── Utility ──────────────────────────────────────────────────────────

export const ZERO_ROTATION = new THREE.Euler(0, 0, 0);
