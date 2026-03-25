import { Buffer } from "buffer";
import type { PoseBodyFrameModel, PoseHeaderModel, PosePointModel } from "pose-format";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrameData {
  poseLandmarks: NormalizedLandmark[] | null;
  poseWorldLandmarks: NormalizedLandmark[] | null;
  leftHandLandmarks: NormalizedLandmark[] | null;
  rightHandLandmarks: NormalizedLandmark[] | null;
  faceLandmarks: NormalizedLandmark[] | null;
}

export interface ParsedPoseData {
  gloss: string;
  header: PoseHeaderModel;
  frameCount: number;
  fps: number;
  frames: PoseFrameData[];
}

function toLandmarks(points?: PosePointModel[] | null): NormalizedLandmark[] | null {
  if (!points || points.length === 0) return null;

  const landmarks = points.map((point) => ({
    x: point.X ?? 0,
    y: point.Y ?? 0,
    z: point.Z ?? 0,
    visibility: point.C ?? 0,
  }));

  const hasVisiblePoint = landmarks.some((point) => (point.visibility ?? 0) > 0);
  return hasVisiblePoint ? landmarks : null;
}

function normalizeFrame(frame: PoseBodyFrameModel): PoseFrameData {
  const person = frame.people?.[0] ?? {};

  return {
    poseLandmarks: toLandmarks(person.POSE_LANDMARKS),
    poseWorldLandmarks: toLandmarks(person.POSE_WORLD_LANDMARKS),
    leftHandLandmarks: toLandmarks(person.LEFT_HAND_LANDMARKS),
    rightHandLandmarks: toLandmarks(person.RIGHT_HAND_LANDMARKS),
    faceLandmarks: toLandmarks(person.FACE_LANDMARKS),
  };
}

export async function readPoseBuffer(buffer: ArrayBuffer, gloss: string): Promise<ParsedPoseData> {
  const { Pose } = await import("pose-format");
  const pose = Pose.from(Buffer.from(buffer));
  const frames = pose.body.frames.map(normalizeFrame);

  console.log("[PoseReader] Parsed pose", {
    gloss,
    fps: pose.body.fps,
    frameCount: frames.length,
    components: pose.header.components.map((component) => ({
      name: component.name,
      points: component.points.length,
      format: component.format,
    })),
  });

  return {
    gloss,
    header: pose.header,
    frameCount: frames.length,
    fps: pose.body.fps,
    frames,
  };
}
