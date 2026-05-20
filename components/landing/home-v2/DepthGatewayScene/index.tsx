"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { BrandmarkPointCloud } from "./BrandmarkPointCloud";
import { IntelligenceChamber } from "./chambers/IntelligenceChamber";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_START } from "./sceneGeom";

/**
 * DepthGatewayScene — shared R3F canvas for the home-v2 sticky stage.
 *
 * Lean composition: one camera rig + one brandmark point cloud +
 * the chamber-C L/R bodies. The orbital constellation, sigil
 * compass, and HUD chamber captions come from the v7 markup (the
 * DOM siblings of this canvas), so they're NOT in the R3F tree.
 *
 *   - FlyingCameraRig: subtle Z dolly across stage progress.
 *   - BrandmarkPointCloud: persistent point cloud anchored to the
 *     active chamber's brandmark dock element via DOM un-projection.
 *     Shape morph from sigil → Fibonacci sphere during chamber C.
 *   - IntelligenceChamber: L/R celestial bodies (Trusted Sources +
 *     Headless Surfaces). Fade in during chamber C only.
 *
 * Probes WebGL on mount; renders nothing if unavailable or
 * prefers-reduced-motion is set (the page paints its own fallback).
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
      <IntelligenceChamber />
    </Canvas>
  );
}
