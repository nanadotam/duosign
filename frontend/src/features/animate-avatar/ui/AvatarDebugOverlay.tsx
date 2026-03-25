"use client";

import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { VRM } from "@pixiv/three-vrm";
import { VRMSchema } from "@pixiv/three-vrm";

interface Props {
  vrm: VRM | null;
  enabled?: boolean;
}

const WATCHED_BONES = [
  "rightUpperArm",
  "leftUpperArm",
  "rightLowerArm",
  "leftLowerArm",
  "rightHand",
  "leftHand",
] as const;

const BONE_NAME_MAP: Record<(typeof WATCHED_BONES)[number], keyof typeof VRMSchema.HumanoidBoneName> = {
  rightUpperArm: "RightUpperArm",
  leftUpperArm: "LeftUpperArm",
  rightLowerArm: "RightLowerArm",
  leftLowerArm: "LeftLowerArm",
  rightHand: "RightHand",
  leftHand: "LeftHand",
};

let overlayRoot: Root | null = null;
let overlayContainer: HTMLDivElement | null = null;
let debugEnabledCache: boolean | null = null;
let mountedVRM: VRM | null = null;

function getBoneNode(vrm: VRM, boneName: (typeof WATCHED_BONES)[number]) {
  const schemaKey = BONE_NAME_MAP[boneName];
  const humanBoneName = VRMSchema.HumanoidBoneName[schemaKey];
  return vrm.humanoid?.getBoneNode(humanBoneName) ?? null;
}

function isBoneDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (debugEnabledCache !== null) return debugEnabledCache;

  debugEnabledCache = new URLSearchParams(window.location.search).get("debug") === "bones";
  return debugEnabledCache;
}

function unmountOverlay(): void {
  overlayRoot?.unmount();
  overlayRoot = null;
  mountedVRM = null;

  if (overlayContainer?.parentNode) {
    overlayContainer.parentNode.removeChild(overlayContainer);
  }
  overlayContainer = null;
}

export function AvatarDebugOverlay({ vrm, enabled = false }: Props) {
  const [rotations, setRotations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled || !vrm) return;

    let rafId = 0;

    const tick = () => {
      const values: Record<string, string> = {};
      for (const bone of WATCHED_BONES) {
        const node = getBoneNode(vrm, bone);
        if (!node) continue;

        const { x, y, z } = node.rotation;
        values[bone] = `x:${x.toFixed(2)} y:${y.toFixed(2)} z:${z.toFixed(2)}`;
      }

      setRotations(values);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [vrm, enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        background: "rgba(0,0,0,0.75)",
        color: "#00ff00",
        fontFamily: "monospace",
        fontSize: 11,
        lineHeight: 1.6,
        padding: "6px 10px",
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {Object.entries(rotations).map(([bone, value]) => (
        <div key={bone}>
          <strong>{bone}:</strong> {value}
        </div>
      ))}
    </div>
  );
}

export function syncAvatarDebugOverlay(vrm: VRM | null): void {
  if (typeof window === "undefined") return;

  const enabled = isBoneDebugEnabled();
  if (!enabled || !vrm) {
    unmountOverlay();
    return;
  }

  if (!overlayContainer) {
    overlayContainer = document.createElement("div");
    overlayContainer.dataset.duosignOverlay = "avatar-debug";
    document.body.appendChild(overlayContainer);
    overlayRoot = createRoot(overlayContainer);
  }

  if (mountedVRM !== vrm) {
    mountedVRM = vrm;
    overlayRoot?.render(<AvatarDebugOverlay vrm={vrm} enabled={enabled} />);
  }
}
