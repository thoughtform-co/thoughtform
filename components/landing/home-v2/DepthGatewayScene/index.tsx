"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { BrandmarkPointCloud } from "./BrandmarkPointCloud";
import { ChamberLabels } from "./ChamberLabels";
import { DiagnosticChamber } from "./chambers/DiagnosticChamber";
import { IntelligenceChamber } from "./chambers/IntelligenceChamber";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_START } from "./sceneGeom";

/**
 * DepthGatewayScene — the shared R3F canvas for the home-v2 sticky
 * stage. Owns one camera rig + one brandmark point cloud + the
 * Diagnostic ring constellation + the Intelligence L/R bodies, all
 * mounted inside the same `<Canvas>` so they share a single GL
 * context, a single render loop, and a single camera.
 *
 * The Definition chamber has no 3D content of its own — its visual
 * register is the brandmark (this canvas) + the DOM text plane
 * (rendered by `HomeV2Page` as an HTML overlay). The camera dolly
 * carries the user from Chamber A through C; the brandmark cloud
 * morphs across; the rings emerge in Chamber B; the L/R bodies fade
 * in during Chamber C.
 *
 * Probes WebGL on mount; renders nothing if WebGL is unavailable
 * (the page's static fallback paints instead, see `HomeV2Page`).
 *
 * `prefers-reduced-motion` also opts out of the canvas — the static
 * fallback gives the same content in a stacked layout without the
 * z-axis dolly.
 */
export function DepthGatewayScene() {
  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglOK(probeWebGL());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (webglOK === null) return null;
  if (!webglOK || reducedMotion) return null;

  return (
    <Canvas
      className="home-v2-stage__canvas-inner"
      camera={{
        fov: CAMERA_FOV,
        near: 0.1,
        far: 100,
        position: CAMERA_START,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(CAMERA_LOOK_AT[0], CAMERA_LOOK_AT[1], CAMERA_LOOK_AT[2]);
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
      <FlyingCameraRig />
      <BrandmarkPointCloud />
      <DiagnosticChamber />
      <IntelligenceChamber />
      <ChamberLabels />
    </Canvas>
  );
}
