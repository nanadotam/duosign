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

  const euler = new THREE.Euler(
    rotation.x * dampener,
    rotation.y * dampener,
    rotation.z * dampener
  );
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(quaternion, lerpAmount);
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

/**
 * Apply upper-body pose to VRM — no lower body (legs are irrelevant for ASL).
 */
export function rigUpperBody(vrm: VRM, riggedPose: RiggedPose): void {
  // Hips rotation only (no position changes — keeps avatar stable)
  rigRotation(vrm, "Hips", riggedPose.Hips.rotation, 0.7);

  // Spine & chest
  rigRotation(vrm, "Chest", riggedPose.Spine, 0.25, 0.3);
  rigRotation(vrm, "Spine", riggedPose.Spine, 0.45, 0.3);

  // Arms
  rigRotation(vrm, "RightUpperArm", riggedPose.RightUpperArm, 1, 0.3);
  rigRotation(vrm, "RightLowerArm", riggedPose.RightLowerArm, 1, 0.3);
  rigRotation(vrm, "LeftUpperArm", riggedPose.LeftUpperArm, 1, 0.3);
  rigRotation(vrm, "LeftLowerArm", riggedPose.LeftLowerArm, 1, 0.3);
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
    });
    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        rigRotation(vrm, key, riggedLeftHand[key]);
      }
    }
  }

  if (riggedRightHand) {
    rigRotation(vrm, "RightHand", {
      z: riggedPose.RightHand.z,
      y: riggedRightHand.RightWrist?.y ?? 0,
      x: riggedRightHand.RightWrist?.x ?? 0,
    });
    for (const bone of FINGER_BONES) {
      const key = `Right${bone}`;
      if (riggedRightHand[key]) {
        rigRotation(vrm, key, riggedRightHand[key]);
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
 * Apply face rigging — head rotation + VRM 0.x blendShapeProxy.
 * Uses VRMSchema.BlendShapePresetName for blink, mouth visemes, and pupils.
 */
export function rigFace(vrm: VRM, riggedFace: RiggedFace): void {
  // Head rotation
  rigRotation(vrm, "Neck", riggedFace.head, 0.7);

  // VRM 0.x: blendShapeProxy + BlendShapePresetName
  const blendshape = vrm.blendShapeProxy;
  const PresetName = VRMSchema.BlendShapePresetName;
  if (!blendshape) return;

  // Blink
  const currentBlink = blendshape.getValue(PresetName.Blink) ?? 0;
  const blinkVal = Math.max(
    lerp(1 - riggedFace.eye.l, currentBlink, 0.5),
    0
  );
  blendshape.setValue(PresetName.Blink, Math.min(blinkVal, 1));

  // Mouth shapes (visemes)
  blendshape.setValue(
    PresetName.I,
    lerp(riggedFace.mouth.shape.I, blendshape.getValue(PresetName.I) ?? 0, 0.5)
  );
  blendshape.setValue(
    PresetName.A,
    lerp(riggedFace.mouth.shape.A, blendshape.getValue(PresetName.A) ?? 0, 0.5)
  );
  blendshape.setValue(
    PresetName.E,
    lerp(riggedFace.mouth.shape.E, blendshape.getValue(PresetName.E) ?? 0, 0.5)
  );
  blendshape.setValue(
    PresetName.O,
    lerp(riggedFace.mouth.shape.O, blendshape.getValue(PresetName.O) ?? 0, 0.5)
  );
  blendshape.setValue(
    PresetName.U,
    lerp(riggedFace.mouth.shape.U, blendshape.getValue(PresetName.U) ?? 0, 0.5)
  );

  // Pupils — VRM 0.x lookAt API
  const lookTarget = new THREE.Euler(
    lerp(oldLookTarget.x, riggedFace.pupil.y, 0.4),
    lerp(oldLookTarget.y, riggedFace.pupil.x, 0.4),
    0,
    "XYZ"
  );
  oldLookTarget.copy(lookTarget);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vrm.lookAt as any)?.applyer?.lookAt(lookTarget);
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
