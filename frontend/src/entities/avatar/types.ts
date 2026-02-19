export type AvatarDisplayMode = "avatar" | "skeleton";

export type PlaybackState = "idle" | "playing" | "paused" | "complete";

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export interface PlaybackStatus {
  state: PlaybackState;
  currentIndex: number;
  totalTokens: number;
  speed: PlaybackSpeed;
}
