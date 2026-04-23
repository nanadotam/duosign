// src/features/animate-avatar/lib/applyPose.ts
import * as THREE4 from "./three.module.js";
import { VRMSchema as VRMSchema2 } from "./three-vrm.module.js";

// src/features/animate-avatar/lib/retargetConfig.ts
import * as THREE2 from "./three.module.js";

// src/features/animate-avatar/lib/vrmRigger.ts
import * as THREE from "./three.module.js";
import { VRMSchema } from "./three-vrm.module.js";
var RIG_CONFIG = {
  hips: {
    dampener: 0.7,
    lerp: 0.12
    // very slow — core body barely moves during signing
  },
  chest: {
    dampener: 0.25,
    lerp: 0.15
    // subtle torso lean
  },
  spine: {
    dampener: 0.45,
    lerp: 0.15
  },
  upperArm: {
    dampener: 1,
    lerp: 0.35
    // arms follow arc paths — moderate smoothing
  },
  lowerArm: {
    dampener: 1,
    lerp: 0.4
    // forearm slightly faster than upper arm
  },
  hand: {
    dampener: 1,
    // MUST remain 1.0 — ASL signs like MY/PLEASE/SORRY require full wrist rotation range
    lerp: 0.6
    // wrists respond faster — need to hit signing targets
  },
  palmOrientation: {
    pronationScale: 0.85
  },
  finger: {
    dampener: 1,
    // MUST remain 1.0 — any reduction prevents closed-fist handshapes (A, S, E, etc.)
    lerp: 0.75
    // fingers snap quickly — handshapes are crisp in ASL
  },
  thumb: {
    dampener: 1,
    // MUST remain 1.0 — thumb opposition distinguishes many ASL handshapes (A vs E, etc.)
    lerp: 0.7
  },
  neck: {
    dampener: 0.7,
    lerp: 0.15
    // head nods are slow and deliberate in ASL grammar
  },
  head: {
    lerp: 0.2
    // head rotation — used by face solve path
  },
  face: {
    lerp: 0.4
    // blendshape / expression lerp
  },
  // Arm rotation limits (radians) — prevent arms crossing body center
  // These are anatomical limits derived from human range-of-motion.
  // Z axis on upper arms: negative = toward body center, positive = away
  // Tighten rightUpperArm.zMin if crossing still occurs
  // Loosen if head/chest-level signs look constrained
  armClamps: {
    rightUpperArm: { zMin: -0.35, zMax: Math.PI, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    leftUpperArm: { zMin: -Math.PI, zMax: 0.35, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    rightLowerArm: { xMin: -Math.PI * 0.9, xMax: 0.1 },
    leftLowerArm: { xMin: -Math.PI * 0.9, xMax: 0.1 }
  },
  // Proportion scaling applied to Kalidokit output before rigging.
  // Compensates for differences between MediaPipe's normalized space and VRM bone lengths.
  proportionScale: {
    hipsWorldPosition: { x: 0.75, y: 0.75, z: 0.22 },
    armExtension: 0.92
  },
  handDepth: {
    scale: 0.35,
    clamp: 0.4
  },
  // Pose engine physics / timing
  hipsYOffset: 0,
  // vertical offset applied to hips world position
  restPoseSmoothing: 0.4,
  // lerp speed when returning to rest pose between signs
  restPoseFrames: 4,
  // number of rAF frames spent lerping to rest pose
  interSignSettleMs: 40
  // extra wait (ms) after rest-pose lerp before next sign
};
var speedMultiplier = 1;
function setSpeedMultiplier(m) {
  speedMultiplier = Math.max(0.5, Math.min(2, m));
}
function effectiveLerp(base) {
  return Math.min(1, base * speedMultiplier);
}
function clampRotation(rotation, boneName) {
  const clamps = RIG_CONFIG.armClamps;
  const key = boneName.charAt(0).toLowerCase() + boneName.slice(1);
  const c = clamps[key];
  if (!c) return rotation;
  return {
    x: c.xMin !== void 0 ? Math.max(c.xMin, Math.min(c.xMax ?? Infinity, rotation.x)) : rotation.x,
    y: c.yMin !== void 0 ? Math.max(c.yMin, Math.min(c.yMax ?? Infinity, rotation.y)) : rotation.y,
    z: c.zMin !== void 0 ? Math.max(c.zMin, Math.min(c.zMax ?? Infinity, rotation.z)) : rotation.z
  };
}
function rigRotation(vrm, boneName, rotation, dampener = 1, lerpAmount = 0.3) {
  var _a;
  const boneKey = boneName;
  const humanBoneName = VRMSchema.HumanoidBoneName[boneKey];
  if (!humanBoneName) return;
  const node = (_a = vrm.humanoid) == null ? void 0 : _a.getBoneNode(humanBoneName);
  if (!node) {
    if (false) {
      console.warn(`[DuoSign] Bone "${boneName}" not found in this VRM model.`);
      warnedBones.add(boneName);
    }
    return;
  }
  const scaled = {
    x: rotation.x * dampener,
    y: rotation.y * dampener,
    z: rotation.z * dampener
  };
  const clamped = clampRotation(scaled, boneName);
  const euler = new THREE.Euler(clamped.x, clamped.y, clamped.z);
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(quaternion, effectiveLerp(lerpAmount));
}
function rigPosition(vrm, boneName, position, dampener = 1, lerpAmount = 0.3) {
  var _a;
  const boneKey = boneName;
  const humanBoneName = VRMSchema.HumanoidBoneName[boneKey];
  if (!humanBoneName) return;
  const node = (_a = vrm.humanoid) == null ? void 0 : _a.getBoneNode(humanBoneName);
  if (!node) return;
  const vector = new THREE.Vector3(
    position.x * dampener,
    position.y * dampener,
    position.z * dampener
  );
  node.position.lerp(vector, lerpAmount);
}
function rigUpperBody(vrm, riggedPose) {
  rigRotation(vrm, "Hips", riggedPose.Hips.rotation, RIG_CONFIG.hips.dampener, RIG_CONFIG.hips.lerp);
  rigRotation(vrm, "Chest", riggedPose.Spine, RIG_CONFIG.chest.dampener, RIG_CONFIG.chest.lerp);
  rigRotation(vrm, "Spine", riggedPose.Spine, RIG_CONFIG.spine.dampener, RIG_CONFIG.spine.lerp);
  rigRotation(vrm, "RightUpperArm", riggedPose.RightUpperArm, RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "RightLowerArm", riggedPose.RightLowerArm, RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
  rigRotation(vrm, "LeftUpperArm", riggedPose.LeftUpperArm, RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "LeftLowerArm", riggedPose.LeftLowerArm, RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
}
var FINGER_BONES = [
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
  "LittleDistal"
];
function rigHands(vrm, riggedLeftHand, riggedRightHand, riggedPose) {
  var _a, _b, _c, _d;
  if (riggedLeftHand) {
    rigRotation(vrm, "LeftHand", {
      z: riggedPose.LeftHand.z,
      y: ((_a = riggedLeftHand.LeftWrist) == null ? void 0 : _a.y) ?? 0,
      x: ((_b = riggedLeftHand.LeftWrist) == null ? void 0 : _b.x) ?? 0
    }, RIG_CONFIG.hand.dampener, RIG_CONFIG.hand.lerp);
    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        const cfg = bone.startsWith("Thumb") ? RIG_CONFIG.thumb : RIG_CONFIG.finger;
        rigRotation(vrm, key, riggedLeftHand[key], cfg.dampener, cfg.lerp);
      }
    }
  }
  if (riggedRightHand) {
    rigRotation(vrm, "RightHand", {
      z: riggedPose.RightHand.z,
      y: ((_c = riggedRightHand.RightWrist) == null ? void 0 : _c.y) ?? 0,
      x: ((_d = riggedRightHand.RightWrist) == null ? void 0 : _d.x) ?? 0
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
var _oldLookTarget = new THREE.Euler();
function rigFace(vrm, riggedFace) {
  rigRotation(vrm, "Neck", riggedFace.head, RIG_CONFIG.neck.dampener, RIG_CONFIG.neck.lerp);
  const blendshape = vrm.blendShapeProxy;
  if (!blendshape) return;
  const PresetName = VRMSchema.BlendShapePresetName;
  blendshape.setValue(PresetName.Joy, 0.15);
  blendshape.setValue(PresetName.Blink, 0);
  blendshape.setValue(PresetName.BlinkL, 0);
  blendshape.setValue(PresetName.BlinkR, 0);
  blendshape.setValue(PresetName.A, 0);
  blendshape.setValue(PresetName.I, 0);
  blendshape.setValue(PresetName.U, 0);
  blendshape.setValue(PresetName.E, 0);
  blendshape.setValue(PresetName.O, 0);
}
function resetPose(vrm) {
  var _a, _b, _c;
  const identity = new THREE.Quaternion();
  const bones = Object.values(VRMSchema.HumanoidBoneName);
  for (const boneName of bones) {
    const node = (_a = vrm.humanoid) == null ? void 0 : _a.getBoneNode(boneName);
    if (node) {
      node.quaternion.slerp(identity, 0.15);
    }
  }
  const rightHand = (_b = vrm.humanoid) == null ? void 0 : _b.getBoneNode(VRMSchema.HumanoidBoneName.RightHand);
  const leftHand = (_c = vrm.humanoid) == null ? void 0 : _c.getBoneNode(VRMSchema.HumanoidBoneName.LeftHand);
  if (rightHand) {
    rightHand.position.z = THREE.MathUtils.lerp(rightHand.position.z, 0, 0.15);
  }
  if (leftHand) {
    leftHand.position.z = THREE.MathUtils.lerp(leftHand.position.z, 0, 0.15);
  }
}
var SIGNING_REST_POSE = {
  RightUpperArm: { x: 0, y: 0, z: -1.2 },
  // rotated from T-pose toward body side
  LeftUpperArm: { x: 0, y: 0, z: 1.2 },
  RightLowerArm: { x: 0, y: 0, z: 0 },
  // neutral — no elbow bend at rest
  LeftLowerArm: { x: 0, y: 0, z: 0 },
  RightHand: { x: 0, y: 0, z: 0 },
  LeftHand: { x: 0, y: 0, z: 0 },
  Spine: { x: 0.02, y: 0, z: 0 },
  // very slight forward lean
  Hips: { x: 0, y: 0, z: 0 }
};
var _renderVRM = null;
function setRenderVRM(vrm) {
  _renderVRM = vrm;
}
function getRenderVRM() {
  return _renderVRM;
}
function lerpToRestPose(vrm, frames = RIG_CONFIG.restPoseFrames, onSettled) {
  const target = vrm ?? _renderVRM;
  if (!target) {
    onSettled == null ? void 0 : onSettled();
    return;
  }
  let remaining = frames;
  const tick = () => {
    var _a, _b;
    if (remaining <= 0) {
      onSettled == null ? void 0 : onSettled();
      return;
    }
    for (const [boneName, pose] of Object.entries(SIGNING_REST_POSE)) {
      rigRotation(target, boneName, pose, 1, RIG_CONFIG.restPoseSmoothing);
    }
    const rightHand = (_a = target.humanoid) == null ? void 0 : _a.getBoneNode(VRMSchema.HumanoidBoneName.RightHand);
    const leftHand = (_b = target.humanoid) == null ? void 0 : _b.getBoneNode(VRMSchema.HumanoidBoneName.LeftHand);
    if (rightHand) {
      rightHand.position.z = THREE.MathUtils.lerp(rightHand.position.z, 0, RIG_CONFIG.restPoseSmoothing);
    }
    if (leftHand) {
      leftHand.position.z = THREE.MathUtils.lerp(leftHand.position.z, 0, RIG_CONFIG.restPoseSmoothing);
    }
    remaining--;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// src/features/animate-avatar/lib/retargetConfig.ts
var BONE_CLAMPS = {
  rightUpperArm: {
    z: [RIG_CONFIG.armClamps.rightUpperArm.zMin, RIG_CONFIG.armClamps.rightUpperArm.zMax],
    x: [RIG_CONFIG.armClamps.rightUpperArm.xMin, RIG_CONFIG.armClamps.rightUpperArm.xMax]
  },
  leftUpperArm: {
    z: [RIG_CONFIG.armClamps.leftUpperArm.zMin, RIG_CONFIG.armClamps.leftUpperArm.zMax],
    x: [RIG_CONFIG.armClamps.leftUpperArm.xMin, RIG_CONFIG.armClamps.leftUpperArm.xMax]
  },
  rightLowerArm: {
    x: [RIG_CONFIG.armClamps.rightLowerArm.xMin, RIG_CONFIG.armClamps.rightLowerArm.xMax]
  },
  leftLowerArm: {
    x: [RIG_CONFIG.armClamps.leftLowerArm.xMin, RIG_CONFIG.armClamps.leftLowerArm.xMax]
  }
};
var SMOOTHING = {
  hips: RIG_CONFIG.hips.lerp,
  spine: RIG_CONFIG.spine.lerp,
  upperArm: RIG_CONFIG.upperArm.lerp,
  lowerArm: RIG_CONFIG.lowerArm.lerp,
  hand: RIG_CONFIG.hand.lerp,
  thumb: RIG_CONFIG.thumb.lerp,
  fingers: RIG_CONFIG.finger.lerp,
  head: RIG_CONFIG.head.lerp,
  face: RIG_CONFIG.face.lerp
};
var PROPORTION_SCALE = RIG_CONFIG.proportionScale;
var HIPS_Y_OFFSET = RIG_CONFIG.hipsYOffset;
var REST_POSE_SMOOTHING = RIG_CONFIG.restPoseSmoothing;
var REST_POSE_FRAMES = RIG_CONFIG.restPoseFrames;
var INTER_SIGN_SETTLE_MS = RIG_CONFIG.interSignSettleMs;
var PALM_PRONATION_SCALE = RIG_CONFIG.palmOrientation.pronationScale;
var HAND_DEPTH_SCALE = RIG_CONFIG.handDepth.scale;
var HAND_DEPTH_CLAMP = RIG_CONFIG.handDepth.clamp;
var ZERO_ROTATION = new THREE2.Euler(0, 0, 0);

// src/features/animate-avatar/lib/fingerConfig.ts
var LANDMARK_CONFIDENCE_THRESHOLD = 0.05;
var ZERO_FILL_EPSILON = 1e-6;
var VECTOR_EPSILON = 0.01;
var LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};
var FINGERS = {
  index: [LANDMARK.INDEX_MCP, LANDMARK.INDEX_PIP, LANDMARK.INDEX_DIP, LANDMARK.INDEX_TIP],
  middle: [LANDMARK.MIDDLE_MCP, LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_DIP, LANDMARK.MIDDLE_TIP],
  ring: [LANDMARK.RING_MCP, LANDMARK.RING_PIP, LANDMARK.RING_DIP, LANDMARK.RING_TIP],
  pinky: [LANDMARK.PINKY_MCP, LANDMARK.PINKY_PIP, LANDMARK.PINKY_DIP, LANDMARK.PINKY_TIP]
};
var FINGER_VRM_BONES = {
  index: {
    Right: ["rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal"],
    Left: ["leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal"]
  },
  middle: {
    Right: ["rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal"],
    Left: ["leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal"]
  },
  ring: {
    Right: ["rightRingProximal", "rightRingIntermediate", "rightRingDistal"],
    Left: ["leftRingProximal", "leftRingIntermediate", "leftRingDistal"]
  },
  pinky: {
    Right: ["rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal"],
    Left: ["leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal"]
  }
};
var JOINT_CLAMPS = {
  mcp: {
    flexion: [-Math.PI / 6, Math.PI / 2],
    abduction: [-0.17, 0.44]
  },
  pip: {
    flexion: [0, 1.92]
  },
  dip: {
    flexion: [0, Math.PI / 2]
  }
};
var NEUTRAL_SPREAD_OFFSET = {
  index: 0.06,
  middle: 0,
  ring: -0.06,
  pinky: -0.1
};
var SPREAD_SCALE = {
  index: 0.8,
  middle: 0.8,
  ring: 0.8,
  pinky: 0.9
};
var NEUTRAL_FINGER_ROTATION = {
  flexion: 0.05,
  spread: 0
};

// src/features/animate-avatar/lib/fingerSolver.ts
import * as THREE3 from "./three.module.js";
function neutralFingerRotationMap() {
  return {
    index: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.index },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 }
    ],
    middle: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.middle },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 }
    ],
    ring: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.ring },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 }
    ],
    pinky: [
      { ...NEUTRAL_FINGER_ROTATION, spread: NEUTRAL_SPREAD_OFFSET.pinky },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 },
      { ...NEUTRAL_FINGER_ROTATION, spread: 0 }
    ]
  };
}
function lm(landmarks, idx) {
  const point = landmarks[idx];
  return new THREE3.Vector3(point.x, point.y, point.z);
}
function isValid(landmarks, idx) {
  const point = landmarks[idx];
  if (!point) return false;
  if (point.visibility !== void 0 && point.visibility < LANDMARK_CONFIDENCE_THRESHOLD) return false;
  if (Math.abs(point.x) < ZERO_FILL_EPSILON && Math.abs(point.y) < ZERO_FILL_EPSILON && Math.abs(point.z) < ZERO_FILL_EPSILON) {
    return false;
  }
  return true;
}
function clampAngle(value, clamp2) {
  return Math.max(clamp2[0], Math.min(clamp2[1], value));
}
function signedAngle(from, to, normal) {
  const angle = from.angleTo(to);
  if (!Number.isFinite(angle)) return 0;
  const cross2 = new THREE3.Vector3().crossVectors(from, to);
  const sign = Math.sign(cross2.dot(normal));
  return sign * angle;
}
function computePalmFrame(landmarks, side) {
  if (!isValid(landmarks, LANDMARK.WRIST) || !isValid(landmarks, LANDMARK.MIDDLE_MCP) || !isValid(landmarks, LANDMARK.INDEX_MCP) || !isValid(landmarks, LANDMARK.PINKY_MCP)) {
    return null;
  }
  const wrist = lm(landmarks, LANDMARK.WRIST);
  const middleMcp = lm(landmarks, LANDMARK.MIDDLE_MCP);
  const indexMcp = lm(landmarks, LANDMARK.INDEX_MCP);
  const pinkyMcp = lm(landmarks, LANDMARK.PINKY_MCP);
  const palmUp = new THREE3.Vector3().subVectors(middleMcp, wrist);
  const knuckleLine = new THREE3.Vector3().subVectors(pinkyMcp, indexMcp);
  if (palmUp.lengthSq() < VECTOR_EPSILON || knuckleLine.lengthSq() < VECTOR_EPSILON) {
    return null;
  }
  palmUp.normalize();
  const palmRight = (side === "Right" ? knuckleLine : knuckleLine.negate()).normalize();
  const palmNormal = new THREE3.Vector3().crossVectors(palmUp, palmRight);
  if (palmNormal.lengthSq() < VECTOR_EPSILON) {
    return null;
  }
  palmNormal.normalize();
  return { palmUp, palmRight, palmNormal };
}
function solvePalmOrientation(landmarks, side) {
  const frame = computePalmFrame(landmarks, side);
  if (!frame) return null;
  const pronation = Math.atan2(frame.palmNormal.y, -frame.palmNormal.z);
  return Number.isFinite(pronation) ? pronation : null;
}
function solveFlexion(landmarks, parentIdx, jointIdx, childIdx, clamp2) {
  const parent = lm(landmarks, parentIdx);
  const joint = lm(landmarks, jointIdx);
  const child = lm(landmarks, childIdx);
  const proximal = new THREE3.Vector3().subVectors(joint, parent);
  const distal = new THREE3.Vector3().subVectors(child, joint);
  if (proximal.lengthSq() < VECTOR_EPSILON || distal.lengthSq() < VECTOR_EPSILON) {
    return NEUTRAL_FINGER_ROTATION.flexion;
  }
  proximal.normalize();
  distal.normalize();
  const bendAngle = Math.PI - proximal.angleTo(distal);
  if (!Number.isFinite(bendAngle)) {
    return NEUTRAL_FINGER_ROTATION.flexion;
  }
  return clampAngle(bendAngle, clamp2);
}
function solveSpread(landmarks, mcpIdx, pipIdx, fingerName, palmFrame, clamp2) {
  const wrist = lm(landmarks, LANDMARK.WRIST);
  const mcp = lm(landmarks, mcpIdx);
  const pip = lm(landmarks, pipIdx);
  const neutral = new THREE3.Vector3().subVectors(mcp, wrist);
  const actual = new THREE3.Vector3().subVectors(pip, mcp);
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
  return clampAngle(adjusted, clamp2);
}
function hasValidFingerLandmarks(landmarks, indices) {
  return indices.every((index) => isValid(landmarks, index));
}
function solveFingers(landmarks, side, previous) {
  const palmFrame = computePalmFrame(landmarks, side);
  const fallback = neutralFingerRotationMap();
  const result = {};
  for (const [fingerName, [mcpIdx, pipIdx, dipIdx, tipIdx]] of Object.entries(FINGERS)) {
    const allFingerLandmarksValid = palmFrame && hasValidFingerLandmarks(landmarks, [
      LANDMARK.WRIST,
      mcpIdx,
      pipIdx,
      dipIdx,
      tipIdx
    ]);
    if (!allFingerLandmarksValid) {
      result[fingerName] = (previous == null ? void 0 : previous[fingerName]) ?? fallback[fingerName];
      continue;
    }
    const mcpFlexion = solveFlexion(landmarks, LANDMARK.WRIST, mcpIdx, pipIdx, JOINT_CLAMPS.mcp.flexion);
    const mcpSpread = solveSpread(landmarks, mcpIdx, pipIdx, fingerName, palmFrame, JOINT_CLAMPS.mcp.abduction);
    const pipFlexion = solveFlexion(landmarks, mcpIdx, pipIdx, dipIdx, JOINT_CLAMPS.pip.flexion);
    const dipFlexion = solveFlexion(landmarks, pipIdx, dipIdx, tipIdx, JOINT_CLAMPS.dip.flexion);
    result[fingerName] = [
      { flexion: mcpFlexion, spread: mcpSpread },
      { flexion: pipFlexion, spread: 0 },
      { flexion: dipFlexion, spread: 0 }
    ];
  }
  return result;
}

// src/features/animate-avatar/lib/fingerSpread.ts
var SPREAD_SCALE_FACTOR = 0.6;
var WRIST = 0;
var INDEX_MCP = 5;
var MIDDLE_MCP = 9;
var RING_MCP = 13;
var PINKY_MCP = 17;
function vec3(a, b) {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}
function magnitude(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function normalize(v) {
  const m = magnitude(v);
  if (m === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}
function signedAngleInPalm(from, to, normal) {
  const fromN = normalize(from);
  const toN = normalize(to);
  const cosAngle = Math.max(-1, Math.min(1, dot(fromN, toN)));
  const angle = Math.acos(cosAngle);
  const c = cross(fromN, toN);
  const sign = dot(c, normal) >= 0 ? 1 : -1;
  return sign * angle;
}
function enhanceHandWithSpread(riggedHand, landmarks, side) {
  if (!landmarks || landmarks.length < 21) return riggedHand;
  const wrist = landmarks[WRIST];
  const indexMcp = landmarks[INDEX_MCP];
  const middleMcp = landmarks[MIDDLE_MCP];
  const ringMcp = landmarks[RING_MCP];
  const pinkyMcp = landmarks[PINKY_MCP];
  const palmCenter = {
    x: (indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 4,
    y: (indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 4,
    z: (indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 4
  };
  const neutralAxis = normalize(vec3(palmCenter, middleMcp));
  const palEdge1 = normalize(vec3(wrist, indexMcp));
  const palEdge2 = normalize(vec3(wrist, pinkyMcp));
  const palmNormal = normalize(cross(palEdge1, palEdge2));
  const fingers = [
    {
      mcp: indexMcp,
      proxyBone: `${side}IndexProximal`,
      expectedSign: side === "Right" ? -1 : 1
    },
    {
      mcp: ringMcp,
      proxyBone: `${side}RingProximal`,
      expectedSign: side === "Right" ? 1 : -1
    },
    {
      mcp: pinkyMcp,
      proxyBone: `${side}LittleProximal`,
      expectedSign: side === "Right" ? 1 : -1
    }
  ];
  const enhanced = { ...riggedHand };
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

// stub:../ui/AvatarDebugOverlay
function syncAvatarDebugOverlay() {
}

// src/features/animate-avatar/lib/applyPose.ts
var BONE_NAME_MAP = {
  hips: "Hips",
  spine: "Spine",
  chest: "Chest",
  neck: "Neck",
  head: "Head",
  rightUpperArm: "RightUpperArm",
  leftUpperArm: "LeftUpperArm",
  rightLowerArm: "RightLowerArm",
  leftLowerArm: "LeftLowerArm",
  rightHand: "RightHand",
  leftHand: "LeftHand",
  rightThumbProximal: "RightThumbProximal",
  rightThumbMetacarpal: "RightThumbIntermediate",
  rightThumbDistal: "RightThumbDistal",
  leftThumbProximal: "LeftThumbProximal",
  leftThumbMetacarpal: "LeftThumbIntermediate",
  leftThumbDistal: "LeftThumbDistal",
  rightIndexProximal: "RightIndexProximal",
  rightIndexIntermediate: "RightIndexIntermediate",
  rightIndexDistal: "RightIndexDistal",
  rightMiddleProximal: "RightMiddleProximal",
  rightMiddleIntermediate: "RightMiddleIntermediate",
  rightMiddleDistal: "RightMiddleDistal",
  rightRingProximal: "RightRingProximal",
  rightRingIntermediate: "RightRingIntermediate",
  rightRingDistal: "RightRingDistal",
  rightLittleProximal: "RightLittleProximal",
  rightLittleIntermediate: "RightLittleIntermediate",
  rightLittleDistal: "RightLittleDistal",
  leftIndexProximal: "LeftIndexProximal",
  leftIndexIntermediate: "LeftIndexIntermediate",
  leftIndexDistal: "LeftIndexDistal",
  leftMiddleProximal: "LeftMiddleProximal",
  leftMiddleIntermediate: "LeftMiddleIntermediate",
  leftMiddleDistal: "LeftMiddleDistal",
  leftRingProximal: "LeftRingProximal",
  leftRingIntermediate: "LeftRingIntermediate",
  leftRingDistal: "LeftRingDistal",
  leftLittleProximal: "LeftLittleProximal",
  leftLittleIntermediate: "LeftLittleIntermediate",
  leftLittleDistal: "LeftLittleDistal"
};
var _activeVRM = null;
var previousFingerRotations = {};
var oldLookTarget = new THREE4.Euler();
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function applyClamp(rotation, boneName) {
  const def = BONE_CLAMPS[boneName];
  if (!def) return rotation;
  return {
    x: def.x ? clamp(rotation.x, def.x[0], def.x[1]) : rotation.x,
    y: def.y ? clamp(rotation.y, def.y[0], def.y[1]) : rotation.y,
    z: def.z ? clamp(rotation.z, def.z[0], def.z[1]) : rotation.z
  };
}
function getBoneNode(vrm, boneName) {
  var _a;
  const schemaKey = BONE_NAME_MAP[boneName];
  if (!schemaKey) return null;
  const humanBoneName = VRMSchema2.HumanoidBoneName[schemaKey];
  if (!humanBoneName) return null;
  return ((_a = vrm.humanoid) == null ? void 0 : _a.getBoneNode(humanBoneName)) ?? null;
}
function lerpBone(vrm, boneName, target, smoothing) {
  const bone = getBoneNode(vrm, boneName);
  if (!bone) return;
  const clamped = applyClamp(target, boneName);
  bone.rotation.x = THREE4.MathUtils.lerp(bone.rotation.x, clamped.x, smoothing);
  bone.rotation.y = THREE4.MathUtils.lerp(bone.rotation.y, clamped.y, smoothing);
  bone.rotation.z = THREE4.MathUtils.lerp(bone.rotation.z, clamped.z, smoothing);
}
function lerpBlendShape(vrm, presetName, target, smoothing) {
  const blendShape = vrm.blendShapeProxy;
  if (!blendShape) return;
  const preset = VRMSchema2.BlendShapePresetName[presetName];
  if (!preset) return;
  const current = blendShape.getValue(preset) ?? 0;
  blendShape.setValue(preset, THREE4.MathUtils.lerp(current, target, smoothing));
}
function scaleRotation(rotation, scale) {
  return {
    x: rotation.x * scale,
    y: rotation.y * scale,
    z: rotation.z * scale
  };
}
function lerpHandDepth(vrm, boneName, targetZ) {
  const bone = getBoneNode(vrm, boneName);
  if (!bone) return;
  bone.position.z = THREE4.MathUtils.lerp(bone.position.z, targetZ, SMOOTHING.hand);
}
function applyFingers(vrm, landmarks, side) {
  const rotations = solveFingers(landmarks, side, previousFingerRotations[side]);
  previousFingerRotations[side] = rotations;
  for (const [fingerName, [mcp, pip, dip]] of Object.entries(rotations)) {
    const [proximalName, intermediateName, distalName] = FINGER_VRM_BONES[fingerName][side];
    lerpBone(vrm, proximalName, { x: 0, y: mcp.spread, z: mcp.flexion }, SMOOTHING.fingers);
    lerpBone(vrm, intermediateName, { x: 0, y: 0, z: pip.flexion }, SMOOTHING.fingers);
    lerpBone(vrm, distalName, { x: 0, y: 0, z: dip.flexion }, SMOOTHING.fingers);
  }
}
function updateLookTarget(vrm, x, y) {
  var _a, _b;
  const lookTarget = new THREE4.Euler(
    THREE4.MathUtils.lerp(oldLookTarget.x, y, SMOOTHING.face),
    THREE4.MathUtils.lerp(oldLookTarget.y, x, SMOOTHING.face),
    0,
    "XYZ"
  );
  oldLookTarget.copy(lookTarget);
  (_b = (_a = vrm.lookAt) == null ? void 0 : _a.applyer) == null ? void 0 : _b.lookAt(lookTarget);
}
function applyPoseToVRM(vrm, frame, kalidokit, options = {}) {
  var _a, _b;
  const start = performance.now();
  const imageSize = options.imageSize ?? { width: 1280, height: 720 };
  _activeVRM = vrm;
  syncAvatarDebugOverlay(vrm);
  let riggedPose;
  if (frame.poseLandmarks) {
    const worldLandmarks = frame.poseWorldLandmarks ?? frame.poseLandmarks.map((lm2) => ({ ...lm2, z: 0 }));
    riggedPose = kalidokit.Pose.solve(
      worldLandmarks,
      // 3D world-space (or flat approximation)
      frame.poseLandmarks,
      // 2D screen-space
      {
        runtime: "mediapipe",
        imageSize,
        enableLegs: false
      }
    );
    if (riggedPose) {
      const hipsNode = getBoneNode(vrm, "hips");
      const hipsWorld = (_a = riggedPose.Hips) == null ? void 0 : _a.worldPosition;
      if (hipsNode && hipsWorld) {
        hipsNode.position.lerp(
          new THREE4.Vector3(
            hipsWorld.x * PROPORTION_SCALE.hipsWorldPosition.x,
            hipsWorld.y * PROPORTION_SCALE.hipsWorldPosition.y + HIPS_Y_OFFSET,
            hipsWorld.z * PROPORTION_SCALE.hipsWorldPosition.z
          ),
          SMOOTHING.hips
        );
      }
      if (frame.poseWorldLandmarks) {
        const worldLandmarks2 = frame.poseWorldLandmarks;
        const rightWristWorld = worldLandmarks2[16];
        const rightShoulderWorld = worldLandmarks2[12];
        if (rightWristWorld && rightShoulderWorld) {
          const rawDepth = (rightWristWorld.z - rightShoulderWorld.z) * HAND_DEPTH_SCALE;
          const clampedDepth = clamp(rawDepth, -HAND_DEPTH_CLAMP, HAND_DEPTH_CLAMP);
          lerpHandDepth(vrm, "rightHand", clampedDepth);
        }
        const leftWristWorld = worldLandmarks2[15];
        const leftShoulderWorld = worldLandmarks2[11];
        if (leftWristWorld && leftShoulderWorld) {
          const rawDepth = (leftWristWorld.z - leftShoulderWorld.z) * HAND_DEPTH_SCALE;
          const clampedDepth = clamp(rawDepth, -HAND_DEPTH_CLAMP, HAND_DEPTH_CLAMP);
          lerpHandDepth(vrm, "leftHand", clampedDepth);
        }
      } else {
        lerpHandDepth(vrm, "rightHand", 0);
        lerpHandDepth(vrm, "leftHand", 0);
      }
      rigUpperBody(vrm, riggedPose);
    }
  }
  const playbackLeftHandLandmarks = frame.rightHandLandmarks;
  const playbackRightHandLandmarks = frame.leftHandLandmarks;
  if (playbackRightHandLandmarks) {
    const rawRightHand = kalidokit.Hand.solve(playbackRightHandLandmarks, "Right");
    const rightHand = rawRightHand ? enhanceHandWithSpread(rawRightHand, playbackRightHandLandmarks, "Right") : null;
    if (rightHand) {
      if (rightHand.RightWrist) {
        const wristBase = scaleRotation(rightHand.RightWrist, PROPORTION_SCALE.armExtension);
        const palmRoll = solvePalmOrientation(playbackRightHandLandmarks, "Right");
        lerpBone(
          vrm,
          "rightHand",
          {
            x: wristBase.x,
            y: wristBase.y,
            z: palmRoll !== null ? palmRoll * PALM_PRONATION_SCALE : wristBase.z
          },
          SMOOTHING.hand
        );
      }
      if (rightHand.RightThumbProximal) {
        lerpBone(vrm, "rightThumbProximal", rightHand.RightThumbProximal, SMOOTHING.thumb);
      }
      if (rightHand.RightThumbIntermediate) {
        lerpBone(vrm, "rightThumbMetacarpal", rightHand.RightThumbIntermediate, SMOOTHING.thumb);
      }
      if (rightHand.RightThumbDistal) {
        lerpBone(vrm, "rightThumbDistal", rightHand.RightThumbDistal, SMOOTHING.thumb);
      }
    }
    applyFingers(vrm, playbackRightHandLandmarks, "Right");
  }
  if (playbackLeftHandLandmarks) {
    const rawLeftHand = kalidokit.Hand.solve(playbackLeftHandLandmarks, "Left");
    const leftHand = rawLeftHand ? enhanceHandWithSpread(rawLeftHand, playbackLeftHandLandmarks, "Left") : null;
    if (leftHand) {
      if (leftHand.LeftWrist) {
        const wristBase = scaleRotation(leftHand.LeftWrist, PROPORTION_SCALE.armExtension);
        const palmRoll = solvePalmOrientation(playbackLeftHandLandmarks, "Left");
        lerpBone(
          vrm,
          "leftHand",
          {
            x: wristBase.x,
            y: wristBase.y,
            z: palmRoll !== null ? palmRoll * PALM_PRONATION_SCALE : wristBase.z
          },
          SMOOTHING.hand
        );
      }
      if (leftHand.LeftThumbProximal) {
        lerpBone(vrm, "leftThumbProximal", leftHand.LeftThumbProximal, SMOOTHING.thumb);
      }
      if (leftHand.LeftThumbIntermediate) {
        lerpBone(vrm, "leftThumbMetacarpal", leftHand.LeftThumbIntermediate, SMOOTHING.thumb);
      }
      if (leftHand.LeftThumbDistal) {
        lerpBone(vrm, "leftThumbDistal", leftHand.LeftThumbDistal, SMOOTHING.thumb);
      }
    }
    applyFingers(vrm, playbackLeftHandLandmarks, "Left");
  }
  if (frame.faceLandmarks) {
    const riggedFace = kalidokit.Face.solve(frame.faceLandmarks, {
      runtime: "mediapipe",
      imageSize,
      smoothBlink: true,
      blinkSettings: [0.3, 0.7]
    });
    if (riggedFace == null ? void 0 : riggedFace.head) {
      lerpBone(vrm, "head", riggedFace.head, SMOOTHING.head);
    }
    if ((riggedFace == null ? void 0 : riggedFace.eye) && (riggedFace == null ? void 0 : riggedFace.head)) {
      const eyes = kalidokit.Face.stabilizeBlink(
        { r: riggedFace.eye.r, l: riggedFace.eye.l },
        riggedFace.head.y,
        { maxRot: 0.5 }
      );
      lerpBlendShape(vrm, "Blink", 1 - eyes.l, SMOOTHING.face);
    }
    if ((_b = riggedFace == null ? void 0 : riggedFace.mouth) == null ? void 0 : _b.shape) {
      lerpBlendShape(vrm, "A", riggedFace.mouth.shape.A ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "E", riggedFace.mouth.shape.E ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "I", riggedFace.mouth.shape.I ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "O", riggedFace.mouth.shape.O ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "U", riggedFace.mouth.shape.U ?? 0, SMOOTHING.face);
    }
    if (riggedFace == null ? void 0 : riggedFace.pupil) {
      updateLookTarget(vrm, riggedFace.pupil.x, riggedFace.pupil.y);
    }
  }
  return performance.now() - start;
}
export {
  RIG_CONFIG,
  SIGNING_REST_POSE,
  applyPoseToVRM,
  enhanceHandWithSpread,
  getRenderVRM,
  lerpToRestPose,
  resetPose,
  rigFace,
  rigHands,
  rigPosition,
  rigRotation,
  rigUpperBody,
  setRenderVRM,
  setSpeedMultiplier,
  solveFingers,
  solvePalmOrientation
};
