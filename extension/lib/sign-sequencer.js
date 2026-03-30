/**
 * SignSequencer — Gloss queue with inter-sign pauses
 * =====================================================
 * Ported from frontend/src/features/animate-avatar/lib/signSequencer.ts
 * Plays a sequence of glosses one at a time with configurable gaps.
 */

class SignSequencer {
  constructor() {
    this._stopped = false;
  }

  /**
   * Play a sequence of glosses.
   * @param {string[]} glosses — e.g. ["HELLO", "MY", "NAME", "J-O-H-N"]
   * @param {Function} playFn  — async (gloss, index) => void — plays one sign
   * @param {Object} callbacks — { onGlossStart, onGlossComplete, onComplete }
   * @param {number} gapMs     — pause between signs (default 80ms)
   */
  async play(glosses, playFn, callbacks = {}, gapMs = 80) {
    this._stopped = false;

    for (let i = 0; i < glosses.length; i++) {
      if (this._stopped) break;

      callbacks.onGlossStart?.(glosses[i], i);

      await playFn(glosses[i], i);

      callbacks.onGlossComplete?.(glosses[i], i);

      // Inter-sign gap
      if (i < glosses.length - 1 && !this._stopped) {
        await new Promise((r) => setTimeout(r, gapMs));
      }
    }

    if (!this._stopped) {
      callbacks.onComplete?.();
    }
  }

  stop() {
    this._stopped = true;
  }
}

export { SignSequencer };
