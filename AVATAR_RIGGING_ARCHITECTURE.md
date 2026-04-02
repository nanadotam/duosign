# DuoSign Avatar Rigging Architecture

## Tree Structure

```
frontend/src/features/animate-avatar/
├── lib/                              # Core rigging + pose processing
│   ├── vrmRigger.ts                  # Master config (RIG_CONFIG) + all bone rigging functions
│   ├── applyPose.ts                  # Pose frame → VRM bone application (pose engine path)
│   ├── fingerSolver.ts              # Custom IK: landmark → bone finger articulation
│   ├── fingerSpread.ts             # Augments KalidoKit output with Y-axis spread
│   ├── fingerConfig.ts             # Landmark indices, joint clamps, VRM bone names
│   ├── landmarkSmoother.ts         # EMA filter for raw MediaPipe landmark jitter
│   ├── retargetConfig.ts           # Re-exports from vrmRigger (single source of truth)
│   ├── rigConfigSync.ts            # User speed setting → rig config
│   ├── signSequencer.ts            # Multi-gloss sequencing + rest pose transitions
│   ├── animatePose.ts              # Frame-by-frame animation loop (rAF-based)
│   ├── poseReader.ts               # Binary .pose file parsing
│   └── poseLoader.ts               # Pose file fetching + caching
│
├── model/                            # React hooks
│   ├── useVideoEngine.ts            # Real-time video → MediaPipe → VRM (primary path)
│   ├── usePosePlayer.ts             # Pre-recorded .pose file playback (fallback path)
│   ├── useVRM.ts                     # VRM model loading (GLTF → VRM 0.x)
│   └── useAvatarRenderer.ts         # Three.js scene, camera, render loop
│
└── ui/                               # Debug overlays
    ├── BoneDebugOverlay.tsx           # ?debug=bones — live bone rotation display
    └── AvatarDebugOverlay.tsx         # Avatar debug sync
```

## Data Flow

```
VIDEO FILE (MP4) or POSE FILE (.pose)
         │
         ▼
┌─────────────────────────────────────────────┐
│  useVideoEngine.ts:processFrame()           │  ← or usePosePlayer → applyPose.ts
│  Lines 237-308                               │
│                                              │
│  1. HolisticLandmarker.detectForVideo()     │
│     → face (468pts), pose (33pts),          │
│       hands (21pts × 2)                     │
│                                              │
│  2. Hand swap (L↔R, MediaPipe is mirrored)  │
│     Lines 261-267                            │
│                                              │
│  3. EMA smoothing on raw hand landmarks     │
│     landmarkSmoother.ts                      │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  SOLVING (landmarks → rotations)            │
│                                              │
│  Body: KalidoKit.Pose.solve()               │  ← Still KalidoKit
│    → hips, spine, chest, arms rotation      │
│                                              │
│  Wrist: KalidoKit.Hand.solve()              │  ← KalidoKit for X/Y only
│    + solvePalmOrientation() for wrist Z     │  ← Custom (fingerSolver.ts:139)
│                                              │
│  Fingers: solveFingers()                    │  ← Fully custom IK
│    fingerSolver.ts:220                       │
│    → per-joint flexion + spread for         │
│      thumb, index, middle, ring, pinky      │
│                                              │
│  Face: KalidoKit.Face.solve()               │  ← Still KalidoKit
│    → head rotation (locked neutral expr.)   │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  RIGGING (rotations → VRM bones)            │
│  vrmRigger.ts                                │
│                                              │
│  rigUpperBody()  — line 246                  │
│    Hips, Chest, Spine, UpperArm, LowerArm   │
│    dampener × lerp via RIG_CONFIG            │
│                                              │
│  rigRotation()   — line 171                  │
│    Scale by dampener → clamp anatomical      │
│    limits → Euler→Quaternion → slerp         │
│                                              │
│  rigHands()      — line 273                  │
│    Wrist Z from pose solver                  │
│    Wrist X/Y from hand solver                │
│    15 finger bones per hand via config lerp  │
│                                              │
│  rigFace()       — line 330                  │
│    Head rotation (slow, deliberate)          │
│    Expression locked: Joy=0.15, Blink=0      │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  THREE.JS RENDER                             │
│  useAvatarRenderer.ts                        │
│                                              │
│  vrm.update(delta) — spring physics          │
│  renderer.render(scene, camera)              │
└─────────────────────────────────────────────┘
```

## Where the Avatar Gets Its Rigging (exact locations)

### Body (arms, spine, hips)

| What | Source | File:Line |
|------|--------|-----------|
| Pose solving | `KalidoKit.Pose.solve(world3D, screen2D)` | useVideoEngine.ts:278 |
| Upper body rig | `rigUpperBody(vrm, riggedPose)` | vrmRigger.ts:246 |
| Arm dampener | `RIG_CONFIG.upperArm = { dampener: 1.0, lerp: 0.35 }` | vrmRigger.ts:57 |
| Arm clamps | `armClamps.rightUpperArm = { zMin: -0.35, ... }` | vrmRigger.ts:97 |
| Hips position | `PROPORTION_SCALE.hipsWorldPosition = { x:0.75, y:0.75, z:0.22 }` | vrmRigger.ts:106 |

### Wrist Rotation

| What | Source | File:Line |
|------|--------|-----------|
| Wrist X/Y | `KalidoKit.Hand.solve(landmarks, side)` | useVideoEngine.ts:369 |
| Wrist Z (pronation) | `solvePalmOrientation(landmarks, side)` | fingerSolver.ts:139 |
| Palm pronation scale | `RIG_CONFIG.palmOrientation.pronationScale = 0.85` | vrmRigger.ts:70 |
| Hand dampener | `RIG_CONFIG.hand = { dampener: 1.0, lerp: 0.6 }` | vrmRigger.ts:66 |

### Finger Articulation (Custom IK — NOT KalidoKit)

| What | Source | File:Line |
|------|--------|-----------|
| Entry point | `solveFingers(landmarks, side, previous)` | fingerSolver.ts:220 |
| Flexion calc | `solveFlexion(landmarks, parent, joint, child, clamp)` | fingerSolver.ts:150 |
| Spread calc | `solveSpread(landmarks, mcp, pip, name, palmFrame, clamp)` | fingerSolver.ts:179 |
| Palm frame | `computePalmFrame(landmarks, side)` | fingerSolver.ts:93 |
| Joint clamps | `JOINT_CLAMPS.mcp.flexion = [-PI/6, PI/2]` | fingerConfig.ts:54 |
| Thumb clamps | `thumbCmc.flexion = [-0.4, PI/2]` | fingerConfig.ts:65 |
| Finger dampener | `RIG_CONFIG.finger = { dampener: 1.0, lerp: 0.75 }` | vrmRigger.ts:73 |
| Thumb dampener | `RIG_CONFIG.thumb = { dampener: 1.0, lerp: 0.7 }` | vrmRigger.ts:77 |
| Confidence threshold | `LANDMARK_CONFIDENCE_THRESHOLD = 0.3` | fingerConfig.ts:9 |
| Landmark smoothing | `LandmarkSmoother(alpha=0.5)` | landmarkSmoother.ts:39 |

### Hand Depth (forward/backward Z-position)

| What | Source | File:Line |
|------|--------|-----------|
| Video engine depth | Wrist Z - Shoulder Z from pose world landmarks | useVideoEngine.ts:296 |
| Pose engine depth | Same calculation | applyPose.ts:228 |
| Depth scale | `HAND_DEPTH_SCALE = 0.35` | vrmRigger.ts:110 |
| Depth clamp | `HAND_DEPTH_CLAMP = 0.4` | vrmRigger.ts:111 |

### Face / Head

| What | Source | File:Line |
|------|--------|-----------|
| Face solving | `KalidoKit.Face.solve(landmarks)` | useVideoEngine.ts:267 |
| Head rotation | `rigFace(vrm, riggedFace)` | vrmRigger.ts:330 |
| Neck dampener | `RIG_CONFIG.neck = { dampener: 0.7, lerp: 0.15 }` | vrmRigger.ts:81 |
| Locked expression | `Joy: 0.15, Blink: 0, mouth: all 0` | vrmRigger.ts:345 |

### Rest Pose (between signs)

| What | Source | File:Line |
|------|--------|-----------|
| Rest pose def | `SIGNING_REST_POSE` (arms + fingers) | vrmRigger.ts:399 |
| Lerp to rest | `lerpToRestPose(vrm, frames, onSettled)` | vrmRigger.ts:440 |
| Smoothing | `RIG_CONFIG.restPoseSmoothing = 0.4` | vrmRigger.ts:116 |
| Frames | `RIG_CONFIG.restPoseFrames = 4` | vrmRigger.ts:117 |
| Settle time | `RIG_CONFIG.interSignSettleMs = 40` | vrmRigger.ts:118 |

## External Dependencies

| Dependency | Version | Role | Could be replaced? |
|-----------|---------|------|-------------------|
| `kalidokit` | 1.1.5 | Body pose, wrist X/Y, face | Body: hard. Wrist: easy. Face: low priority. |
| `@pixiv/three-vrm` | 0.6.11 | VRM 0.x model loading + bone access | Upgrade to v2+/v3 for VRM 1.0 (3-5 day effort) |
| `@mediapipe/tasks-vision` | 0.10.32 | HolisticLandmarker (21pt hands, 33pt pose, 468pt face) | No better alternative for browser |
| `three` | 0.137.4 | 3D rendering, quaternion math | Would upgrade with three-vrm migration |
| `pose-format` | 1.6.2 | Binary .pose file parsing | No — standard format for sign language data |

## Known Limitations

1. **KalidoKit is unmaintained** — last updated 2022, hardcoded magic numbers
2. **MediaPipe Z-depth is unreliable** — monocular camera cannot accurately estimate depth, affects hand depth and finger curl when palm faces camera
3. **21 landmarks per hand is the ceiling** — no sub-joint articulation data available
4. **VRM 0.x bind pose variance** — same rotation values look different on different VRM models (VRM 1.0 fixes this with normalized bones)
5. **No temporal coherence in MediaPipe** — landmarks can jump between frames (mitigated by EMA smoother)
