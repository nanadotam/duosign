export type AvatarDisplayMode = "avatar" | "skeleton";

export type PlaybackState = "idle" | "playing" | "paused" | "complete";

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type ViewMode = "interpreter" | "fullbody" | "world";

export interface PlaybackStatus {
  state: PlaybackState;
  currentIndex: number;
  totalTokens: number;
  speed: PlaybackSpeed;
}

export interface AvatarModel {
  id: string;
  name: string;
  path: string;        // e.g. "/avatars/DS-Proto-2.1.vrm"
  thumbnail?: string;
}

export interface AvatarDebugStats {
  fps: number;
  frameIndex: number;
  totalFrames: number;
  currentGloss: string;
  poseConfidence: number;
  leftHandConfidence: number;
  rightHandConfidence: number;
  viewMode: ViewMode;
  modelName: string;
  renderTimeMs: number;
  poseLoadTimeMs: number;
  totalGlosses: number;
  currentGlossIndex: number;
}
