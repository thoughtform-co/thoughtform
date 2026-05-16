"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitField } from "./OrbitField";
import { CAMERA_PARAMS } from "./intelligenceLayerGeom";

/**
 * IntelligenceLayerStack — thin R3F Canvas host for the `OrbitField`
 * scene (ADR-014).
 *
 * The interesting stuff lives in `OrbitField` (the two side-orbit
 * hairlines, decorative diamond pips, the faint substrate guide
 * ring + halo); this wrapper just constructs the Canvas with the
 * front-on perspective camera and the no-shadows, low-power gl
 * config.
 *
 * Camera framing (ADR-014):
 *   - PerspectiveCamera at [0, 0, 4.0], fov 26, lookAt [0, 0, 0].
 *   - FRONT-ON. No Y elevation, no Y rotation anywhere in the scene
 *     — the orbital triad reads as three coplanar circles, not
 *     three foreshortened ellipses.
 *   - Static — there is no rotation in the new model.
 *
 * Mounted by `IntelligenceLayerPortal` into the
 * `[data-ilayer-stack-root]` placeholder in the v7 prototype HTML.
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
      <OrbitField />
    </Canvas>
  );
}
