"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { BrandmarkPointCloud } from "./BrandmarkPointCloud";
import { IntelligenceChamber } from "./chambers/IntelligenceChamber";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { StreamingDust } from "./StreamingDust";
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_START } from "./sceneGeom";

/**
 * DepthGatewayScene — shared R3F canvas for the home-v2 sticky stage.
 *
 * Lean composition. The orbital constellation, sigil compass, and
 * HUD chamber captions come from the v7 markup (DOM siblings of this
 * canvas), so they're NOT in the R3F tree.
 *
 *   - FlyingCameraRig: forward Z dolly across stage progress (z=8 → z=3).
 *   - StreamingDust: ambient particle field flowing far-Z → near-Z.
 *     Provides the "traveling through space" signal regardless of
 *     which chamber is active. Velocity-reactive — flow speeds up
 *     when the user is actively scrolling.
 *   - BrandmarkPointCloud: persistent traveling artifact. Lerps
 *     between two world stations (A → B) so the brandmark moves
 *     smoothly through scene space instead of teleporting between
 *     DOM dock positions. Shape morph from sigil → Fibonacci sphere
 *     during chamber C.
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
      {/* StreamingDust paints behind the brandmark + L/R bodies —
          provides the constant z-axis travel signal even when
          chamber content is static. */}
      <StreamingDust />
      <BrandmarkPointCloud />
      <IntelligenceChamber />
    </Canvas>
  );
}
