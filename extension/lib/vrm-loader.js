/**
 * VRM Loader — Load VRM 0.x models from blob URLs or paths
 * ============================================================
 * Ported from frontend/src/features/animate-avatar/model/useVRM.ts
 * Uses Three.js GLTFLoader + VRM.from() for VRM 0.x spec.
 */

import * as THREE from "https://esm.sh/three@0.137.4";
import { GLTFLoader } from "https://esm.sh/three@0.137.4/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMUtils } from "https://esm.sh/@pixiv/three-vrm@0.6.11";

/** Dispose all geometries and materials in a scene tree */
function disposeScene(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      for (const mat of materials) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
    }
  });
}

class VRMLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.loader.crossOrigin = "anonymous";
    /** @type {VRM|null} */
    this.vrm = null;
  }

  /**
   * Load a VRM model from a URL (can be blob:// URL from IndexedDB).
   * @param {string} url — VRM file URL
   * @param {THREE.Scene} scene — Three.js scene to add the model to
   * @returns {Promise<VRM>}
   */
  async load(url, scene) {
    // Clean up previous model
    if (this.vrm) {
      scene.remove(this.vrm.scene);
      disposeScene(this.vrm.scene);
      this.vrm = null;
    }

    const gltf = await this.loader.loadAsync(url);

    // VRM 0.x: remove unnecessary joints BEFORE VRM.from()
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    // VRM 0.x: use VRM.from(gltf) — NOT gltf.userData.vrm
    const vrm = await VRM.from(gltf);

    // Rotate 180° to face camera
    vrm.scene.rotation.y = Math.PI;

    scene.add(vrm.scene);
    this.vrm = vrm;
    return vrm;
  }

  /** Dispose the current model */
  dispose(scene) {
    if (this.vrm && scene) {
      scene.remove(this.vrm.scene);
      disposeScene(this.vrm.scene);
      this.vrm = null;
    }
  }
}

export { VRMLoader, disposeScene };
