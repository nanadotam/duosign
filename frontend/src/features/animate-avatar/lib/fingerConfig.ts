/**
 * fingerConfig.ts
 *
 * Constants for the direct landmark-to-bone finger solver.
 * All angles in radians.
 */

/**
 * Minimum confidence threshold for a landmark to be considered valid.
 * 0.3 filters out noisy/unreliable detections while accepting most valid frames.
 * Previously 0.05 which allowed very low-quality landmarks through, causing jitter.
 */
export const LANDMARK_CONFIDENCE_THRESHOLD = 0.3;
export const ZERO_FILL_EPSILON = 1e-6;
export const VECTOR_EPSILON = 0.01;

/**
 * MediaPipe landmark indices.
 * Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 */
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

export const FINGERS = {
  thumb: [LANDMARK.THUMB_CMC, LANDMARK.THUMB_MCP, LANDMARK.THUMB_IP, LANDMARK.THUMB_TIP],
  index: [LANDMARK.INDEX_MCP, LANDMARK.INDEX_PIP, LANDMARK.INDEX_DIP, LANDMARK.INDEX_TIP],
  middle: [LANDMARK.MIDDLE_MCP, LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_DIP, LANDMARK.MIDDLE_TIP],
  ring: [LANDMARK.RING_MCP, LANDMARK.RING_PIP, LANDMARK.RING_DIP, LANDMARK.RING_TIP],
  pinky: [LANDMARK.PINKY_MCP, LANDMARK.PINKY_PIP, LANDMARK.PINKY_DIP, LANDMARK.PINKY_TIP],
} as const;

export type FingerName = keyof typeof FINGERS;

/**
 * VRM bone names for each finger segment.
 *
 * camelCase keys are used by applyPose.ts (which maps through BONE_NAME_MAP).
 * PascalCase variants are used by the video engine (which calls rigRotation directly).
 *
 * Note: VRM 0.x calls the thumb's middle bone "ThumbIntermediate" (not Metacarpal).
 * The camelCase key "rightThumbMetacarpal" maps to "RightThumbIntermediate" via BONE_NAME_MAP.
 */
export const FINGER_VRM_BONES: Record<FingerName, Record<"Right" | "Left", [string, string, string]>> = {
  thumb: {
    Right: ["rightThumbProximal", "rightThumbMetacarpal", "rightThumbDistal"],
    Left: ["leftThumbProximal", "leftThumbMetacarpal", "leftThumbDistal"],
  },
  index: {
    Right: ["rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal"],
    Left: ["leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal"],
  },
  middle: {
    Right: ["rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal"],
    Left: ["leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal"],
  },
  ring: {
    Right: ["rightRingProximal", "rightRingIntermediate", "rightRingDistal"],
    Left: ["leftRingProximal", "leftRingIntermediate", "leftRingDistal"],
  },
  pinky: {
    Right: ["rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal"],
    Left: ["leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal"],
  },
};

export const JOINT_CLAMPS = {
  mcp: {
    flexion: [-Math.PI / 6, Math.PI / 2],
    abduction: [-0.17, 0.44],
  },
  pip: {
    flexion: [0, 1.92],
  },
  dip: {
    flexion: [0, Math.PI / 2],
  },
  // Thumb joints have wider ROM than other fingers — the thumb moves in a
  // different plane and is critical for ASL handshape distinction (A/E/S/T/O).
  thumbCmc: {
    flexion: [-0.4, Math.PI / 2],
    abduction: [-0.6, 0.8],
  },
  thumbMcp: {
    flexion: [-0.2, Math.PI / 2],
  },
  thumbIp: {
    flexion: [0, Math.PI / 2],
  },
} as const;

export const NEUTRAL_SPREAD_OFFSET: Record<FingerName, number> = {
  thumb: 0.3,
  index: 0.06,
  middle: 0,
  ring: -0.06,
  pinky: -0.10,
};

export const SPREAD_SCALE: Record<FingerName, number> = {
  thumb: 0.9,
  index: 0.8,
  middle: 0.8,
  ring: 0.8,
  pinky: 0.9,
};

export const NEUTRAL_FINGER_ROTATION = {
  flexion: 0.05,
  spread: 0,
} as const;
