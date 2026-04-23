/**
 * VRM 0.x Rigging Utilities — Ported from frontend/src/features/animate-avatar/lib/vrmRigger.ts
 * ================================================================================================
 * Applies rotations and positions to VRM bones with dampening and interpolation.
 * Uses @pixiv/three-vrm v0.6.x API: VRMSchema.HumanoidBoneName + getBoneNode()
 *
 * Loaded via <script type="module"> — Three.js and VRM are imported from esm.sh CDN.
 */

import { VRMSchema } from "./vendor/three-vrm.module.js";
import * as THREE from "./vendor/three.module.js";

// ── Rig Configuration ──────────────────────────────────────────────

const RIG_CONFIG = {
  hips: { dampener: 0.7, lerp: 0.12 },
  chest: { dampener: 0.25, lerp: 0.15 },
  spine: { dampener: 0.45, lerp: 0.15 },
  upperArm: { dampener: 1.0, lerp: 0.35 },
  lowerArm: { dampener: 1.0, lerp: 0.4 },
  hand: { dampener: 1.0, lerp: 0.6 },
  neck: { dampener: 0.7, lerp: 0.15 },
  head: { dampener: 0.35, lerp: 0.2 },
  finger: { dampener: 1.0, lerp: 0.75 },
  thumb: { dampener: 1.0, lerp: 0.7 },
  face: { lerp: 0.4 },
  // camelCase keys for clampRotation lookup
  armClamps: {
    rightUpperArm: { zMin: -0.35, zMax: Math.PI, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    leftUpperArm:  { zMin: -Math.PI, zMax: 0.35, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    rightLowerArm: { xMin: -Math.PI * 0.9, xMax: 0.1 },
    leftLowerArm:  { xMin: -Math.PI * 0.9, xMax: 0.1 },
  },
  restPoseSmoothing: 0.4,
  restPoseFrames: 4,
  interSignSettleMs: 40,
};

let speedMultiplier = 1.0;
let _renderVRM = null;

function setSpeedMultiplier(m) {
  speedMultiplier = Math.max(0.5, Math.min(2.0, m));
}

function effectiveLerp(base) {
  return base * speedMultiplier;
}

function getRenderVRM() {
  return _renderVRM;
}

function setRenderVRM(vrm) {
  _renderVRM = vrm;
}

// ── Helpers ─────────────────────────────────────────────────────────

function _lerp(a, b, t) {
  return a + (b - a) * t;
}

const warnedBones = new Set();

function clampRotation(rotation, boneName) {
  // rigRotation receives PascalCase names; armClamps keys are camelCase
  const key = boneName.charAt(0).toLowerCase() + boneName.slice(1);
  const c = RIG_CONFIG.armClamps[key];
  if (!c) return rotation;
  return {
    x: c.xMin !== undefined ? Math.max(c.xMin, Math.min(c.xMax, rotation.x)) : rotation.x,
    y: c.yMin !== undefined ? Math.max(c.yMin, Math.min(c.yMax, rotation.y)) : rotation.y,
    z: c.zMin !== undefined ? Math.max(c.zMin, Math.min(c.zMax, rotation.z)) : rotation.z,
  };
}

// ── Bone rigging ────────────────────────────────────────────────────

function rigRotation(vrm, boneName, rotation, dampener = 1, lerpAmount = 0.3) {
  const schemaBone = VRMSchema.HumanoidBoneName[boneName];
  if (!schemaBone) return;
  const node = vrm.humanoid?.getBoneNode(schemaBone);
  if (!node) {
    if (!warnedBones.has(boneName)) {
      warnedBones.add(boneName);
      console.warn(`[VRMRigger] Missing bone: ${boneName}`);
    }
    return;
  }

  const clamped = clampRotation(rotation, boneName);
  const euler = new THREE.Euler(
    clamped.x * dampener,
    clamped.y * dampener,
    clamped.z * dampener,
  );
  const target = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(target, effectiveLerp(lerpAmount));
}

function rigPosition(vrm, boneName, position, dampener = 1, lerpAmount = 0.3) {
  const schemaBone = VRMSchema.HumanoidBoneName[boneName];
  if (!schemaBone) return;
  const node = vrm.humanoid?.getBoneNode(schemaBone);
  if (!node) return;

  const t = effectiveLerp(lerpAmount);
  node.position.x = _lerp(node.position.x, position.x * dampener, t);
  node.position.y = _lerp(node.position.y, position.y * dampener, t);
  node.position.z = _lerp(node.position.z, position.z * dampener, t);
}

// ── Upper Body Rig ──────────────────────────────────────────────────

function rigUpperBody(vrm, riggedPose) {
  if (!riggedPose) return;

  const cfg = RIG_CONFIG;

  // Hips rotation — Kalidokit returns Hips.rotation (nested), not Hips directly
  rigRotation(vrm, "Hips", riggedPose.Hips.rotation, cfg.hips.dampener, cfg.hips.lerp);

  // Kalidokit does NOT return a separate Chest field — use Spine for both (matches frontend)
  rigRotation(vrm, "Chest", riggedPose.Spine, cfg.chest.dampener, cfg.chest.lerp);
  rigRotation(vrm, "Spine", riggedPose.Spine, cfg.spine.dampener, cfg.spine.lerp);

  rigRotation(vrm, "RightUpperArm", riggedPose.RightUpperArm, cfg.upperArm.dampener, cfg.upperArm.lerp);
  rigRotation(vrm, "RightLowerArm", riggedPose.RightLowerArm, cfg.lowerArm.dampener, cfg.lowerArm.lerp);
  rigRotation(vrm, "LeftUpperArm",  riggedPose.LeftUpperArm,  cfg.upperArm.dampener, cfg.upperArm.lerp);
  rigRotation(vrm, "LeftLowerArm",  riggedPose.LeftLowerArm,  cfg.lowerArm.dampener, cfg.lowerArm.lerp);
}

// ── Hand Rig ────────────────────────────────────────────────────────

const FINGER_BONES = [
  "RingProximal",
  "RingIntermediate",
  "RingDistal",
  "IndexProximal",
  "IndexIntermediate",
  "IndexDistal",
  "MiddleProximal",
  "MiddleIntermediate",
  "MiddleDistal",
  "ThumbProximal",
  "ThumbIntermediate",
  "ThumbDistal",
  "LittleProximal",
  "LittleIntermediate",
  "LittleDistal",
];

function rigHands(vrm, riggedLeftHand, riggedRightHand, riggedPose) {
  const cfg = RIG_CONFIG;

  // Wrist: combine pronation (Z) from pose solver with X/Y from hand solver — matches frontend
  if (riggedLeftHand) {
    rigRotation(vrm, "LeftHand", {
      z: riggedPose.LeftHand?.z ?? 0,
      y: riggedLeftHand.LeftWrist?.y ?? 0,
      x: riggedLeftHand.LeftWrist?.x ?? 0,
    }, cfg.hand.dampener, cfg.hand.lerp);

    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        const boneCfg = bone.startsWith("Thumb") ? cfg.thumb : cfg.finger;
        rigRotation(vrm, key, riggedLeftHand[key], boneCfg.dampener, boneCfg.lerp);
      }
    }
  }

  if (riggedRightHand) {
    rigRotation(vrm, "RightHand", {
      z: riggedPose.RightHand?.z ?? 0,
      y: riggedRightHand.RightWrist?.y ?? 0,
      x: riggedRightHand.RightWrist?.x ?? 0,
    }, cfg.hand.dampener, cfg.hand.lerp);

    for (const bone of FINGER_BONES) {
      const key = `Right${bone}`;
      if (riggedRightHand[key]) {
        const boneCfg = bone.startsWith("Thumb") ? cfg.thumb : cfg.finger;
        rigRotation(vrm, key, riggedRightHand[key], boneCfg.dampener, boneCfg.lerp);
      }
    }
  }
}

// ── Face Rig ────────────────────────────────────────────────────────

function rigFace(vrm, riggedFace) {
  if (!riggedFace || !vrm.blendShapeProxy) return;

  const t = effectiveLerp(RIG_CONFIG.face.lerp);

  // Eye blendshapes
  if (riggedFace.eye) {
    const blink = VRMSchema.BlendShapePresetName;
    if (blink) {
      const leftEye = riggedFace.eye.l ?? 0;
      const rightEye = riggedFace.eye.r ?? 0;
      vrm.blendShapeProxy.setValue(
        blink.BlinkL,
        _lerp(vrm.blendShapeProxy.getValue(blink.BlinkL) ?? 0, leftEye, t),
      );
      vrm.blendShapeProxy.setValue(
        blink.BlinkR,
        _lerp(vrm.blendShapeProxy.getValue(blink.BlinkR) ?? 0, rightEye, t),
      );
    }
  }

  // Mouth blendshapes
  if (riggedFace.mouth) {
    const mouth = VRMSchema.BlendShapePresetName;
    if (mouth) {
      const shape = riggedFace.mouth.shape ?? {};
      vrm.blendShapeProxy.setValue(
        mouth.A,
        _lerp(vrm.blendShapeProxy.getValue(mouth.A) ?? 0, shape.A ?? 0, t),
      );
      vrm.blendShapeProxy.setValue(
        mouth.I,
        _lerp(vrm.blendShapeProxy.getValue(mouth.I) ?? 0, shape.I ?? 0, t),
      );
      vrm.blendShapeProxy.setValue(
        mouth.U,
        _lerp(vrm.blendShapeProxy.getValue(mouth.U) ?? 0, shape.U ?? 0, t),
      );
      vrm.blendShapeProxy.setValue(
        mouth.E,
        _lerp(vrm.blendShapeProxy.getValue(mouth.E) ?? 0, shape.E ?? 0, t),
      );
      vrm.blendShapeProxy.setValue(
        mouth.O,
        _lerp(vrm.blendShapeProxy.getValue(mouth.O) ?? 0, shape.O ?? 0, t),
      );
    }
  }

  // Head rotation from face tracking
  if (riggedFace.head) {
    rigRotation(vrm, "Head", riggedFace.head, 0.35, RIG_CONFIG.head.lerp);
  }
}

// ── Reset & Rest Pose ───────────────────────────────────────────────

function resetPose(vrm) {
  if (!vrm?.humanoid) return;
  const allBones = Object.values(VRMSchema.HumanoidBoneName);
  for (const boneName of allBones) {
    const node = vrm.humanoid.getBoneNode(boneName);
    if (node) {
      node.quaternion.identity();
    }
  }
}

function lerpToRestPose(vrm, frames = 4, onComplete) {
  if (!vrm?.humanoid) {
    onComplete?.();
    return;
  }

  let frame = 0;
  const t = RIG_CONFIG.restPoseSmoothing;
  const identity = new THREE.Quaternion();

  function step() {
    if (frame >= frames) {
      resetPose(vrm);
      onComplete?.();
      return;
    }

    const allBones = Object.values(VRMSchema.HumanoidBoneName);
    for (const boneName of allBones) {
      const node = vrm.humanoid.getBoneNode(boneName);
      if (node) {
        node.quaternion.slerp(identity, t);
      }
    }

    frame++;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ── Exports ─────────────────────────────────────────────────────────

export {
  RIG_CONFIG,
  setSpeedMultiplier,
  effectiveLerp,
  getRenderVRM,
  setRenderVRM,
  rigRotation,
  rigPosition,
  rigUpperBody,
  rigHands,
  rigFace,
  resetPose,
  lerpToRestPose,
  clampRotation,
};
