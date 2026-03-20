import type { VRM } from "@pixiv/three-vrm";
import type { NormalizedLandmark, PoseFrameData } from "./poseReader";
import { rigFace, rigHands, rigPosition, rigUpperBody } from "./vrmRigger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KalidokitModule = any;

interface ApplyPoseOptions {
  imageSize?: { width: number; height: number };
  smoothing?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function withSpread(
  handRig: Record<string, { x: number; y: number; z: number }> | undefined,
  side: "Left" | "Right",
  landmarks: NormalizedLandmark[] | null
): Record<string, { x: number; y: number; z: number }> | null {
  if (!handRig || !landmarks || landmarks.length < 21) return handRig ?? null;

  const mcp = {
    index: landmarks[5],
    middle: landmarks[9],
    ring: landmarks[13],
    little: landmarks[17],
  };

  const palmWidth = Math.max(Math.abs(mcp.little.x - mcp.index.x), 1e-5);
  const handSign = side === "Left" ? -1 : 1;

  const spreads = {
    [`${side}IndexProximal`]: clamp(((mcp.index.x - mcp.middle.x) / palmWidth) * handSign, -0.35, 0.35),
    [`${side}MiddleProximal`]: 0,
    [`${side}RingProximal`]: clamp(((mcp.ring.x - mcp.middle.x) / palmWidth) * handSign, -0.25, 0.25),
    [`${side}LittleProximal`]: clamp(((mcp.little.x - mcp.ring.x) / palmWidth) * handSign, -0.45, 0.45),
  };

  for (const [bone, spread] of Object.entries(spreads)) {
    if (!handRig[bone]) continue;
    handRig[bone] = {
      ...handRig[bone],
      y: spread,
    };
  }

  return handRig;
}

export function applyPoseToVRM(
  vrm: VRM,
  frame: PoseFrameData,
  kalidokit: KalidokitModule,
  options: ApplyPoseOptions = {}
): number {
  const start = performance.now();
  const imageSize = options.imageSize ?? { width: 1280, height: 720 };
  const smoothing = options.smoothing ?? 0.8;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let riggedPose: any;

  if (frame.poseLandmarks && frame.poseWorldLandmarks) {
    riggedPose = kalidokit.Pose.solve(frame.poseWorldLandmarks, frame.poseLandmarks, {
      runtime: "mediapipe",
      imageSize,
      enableLegs: false,
    });

    if (riggedPose) {
      rigUpperBody(vrm, riggedPose, smoothing);
      const hips = (riggedPose.Hips as { worldPosition?: { x: number; y: number; z: number } } | undefined)
        ?.worldPosition;
      if (hips) {
        rigPosition(
          vrm,
          "Hips",
          {
            x: hips.x * 0.01,
            y: hips.y * 0.01,
            z: hips.z * 0.01,
          },
          1,
          smoothing
        );
      }
    }
  }

  let leftHand = frame.leftHandLandmarks
    ? kalidokit.Hand.solve(frame.leftHandLandmarks, "Left")
    : null;
  let rightHand = frame.rightHandLandmarks
    ? kalidokit.Hand.solve(frame.rightHandLandmarks, "Right")
    : null;

  leftHand = withSpread(leftHand ?? undefined, "Left", frame.leftHandLandmarks);
  rightHand = withSpread(rightHand ?? undefined, "Right", frame.rightHandLandmarks);

  if (riggedPose) {
    rigHands(vrm, leftHand, rightHand, riggedPose, smoothing);
  }

  if (frame.faceLandmarks) {
    const riggedFace = kalidokit.Face.solve(frame.faceLandmarks, {
      runtime: "mediapipe",
      imageSize,
      smoothBlink: true,
      blinkSettings: [0.3, 0.7],
    });

    if (riggedFace) {
      riggedFace.eye = kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y, {
        maxRot: 0.5,
      });
      rigFace(vrm, riggedFace, smoothing);
    }
  }

  return performance.now() - start;
}
