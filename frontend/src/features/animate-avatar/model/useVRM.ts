"use client";

/**
 * useVRM — Load and manage VRM 0.x models
 * ========================================
 * Uses @pixiv/three-vrm v0.6.x with GLTFLoader + VRM.from().
 * Handles model loading, cleanup, and instant switching.
 *
 * VRM 0.x critical APIs:
 *   - VRMUtils.removeUnnecessaryJoints(gltf.scene)
 *   - VRM.from(gltf)  (NOT gltf.userData.vrm)
 *   - VRMUtils.deepDispose(vrm.scene)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRM, VRMUtils } from "@pixiv/three-vrm";

/** Dispose all geometries and materials in a scene tree (VRM 0.x has no VRMUtils.deepDispose) */
function disposeScene(scene: THREE.Object3D): void {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = mat as any;
        if (m.map) m.map.dispose();
        mat.dispose();
      }
    }
  });
}

interface UseVRMOptions {
  scene: THREE.Scene | null;
  initialPath?: string;
}

interface UseVRMReturn {
  vrm: VRM | null;
  isLoading: boolean;
  error: string | null;
  modelName: string;
  loadModel: (path: string) => Promise<void>;
}

export function useVRM({ scene, initialPath }: UseVRMOptions): UseVRMReturn {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");
  const loaderRef = useRef<GLTFLoader | null>(null);
  const currentVrmRef = useRef<VRM | null>(null);

  // Initialize loader once — no VRMLoaderPlugin needed for VRM 0.x
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.crossOrigin = "anonymous";
    loaderRef.current = loader;
  }, []);

  const loadModel = useCallback(
    async (path: string) => {
      if (!scene || !loaderRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Clean up previous model
        if (currentVrmRef.current) {
          scene.remove(currentVrmRef.current.scene);
          disposeScene(currentVrmRef.current.scene);
          currentVrmRef.current = null;
        }

        const gltf = await loaderRef.current.loadAsync(path);

        // VRM 0.x: removeUnnecessaryJoints BEFORE VRM.from()
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // VRM 0.x: use VRM.from(gltf) — NOT gltf.userData.vrm
        const newVrm = await VRM.from(gltf);

        // Rotate 180° to face camera
        newVrm.scene.rotation.y = Math.PI;

        scene.add(newVrm.scene);
        currentVrmRef.current = newVrm;
        setVrm(newVrm);
        setModelName(path.split("/").pop()?.replace(".vrm", "") ?? "Unknown");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load VRM";
        console.error("VRM load error:", msg);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [scene]
  );

  // Load initial model
  useEffect(() => {
    if (initialPath && scene) {
      loadModel(initialPath);
    }
  }, [initialPath, scene, loadModel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentVrmRef.current && scene) {
        scene.remove(currentVrmRef.current.scene);
        disposeScene(currentVrmRef.current.scene);
      }
    };
  }, [scene]);

  return { vrm, isLoading, error, modelName, loadModel };
}
