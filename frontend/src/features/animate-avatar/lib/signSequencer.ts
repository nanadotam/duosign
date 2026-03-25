import { INTER_SIGN_SETTLE_MS, REST_POSE_FRAMES } from "./retargetConfig";
import { lerpToRestPose } from "./vrmRigger";

export interface SignSequencerCallbacks {
  onGlossStart?: (gloss: string, index: number) => void;
  onGlossComplete?: (gloss: string, index: number) => void;
  onComplete?: () => void;
}

export class SignSequencer {
  private stopped = false;
  private paused = false;

  private betweenSigns(pauseMs: number): Promise<void> {
    return new Promise<void>((resolve) => {
      lerpToRestPose(undefined, REST_POSE_FRAMES, () => {
        window.setTimeout(resolve, Math.min(INTER_SIGN_SETTLE_MS, pauseMs));
      });
    });
  }

  async play(
    glosses: string[],
    playSign: (
      gloss: string,
      index: number
    ) => Promise<{ pause: () => void; resume: () => void; stop: () => void } | void>,
    callbacks: SignSequencerCallbacks = {},
    pauseMs = 80
  ): Promise<void> {
    this.stopped = false;
    this.paused = false;
    console.log("[SignSequencer] Queue start", { glosses });

    try {
      for (let index = 0; index < glosses.length; index += 1) {
        if (this.stopped) break;

        const gloss = glosses[index];
        callbacks.onGlossStart?.(gloss, index);
        console.log("[SignSequencer] Playing gloss", { gloss, index, total: glosses.length });

        try {
          await playSign(gloss, index);
        } catch (error) {
          console.warn("[SignSequencer] Gloss failed, skipping", { gloss, index, error });
        }

        callbacks.onGlossComplete?.(gloss, index);

        if (!this.stopped && index < glosses.length - 1) {
          await this.betweenSigns(pauseMs);
        }
      }
    } finally {
      callbacks.onComplete?.();
      console.log("[SignSequencer] Queue complete", {
        stopped: this.stopped,
        remainingPaused: this.paused,
      });
    }
  }

  stop(): void {
    this.stopped = true;
    this.paused = false;
  }

  pause(controls?: { pause: () => void }): void {
    this.paused = true;
    controls?.pause();
  }

  resume(controls?: { resume: () => void }): void {
    this.paused = false;
    controls?.resume();
  }
}
