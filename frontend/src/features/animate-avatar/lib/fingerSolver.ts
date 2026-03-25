import * as THREE from "three";
import {
  FINGERS,
  JOINT_CLAMPS,
  LANDMARK,
  LANDMARK_CONFIDENCE_THRESHOLD,
  NEUTRAL_FINGER_ROTATION,
  NEUTRAL_SPREAD_OFFSET,
  SPREAD_SCALE,
  VECTOR_EPSILON,
  ZERO_FILL_EPSILON,
  type FingerName,
} from "./fingerConfig";

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FingerJointRotation {
  flexion: number;
  spread: number;
}

export type FingerRotationMap = Record<
  FingerName,
  [
    mcp: FingerJointRotation,
    pip: FingerJointRotation,
    dip: FingerJointRotation,
  ]
>;

function neutralFingerRotationMap(): FingerRotationMap {
  return {
    index: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.index },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
    ],
    middle: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.middle },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
    ],
    ring: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.ring },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
    ],
    pinky: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.pinky },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
    ],
  };
}

function lm(landmarks: Landmark3D[], idx: number): THREE.Vector3 {
  const point = landmarks[idx];
  return new THREE.Vector3(point.x, point.y, point.z);
}

function isValid(landmarks: Landmark3D[], idx: number): boolean {
  const point = landmarks[idx];
  if (!point) return false;
  if (point.visibility !== undefined && point.visibility < LANDMARK_CONFIDENCE_THRESHOLD) return false;
  if (
    Math.abs(point.x) < ZERO_FILL_EPSILON &&
    Math.abs(point.y) < ZERO_FILL_EPSILON &&
    Math.abs(point.z) < ZERO_FILL_EPSILON
  ) {
    return false;
  }
  return true;
}

function clampAngle(value: number, clamp: readonly [number, number]): number {
  return Math.max(clamp[0], Math.min(clamp[1], value));
}

function signedAngle(from: THREE.Vector3, to: THREE.Vector3, normal: THREE.Vector3): number {
  const angle = from.angleTo(to);
  if (!Number.isFinite(angle)) return 0;

  const cross = new THREE.Vector3().crossVectors(from, to);
  const sign = Math.sign(cross.dot(normal));
  return sign * angle;
}

function computePalmFrame(
  landmarks: Landmark3D[],
  side: "Right" | "Left"
): {
  palmUp: THREE.Vector3;
  palmRight: THREE.Vector3;
  palmNormal: THREE.Vector3;
} | null {
  if (
    !isValid(landmarks, LANDMARK.WRIST) ||
    !isValid(landmarks, LANDMARK.MIDDLE_MCP) ||
    !isValid(landmarks, LANDMARK.INDEX_MCP) ||
    !isValid(landmarks, LANDMARK.PINKY_MCP)
  ) {
    return null;
  }

  const wrist = lm(landmarks, LANDMARK.WRIST);
  const middleMcp = lm(landmarks, LANDMARK.MIDDLE_MCP);
  const indexMcp = lm(landmarks, LANDMARK.INDEX_MCP);
  const pinkyMcp = lm(landmarks, LANDMARK.PINKY_MCP);

  const palmUp = new THREE.Vector3().subVectors(middleMcp, wrist);
  const knuckleLine = new THREE.Vector3().subVectors(pinkyMcp, indexMcp);

  if (palmUp.lengthSq() < VECTOR_EPSILON || knuckleLine.lengthSq() < VECTOR_EPSILON) {
    return null;
  }

  palmUp.normalize();

  const palmRight = (side === "Right" ? knuckleLine : knuckleLine.negate()).normalize();
  const palmNormal = new THREE.Vector3().crossVectors(palmUp, palmRight);

  if (palmNormal.lengthSq() < VECTOR_EPSILON) {
    return null;
  }

  palmNormal.normalize();
  return { palmUp, palmRight, palmNormal };
}

/**
 * Derive wrist pronation/supination from the palm normal vector.
 * Falls back to null when the hand landmarks are insufficient.
 */
export function solvePalmOrientation(
  landmarks: Landmark3D[],
  side: "Right" | "Left"
): number | null {
  const frame = computePalmFrame(landmarks, side);
  if (!frame) return null;

  const pronation = Math.atan2(frame.palmNormal.y, -frame.palmNormal.z);
  return Number.isFinite(pronation) ? pronation : null;
}

function solveFlexion(
  landmarks: Landmark3D[],
  parentIdx: number,
  jointIdx: number,
  childIdx: number,
  clamp: readonly [number, number]
): number {
  const parent = lm(landmarks, parentIdx);
  const joint = lm(landmarks, jointIdx);
  const child = lm(landmarks, childIdx);

  const proximal = new THREE.Vector3().subVectors(joint, parent);
  const distal = new THREE.Vector3().subVectors(child, joint);

  if (proximal.lengthSq() < VECTOR_EPSILON || distal.lengthSq() < VECTOR_EPSILON) {
    return NEUTRAL_FINGER_ROTATION.flexion;
  }

  proximal.normalize();
  distal.normalize();

  const bendAngle = Math.PI - proximal.angleTo(distal);
  if (!Number.isFinite(bendAngle)) {
    return NEUTRAL_FINGER_ROTATION.flexion;
  }

  return clampAngle(bendAngle, clamp);
}

function solveSpread(
  landmarks: Landmark3D[],
  mcpIdx: number,
  pipIdx: number,
  fingerName: FingerName,
  palmFrame: { palmUp: THREE.Vector3; palmRight: THREE.Vector3; palmNormal: THREE.Vector3 },
  clamp: readonly [number, number]
): number {
  const wrist = lm(landmarks, LANDMARK.WRIST);
  const mcp = lm(landmarks, mcpIdx);
  const pip = lm(landmarks, pipIdx);

  const neutral = new THREE.Vector3().subVectors(mcp, wrist);
  const actual = new THREE.Vector3().subVectors(pip, mcp);

  if (neutral.lengthSq() < VECTOR_EPSILON || actual.lengthSq() < VECTOR_EPSILON) {
    return NEUTRAL_SPREAD_OFFSET[fingerName];
  }

  neutral.normalize();
  actual.normalize();

  const neutralInPlane = neutral.clone().projectOnPlane(palmFrame.palmNormal);
  const actualInPlane = actual.clone().projectOnPlane(palmFrame.palmNormal);

  if (neutralInPlane.lengthSq() < VECTOR_EPSILON || actualInPlane.lengthSq() < VECTOR_EPSILON) {
    return NEUTRAL_SPREAD_OFFSET[fingerName];
  }

  neutralInPlane.normalize();
  actualInPlane.normalize();

  const rawSpread = signedAngle(neutralInPlane, actualInPlane, palmFrame.palmNormal);
  const adjusted = rawSpread * SPREAD_SCALE[fingerName] + NEUTRAL_SPREAD_OFFSET[fingerName];
  return clampAngle(adjusted, clamp);
}

function hasValidFingerLandmarks(landmarks: Landmark3D[], indices: readonly number[]): boolean {
  return indices.every((index) => isValid(landmarks, index));
}

export function solveFingers(
  landmarks: Landmark3D[],
  side: "Right" | "Left",
  previous?: Partial<FingerRotationMap>
): FingerRotationMap {
  const palmFrame = computePalmFrame(landmarks, side);
  const fallback = neutralFingerRotationMap();
  const result: Partial<FingerRotationMap> = {};

  for (const [fingerName, [mcpIdx, pipIdx, dipIdx, tipIdx]] of Object.entries(FINGERS) as [
    FingerName,
    readonly [number, number, number, number],
  ][]) {
    const allFingerLandmarksValid = palmFrame && hasValidFingerLandmarks(landmarks, [
      LANDMARK.WRIST,
      mcpIdx,
      pipIdx,
      dipIdx,
      tipIdx,
    ]);

    if (!allFingerLandmarksValid) {
      result[fingerName] = previous?.[fingerName] ?? fallback[fingerName];
      continue;
    }

    const mcpFlexion = solveFlexion(landmarks, LANDMARK.WRIST, mcpIdx, pipIdx, JOINT_CLAMPS.mcp.flexion);
    const mcpSpread = solveSpread(landmarks, mcpIdx, pipIdx, fingerName, palmFrame, JOINT_CLAMPS.mcp.abduction);
    const pipFlexion = solveFlexion(landmarks, mcpIdx, pipIdx, dipIdx, JOINT_CLAMPS.pip.flexion);
    const dipFlexion = solveFlexion(landmarks, pipIdx, dipIdx, tipIdx, JOINT_CLAMPS.dip.flexion);

    result[fingerName] = [
      { flexion: mcpFlexion, spread: mcpSpread },
      { flexion: pipFlexion, spread: 0 },
      { flexion: dipFlexion, spread: 0 },
    ];
  }

  return result as FingerRotationMap;
}
