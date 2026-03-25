# DuoSign — Production Avatar Animation PRD
## Complete Engineering Requirements for Claude Code

**Version:** 1.0  
**Date:** 2026-03-20  
**Author:** Nana Kwaku Amoako  
**Repo root:** `/Users/nanaamoako/Desktop/duosign`  
**Stack:** Next.js 14 · TypeScript · @pixiv/three-vrm 0.6.11 (VRM 0.x) · Kalidokit 1.1.5 · MediaPipe Tasks Vision · Three.js 0.137.4  

---

## How to Use This Document

This document is a complete, self-contained specification for an AI coding agent operating with full filesystem access on the local machine. Every section specifies:

- **Which file** to create or modify (full path from repo root)
- **What currently exists** in that file (so the agent can locate insertion points)
- **Exactly what to change** and why
- **What to verify** after the change

Work through sections **in order**. Do not skip ahead. Each section is independent enough to test before proceeding. After each section, run the verification command and confirm it passes before moving to the next.

If any step produces a TypeScript error, fix the error before proceeding. Do not suppress errors with `// @ts-ignore` or `as any` unless the existing code already uses that pattern.

---

## Section 0: Pre-flight — Read and Understand the Codebase

Before making any changes, confirm these files exist and are readable:

```bash
ls /Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/lib/vrmRigger.ts
ls /Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/model/useVideoEngine.ts
ls /Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/model/usePosePlayer.ts
ls /Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/ui/AvatarCanvas.tsx
ls /Users/nanaamoako/Desktop/duosign/frontend/src/shared/hooks/useSettings.tsx
ls /Users/nanaamoako/Desktop/duosign/frontend/src/shared/constants/index.ts
```

Confirm the VRM version in package.json:
```bash
cat /Users/nanaamoako/Desktop/duosign/frontend/package.json | grep three-vrm
# Expected: "@pixiv/three-vrm": "0.6.11"
```

This is **VRM 0.x spec**. The correct APIs are:
- `vrm.humanoid?.getBoneNode(VRMSchema.HumanoidBoneName[key])` — NOT `getNormalizedBoneNode`
- `vrm.blendShapeProxy` — NOT `vrm.expressionManager`
- `node.quaternion.slerp(quaternion, t)` — quaternion slerp, not euler lerp
- `VRMSchema.HumanoidBoneName` enum for bone names
- `VRMSchema.BlendShapePresetName` for expressions

All code written in this PRD must use the 0.x API. Any 1.x API will silently fail.

---

## Section 1: Central Rig Configuration Object

### What this fixes
Every animation quality parameter in the codebase is currently a hardcoded magic number scattered across `vrmRigger.ts`. The spine dampener is `0.25`, arms are `1.0`, lerp is `0.3` everywhere. There is no way to tune these without hunting through the file. This section creates a single exported config object at the top of the file that controls everything.

### File to modify
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/lib/vrmRigger.ts
```

### Current state of the file
The file begins with imports and a `lerp` helper function, then `rigRotation`, `rigPosition`, `rigUpperBody`, etc. There is no config object.

### What to add

Insert the following block **after the imports and before the `lerp` helper**, as the first substantive code in the file:

```typescript
// ── Animation Rig Configuration ─────────────────────────────────────
//
// All tunable parameters live here. Edit these values to change
// how the avatar moves — no other code changes needed.
//
// dampener: scales how much of the source motion transfers (0–1).
//   1.0 = full transfer, 0.5 = half amplitude, 0.25 = very subtle
// lerp: controls response speed (0–1).
//   0.1 = very slow/smooth, 0.5 = moderate, 0.9 = near-instant/crisp
//
// ASL signing context:
//   - Core body (hips/spine) should be slow and stable
//   - Arms need moderate response to follow arc paths naturally
//   - Hands/wrists need faster response to hit signing targets
//   - Fingers need the fastest response — handshapes are crisp, not blurry
//   - Head should be slow and deliberate (head nods in ASL are meaningful)

export const RIG_CONFIG = {
  hips: {
    dampener: 0.7,
    lerp: 0.12,      // very slow — core body barely moves during signing
  },
  chest: {
    dampener: 0.25,
    lerp: 0.15,      // subtle torso lean
  },
  spine: {
    dampener: 0.45,
    lerp: 0.15,
  },
  upperArm: {
    dampener: 1.0,
    lerp: 0.35,      // arms follow arc paths — moderate smoothing
  },
  lowerArm: {
    dampener: 1.0,
    lerp: 0.4,       // forearm slightly faster than upper arm
  },
  hand: {
    dampener: 1.0,
    lerp: 0.6,       // wrists respond faster — need to hit signing targets
  },
  finger: {
    dampener: 1.0,
    lerp: 0.75,      // fingers snap quickly — handshapes are crisp in ASL
  },
  thumb: {
    dampener: 1.0,
    lerp: 0.7,
  },
  neck: {
    dampener: 0.7,
    lerp: 0.15,      // head nods are slow and deliberate in ASL grammar
  },
};

// Speed multiplier applied from user settings (animationSpeed / 100).
// Default is 1.0. At 0.5x speed, lerp values are halved (smoother).
// At 2.0x, lerp values are doubled (snappier).
// Clamped to [0.5, 2.0] to prevent extreme values.
export let speedMultiplier = 1.0;

export function setSpeedMultiplier(m: number): void {
  speedMultiplier = Math.max(0.5, Math.min(2.0, m));
}

/** Compute effective lerp amount for a region, scaled by speed multiplier */
function effectiveLerp(base: number): number {
  return Math.min(1.0, base * speedMultiplier);
}
```

### What to change in `rigRotation`

Find the existing `rigRotation` function. Its current signature is:
```typescript
export function rigRotation(
  vrm: VRM,
  boneName: string,
  rotation: { x: number; y: number; z: number },
  dampener = 1,
  lerpAmount = 0.3
): void {
```

Replace the entire `rigRotation` function body with this updated version that uses `effectiveLerp`:

```typescript
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
  // Apply speed multiplier to lerp amount
  node.quaternion.slerp(quaternion, effectiveLerp(lerpAmount));
}
```

### What to change in `rigUpperBody`

Find `rigUpperBody`. Replace the hardcoded dampener/lerp values with `RIG_CONFIG` values:

```typescript
export function rigUpperBody(vrm: VRM, riggedPose: RiggedPose): void {
  rigRotation(vrm, "Hips",  riggedPose.Hips.rotation, RIG_CONFIG.hips.dampener,  RIG_CONFIG.hips.lerp);
  rigRotation(vrm, "Chest", riggedPose.Spine,          RIG_CONFIG.chest.dampener, RIG_CONFIG.chest.lerp);
  rigRotation(vrm, "Spine", riggedPose.Spine,          RIG_CONFIG.spine.dampener, RIG_CONFIG.spine.lerp);
  rigRotation(vrm, "RightUpperArm", riggedPose.RightUpperArm, RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "RightLowerArm", riggedPose.RightLowerArm, RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
  rigRotation(vrm, "LeftUpperArm",  riggedPose.LeftUpperArm,  RIG_CONFIG.upperArm.dampener, RIG_CONFIG.upperArm.lerp);
  rigRotation(vrm, "LeftLowerArm",  riggedPose.LeftLowerArm,  RIG_CONFIG.lowerArm.dampener, RIG_CONFIG.lowerArm.lerp);
}
```

### What to change in `rigHands`

Find `rigHands`. Update all bone applications to use `RIG_CONFIG`:

```typescript
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
    }, RIG_CONFIG.hand.dampener, RIG_CONFIG.hand.lerp);

    for (const bone of FINGER_BONES) {
      const key = `Left${bone}`;
      if (riggedLeftHand[key]) {
        // Thumbs use thumb lerp, all others use finger lerp
        const cfg = bone.startsWith("Thumb") ? RIG_CONFIG.thumb : RIG_CONFIG.finger;
        rigRotation(vrm, key, riggedLeftHand[key], cfg.dampener, cfg.lerp);
      }
    }
  }

  if (riggedRightHand) {
    rigRotation(vrm, "RightHand", {
      z: riggedPose.RightHand.z,
      y: riggedRightHand.RightWrist?.y ?? 0,
      x: riggedRightHand.RightWrist?.x ?? 0,
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
```

### What to change in `rigFace`

Replace `rigFace` entirely. Keep head rotation (neck), remove all blendshape expression calls, keep a neutral locked expression:

```typescript
export function rigFace(vrm: VRM, riggedFace: RiggedFace): void {
  // Head rotation — slow and deliberate (ASL uses head nods grammatically)
  rigRotation(vrm, "Neck", riggedFace.head, RIG_CONFIG.neck.dampener, RIG_CONFIG.neck.lerp);

  // Lock expression to a neutral slight smile — no dynamic expressions
  // This is intentional: VRM facial blendshapes are a separate development track.
  // The avatar will tilt its head in the direction of the source signer
  // but always maintain a composed, neutral expression.
  const blendshape = vrm.blendShapeProxy;
  if (!blendshape) return;

  const PresetName = VRMSchema.BlendShapePresetName;

  // Gentle neutral smile — locked, never changes
  blendshape.setValue(PresetName.Joy, 0.15);

  // Eyes open — never blink during signing (prevents distraction)
  blendshape.setValue(PresetName.Blink, 0);
  blendshape.setValue(PresetName.BlinkL, 0);
  blendshape.setValue(PresetName.BlinkR, 0);

  // Mouth closed — no visemes during signing
  blendshape.setValue(PresetName.A, 0);
  blendshape.setValue(PresetName.I, 0);
  blendshape.setValue(PresetName.U, 0);
  blendshape.setValue(PresetName.E, 0);
  blendshape.setValue(PresetName.O, 0);
}
```

### Verification

```bash
cd /Users/nanaamoako/Desktop/duosign/frontend
npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -20
```

Expected: zero errors from the files modified. If there are errors, fix them before proceeding.

---

## Section 2: Fix the Hand Swap Bug in usePosePlayer

### What this fixes

In `usePosePlayer.ts`, the hands are passed to Kalidokit with the wrong side labels. The current broken code:

```typescript
// WRONG — this produces mirrored/wrong handshapes in pose fallback
const leftHand = frame.rightHandLandmarks
  ? Kalidokit.Hand.solve(frame.rightHandLandmarks, "Left")
  : null;
const rightHand = frame.leftHandLandmarks
  ? Kalidokit.Hand.solve(frame.leftHandLandmarks, "Right")
  : null;
```

The video engine (`useVideoEngine.ts`) correctly handles this by swapping during result extraction because MediaPipe labels hands from the camera's perspective. The pose engine must do the same — use `rightHandLandmarks` for `"Right"` and `leftHandLandmarks` for `"Left"`.

### File to modify
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/model/usePosePlayer.ts
```

### Find this block (inside `applyFrame`)

```typescript
// Solve and apply hands
const leftHand = frame.rightHandLandmarks
  ? Kalidokit.Hand.solve(frame.rightHandLandmarks, "Left")
  : null;
const rightHand = frame.leftHandLandmarks
  ? Kalidokit.Hand.solve(frame.leftHandLandmarks, "Right")
  : null;
```

### Replace with

```typescript
// Hand solve — use landmarks with their correct side.
// The .pose files store landmarks with their actual handedness
// (MediaPipe's perspective-based labeling is already resolved during extraction).
// RIGHT hand landmarks → solve as "Right"
// LEFT hand landmarks  → solve as "Left"
const rightHand = frame.rightHandLandmarks
  ? Kalidokit.Hand.solve(frame.rightHandLandmarks, "Right")
  : null;
const leftHand = frame.leftHandLandmarks
  ? Kalidokit.Hand.solve(frame.leftHandLandmarks, "Left")
  : null;
```

### Also fix the Pose.solve call in the same function

Find this block:
```typescript
const riggedPose = Kalidokit.Pose.solve(
  frame.poseLandmarks,
  frame.poseLandmarks,
  { runtime: "mediapipe" }
);
```

`Pose.solve` requires world-space 3D landmarks as the FIRST argument. The pose file includes `poseLandmarks` (2D image-space) but NOT `poseWorldLandmarks` separately — they are embedded in the binary. The current parser extracts only `poseLandmarks`. Since world landmarks are not separately available from the current parser, pass `null` guard:

```typescript
// Pose.solve(world3D, image2D, options)
// If we don't have separate world landmarks, we approximate using
// the same landmark set — this is the same data, so upper-body rotation
// will be less accurate than the video engine but still functional.
// TODO: Update parsePoseFile() to separately extract POSE_WORLD_LANDMARKS
const riggedPose = frame.poseLandmarks
  ? Kalidokit.Pose.solve(
      frame.poseLandmarks,   // world3D (approximated — same as 2D for now)
      frame.poseLandmarks,   // image2D
      { runtime: "mediapipe", enableLegs: false }
    )
  : null;

if (riggedPose) {
  rigUpperBody(vrm, riggedPose);
  rigHands(vrm, leftHand, rightHand, riggedPose);
}
```

### Verification

```bash
cd /Users/nanaamoako/Desktop/duosign/frontend
npx tsc --noEmit 2>&1 | grep "usePosePlayer" | head -10
```

Expected: no errors on usePosePlayer.ts.

---

## Section 3: Wire animationSpeed from Settings into the Renderer

### What this fixes

`AppSettings.animationSpeed` already exists (50–200 range), already persists to localStorage, already has a slider in the settings page. It is completely disconnected from the animation engine. This section wires it through.

### File to create
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/lib/rigConfigSync.ts
```

### Contents

```typescript
/**
 * rigConfigSync — Sync AppSettings.animationSpeed into the rig config
 * ====================================================================
 * Call syncRigSpeed(settings.animationSpeed) whenever settings change.
 * animationSpeed is 50–200 (percentage). Divide by 100 → 0.5–2.0 multiplier.
 *
 * What the multiplier does:
 *   0.5x = lerp values halved → very smooth/dreamlike motion
 *   1.0x = default — balanced for ASL signing
 *   1.5x = snappier — useful for fast signers
 *   2.0x = near-instant — crisp handshapes, robotic feel
 */

import { setSpeedMultiplier } from "./vrmRigger";

export function syncRigSpeed(animationSpeed: number): void {
  // animationSpeed: 50–200 → multiplier: 0.5–2.0
  const multiplier = animationSpeed / 100;
  setSpeedMultiplier(multiplier);
}
```

### File to modify: `AvatarCanvas.tsx`

```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/ui/AvatarCanvas.tsx
```

Find the import block at the top of `AvatarCanvas.tsx`. Add this import:

```typescript
import { syncRigSpeed } from "../lib/rigConfigSync";
```

Also add this import for settings:
```typescript
import { useSettings } from "@/shared/hooks/useSettings";
```

Inside the `AvatarCanvas` component function, after the existing hooks, add:

```typescript
const { settings } = useSettings();

// Sync animation speed from settings into the rig config whenever it changes
useEffect(() => {
  syncRigSpeed(settings.animationSpeed);
}, [settings.animationSpeed]);
```

### Verification

Open DuoSign in the browser. Go to Settings. Change the animation speed slider. Translate "HELLO MY NAME IS" and play. The avatar's motion should be noticeably different at 50% (very smooth) vs 200% (snappy). Log to confirm in browser console:

```javascript
// In browser console:
// Change speed to 200 in settings, then check:
// The fingers should snap to handshapes much faster than at 50
```

---

## Section 4: Arm Rotation Clamps

### What this fixes

When certain signs involve the arm rotating toward the body center, the avatar's arm can pass through the torso. This is because `rigRotation` applies Kalidokit's output directly with no anatomical limits. This section adds a clamping layer inside `rigRotation`.

### File to modify
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/lib/vrmRigger.ts
```

Add these clamp constants to the `RIG_CONFIG` object you created in Section 1, after `neck`:

```typescript
  // Arm rotation limits (radians) — prevent arms crossing body center
  // These are anatomical limits derived from human range-of-motion.
  // Z axis on upper arms: negative = toward body center, positive = away
  // Tighten rightUpperArm.zMin if crossing still occurs
  // Loosen if head/chest-level signs look constrained
  armClamps: {
    rightUpperArm: { zMin: -0.35, zMax: Math.PI, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    leftUpperArm:  { zMin: -Math.PI, zMax: 0.35, xMin: -Math.PI / 2, xMax: Math.PI / 2 },
    rightLowerArm: { xMin: -Math.PI * 0.9, xMax: 0.1 },
    leftLowerArm:  { xMin: -Math.PI * 0.9, xMax: 0.1 },
  },
```

Add a clamp utility function **before** `rigRotation`:

```typescript
function clampRotation(
  rotation: { x: number; y: number; z: number },
  boneName: string
): { x: number; y: number; z: number } {
  const clamps = RIG_CONFIG.armClamps as Record<string, {
    xMin?: number; xMax?: number;
    yMin?: number; yMax?: number;
    zMin?: number; zMax?: number;
  }>;

  // Convert PascalCase bone name to camelCase for lookup
  const key = boneName.charAt(0).toLowerCase() + boneName.slice(1);
  const c = clamps[key];
  if (!c) return rotation;

  return {
    x: c.xMin !== undefined ? Math.max(c.xMin, Math.min(c.xMax ?? Infinity, rotation.x)) : rotation.x,
    y: c.yMin !== undefined ? Math.max(c.yMin, Math.min(c.yMax ?? Infinity, rotation.y)) : rotation.y,
    z: c.zMin !== undefined ? Math.max(c.zMin, Math.min(c.zMax ?? Infinity, rotation.z)) : rotation.z,
  };
}
```

In `rigRotation`, apply the clamp after dampener scaling, before slerp:

```typescript
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

  // Scale by dampener first, then clamp to anatomical limits
  const scaled = {
    x: rotation.x * dampener,
    y: rotation.y * dampener,
    z: rotation.z * dampener,
  };
  const clamped = clampRotation(scaled, boneName);

  const euler = new THREE.Euler(clamped.x, clamped.y, clamped.z);
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  node.quaternion.slerp(quaternion, effectiveLerp(lerpAmount));
}
```

### Verification

```bash
cd /Users/nanaamoako/Desktop/duosign/frontend
npx tsc --noEmit 2>&1 | grep "vrmRigger" | head -10
```

Test visually: translate "MY NAME IS" and play. The signing arm should not pass through the avatar's torso during the NAME or MY signs. If it still passes through, tighten `rightUpperArm.zMin` from `-0.35` toward `-0.1` in `RIG_CONFIG.armClamps`.

---

## Section 5: Rest Pose Between Signs

### What this fixes

Currently the avatar holds the last frame of a sign frozen during the 100ms gap between signs in `usePosePlayer.ts` and the 50ms gap in `useVideoEngine.ts`. This makes sentences look like one unbroken gesture. A brief lerp toward a neutral signing stance makes each sign read as a discrete word.

### Add to `vrmRigger.ts`

Add this constant and function at the end of the file:

```typescript
// ── Signing Rest Pose ────────────────────────────────────────────────

/**
 * Neutral ASL signing stance.
 * Arms relaxed at sides, not full T-pose extension.
 * Applied briefly between signs during inter-sign pauses.
 *
 * These values are in local bone space (relative to bind pose).
 * Tune if the rest pose looks stiff or unnatural.
 */
const SIGNING_REST_POSE: Record<string, { x: number; y: number; z: number }> = {
  RightUpperArm: { x: 0,    y: 0,    z: -0.4  }, // arms lowered to sides
  LeftUpperArm:  { x: 0,    y: 0,    z:  0.4  },
  RightLowerArm: { x: 0,    y: 0,    z: -0.1  },
  LeftLowerArm:  { x: 0,    y: 0,    z:  0.1  },
  RightHand:     { x: 0,    y: 0,    z:  0    },
  LeftHand:      { x: 0,    y: 0,    z:  0    },
  Spine:         { x: 0.02, y: 0,    z:  0    }, // very slight forward lean
  Hips:          { x: 0,    y: 0,    z:  0    },
};

/**
 * Lerp the avatar toward the neutral signing rest pose over `frames` frames.
 * Call between signs during the inter-sign pause window.
 *
 * @param vrm - The loaded VRM instance
 * @param frames - How many animation frames to spend lerping (default 3 ≈ 50ms at 60fps)
 * @param onSettled - Optional callback when lerp is complete
 */
export function lerpToRestPose(
  vrm: VRM,
  frames = 3,
  onSettled?: () => void
): void {
  let remaining = frames;

  const tick = () => {
    if (remaining <= 0) {
      onSettled?.();
      return;
    }

    for (const [boneName, target] of Object.entries(SIGNING_REST_POSE)) {
      rigRotation(vrm, boneName, target, 1.0, 0.35);
    }

    remaining--;
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
```

### Modify `usePosePlayer.ts` — inter-sign pause

Find the import from `vrmRigger`:
```typescript
import { rigUpperBody, rigHands, rigFace, resetPose } from "../lib/vrmRigger";
```

Add `lerpToRestPose` to the import:
```typescript
import { rigUpperBody, rigHands, rigFace, resetPose, lerpToRestPose } from "../lib/vrmRigger";
```

Find the inter-sign pause in `playSequence`:
```typescript
if (playingRef.current && i < glosses.length - 1) {
  await new Promise((r) => setTimeout(r, 100));
}
```

Replace with:
```typescript
if (playingRef.current && i < glosses.length - 1 && vrm) {
  // Lerp to rest pose over 3 frames, then wait remaining time
  await new Promise<void>((resolve) => {
    lerpToRestPose(vrm, 3, () => setTimeout(resolve, 50));
  });
}
```

### Modify `useVideoEngine.ts` — inter-sign pause

Find the import from `vrmRigger`:
```typescript
import { rigUpperBody, rigHands, rigFace, resetPose } from "../lib/vrmRigger";
```

Add `lerpToRestPose`:
```typescript
import { rigUpperBody, rigHands, rigFace, resetPose, lerpToRestPose } from "../lib/vrmRigger";
```

Find the inter-sign pause in `playSequence`:
```typescript
if (playingRef.current && i < glosses.length - 1) {
  await new Promise((r) => setTimeout(r, 50));
}
```

Replace with:
```typescript
if (playingRef.current && i < glosses.length - 1 && vrm) {
  await new Promise<void>((resolve) => {
    lerpToRestPose(vrm, 3, () => setTimeout(resolve, 20));
  });
}
```

### Verification

Translate "HELLO THANK YOU PLEASE" and play. Between each sign there should be a brief, visible reset of the avatar's arms toward a relaxed pose. The sentence should feel like distinct words rather than one continuous motion.

---

## Section 6: Debug Overlay — Bone Rotation Inspector

### What this is

A development-only overlay that shows live bone rotation values. Enabled by adding `?debug=bones` to any URL. Critical for tuning `RIG_CONFIG` values without guesswork.

### File to create
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/ui/BoneDebugOverlay.tsx
```

### Contents

```tsx
"use client";

/**
 * BoneDebugOverlay — Live bone rotation inspector
 * =================================================
 * Enable with ?debug=bones in the URL.
 * Shows real-time rotation values for key arm, hand, and finger bones.
 * Use this to tune RIG_CONFIG values in vrmRigger.ts.
 *
 * Reading the values:
 *   x = pitch (forward/back)
 *   y = yaw (left/right twist)
 *   z = roll (side lean / adduction/abduction)
 *
 * For arms: z is the most important axis for ASL.
 *   Negative z = arm moves toward body center
 *   Positive z = arm moves away from body
 *
 * For fingers: z controls curl (negative = curled/flexed)
 */

import { useEffect, useState } from "react";
import type { VRM } from "@pixiv/three-vrm";
import { VRMSchema } from "@pixiv/three-vrm";

interface Props {
  vrm: VRM | null;
  enabled?: boolean;
}

const WATCHED_BONES = [
  "RightUpperArm",
  "LeftUpperArm",
  "RightLowerArm",
  "LeftLowerArm",
  "RightHand",
  "LeftHand",
  "RightIndexProximal",
  "LeftIndexProximal",
  "RightThumbProximal",
  "LeftThumbProximal",
] as const;

type BoneName = typeof WATCHED_BONES[number];

export function BoneDebugOverlay({ vrm, enabled = false }: Props) {
  const [rotations, setRotations] = useState<Record<string, string>>({});
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled || !vrm) return;
    let rafId: number;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const tick = () => {
      const vals: Record<string, string> = {};
      frameCount++;

      for (const boneName of WATCHED_BONES) {
        const boneKey = boneName as keyof typeof VRMSchema.HumanoidBoneName;
        const humanBoneName = VRMSchema.HumanoidBoneName[boneKey];
        if (!humanBoneName) continue;

        const node = vrm.humanoid?.getBoneNode(humanBoneName);
        if (node) {
          // Convert quaternion to euler for readability
          const euler = new (require("three").Euler)().setFromQuaternion(node.quaternion);
          const x = euler.x.toFixed(2);
          const y = euler.y.toFixed(2);
          const z = euler.z.toFixed(2);
          vals[boneName] = `x:${x} y:${y} z:${z}`;
        }
      }

      // FPS counter
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      setRotations(vals);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [vrm, enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        background: "rgba(0, 0, 0, 0.82)",
        color: "#00ff88",
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1.7,
        padding: "8px 12px",
        borderRadius: 6,
        pointerEvents: "none",
        zIndex: 200,
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(0, 255, 136, 0.2)",
        minWidth: 240,
      }}
    >
      <div style={{ color: "#ffffff", fontWeight: "bold", marginBottom: 4, fontSize: 9 }}>
        BONE DEBUG — {fps}fps
      </div>
      {Object.entries(rotations).map(([bone, val]) => (
        <div key={bone}>
          <span style={{ color: "#888" }}>{bone}: </span>
          <span>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, color: "#555", fontSize: 9 }}>
        Tune via RIG_CONFIG in vrmRigger.ts
      </div>
    </div>
  );
}
```

### File to modify: `AvatarCanvas.tsx`

Add the import:
```typescript
import { BoneDebugOverlay } from "./BoneDebugOverlay";
```

Inside the component, add the enabled check (near the top of the component body):
```typescript
const debugBonesEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("debug") === "bones";
```

Inside the JSX return, find `{isSkeleton ? (` or the canvas container div. Add the overlay as a sibling inside the container:

```tsx
{/* Bone debug overlay — enabled by ?debug=bones */}
<BoneDebugOverlay vrm={vrm} enabled={debugBonesEnabled} />
```

Place it as the last child inside the canvas container div (after the existing Three.js canvas is mounted via `containerRef`).

### How to use

Navigate to `http://localhost:3000/translate?debug=bones` and translate any sentence. The overlay appears in the top-left of the avatar panel showing live rotation values for 10 key bones. Use these values to:
- Confirm arm clamps are working (z values for upper arms should stay within RIG_CONFIG.armClamps ranges)
- Tune finger lerp (watch IndexProximal z change during fingerspelling — should snap, not drift)
- Verify head rotation (Neck x/y/z should move during signs that have head movement)

---

## Section 7: Production-Ready Pose Fallback Quality

### What this fixes

The pose engine's `parsePoseFile` in `usePosePlayer.ts` is a handwritten binary parser that may fail silently on certain .pose files. The skeleton viewer uses the proper `pose-format` JS library (`Pose.from(buffer)`). The pose engine should use the same library.

### File to modify
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/model/usePosePlayer.ts
```

### Replace `parsePoseFile` entirely

Find the entire `parsePoseFile` async function (it spans approximately 120 lines). Replace it with this version that uses the real `pose-format` library, matching what `useSkeletonPlayer.ts` does:

```typescript
/**
 * Parse a .pose binary buffer using the pose-format library.
 * This is the same approach used by the skeleton viewer — uses Pose.from()
 * which correctly handles all pose-format binary versions.
 *
 * Extracts per-frame landmark arrays in the format Kalidokit expects:
 *   poseLandmarks: 33 points (POSE_LANDMARKS component)
 *   leftHandLandmarks: 21 points (LEFT_HAND_LANDMARKS component)
 *   rightHandLandmarks: 21 points (RIGHT_HAND_LANDMARKS component)
 *   faceLandmarks: 478 points (FACE_LANDMARKS component)
 */
async function parsePoseFile(buffer: ArrayBuffer, gloss: string): Promise<PoseData> {
  try {
    const { Pose } = await import("pose-format");
    const { Buffer } = await import("buffer");

    const buf = Buffer.from(buffer);
    const pose = Pose.from(buf);

    const fps = pose.body.fps || TARGET_FPS;
    const frameCount: number = pose.body.frames?.length ?? 0;

    if (frameCount === 0) {
      console.warn(`[PosePlayer] ${gloss}: pose parsed but has 0 frames`);
      return { gloss, frames: [], fps };
    }

    const frames: PoseFrame[] = [];

    for (let f = 0; f < frameCount; f++) {
      const poseFrame = pose.body.frames[f];
      if (!poseFrame || !poseFrame.people || poseFrame.people.length === 0) {
        frames.push({
          poseLandmarks: null,
          leftHandLandmarks: null,
          rightHandLandmarks: null,
          faceLandmarks: null,
        });
        continue;
      }

      const person = poseFrame.people[0];

      /**
       * Convert pose-format points to Kalidokit-compatible landmark arrays.
       * pose-format points have: X, Y, Z (normalized 0–1 image coords), C (confidence)
       * Kalidokit expects: { x, y, z, visibility? }
       */
      const extractComponent = (
        componentName: string
      ): Array<{ x: number; y: number; z: number; visibility?: number }> | null => {
        const points = person[componentName];
        if (!points || points.length === 0) return null;

        let hasValid = false;
        const lms = points.map((pt: { X: number; Y: number; Z: number; C?: number }) => {
          const conf = pt.C ?? 0;
          if (conf > 0.01) hasValid = true;
          return { x: pt.X, y: pt.Y, z: pt.Z, visibility: conf };
        });

        return hasValid ? lms : null;
      };

      frames.push({
        poseLandmarks:      extractComponent("POSE_LANDMARKS"),
        leftHandLandmarks:  extractComponent("LEFT_HAND_LANDMARKS"),
        rightHandLandmarks: extractComponent("RIGHT_HAND_LANDMARKS"),
        faceLandmarks:      extractComponent("FACE_LANDMARKS"),
      });
    }

    console.log(`[PosePlayer] ${gloss}: ${frameCount} frames @ ${fps}fps parsed successfully`);
    return { gloss, frames, fps };

  } catch (err) {
    console.warn(`[PosePlayer] Failed to parse .pose for "${gloss}":`, err);
    return { gloss, frames: [], fps: TARGET_FPS };
  }
}
```

### Verification

In the browser, translate a word like "HELLO" and switch to Skeleton mode. Then switch back to Avatar mode. Both should play the same sign — the skeleton is the ground truth. If the avatar's pose roughly matches the skeleton's pose (arms in same general position), the parser is working. They won't match perfectly due to Kalidokit retargeting, but the arms should be on the right sides doing roughly the right thing.

---

## Section 8: Confidence Logging for Debug Stats

### What this fixes

The `AvatarDebugStats` type has `leftHandConfidence` and `rightHandConfidence` fields, but the pose engine sets them both to `0` and never updates them. This makes the Stats for Nerds overlay useless for diagnosing pose quality during fallback playback.

### File to modify
```
/Users/nanaamoako/Desktop/duosign/frontend/src/features/animate-avatar/model/usePosePlayer.ts
```

Inside `applyFrame`, after the landmark extraction, add confidence calculations before the existing Kalidokit solve block:

```typescript
// Calculate confidence values for this frame (used in debug stats)
const avgConfidence = (
  landmarks: Array<{ visibility?: number }> | null
): number => {
  if (!landmarks || landmarks.length === 0) return 0;
  const sum = landmarks.reduce((acc, lm) => acc + (lm.visibility ?? 0), 0);
  return sum / landmarks.length;
};

const poseConf  = avgConfidence(frame.poseLandmarks);
const leftConf  = avgConfidence(frame.leftHandLandmarks);
const rightConf = avgConfidence(frame.rightHandLandmarks);
```

Then update the `setDebugStats` call inside `playGloss` to include these values. Find:
```typescript
setDebugStats((prev) => ({
  ...prev,
  frameIndex: frameIdx,
  totalFrames: poseData.frames.length,
  currentGloss: gloss,
  renderTimeMs: renderTime,
  viewMode,
  modelName,
  fps: rendererFps,
}));
```

Replace with:
```typescript
setDebugStats((prev) => ({
  ...prev,
  frameIndex: frameIdx,
  totalFrames: poseData.frames.length,
  currentGloss: gloss,
  renderTimeMs: renderTime ?? 0,
  viewMode,
  modelName,
  fps: rendererFps,
  poseConfidence: poseConf,
  leftHandConfidence: leftConf,
  rightHandConfidence: rightConf,
}));
```

For this to work, `poseConf`, `leftConf`, `rightConf` need to be accessible in the closure. Move the confidence calculation into `applyFrame` and return them. Or, simpler: calculate directly from the frame in the play loop. Here is the clean approach — update `applyFrame` to return a stats object:

```typescript
const applyFrame = useCallback(
  (frame: PoseFrame): { renderTime: number; poseConf: number; leftConf: number; rightConf: number } => {
    const startTime = performance.now();

    const avg = (lms: Array<{ visibility?: number }> | null): number => {
      if (!lms?.length) return 0;
      return lms.reduce((a, l) => a + (l.visibility ?? 0), 0) / lms.length;
    };

    const poseConf  = avg(frame.poseLandmarks);
    const leftConf  = avg(frame.leftHandLandmarks);
    const rightConf = avg(frame.rightHandLandmarks);

    if (!vrm || !Kalidokit) return { renderTime: 0, poseConf, leftConf, rightConf };

    try {
      // ... existing Kalidokit solve and rig calls unchanged ...
    } catch {
      // silent
    }

    return { renderTime: performance.now() - startTime, poseConf, leftConf, rightConf };
  },
  [vrm]
);
```

Update the call site to destructure:
```typescript
const { renderTime, poseConf, leftConf, rightConf } = applyFrame(poseData.frames[frameIdx]);
```

---

## Section 9: Full Build and Runtime Verification

### Step 9.1 — TypeScript check

```bash
cd /Users/nanaamoako/Desktop/duosign/frontend
npx tsc --noEmit 2>&1
```

Expected: **zero errors**. If there are errors, read them carefully. Most will be:
- Missing imports — add the import
- Wrong return type — check the function signature
- VRM 0.x API used correctly — confirm `getBoneNode` not `getNormalizedBoneNode`

Fix all errors before proceeding.

### Step 9.2 — Start the development server

```bash
cd /Users/nanaamoako/Desktop/duosign/frontend
npm run dev
```

Wait for `Ready in Xs` in the terminal output.

### Step 9.3 — Run the verification suite in the browser

Open `http://localhost:3000/translate` in Chrome or Firefox.

**Test 1 — Basic translation and playback**
1. Type: `hello my name is nana`
2. Press Translate
3. Press Play
4. Expected: avatar signs each gloss in sequence, brief pause between each sign, arms return toward sides between signs, avatar does NOT freeze or lock up

**Test 2 — Arm crossing check**
1. Type: `my name is`  
2. Translate and play
3. Watch the `MY` and `NAME` signs specifically
4. Expected: signing arm does NOT pass through the avatar's torso mesh

**Test 3 — Fingerspelling**
1. Type: `netflix`
2. Translate and play
3. Expected: backend resolves to N-E-T-F-L-I-X and avatar signs each letter
4. Each letter should show a distinct, different hand pose — not all the same

**Test 4 — Animation speed**
1. Go to Settings → Animation Speed → set to 200%
2. Return to translate page, type `hello` and play
3. Expected: avatar moves noticeably snappier/faster
4. Set speed to 50%, play again
5. Expected: avatar moves noticeably smoother/slower

**Test 5 — Skeleton ground truth comparison**
1. Translate `HELLO`
2. Press Play in Avatar mode — watch where the hand is
3. Click Skeleton in the display mode toggle
4. Press Replay — watch the skeleton
5. Expected: the hand/arm positions in skeleton mode roughly match what the avatar was doing (not mirrored, not inverted)

**Test 6 — Debug overlay**
1. Navigate to `http://localhost:3000/translate?debug=bones`
2. Translate `MY NAME IS` and play
3. Expected: bone overlay appears in top-left with live rotation values
4. During signing, `RightUpperArm z` should stay within -0.35 to π (the clamp range)
5. During fingerspelling, `RightIndexProximal z` should change rapidly between letters

**Test 7 — Pose engine fallback**
1. Translate a word that might not have a video but has a pose file
2. In DevTools Network tab, watch the requests
3. Expected: if video fetch returns 404, pose fetch is attempted next, avatar still signs

### Step 9.4 — Console check

In browser DevTools, check the console for:
- `[PosePlayer] HELLO: N frames @ Xfps parsed successfully` — pose parser working
- `[VideoEngine] HolisticLandmarker initialized successfully` — MediaPipe working
- No red errors except expected 404s for missing glosses

---

## Section 10: What This Produces — Post-Implementation State

When all sections are complete, DuoSign's animation system will have the following characteristics:

### Avatar animation quality

| Aspect | Before | After |
|--------|--------|-------|
| Arm crossing | Occurs on chest-level signs | Clamped — does not occur |
| Finger response | 0.3 lerp (slow, mushy) | 0.75 lerp (crisp, snappy) |
| Upper body | 0.3 lerp (same as fingers) | 0.15 lerp (slow, stable) |
| Rest between signs | Avatar freezes in last pose | Brief reset to natural stance |
| Hand swap (pose engine) | Hands mirrored incorrectly | Correct handedness |
| Pose file parsing | Custom binary parser (fragile) | pose-format library (robust) |
| Speed control | Setting exists, does nothing | Wires directly to lerp speed |
| Debug tools | None | ?debug=bones live overlay |
| Neutral expression | Blendshapes animate randomly | Locked neutral smile |
| Head movement | Animates | Animates (unchanged) |

### Files created
```
frontend/src/features/animate-avatar/lib/rigConfigSync.ts    (new)
frontend/src/features/animate-avatar/ui/BoneDebugOverlay.tsx (new)
```

### Files modified
```
frontend/src/features/animate-avatar/lib/vrmRigger.ts        (RIG_CONFIG + clamps + restPose + rigFace)
frontend/src/features/animate-avatar/model/usePosePlayer.ts  (hand fix + parsePoseFile + confidence)
frontend/src/features/animate-avatar/ui/AvatarCanvas.tsx     (debug overlay + speed sync)
```

### Files NOT touched
```
useVideoEngine.ts      — video engine is production-ready as-is
useAvatarRenderer.ts   — Three.js scene setup is solid
useVRM.ts              — VRM 0.x loading is correct
skeletonRenderer.ts    — skeleton viewer is correct ground truth
backend/               — no backend changes needed
```

---

## Appendix A: Tuning RIG_CONFIG After Implementation

Once everything runs, open `vrmRigger.ts` and adjust these values based on what you see:

```typescript
// If arms still cross body on MY/NAME signs:
armClamps: {
  rightUpperArm: { zMin: -0.2, ... }  // tighten from -0.35 toward -0.1
}

// If fingers still look mushy/slow during fingerspelling:
finger: { lerp: 0.85 }  // raise from 0.75

// If the avatar's core body looks jittery:
spine: { lerp: 0.08 }   // lower from 0.15

// If signs look too slow/sluggish overall:
// Raise animationSpeed in Settings to 150 (1.5× multiplier)
// Or raise base lerp values across the board

// If rest pose looks stiff (arms too far out):
// In SIGNING_REST_POSE: lower z magnitude on upper arms from 0.4 to 0.2
```

## Appendix B: What Is Still Not Fixed (Known Limits)

These are limitations that exist after this implementation. They are documented here so you know what to expect:

1. **Contact signs** (touching chin, forehead, chest) will still not make precise contact. The hand gets closer but does not precisely land. Fixing this requires Inverse Kinematics (IK) — a separate larger project.

2. **Kalidokit finger Z-only output** — Kalidokit models finger joints as hinges (Z-axis only). Finger spread (the V vs U handshape distinction) is not captured by Kalidokit. The video engine gets real MediaPipe hand data but Kalidokit strips the spread. The finger PRD addresses this with a direct vector solver.

3. **Pose world landmarks in fallback** — The pose engine passes 2D landmarks twice to `Pose.solve` because the world landmarks are not separately stored in the extraction pipeline. This makes upper-body arm angles less precise than the video engine. Fixing requires updating `wlasl_pose_pipeline.py` to store world landmarks separately.

4. **Kalidokit is deprecated** — The library is frozen. It still works but will not receive fixes. All improvements above work within its constraints. The video engine (live MediaPipe → VRM) is the better long-term path.
