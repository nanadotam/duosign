/**
 * poseSmoothing — Transition interpolation between pose-format frames
 * ===================================================================
 * Generates cosine-eased interpolated frames between the last frame of one
 * sign and the first frame of the next, replacing the hard cut (and the old
 * 80 ms pause) with a smooth animated blend.
 *
 * Usage:
 *   const transitionFrames = interpolateTransition(lastFrameOfA, firstFrameOfB, header);
 *   // play each frame in transitionFrames before starting sign B
 */

import type {
  PoseBodyFrameModel,
  PoseHeaderModel,
  PosePointModel,
} from "pose-format";

// ── Easing ────────────────────────────────────────────────────────────────────

/** Cosine ease-in-out: smooth start and end, faster in the middle. */
function cosineEase(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

// ── Point interpolation ───────────────────────────────────────────────────────

function lerpPoint(a: PosePointModel, b: PosePointModel, t: number): PosePointModel {
  return {
    X: a.X + (b.X - a.X) * t,
    Y: a.Y + (b.Y - a.Y) * t,
    Z: (a.Z ?? 0) + ((b.Z ?? 0) - (a.Z ?? 0)) * t,
    C: (a.C ?? 1) + ((b.C ?? 1) - (a.C ?? 1)) * t,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate `steps` interpolated frames that bridge frameA → frameB.
 *
 * The endpoints (frameA and frameB) are NOT included; only the in-between
 * frames are returned so the caller can play them between the two signs
 * without repeating the boundary frames.
 *
 * @param frameA  Last frame of the outgoing sign
 * @param frameB  First frame of the incoming sign
 * @param header  Shared pose header (describes component names and point lists)
 * @param steps   Number of interpolated frames to generate (default 6 ≈ 200 ms at 30 fps)
 */
export function interpolateTransition(
  frameA: PoseBodyFrameModel,
  frameB: PoseBodyFrameModel,
  header: PoseHeaderModel,
  steps = 6,
): PoseBodyFrameModel[] {
  if (!frameA?.people?.length || !frameB?.people?.length || steps <= 0) return [];

  const result: PoseBodyFrameModel[] = [];

  for (let step = 1; step <= steps; step++) {
    const t = cosineEase(step / (steps + 1));

    const people = frameA.people.map((personA, pi) => {
      const personB = frameB.people[pi];
      if (!personB) return personA;

      // Build a new person object by interpolating each component's point array.
      // We use a plain object cast because PosePersonModel mixes typed component
      // properties with dynamic names — the renderer accesses them via
      // person[component.name] so the shape is compatible.
      const blended: Record<string, PosePointModel[] | unknown> = {};

      for (const component of header.components) {
        const compA = (personA as Record<string, unknown>)[component.name] as PosePointModel[] | undefined;
        const compB = (personB as Record<string, unknown>)[component.name] as PosePointModel[] | undefined;

        if (!compA) continue;
        if (!compB) { blended[component.name] = compA; continue; }

        blended[component.name] = compA.map((ptA, idx) => {
          const ptB = compB[idx];
          return ptB ? lerpPoint(ptA, ptB, t) : ptA;
        });
      }

      return blended;
    });

    // Spread frameA to preserve any non-people metadata (fps etc.)
    result.push({ ...frameA, people } as PoseBodyFrameModel);
  }

  return result;
}
