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
