"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { CelestialMotes } from "./CelestialMotes";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { GatewayWorld } from "./gates/GatewayWorld";
import { InterGateCorridor } from "./InterGateCorridor";
import { LatentFieldTunnel } from "./LatentFieldTunnel";
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
 *   - LatentFieldTunnel     : layered latent-space visualisation —
 *                             rank-tiered point cloud + faint
 *                             embedding-vector linework + sparse
 *                             PT Mono token motes. Frames the
 *                             brandmark as flying through the
 *                             substrate of intelligence rather than
 *                             through a starfield. STILL at rest,
 *                             flows ONLY with scroll velocity, peaks
 *                             through the Thoughtform boot envelope.
 *   - CelestialMotes        : a small set of sphere-shaped particle
 *                             clusters that fly past the camera like
 *                             planetoids — the celestial-navigation
 *                             companion to the latent field's
 *                             abstract substrate. Star Atlas-
 *                             inspired. Motion gated on scroll
 *                             velocity (no idle drift, no idle
 *                             rotation).
 *   - ScrollStreaks         : near-camera streaks driven by scroll
 *                             velocity (invisible when idle). The
 *                             warm punctuation layer on top of the
 *                             cool LatentFieldTunnel + CelestialMotes.
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
      <LatentFieldTunnel />
      <CelestialMotes />
      <ScrollStreaks />
      <GatewayWorld />
    </Canvas>
  );
}
