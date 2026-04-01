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
  upperArm: { dampener: 0.85, lerp: 0.28 },
  lowerArm: { dampener: 0.9, lerp: 0.3 },
  hand: { dampener: 1.0, lerp: 0.4 },
  head: { dampener: 0.35, lerp: 0.08 },
  fingers: { dampener: 1.0, lerp: 0.55 },
  face: { lerp: 0.4 },
  armClamps: {
    leftUpperArm: { zMin: -0.9, zMax: 1.6 },
    rightUpperArm: { zMin: -1.6, zMax: 0.9 },
    leftLowerArm: { zMin: -2.5, zMax: 0.3 },
    rightLowerArm: { zMin: -0.3, zMax: 2.5 },
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
  const clamps = RIG_CONFIG.armClamps[boneName];
  if (!clamps) return rotation;
  return {
    x: rotation.x,
    y: rotation.y,
    z: Math.max(clamps.zMin, Math.min(clamps.zMax, rotation.z)),
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

  // Hips
  if (riggedPose.Hips) {
    if (riggedPose.Hips.rotation) {
      rigRotation(
        vrm,
        "Hips",
        riggedPose.Hips.rotation,
        cfg.hips.dampener,
        cfg.hips.lerp,
      );
    }
    if (riggedPose.Hips.position) {
      rigPosition(
        vrm,
        "Hips",
        {
          x: riggedPose.Hips.position.x,
          y: riggedPose.Hips.position.y + 1,
          z: -riggedPose.Hips.position.z,
        },
        1,
        cfg.hips.lerp,
      );
    }
  }

  // Chest
  if (riggedPose.Chest) {
    rigRotation(
      vrm,
      "Chest",
      riggedPose.Chest,
      cfg.chest.dampener,
      cfg.chest.lerp,
    );
  }

  // Spine
  if (riggedPose.Spine) {
    rigRotation(
      vrm,
      "Spine",
      riggedPose.Spine,
      cfg.spine.dampener,
      cfg.spine.lerp,
    );
  }

  // Right upper arm
  if (riggedPose.RightUpperArm) {
    rigRotation(
      vrm,
      "RightUpperArm",
      riggedPose.RightUpperArm,
      cfg.upperArm.dampener,
      cfg.upperArm.lerp,
    );
  }

  // Right lower arm
  if (riggedPose.RightLowerArm) {
    rigRotation(
      vrm,
      "RightLowerArm",
      riggedPose.RightLowerArm,
      cfg.lowerArm.dampener,
      cfg.lowerArm.lerp,
    );
  }

  // Left upper arm
  if (riggedPose.LeftUpperArm) {
    rigRotation(
      vrm,
      "LeftUpperArm",
      riggedPose.LeftUpperArm,
      cfg.upperArm.dampener,
      cfg.upperArm.lerp,
    );
  }

  // Left lower arm
  if (riggedPose.LeftLowerArm) {
    rigRotation(
      vrm,
      "LeftLowerArm",
      riggedPose.LeftLowerArm,
      cfg.lowerArm.dampener,
      cfg.lowerArm.lerp,
    );
  }

  // Head
  if (riggedPose.Head) {
    rigRotation(vrm, "Head", riggedPose.Head, cfg.head.dampener, cfg.head.lerp);
  }
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

  // Wrist rotations from pose
  if (riggedPose?.LeftHand) {
    rigRotation(
      vrm,
      "LeftHand",
      riggedPose.LeftHand,
      cfg.hand.dampener,
      cfg.hand.lerp,
    );
  }
  if (riggedPose?.RightHand) {
    rigRotation(
      vrm,
      "RightHand",
      riggedPose.RightHand,
      cfg.hand.dampener,
      cfg.hand.lerp,
    );
  }

  // Left hand finger articulation
  if (riggedLeftHand) {
    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        rigRotation(
          vrm,
          key,
          riggedLeftHand[key],
          cfg.fingers.dampener,
          cfg.fingers.lerp,
        );
      }
    }
  }

  // Right hand finger articulation
  if (riggedRightHand) {
    for (const bone of FINGER_BONES) {
      const key = `Right${bone}`;
      if (riggedRightHand[key]) {
        rigRotation(
          vrm,
          key,
          riggedRightHand[key],
          cfg.fingers.dampener,
          cfg.fingers.lerp,
        );
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
