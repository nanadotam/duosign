/**
 * index.extension.ts — Extension-safe re-export bundle entry point
 * =================================================================
 * This file is the esbuild entry point for the duosign-rig.module.js
 * bundle that runs inside the Chrome extension.
 *
 * What's included:
 *   - applyPoseToVRM     (pose frame → VRM bones, full finger solver)
 *   - rigUpperBody       (body/spine/arm rigging)
 *   - rigHands           (wrist + full finger articulation)
 *   - rigFace            (head rotation + neutral expression)
 *   - resetPose          (identity quaternion reset)
 *   - lerpToRestPose     (inter-sign settle animation)
 *   - setRenderVRM       (registers VRM for spring physics updates)
 *   - getRenderVRM
 *   - setSpeedMultiplier
 *   - RIG_CONFIG         (animation tuning constants)
 *
 * What's excluded:
 *   - React/Next.js/UI code
 *   - AvatarDebugOverlay (stubbed to no-op by the build script)
 *   - three / @pixiv/three-vrm (marked external — loaded by the extension separately)
 */

export { applyPoseToVRM } from "./applyPose";

export {
  RIG_CONFIG,
  setSpeedMultiplier,
  rigUpperBody,
  rigHands,
  rigFace,
  rigRotation,
  rigPosition,
  resetPose,
  lerpToRestPose,
  setRenderVRM,
  getRenderVRM,
  SIGNING_REST_POSE,
} from "./vrmRigger";

export {
  solveFingers,
  solvePalmOrientation,
  type Landmark3D,
  type FingerRotationMap,
} from "./fingerSolver";

export {
  enhanceHandWithSpread,
  type LandmarkPoint,
  type RiggedHandMap,
} from "./fingerSpread";
