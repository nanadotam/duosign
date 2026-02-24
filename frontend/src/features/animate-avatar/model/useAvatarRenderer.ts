"use client";

/**
 * useAvatarRenderer — Three.js scene management
 * ================================================
 * Creates and manages the Three.js renderer, scene, camera, and lights.
 * Supports three view mode camera presets and handles resize.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ViewMode } from "@/entities/avatar/types";

interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  orbitEnabled: boolean;
}

const CAMERA_PRESETS: Record<ViewMode, CameraPreset> = {
  interpreter: {
    position: [0, 1.2, 1.2],
    target: [0, 1.3, 0],
    fov: 60,
    orbitEnabled: false,
  },
  fullbody: {
    position: [0, 0.9, 1.8],
    target: [0, 1.0, 0],
    fov: 60,
    orbitEnabled: false,
  },
  world: {
    position: [0, 1.0, 2.5],
    target: [0, 1.2, 0],
    fov: 55,
    orbitEnabled: true,
  },
};

interface UseAvatarRendererReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  scene: THREE.Scene | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  fps: number;
}

export function useAvatarRenderer(): UseAvatarRendererReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>("interpreter");
  const [fps, setFps] = useState(0);

  // Internal refs (not reactive — used in render loop)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const rafRef = useRef<number>(0);
  const fpsFrames = useRef(0);
  const fpsTime = useRef(0);

  // Initialize scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Match original script.js: no outputEncoding, no toneMapping.
    // Default LinearEncoding + NoToneMapping preserves the VRM's original colors.
    // Setting sRGBEncoding washes out the model, making it appear pale.
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const newScene = new THREE.Scene();
    sceneRef.current = newScene;
    setScene(newScene);

    // Camera
    const preset = CAMERA_PRESETS.interpreter;
    const camera = new THREE.PerspectiveCamera(preset.fov, 1, 0.1, 100);
    camera.position.set(...preset.position);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(...preset.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enabled = preset.orbitEnabled;
    controls.update();
    controlsRef.current = controls;

    // Lighting — matches original script.js: single directional light, no ambient.
    // Ambient/fill lights wash out the VRM model making it pale.
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    newScene.add(light);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const { clientWidth: w, clientHeight: h } = container;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Render loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();

      // FPS counter
      fpsFrames.current++;
      fpsTime.current += delta;
      if (fpsTime.current >= 1.0) {
        setFps(Math.round(fpsFrames.current / fpsTime.current));
        fpsFrames.current = 0;
        fpsTime.current = 0;
      }

      if (controlsRef.current?.enabled) {
        controlsRef.current.update();
      }

      renderer.render(newScene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // View mode switching
  const setViewMode = useCallback((mode: ViewMode) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const preset = CAMERA_PRESETS[mode];

    // Animate camera transition
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...preset.position);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(...preset.target);
    const startFov = camera.fov;
    const endFov = preset.fov;

    let t = 0;
    const duration = 0.5; // seconds
    const startTime = performance.now();

    const animateTransition = () => {
      t = Math.min((performance.now() - startTime) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.fov = startFov + (endFov - startFov) * ease;
      camera.updateProjectionMatrix();
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        controls.enabled = preset.orbitEnabled;
      }
    };

    // Disable orbit during transition
    controls.enabled = false;
    animateTransition();
    setViewModeState(mode);
  }, []);

  return { containerRef, scene, viewMode, setViewMode, fps };
}
