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
import * as THREE from "three";
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
          const euler = new THREE.Euler().setFromQuaternion(node.quaternion);
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
