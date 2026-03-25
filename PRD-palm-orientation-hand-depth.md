# PRD: Palm Orientation & Hand Z-Depth Implementation

**Project**: DuoSign
**Date**: 2026-03-25
**Status**: Proposal
**Target files**: `fingerSolver.ts`, `applyPose.ts`, `retargetConfig.ts`, `vrmRigger.ts`

---

## Feasibility Assessment

| Feature | Feasibility | What's Already There | What's Missing |
|---------|-------------|---------------------|----------------|
| Palm Orientation | **High — 70% done** | `computePalmFrame()` in `fingerSolver.ts` (lines 93–133) already computes `palmNormal` every frame | `palmNormal` is private and discarded after finger spread. Never used to drive wrist rotation |
| Hand Z-Depth | **Medium — data exists, not applied** | `poseWorldLandmarks` is already in `PoseFrameData` (poseReader.ts:13) and passed into `applyPose.ts` (line 182) | Wrist Z from landmarks 15/16 is never extracted or applied to any VRM bone. Backend TODO (applyPose.ts:180) notes some .pose files may not store world landmarks |

---

## What a Viewer Will See (Before vs. After)

### Feature 1: Palm Orientation

**Before**: Wrist rotation comes from Kalidokit `Hand.solve()`, which is weak on Z-axis (pronation/supination). The hand often looks "generic" regardless of what the sign requires.

**After — specific visible differences**:

| Sign | Before | After |
|------|--------|-------|
| **PLEASE** | Palm direction ambiguous, may look like SORRY | Palm clearly faces down/inward toward chest |
| **SORRY** | Indistinguishable from PLEASE in many cases | Palm faces body, circular motion clearly inward |
| **THANK YOU** | Generic forward motion, palm direction lost | Palm clearly faces outward from chin toward viewer |
| **STOP / WAIT** | Hand extends without palm-out signal | Palm faces directly toward viewer (flat wall) |
| **WANT** | Palms ambiguous | Both palms clearly face upward as hands pull back |
| **GIVE / OFFER** | Hand moves, palm direction flat | Palm-upward offering posture preserved through motion |
| **Any sign with palm rotation** | Wrist barely moves on roll axis | Wrist rolls visibly as palm turns in/out/up/down |

**In plain terms**: The wrists will actually rotate. Right now wrist roll (pronation/supination) is the weakest part of the animation. After this, you'll see the palm-turning motion that's fundamental to most ASL signs.

---

### Feature 2: Hand Z-Depth

**Before**: All hand positions appear at the same depth plane. Signs that reach forward or pull back look flat.

**After — specific visible differences**:

| Sign | Before | After |
|------|--------|-------|
| **FEEL / HEART / SORRY** | Hand hovers at mid-space, no body contact feel | Hand visually moves close to chest |
| **GIVE / SHOW / PRESENT** | Hand moves but no forward reach | Hand extends visibly forward in 3D space |
| **PUSH** | Stays flat, looks like a wave | Hand pushes out toward viewer, arm extends in Z |
| **PULL / COME** | Horizontal arm motion only | Hand starts extended forward, pulls back toward body |
| **Any spatial verb** | 2D plane movement only | Correct 3D arc — reaching out, pulling in |
| **THINK / KNOW (forehead)** | Same depth as FEEL (chest) | Forehead signs feel closer; depth layering correct |

**In plain terms**: The avatar will look like it's reaching in 3D space rather than gesturing on a flat vertical plane. This is the single biggest factor making sign language avatars look robotic — they're flat. This fixes that.

---

## Implementation Instructions

---

### FEATURE 1: Palm Orientation Vector → Wrist Pronation

#### Root Cause
`computePalmFrame()` in `fingerSolver.ts` computes `palmNormal` (the vector perpendicular to the palm surface) correctly every frame. It is **used only for finger spread projection** (line 186) then discarded. The wrist bone (`rightHand` / `leftHand`) gets its rotation from Kalidokit's `RightWrist`, which has reliable X (flexion) and Y (ulnar/radial deviation) but **unreliable Z (pronation/supination roll)**.

#### Step 1 — `vrmRigger.ts`: Add tuning constant to `RIG_CONFIG`

Inside the `RIG_CONFIG` object (after the `hand` block, around line 68), add:

```ts
palmOrientation: {
  pronationScale: 0.85,   // scale factor on palm-derived pronation angle (0–1)
                           // 1.0 = full palm normal drives wrist roll
                           // 0.85 = slight reduction to prevent overrotation
                           // Tune down if wrist snaps on fast signs
},
```

#### Step 2 — `fingerSolver.ts`: Export palm orientation solver

Add this exported function **after the closing brace of `computePalmFrame` (after line 133)**:

```ts
/**
 * Derive wrist pronation/supination angle from the palm normal vector.
 *
 * Returns the roll angle (radians) the wrist bone should be set to,
 * or null if landmarks are insufficient.
 *
 * How it works:
 *   - palmNormal points perpendicular to the palm surface
 *   - palmNormal.y ≈ +1 means palm faces up
 *   - palmNormal.y ≈ -1 means palm faces down
 *   - palmNormal.z ≈ +1 means palm faces toward camera (away from signer)
 *   - palmNormal.z ≈ -1 means palm faces away from camera (toward signer)
 *   - atan2(y, -z) converts this to a roll angle around the wrist-finger axis
 *
 * This replaces Kalidokit's RightWrist.z / LeftWrist.z which is unreliable
 * for the pronation/supination axis.
 */
export function solvePalmOrientation(
  landmarks: Landmark3D[],
  side: "Right" | "Left"
): number | null {
  const frame = computePalmFrame(landmarks, side);
  if (!frame) return null;
  const pronation = Math.atan2(frame.palmNormal.y, -frame.palmNormal.z);
  if (!Number.isFinite(pronation)) return null;
  return pronation;
}
```

#### Step 3 — `retargetConfig.ts`: Export the new scale constant

At the bottom of `retargetConfig.ts`, after the `INTER_SIGN_SETTLE_MS` line, add:

```ts
export const PALM_PRONATION_SCALE = RIG_CONFIG.palmOrientation.pronationScale;
```

#### Step 4 — `applyPose.ts`: Import and apply

At the top of the file, update the import from `fingerSolver`:

```ts
// Change:
import { solveFingers, type FingerRotationMap, type Landmark3D } from "./fingerSolver";
// To:
import { solveFingers, solvePalmOrientation, type FingerRotationMap, type Landmark3D } from "./fingerSolver";
```

Update the import from `retargetConfig` to include the new constant:

```ts
import {
  BONE_CLAMPS,
  HIPS_Y_OFFSET,
  PROPORTION_SCALE,
  SMOOTHING,
  PALM_PRONATION_SCALE,   // add this
  type BoneClamp,
} from "./retargetConfig";
```

In the **right hand block** (around lines 257–283), replace the `rightHand.RightWrist` application block with:

```ts
// Was:
if (rightHand.RightWrist) {
  lerpBone(
    vrm,
    "rightHand",
    scaleRotation(rightHand.RightWrist, PROPORTION_SCALE.armExtension),
    SMOOTHING.hand
  );
}

// Replace with:
if (rightHand.RightWrist) {
  const wristBase = scaleRotation(rightHand.RightWrist, PROPORTION_SCALE.armExtension);
  const palmRoll = solvePalmOrientation(frame.rightHandLandmarks as Landmark3D[], "Right");
  lerpBone(
    vrm,
    "rightHand",
    {
      x: wristBase.x,
      y: wristBase.y,
      z: palmRoll !== null ? palmRoll * PALM_PRONATION_SCALE : wristBase.z,
    },
    SMOOTHING.hand
  );
}
```

In the **left hand block** (around lines 285–310), do the same:

```ts
// Was:
if (leftHand.LeftWrist) {
  lerpBone(
    vrm,
    "leftHand",
    scaleRotation(leftHand.LeftWrist, PROPORTION_SCALE.armExtension),
    SMOOTHING.hand
  );
}

// Replace with:
if (leftHand.LeftWrist) {
  const wristBase = scaleRotation(leftHand.LeftWrist, PROPORTION_SCALE.armExtension);
  const palmRoll = solvePalmOrientation(frame.leftHandLandmarks as Landmark3D[], "Left");
  lerpBone(
    vrm,
    "leftHand",
    {
      x: wristBase.x,
      y: wristBase.y,
      z: palmRoll !== null ? palmRoll * PALM_PRONATION_SCALE : wristBase.z,
    },
    SMOOTHING.hand
  );
}
```

#### Tuning Notes for Feature 1
- If wrists snap or flip on fast signs → reduce `pronationScale` toward 0.6
- If palm rotation looks too subtle → increase toward 1.0
- If palm direction looks inverted on one hand → negate `palmRoll` for that side
- The `palmRoll !== null ? ... : wristBase.z` fallback means Kalidokit still covers frames where hand landmarks are lost

---

### FEATURE 2: Hand Z-Depth from Pose World Landmarks

#### Root Cause
`poseWorldLandmarks` are 3D metric-space landmarks (in meters). Wrist positions:
- Landmark 15 = LEFT_WRIST world position (x, y, z in meters)
- Landmark 16 = RIGHT_WRIST world position

Landmark 11 = LEFT_SHOULDER, 12 = RIGHT_SHOULDER.

Currently `applyPose.ts` passes `poseWorldLandmarks` to Kalidokit but **never reads wrist Z** from them directly. Hips Z scale is 0.22 (line 103 in vrmRigger.ts) which is intentionally small and does not represent wrist depth.

The Z depth of each wrist relative to its shoulder = `wrist.z - shoulder.z`. In MediaPipe world space:
- Negative Z = in front of the body (reaching forward)
- Positive Z = behind the shoulder

We apply this as a local Z position offset on the `RightHand` / `LeftHand` bone.

**Important caveat**: Some .pose binaries may have `poseWorldLandmarks = null` due to the TODO at applyPose.ts:180 (world landmarks not stored in all .pose files). The implementation must null-check and gracefully skip.

#### Step 1 — `vrmRigger.ts`: Add depth tuning constant to `RIG_CONFIG`

Inside `RIG_CONFIG`, after `proportionScale`, add:

```ts
handDepth: {
  scale: 0.35,        // how much of the world-space Z offset transfers to VRM (meters → VRM units)
                       // Start at 0.35. If hands phase through body → reduce.
                       // If depth looks too subtle → increase toward 0.5
  clamp: 0.4,         // maximum Z offset in VRM units (prevents extreme reaching)
},
```

#### Step 2 — `retargetConfig.ts`: Export the new constants

```ts
export const HAND_DEPTH_SCALE = RIG_CONFIG.handDepth.scale;
export const HAND_DEPTH_CLAMP = RIG_CONFIG.handDepth.clamp;
```

#### Step 3 — `applyPose.ts`: Import and apply

Add to the `retargetConfig` import:

```ts
import {
  BONE_CLAMPS,
  HIPS_Y_OFFSET,
  PROPORTION_SCALE,
  SMOOTHING,
  PALM_PRONATION_SCALE,
  HAND_DEPTH_SCALE,     // add
  HAND_DEPTH_CLAMP,     // add
  type BoneClamp,
} from "./retargetConfig";
```

After the hips world position block (after line ~208, after the `if (hipsNode && hipsWorld)` block closes), add a new block inside the outer `if (frame.poseWorldLandmarks)` scope:

```ts
// Hand Z-depth from world landmarks
// poseWorldLandmarks[15] = left wrist, [16] = right wrist (metric 3D)
// poseWorldLandmarks[11] = left shoulder, [12] = right shoulder
const wlm = frame.poseWorldLandmarks;

const rightWristWorld  = wlm[16];
const rightShoulderWorld = wlm[12];
if (rightWristWorld && rightShoulderWorld) {
  // Depth relative to shoulder (negative = reaching forward)
  const rawDepth = (rightWristWorld.z - rightShoulderWorld.z) * HAND_DEPTH_SCALE;
  const clampedDepth = Math.max(-HAND_DEPTH_CLAMP, Math.min(HAND_DEPTH_CLAMP, rawDepth));
  const rightHandBone = getBoneNode(vrm, "rightHand");
  if (rightHandBone) {
    rightHandBone.position.z = THREE.MathUtils.lerp(
      rightHandBone.position.z,
      clampedDepth,
      SMOOTHING.hand
    );
  }
}

const leftWristWorld   = wlm[15];
const leftShoulderWorld = wlm[11];
if (leftWristWorld && leftShoulderWorld) {
  const rawDepth = (leftWristWorld.z - leftShoulderWorld.z) * HAND_DEPTH_SCALE;
  const clampedDepth = Math.max(-HAND_DEPTH_CLAMP, Math.min(HAND_DEPTH_CLAMP, rawDepth));
  const leftHandBone = getBoneNode(vrm, "leftHand");
  if (leftHandBone) {
    leftHandBone.position.z = THREE.MathUtils.lerp(
      leftHandBone.position.z,
      clampedDepth,
      SMOOTHING.hand
    );
  }
}
```

#### Step 4 — `applyPose.ts`: Reset hand Z in rest pose

When `lerpToRestPose` runs between signs, the hand bones' `.position.z` offset should return to 0. This is currently handled by `SIGNING_REST_POSE` rotations but **not positions**.

At the very end of the `if (frame.poseWorldLandmarks)` null check (or in a separate utility), ensure the position resets when world landmarks are absent:

```ts
// If no world landmarks available, reset hand depth to neutral
if (!frame.poseWorldLandmarks) {
  const rh = getBoneNode(vrm, "rightHand");
  const lh = getBoneNode(vrm, "leftHand");
  if (rh) rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0, SMOOTHING.hand);
  if (lh) lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0, SMOOTHING.hand);
}
```

#### Tuning Notes for Feature 2
- If hands clip through the torso on body-contact signs → reduce `scale` or `clamp`
- If depth is barely noticeable → increase `scale` toward 0.5
- If motion feels jittery → reduce `SMOOTHING.hand` only for the position lerp (can split into a separate `handDepth` lerp value)
- Z-depth effect is most visible on signs like GIVE, PUSH, PULL, COME and body-contact signs like FEEL, HEART, PLEASE

---

## Backend Consideration (Prerequisite for Feature 2 on pose engine path)

The comment at `applyPose.ts:180` says:
> TODO: re-run offline pipeline to store POSE_WORLD_LANDMARKS separately so shoulder and torso rotation compute correctly from true 3D metric space.

This means: for .pose files that were processed before world landmarks were stored, `frame.poseWorldLandmarks` will be `null`, and Feature 2 will silently skip (graceful fallback, no errors).

**To get Feature 2 working on all pre-recorded signs**: re-run `wlasl_pose_pipeline.py` to regenerate .pose files with `POSE_WORLD_LANDMARKS` stored. This is a backend-only change with no frontend code impact.

Check whether world landmarks are present by inspecting a sample .pose file — the `[PoseReader]` console log in `poseReader.ts` (line 58) prints component names and point counts. If `POSE_WORLD_LANDMARKS` appears with 33 points, it's working.

---

## File Change Summary

| File | Change | Lines affected |
|------|--------|----------------|
| `vrmRigger.ts` | Add `palmOrientation` and `handDepth` blocks to `RIG_CONFIG` | After line 68, after line 105 |
| `retargetConfig.ts` | Export `PALM_PRONATION_SCALE`, `HAND_DEPTH_SCALE`, `HAND_DEPTH_CLAMP` | Bottom of file |
| `fingerSolver.ts` | Add exported `solvePalmOrientation()` function | After line 133 |
| `applyPose.ts` | Update imports; replace wrist Z with palm-derived roll; add hand Z-depth block | Lines 5–14, 263–280, 285–308, after 208 |

No new files. No new dependencies. No backend changes required for Feature 1. Feature 2 works immediately on any .pose file that contains world landmarks; degrades gracefully on those that don't.

---

## Suggested Implementation Order

1. **Feature 1 first** — pure frontend, self-contained, highest visual impact per line of code
2. **Feature 2 frontend code** — add the block, test with any sign that has world landmarks
3. **Backend re-pipeline** — regenerate .pose files to unlock Feature 2 for all signs

---

## Testing Checklist

### Feature 1
- [ ] PLEASE: palm should clearly face down/inward
- [ ] SORRY: palm should face body (different from PLEASE)
- [ ] THANK YOU: palm faces outward from chin
- [ ] STOP: palm faces viewer (wall-stop gesture)
- [ ] WANT: palms face upward
- [ ] Watch for wrist flipping on fast signs — reduce `pronationScale` if it occurs

### Feature 2
- [ ] GIVE: hand extends visibly forward
- [ ] FEEL / HEART: hand stays close to chest depth
- [ ] PUSH: hand pushes toward viewer in Z
- [ ] COME: hand starts forward, pulls back
- [ ] Hands should not clip through torso on body-contact signs
- [ ] Check `[PoseReader]` console log to confirm `POSE_WORLD_LANDMARKS: 33 points` is present
