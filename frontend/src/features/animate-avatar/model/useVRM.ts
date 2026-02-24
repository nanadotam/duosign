"use client";

/**
 * useVRM — Load and manage VRM 1.0 models
 * ========================================
 * Uses @pixiv/three-vrm v3 with GLTFLoader + VRMLoaderPlugin.
 * Handles model loading, cleanup, and instant switching.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { VRM } from "@pixiv/three-vrm";

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

  // Initialize loader once
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
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
          VRMUtils.deepDispose(currentVrmRef.current.scene);
          currentVrmRef.current = null;
        }

        const gltf = await loaderRef.current.loadAsync(path);
        const newVrm = gltf.userData.vrm as VRM;

        if (!newVrm) {
          throw new Error("No VRM data found in file");
        }

        // Optimize joints
        VRMUtils.removeUnnecessaryJoints(newVrm.scene);

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
        VRMUtils.deepDispose(currentVrmRef.current.scene);
      }
    };
  }, [scene]);

  return { vrm, isLoading, error, modelName, loadModel };
}
