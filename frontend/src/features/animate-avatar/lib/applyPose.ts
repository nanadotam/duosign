import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";
import { VRMSchema } from "@pixiv/three-vrm";
import type { PoseFrameData } from "./poseReader";
import {
  BONE_CLAMPS,
  HIPS_Y_OFFSET,
  PROPORTION_SCALE,
  SMOOTHING,
  type BoneClamp,
} from "./retargetConfig";
import { FINGER_VRM_BONES } from "./fingerConfig";
import { solveFingers, type FingerRotationMap, type Landmark3D } from "./fingerSolver";
import { enhanceHandWithSpread, type LandmarkPoint } from "./fingerSpread";
import { syncAvatarDebugOverlay } from "../ui/AvatarDebugOverlay";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KalidokitModule = any;

interface ApplyPoseOptions {
  imageSize?: { width: number; height: number };
  smoothing?: number;
}

type Rotation = { x: number; y: number; z: number };
type HandRig = Record<string, Rotation>;

const BONE_NAME_MAP: Record<string, keyof typeof VRMSchema.HumanoidBoneName> = {
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
  leftLittleDistal: "LeftLittleDistal",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _activeVRM: VRM | null = null;
const previousFingerRotations: Partial<Record<"Right" | "Left", FingerRotationMap>> = {};
const oldLookTarget = new THREE.Euler();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function applyClamp(rotation: Rotation, boneName: string): Rotation {
  const def: BoneClamp | undefined = BONE_CLAMPS[boneName];
  if (!def) return rotation;

  return {
    x: def.x ? clamp(rotation.x, def.x[0], def.x[1]) : rotation.x,
    y: def.y ? clamp(rotation.y, def.y[0], def.y[1]) : rotation.y,
    z: def.z ? clamp(rotation.z, def.z[0], def.z[1]) : rotation.z,
  };
}

function getBoneNode(vrm: VRM, boneName: string) {
  const schemaKey = BONE_NAME_MAP[boneName];
  if (!schemaKey) return null;
  const humanBoneName = VRMSchema.HumanoidBoneName[schemaKey];
  if (!humanBoneName) return null;
  return vrm.humanoid?.getBoneNode(humanBoneName) ?? null;
}

function lerpBone(vrm: VRM, boneName: string, target: Rotation, smoothing: number): void {
  const bone = getBoneNode(vrm, boneName);
  if (!bone) return;

  const clamped = applyClamp(target, boneName);
  bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, clamped.x, smoothing);
  bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, clamped.y, smoothing);
  bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, clamped.z, smoothing);
}

function lerpBlendShape(vrm: VRM, presetName: string, target: number, smoothing: number): void {
  const blendShape = vrm.blendShapeProxy;
  if (!blendShape) return;
  const preset = VRMSchema.BlendShapePresetName[presetName as keyof typeof VRMSchema.BlendShapePresetName];
  if (!preset) return;
  const current = blendShape.getValue(preset) ?? 0;
  blendShape.setValue(preset, THREE.MathUtils.lerp(current, target, smoothing));
}

function scaleRotation(rotation: Rotation, scale: number): Rotation {
  return {
    x: rotation.x * scale,
    y: rotation.y * scale,
    z: rotation.z * scale,
  };
}

function applyFingers(
  vrm: VRM,
  landmarks: Landmark3D[],
  side: "Left" | "Right"
): void {
  const rotations = solveFingers(landmarks, side, previousFingerRotations[side]);
  previousFingerRotations[side] = rotations;

  for (const [fingerName, [mcp, pip, dip]] of Object.entries(rotations)) {
    const [proximalName, intermediateName, distalName] =
      FINGER_VRM_BONES[fingerName as keyof typeof FINGER_VRM_BONES][side];

    lerpBone(vrm, proximalName, { x: 0, y: mcp.spread, z: mcp.flexion }, SMOOTHING.fingers);
    lerpBone(vrm, intermediateName, { x: 0, y: 0, z: pip.flexion }, SMOOTHING.fingers);
    lerpBone(vrm, distalName, { x: 0, y: 0, z: dip.flexion }, SMOOTHING.fingers);
  }
}

function updateLookTarget(vrm: VRM, x: number, y: number): void {
  const lookTarget = new THREE.Euler(
    THREE.MathUtils.lerp(oldLookTarget.x, y, SMOOTHING.face),
    THREE.MathUtils.lerp(oldLookTarget.y, x, SMOOTHING.face),
    0,
    "XYZ"
  );
  oldLookTarget.copy(lookTarget);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vrm.lookAt as any)?.applyer?.lookAt(lookTarget);
}

export function applyPoseToVRM(
  vrm: VRM,
  frame: PoseFrameData,
  kalidokit: KalidokitModule,
  options: ApplyPoseOptions = {}
): number {
  const start = performance.now();
  const imageSize = options.imageSize ?? { width: 1280, height: 720 };
  _activeVRM = vrm;
  syncAvatarDebugOverlay(vrm);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let riggedPose: any;

  if (frame.poseLandmarks) {
    // First arg: 3D world-space landmarks (metric space, used for depth/shoulder rotation).
    // Second arg: 2D screen-space landmarks (normalized 0–1, used for 2D positions).
    //
    // If POSE_WORLD_LANDMARKS were stored in the .pose binary, use them.
    // Otherwise, fall back to poseLandmarks with z=0 — this is still better than
    // passing the same array twice because it signals to Kalidokit that the world
    // arg is flat, preventing incorrect depth assumptions.
    //
    // TODO: re-run offline pipeline to store POSE_WORLD_LANDMARKS separately so
    // shoulder and torso rotation compute correctly from true 3D metric space.
    const worldLandmarks = frame.poseWorldLandmarks
      ?? frame.poseLandmarks.map((lm) => ({ ...lm, z: 0 }));

    riggedPose = kalidokit.Pose.solve(
      worldLandmarks,         // 3D world-space (or flat approximation)
      frame.poseLandmarks,    // 2D screen-space
      {
        runtime: "mediapipe",
        imageSize,
        enableLegs: false,
      }
    );

    if (riggedPose) {
      const hipsNode = getBoneNode(vrm, "hips");
      const hipsWorld = riggedPose.Hips?.worldPosition as Rotation | undefined;

      if (hipsNode && hipsWorld) {
        hipsNode.position.lerp(
          new THREE.Vector3(
            hipsWorld.x * PROPORTION_SCALE.hipsWorldPosition.x,
            hipsWorld.y * PROPORTION_SCALE.hipsWorldPosition.y + HIPS_Y_OFFSET,
            hipsWorld.z * PROPORTION_SCALE.hipsWorldPosition.z
          ),
          SMOOTHING.hips
        );
      }

      if (riggedPose.Hips?.rotation) {
        lerpBone(vrm, "hips", riggedPose.Hips.rotation, SMOOTHING.hips);
      }

      if (riggedPose.Spine) {
        lerpBone(vrm, "spine", riggedPose.Spine, SMOOTHING.spine);
        lerpBone(vrm, "chest", riggedPose.Spine, SMOOTHING.spine);
      }

      if (riggedPose.RightUpperArm) {
        lerpBone(
          vrm,
          "rightUpperArm",
          scaleRotation(riggedPose.RightUpperArm, PROPORTION_SCALE.armExtension),
          SMOOTHING.upperArm
        );
      }

      if (riggedPose.LeftUpperArm) {
        lerpBone(
          vrm,
          "leftUpperArm",
          scaleRotation(riggedPose.LeftUpperArm, PROPORTION_SCALE.armExtension),
          SMOOTHING.upperArm
        );
      }

      if (riggedPose.RightLowerArm) {
        lerpBone(
          vrm,
          "rightLowerArm",
          scaleRotation(riggedPose.RightLowerArm, PROPORTION_SCALE.armExtension),
          SMOOTHING.lowerArm
        );
      }

      if (riggedPose.LeftLowerArm) {
        lerpBone(
          vrm,
          "leftLowerArm",
          scaleRotation(riggedPose.LeftLowerArm, PROPORTION_SCALE.armExtension),
          SMOOTHING.lowerArm
        );
      }
    }
  }

  if (frame.rightHandLandmarks) {
    const rawRightHand = kalidokit.Hand.solve(frame.rightHandLandmarks, "Right") as HandRig | null;
    // Augment with Y-axis spread computed from raw landmarks (partial Kalidokit mitigation)
    const rightHand = rawRightHand
      ? enhanceHandWithSpread(rawRightHand, frame.rightHandLandmarks as LandmarkPoint[], "Right")
      : null;
    if (rightHand) {
      if (rightHand.RightWrist) {
        lerpBone(
          vrm,
          "rightHand",
          scaleRotation(rightHand.RightWrist, PROPORTION_SCALE.armExtension),
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
    applyFingers(vrm, frame.rightHandLandmarks as Landmark3D[], "Right");
  }

  if (frame.leftHandLandmarks) {
    const rawLeftHand = kalidokit.Hand.solve(frame.leftHandLandmarks, "Left") as HandRig | null;
    const leftHand = rawLeftHand
      ? enhanceHandWithSpread(rawLeftHand, frame.leftHandLandmarks as LandmarkPoint[], "Left")
      : null;
    if (leftHand) {
      if (leftHand.LeftWrist) {
        lerpBone(
          vrm,
          "leftHand",
          scaleRotation(leftHand.LeftWrist, PROPORTION_SCALE.armExtension),
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
    applyFingers(vrm, frame.leftHandLandmarks as Landmark3D[], "Left");
  }

  if (frame.faceLandmarks) {
    const riggedFace = kalidokit.Face.solve(frame.faceLandmarks, {
      runtime: "mediapipe",
      imageSize,
      smoothBlink: true,
      blinkSettings: [0.3, 0.7],
    });

    if (riggedFace?.head) {
      lerpBone(vrm, "head", riggedFace.head, SMOOTHING.head);
    }

    if (riggedFace?.eye && riggedFace?.head) {
      const eyes = kalidokit.Face.stabilizeBlink(
        { r: riggedFace.eye.r, l: riggedFace.eye.l },
        riggedFace.head.y,
        { maxRot: 0.5 }
      );
      lerpBlendShape(vrm, "Blink", 1 - eyes.l, SMOOTHING.face);
    }

    if (riggedFace?.mouth?.shape) {
      lerpBlendShape(vrm, "A", riggedFace.mouth.shape.A ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "E", riggedFace.mouth.shape.E ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "I", riggedFace.mouth.shape.I ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "O", riggedFace.mouth.shape.O ?? 0, SMOOTHING.face);
      lerpBlendShape(vrm, "U", riggedFace.mouth.shape.U ?? 0, SMOOTHING.face);
    }

    if (riggedFace?.pupil) {
      updateLookTarget(vrm, riggedFace.pupil.x, riggedFace.pupil.y);
    }
  }

  return performance.now() - start;
}
