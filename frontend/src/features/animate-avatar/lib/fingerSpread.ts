/**
 * fingerSpread — Y-axis finger spread from raw MediaPipe landmarks
 * ================================================================
 * Kalidokit's Hand.solve() computes excellent Z-axis finger curl but outputs
 * very little Y-axis spread information. This module extracts spread directly
 * from the raw MediaPipe 21-point hand landmarks and augments the Kalidokit
 * output.
 *
 * This is a PARTIAL MITIGATION of a known Kalidokit limitation — not a full
 * IK solution. It meaningfully improves the distinction between spread
 * handshapes (B vs flat-5, V vs U, open-A vs A) but cannot fully replicate
 * all ASL handshape nuances.
 *
 * MediaPipe hand landmark indices (MCP joints):
 *   Wrist: 0   Thumb MCP: 2   Index MCP: 5
 *   Middle MCP: 9   Ring MCP: 13   Pinky MCP: 17
 */

/** 3D point from MediaPipe */
export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

/** A rigged bone rotation (Euler XYZ in radians) */
interface BoneRotation {
  x: number;
  y: number;
  z: number;
}

/** Rigged hand output from Kalidokit — indexed by bone name strings */
export type RiggedHandMap = Record<string, BoneRotation>;

// Scale factor mapping spread angle (radians) → Y-axis bone rotation delta.
// 0.6 is empirically tuned — higher values amplify spread too aggressively.
// Partial mitigation: see module-level JSDoc.
const SPREAD_SCALE_FACTOR = 0.6;

// MCP landmark indices
const WRIST      = 0;
const INDEX_MCP  = 5;
const MIDDLE_MCP = 9;
const RING_MCP   = 13;
const PINKY_MCP  = 17;

function vec3(a: LandmarkPoint, b: LandmarkPoint) {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}

function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function magnitude(v: { x: number; y: number; z: number }) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v: { x: number; y: number; z: number }) {
  const m = magnitude(v);
  if (m === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}

/**
 * Compute signed angle (radians) between two 2D directions in the palm plane.
 * Positive = spread outward from neutral (middle finger axis).
 */
function signedAngleInPalm(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number }
): number {
  const fromN = normalize(from);
  const toN = normalize(to);
  const cosAngle = Math.max(-1, Math.min(1, dot(fromN, toN)));
  const angle = Math.acos(cosAngle);
  // Sign: if cross(from, to) aligns with normal → positive; otherwise negative
  const c = cross(fromN, toN);
  const sign = dot(c, normal) >= 0 ? 1 : -1;
  return sign * angle;
}

/**
 * Augment a Kalidokit rigged hand with Y-axis spread computed from raw landmarks.
 *
 * Call this AFTER Kalidokit.Hand.solve() and BEFORE passing the result to rigHands().
 * The function mutates a shallow copy of riggedHand — it does not modify the original.
 *
 * @param riggedHand  - Output from Kalidokit.Hand.solve()
 * @param landmarks   - Raw 21-point MediaPipe hand landmark array
 * @param side        - "Left" or "Right"
 * @returns           - Augmented rigged hand with Y-axis spread added to proximal bones
 */
export function enhanceHandWithSpread(
  riggedHand: RiggedHandMap,
  landmarks: LandmarkPoint[],
  side: "Left" | "Right"
): RiggedHandMap {
  if (!landmarks || landmarks.length < 21) return riggedHand;

  // Palm plane: use wrist + index/ring MCPs to define the palm coordinate system
  const wrist     = landmarks[WRIST];
  const indexMcp  = landmarks[INDEX_MCP];
  const middleMcp = landmarks[MIDDLE_MCP];
  const ringMcp   = landmarks[RING_MCP];
  const pinkyMcp  = landmarks[PINKY_MCP];

  // Palm center = average of the four MCP knuckles
  const palmCenter = {
    x: (indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 4,
    y: (indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 4,
    z: (indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 4,
  };

  // Neutral axis = middle MCP direction from palm center
  const neutralAxis = normalize(vec3(palmCenter, middleMcp));

  // Palm normal = cross of two palm edge vectors (used to determine spread sign)
  const palEdge1 = normalize(vec3(wrist, indexMcp));
  const palEdge2 = normalize(vec3(wrist, pinkyMcp));
  const palmNormal = normalize(cross(palEdge1, palEdge2));

  // Finger proximal bone names per side
  const fingers: Array<{
    mcp: LandmarkPoint;
    proxyBone: string;
    // expected spread sign: index/ring/pinky splay outward from middle
    expectedSign: 1 | -1;
  }> = [
    {
      mcp: indexMcp,
      proxyBone: `${side}IndexProximal`,
      expectedSign: side === "Right" ? -1 : 1,
    },
    {
      mcp: ringMcp,
      proxyBone: `${side}RingProximal`,
      expectedSign: side === "Right" ? 1 : -1,
    },
    {
      mcp: pinkyMcp,
      proxyBone: `${side}LittleProximal`,
      expectedSign: side === "Right" ? 1 : -1,
    },
  ];

  // Shallow-copy the rigged hand so we don't mutate the Kalidokit output
  const enhanced: RiggedHandMap = { ...riggedHand };

  for (const { mcp, proxyBone, expectedSign } of fingers) {
    const fingerDir = normalize(vec3(palmCenter, mcp));
    const spreadAngle = signedAngleInPalm(neutralAxis, fingerDir, palmNormal);
    const yDelta = spreadAngle * SPREAD_SCALE_FACTOR * expectedSign;

    const existing = enhanced[proxyBone];
    if (existing) {
      enhanced[proxyBone] = { ...existing, y: existing.y + yDelta };
    }
  }

  return enhanced;
}
