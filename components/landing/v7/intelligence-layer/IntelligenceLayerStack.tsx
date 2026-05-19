"use client";

import { Canvas } from "@react-three/fiber";
import { CAMERA_PARAMS, CAMERA_TILT } from "./intelligenceLayerGeom";
import { TriadScene } from "./TriadScene";

/**
 * IntelligenceLayerStack — R3F host for the celestial triad (ADR-016).
 *
 * Perspective camera (revised 2026-05-19) — orthographic with a small
 * fixed zoom previously made spheres render at ~70px and collapsed
 * bodies to ~45%/55% NDC. Perspective keeps the layout consistent
 * across viewports without per-canvas zoom recompute.
 */
export function IntelligenceLayerStack() {
  return (
    <Canvas
      camera={{
        fov: CAMERA_PARAMS.fov,
        near: CAMERA_PARAMS.near,
        far: CAMERA_PARAMS.far,
        position: CAMERA_PARAMS.position,
      }}
      onCreated={({ camera }) => {
        const [lx, ly, lz] = CAMERA_PARAMS.lookAt;
        camera.lookAt(lx, ly, lz);
      }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }}
      frameloop="always"
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <group rotation={[CAMERA_TILT.x, CAMERA_TILT.y, 0]}>
        <TriadScene />
      </group>
    </Canvas>
  );
}
