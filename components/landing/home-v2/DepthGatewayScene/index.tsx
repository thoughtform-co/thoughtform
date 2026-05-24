"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { GatewayWorld } from "./gates/GatewayWorld";
import { InterGateCorridor } from "./InterGateCorridor";
import { ScrollStreaks } from "./ScrollStreaks";
import { StaticStarfield } from "./StaticStarfield";
import { ThoughtformAtmosphere } from "./ThoughtformAtmosphere";
import { CAMERA_FOV, CAMERA_START, getCameraLookAt } from "./sceneGeom";

/**
 * DepthGatewayScene — single R3F canvas for the home-v2 depth
 * corridor (ADR-018, world-owned rebuild).
 *
 * Scene composition (paint order, near -> far):
 *
 *   - StaticStarfield       : non-animated deep-space background.
 *   - ThoughtformAtmosphere : dense local star cluster behind the
 *                             Thoughtform gate plus a soft gold
 *                             shockwave ring that pulses at the
 *                             pan-completion boundary ("stargate
 *                             locked into view"). Scoped to the
 *                             Thoughtform beat + early
 *                             passthrough-01 via camera-space
 *                             depth focus.
 *   - InterGateCorridor     : depth-stacked debris bands at
 *                             intermediate Z stations between the
 *                             gate groups — the
 *                             "spaceship-flying-through-space"
 *                             atmosphere between gates.
 *   - ScrollStreaks         : near-camera streaks driven by scroll
 *                             velocity (invisible when idle).
 *   - GatewayWorld          : the four world-rigid gate groups
 *                             (Thoughtform, Diagnostic,
 *                             Interstitial, Intelligence). Each
 *                             gate paints at its station Z and
 *                             self-manages its visibility envelope.
 *
 * The PRIMARY brandmark painter is the DOM-side
 * `ProjectedBrandmarkActor` — its world position is interpolated
 * between gate centres and projected through a mirror camera
 * tracing the same path. The substrate-cut at intelligence is
 * handled inside the `IntelligenceGate` group itself (no separate
 * top-level `BrandmarkPointCloud`).
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
      <ThoughtformAtmosphere />
      <InterGateCorridor />
      <ScrollStreaks />
      <GatewayWorld />
    </Canvas>
  );
}
