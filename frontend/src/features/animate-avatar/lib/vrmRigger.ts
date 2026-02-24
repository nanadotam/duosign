/**
 * VRM 1.0 Rigging Utilities
 * =========================
 * Extracted and upgraded from the standalone script.js.
 * Uses @pixiv/three-vrm v3 API (VRM 1.0 spec):
 *   - VRMHumanBoneName enum (replaces VRMSchema.HumanoidBoneName)
 *   - expressionManager (replaces blendShapeProxy)
 *   - humanoid.getNormalizedBoneNode() (replaces humanoid.getBoneNode())
 *
 * Only upper-body rigging — legs/hips position are locked for ASL signing.
 */

import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";
import { VRMHumanBoneName } from "@pixiv/three-vrm";

// ── Helpers ─────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Apply rotation to a VRM bone with dampening and interpolation.
 */
export function rigRotation(
  vrm: VRM,
  boneName: string,
  rotation: { x: number; y: number; z: number },
  dampener = 1,
  lerpAmount = 0.3
): void {
  const boneKey = boneName as keyof typeof VRMHumanBoneName;
  const humanBoneName = VRMHumanBoneName[boneKey];
  if (!humanBoneName) return;

  const node = vrm.humanoid?.getNormalizedBoneNode(humanBoneName);
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
 */
export function rigPosition(
  vrm: VRM,
  boneName: string,
  position: { x: number; y: number; z: number },
  dampener = 1,
  lerpAmount = 0.3
): void {
  const boneKey = boneName as keyof typeof VRMHumanBoneName;
  const humanBoneName = VRMHumanBoneName[boneKey];
  if (!humanBoneName) return;

  const node = vrm.humanoid?.getNormalizedBoneNode(humanBoneName);
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

/**
 * Apply face rigging — head rotation + VRM 1.0 expressions.
 */
export function rigFace(vrm: VRM, riggedFace: RiggedFace): void {
  // Head rotation
  rigRotation(vrm, "Neck", riggedFace.head, 0.7);

  const expr = vrm.expressionManager;
  if (!expr) return;

  // Blink
  const blinkVal = Math.max(
    lerp(1 - riggedFace.eye.l, expr.getValue("blink") ?? 0, 0.5),
    0
  );
  expr.setValue("blink", Math.min(blinkVal, 1));

  // Mouth shapes (visemes)
  const shapes = riggedFace.mouth.shape;
  for (const [key, val] of Object.entries(shapes)) {
    const exprName = key.toLowerCase();
    const current = expr.getValue(exprName) ?? 0;
    expr.setValue(exprName, lerp(val, current, 0.5));
  }
}

/**
 * Reset all bones to rest pose (T-pose or bind pose).
 */
export function resetPose(vrm: VRM): void {
  const identity = new THREE.Quaternion();
  const bones = Object.values(VRMHumanBoneName);
  for (const boneName of bones) {
    const node = vrm.humanoid?.getNormalizedBoneNode(boneName);
    if (node) {
      node.quaternion.slerp(identity, 0.15);
    }
  }
}
