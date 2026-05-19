"use client";

import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { CAMERA_PARAMS } from "./intelligenceLayerGeom";
import { TriadScene } from "./TriadScene";

/**
 * IntelligenceLayerStack — R3F host for the celestial triad (ADR-016).
 *
 * Orthographic camera with a mild X/Y tilt so orbital rings read as
 * orbits rather than flat overlapping ellipses. The scene composes
 * three `CelestialBody` groups plus a `CometStream` connector.
 */
export function IntelligenceLayerStack() {
  return (
    <Canvas
      orthographic
      camera={{
        zoom: CAMERA_PARAMS.zoom,
        position: CAMERA_PARAMS.position,
        near: CAMERA_PARAMS.near,
        far: CAMERA_PARAMS.far,
      }}
      onCreated={({ camera }) => {
        const [lx, ly, lz] = CAMERA_PARAMS.lookAt;
        camera.lookAt(lx, ly, lz);
        const [rx, ry, rz] = CAMERA_PARAMS.rotation;
        camera.rotation.set(rx, ry, rz);
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
      <OrthographicCamera
        makeDefault
        zoom={CAMERA_PARAMS.zoom}
        position={CAMERA_PARAMS.position}
        near={CAMERA_PARAMS.near}
        far={CAMERA_PARAMS.far}
      />
      <TriadScene />
    </Canvas>
  );
}
