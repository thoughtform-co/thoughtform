"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { BrandmarkPointCloud } from "./BrandmarkPointCloud";
import { IntelligenceChamber } from "./chambers/IntelligenceChamber";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { GatewayWorld } from "./gates/GatewayWorld";
import { ScrollStreaks } from "./ScrollStreaks";
import { StaticStarfield } from "./StaticStarfield";
import { CAMERA_FOV, CAMERA_START, getCameraLookAt } from "./sceneGeom";

/**
 * DepthGatewayScene — shared R3F canvas for the home-v2 depth
 * corridor (ADR-018).
 *
 * Scene composition (paint order, near → far):
 *
 *   - StaticStarfield  : non-animated background stars
 *   - ScrollStreaks    : near-camera streaks driven by scroll velocity
 *                         (invisible when idle)
 *   - GatewayWorld     : world-space diagram gates (Thoughtform,
 *                         Diagnostic, Interstitial). Each gate paints
 *                         at its station Z and fades in/out via its
 *                         own visibility envelope.
 *   - BrandmarkPointCloud : substrate-morph cover during the
 *                         intelligence beat only (covers the cut from
 *                         the projected vector actor to the sphere).
 *   - IntelligenceChamber : L/R side bodies, fade in during the
 *                         intelligence beat.
 *
 * The PRIMARY brandmark painter is the DOM-side
 * `ProjectedBrandmarkActor` (`components/landing/home-v2/
 * ProjectedBrandmarkActor.tsx`), NOT a member of this canvas.
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

  const [lx, ly, lz] = getCameraLookAt(0);

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
      <FlyingCameraRig />
      <StaticStarfield />
      <ScrollStreaks />
      <GatewayWorld />
      <BrandmarkPointCloud />
      <IntelligenceChamber />
    </Canvas>
  );
}
