/**
 * AvatarRenderer — Three.js scene management for VRM rendering
 * ================================================================
 * Ported from frontend/src/features/animate-avatar/model/useAvatarRenderer.ts
 * Creates renderer, scene, camera, lights, and render loop.
 * Used by the side panel when in "Avatar 3D" mode.
 */

import * as THREE from "./vendor/three.module.js";
import { getRenderVRM } from "./vendor/duosign-rig.module.js";

const CAMERA_PRESETS = {
  interpreter: {
    position: [0, 1.1, 1.6],  // further back so arms stay in frame
    target: [0, 1.1, 0],      // look at mid-chest — keeps hands visible
    fov: 55,
  },
  fullbody: {
    position: [0, 0.9, 2.2],
    target: [0, 1.0, 0],
    fov: 55,
  },
};

class AvatarRenderer {
  /**
   * @param {HTMLElement} container — DOM element to mount the Three.js canvas in
   */
  constructor(container) {
    this.container = container;
    this.rafId = 0;
    this.fps = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._clock = new THREE.Clock();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera — default to interpreter view
    const preset = CAMERA_PRESETS.interpreter;
    this.camera = new THREE.PerspectiveCamera(preset.fov, 1, 0.1, 100);
    this.camera.position.set(...preset.position);
    this.camera.lookAt(...preset.target);

    // Lighting — single directional light (matches original script.js)
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    this.scene.add(light);

    // Resize handling
    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(container);
    this._handleResize();

    // Start render loop
    this._animate();
  }

  _handleResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    this.rafId = requestAnimationFrame(() => this._animate());

    const rawDelta = this._clock.getDelta();
    const delta = Math.min(rawDelta, 0.05); // Cap at 50ms

    // Update VRM spring physics (hair, cloth)
    const vrm = getRenderVRM();
    if (vrm) vrm.update(delta);

    // FPS counter
    this._fpsFrames++;
    this._fpsTime += delta;
    if (this._fpsTime >= 1.0) {
      this.fps = Math.round(this._fpsFrames / this._fpsTime);
      this._fpsFrames = 0;
      this._fpsTime = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /** Zoom — set camera distance along Z (keeps X/Y from current preset) */
  setZoom(z) {
    this.camera.position.z = Math.max(0.5, Math.min(4.0, z));
  }

  /** Switch camera to a preset view */
  setViewMode(mode) {
    const preset = CAMERA_PRESETS[mode] || CAMERA_PRESETS.interpreter;
    this.camera.position.set(...preset.position);
    this.camera.fov = preset.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(...preset.target);
  }

  /** Clean up */
  dispose() {
    cancelAnimationFrame(this.rafId);
    this._resizeObserver.disconnect();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export { AvatarRenderer, CAMERA_PRESETS };
