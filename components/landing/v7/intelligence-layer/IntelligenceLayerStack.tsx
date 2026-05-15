"use client";

import { Canvas } from "@react-three/fiber";
import { BrandmarkRingfield } from "./BrandmarkRingfield";
import { CAMERA_PARAMS } from "./intelligenceLayerGeom";

/**
 * IntelligenceLayerStack — thin R3F Canvas host for the
 * `BrandmarkRingfield` scene (ADR-012 v5).
 *
 * The interesting stuff lives in `BrandmarkRingfield` (the brandmark
 * particle cloud + three coaxial hairline rings + bearing ticks +
 * diamond markers + sub-orbits + halo dots + flow arcs); this
 * wrapper just constructs the Canvas with the perspective camera
 * framing and the no-shadows, low-power gl config.
 *
 * Mounted by `IntelligenceLayerPortal` into the
 * `[data-ilayer-stack-root]` placeholder in the v7 prototype HTML.
 *
 * Camera framing:
 *   - PerspectiveCamera at [0, 0.6, 3.4], fov 32, lookAt [0, 0, 0]
 *   - Slight elevation so the 3/4 view at the SETTLE / HOLD beat
 *     reads with depth without exaggerating the perspective.
 *   - Static — rotation lives on the parent group, not the camera.
 */
export function IntelligenceLayerStack() {
  return (
    <Canvas
      camera={{
        fov: CAMERA_PARAMS.fov,
        position: CAMERA_PARAMS.position,
        near: CAMERA_PARAMS.near,
        far: CAMERA_PARAMS.far,
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
      <BrandmarkRingfield />
    </Canvas>
  );
}
