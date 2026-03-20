import * as THREE from "three";

export interface BoneClamp {
  x?: [min: number, max: number];
  y?: [min: number, max: number];
  z?: [min: number, max: number];
}

export const BONE_CLAMPS: Record<string, BoneClamp> = {
  rightUpperArm: {
    z: [-0.2, Math.PI],
    x: [-Math.PI / 2, Math.PI / 2],
  },
  leftUpperArm: {
    z: [-Math.PI, 0.2],
    x: [-Math.PI / 2, Math.PI / 2],
  },
  rightLowerArm: {
    x: [-Math.PI * 0.85, 0.05],
    z: [-Math.PI / 2, Math.PI / 2],
  },
  leftLowerArm: {
    x: [-Math.PI * 0.85, 0.05],
    z: [-Math.PI / 2, Math.PI / 2],
  },
};

export const SMOOTHING = {
  hips: 0.1,
  spine: 0.15,
  upperArm: 0.55,
  lowerArm: 0.6,
  hand: 0.82,
  thumb: 0.88,
  fingers: 0.92,
  head: 0.2,
  face: 0.4,
};

export const PROPORTION_SCALE = {
  hipsWorldPosition: {
    x: 0.75,
    y: 0.75,
    z: 0.22,
  },
  armExtension: 0.92,
};

export const SIGNING_REST_POSE: Record<string, { x: number; y: number; z: number }> = {
  rightUpperArm: { x: 0.02, y: 0, z: -0.32 },
  leftUpperArm: { x: 0.02, y: 0, z: 0.32 },
  rightLowerArm: { x: -0.08, y: 0, z: -0.08 },
  leftLowerArm: { x: -0.08, y: 0, z: 0.08 },
  rightHand: { x: 0, y: 0, z: 0 },
  leftHand: { x: 0, y: 0, z: 0 },
  spine: { x: 0.02, y: 0, z: 0 },
  hips: { x: 0, y: 0, z: 0 },
};

export const HIPS_Y_OFFSET = 0;
export const REST_POSE_SMOOTHING = 0.4;
export const REST_POSE_FRAMES = 4;
export const INTER_SIGN_SETTLE_MS = 40;

export const ZERO_ROTATION = new THREE.Euler(0, 0, 0);
