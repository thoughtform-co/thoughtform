"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { AstrogationField } from "./AstrogationField";
import { BrandmarkAccretionShell } from "./BrandmarkAccretionShell";
import { CelestialMotes } from "./CelestialMotes";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { GatewayWorld } from "./gates/GatewayWorld";
import { InterGateCorridor } from "./InterGateCorridor";
import { LatentFieldTunnel } from "./LatentFieldTunnel";
import { LatentTopographyContours } from "./LatentTopographyContours";
import { LatentWormholeWalls } from "./LatentWormholeWalls";
import { ScrollStreaks } from "./ScrollStreaks";
import { StaticStarfield } from "./StaticStarfield";
import { ThoughtformAtmosphere } from "./ThoughtformAtmosphere";
import { CAMERA_START, getCameraFov, getCameraLookAt } from "./sceneGeom";

/** Current viewport aspect (browser only; safe fallback on server).
 *  Used only for the Canvas's initial camera fov; `FlyingCameraRig`
 *  owns the live fov + resize sync thereafter. */
function viewportAspect(): number {
  if (typeof window === "undefined") return 16 / 9;
  return window.innerWidth / window.innerHeight;
}

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
 *   - LatentWormholeWalls   : subtle particle-based wormhole shell
 *                             that wraps BOTH passthrough legs.
 *                             Longitudinal dotted rails around an
 *                             oval cross-section + 3 aperture
 *                             depth-gate frames per leg + a low
 *                             topographic shelf. World-fixed
 *                             geometry; the camera flies through
 *                             the walls. Each leg has its own
 *                             progress reveal so parked beats stay
 *                             clean — the wormhole opens AFTER the
 *                             user leaves Thoughtform, then again
 *                             AFTER they leave Diagnostic. Inspired
 *                             by the archived latent-cases topology
 *                             (`celestialGatewayGeometry.ts`),
 *                             scaled to subtle so it never reads
 *                             as a literal grid tube.
 *   - LatentTopographyContours : world-fixed contour shards + ridge
 *                             arcs + gradient arrows distributed
 *                             along BOTH passthrough legs. Reads
 *                             as the level sets of a loss surface
 *                             the camera is flying past. Paints
 *                             ABOVE the wormhole walls so contours
 *                             register on top of the rail lattice
 *                             rather than competing with it. Unlike
 *                             LatentFieldTunnel (camera-relative
 *                             ambient particles), every shard
 *                             lives at a fixed world Z — the
 *                             camera literally flies past each
 *                             one. Reinforces the "real depth
 *                             corridor" read with abstract latent-
 *                             space content instead of literal
 *                             equation glyphs.
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
 *   - GatewayWorld          : world-rigid gate groups (Thoughtform,
 *                             Navigate, Interstitial, Intelligence).
 *                             Each gate paints at its station Z and
 *                             self-manages its visibility envelope.
 *                             The Encode (Diagnostic) station has no
 *                             standalone gate — its constellation
 *                             arrives via the accreted shell.
 *   - BrandmarkAccretionShell : inside-out intelligence-layer shell
 *                             that accretes around the brandmark
 *                             as it travels (substrate dodecahedron
 *                             + inner geodesic at Navigate; solar-
 *                             system source orbits at Encode; outer
 *                             surfaces skin at Build). Tracks
 *                             `getBrandmarkWorldPosition` per frame
 *                             so the shell follows the mark through
 *                             lead mode. Reveals owned by
 *                             `CORRIDOR_TIMELINE.accretion`. The
 *                             mark itself never changes — what
 *                             surrounds it does. Lands co-located
 *                             with `SubstrateMorphCloud` so the
 *                             assembled shell wraps the substrate
 *                             sphere at the climax. See ADR-013 +
 *                             the shell-into-corridor pass.
 *
 * The PRIMARY brandmark painter is the DOM-side
 * `ProjectedBrandmarkActor` — its world position is interpolated
 * between gate centres and projected through a mirror camera
 * tracing the same path. The substrate-cut at intelligence is
 * handled inside the `IntelligenceGate` group itself (no separate
 * top-level `BrandmarkPointCloud`).
 *
 * WebGL availability + reduced-motion gating live in `HomeV2Page`;
 * this component is only mounted when the corridor mode is active,
 * so no probe is needed here.
 */
export function DepthGatewayScene() {
  const tier = useDeviceTier();
  const [lx, ly, lz] = getCameraLookAt(0);
  // `glEpoch` is bumped on `webglcontextrestored` to force a Canvas
  // remount so all `useMemo` geometry rebuilds against the fresh
  // context — phones drop GL contexts under memory pressure /
  // backgrounding. (ADR-018 mobile revision.)
  const [glEpoch, setGlEpoch] = useState(0);

  // Engagement-gated render loop. The Canvas is mounted for the whole
  // page, but it only needs to draw while the corridor stage is on
  // screen — `active` (pinned & in view) or `armed` (rising into the
  // pin). While engaged we run `frameloop="always"` so the layers that
  // animate on continuous clock time (ThoughtformAtmosphere twinkle +
  // boot-glow breathing, LatentFieldTunnel embedding-vector twinkle,
  // InterGateCorridor debris spin) keep moving even when the user is
  // parked and reading. While disengaged the corridor is fully
  // off-screen, so we drop to `"demand"` and the GPU idles — nothing
  // the user can see freezes. (ADR-018 mobile/perf revision.)
  //
  // A boolean selector re-renders only on the engage/disengage edge,
  // not per scroll frame. Initialise from the live store so the first
  // paint already matches engagement (mirrors HomeCorridor's brandmark
  // handoff effect, which reads the same signal).
  const [engaged, setEngaged] = useState(() => {
    const t = useDepthGatewayStore.getState().transform;
    return t.active || t.armed;
  });
  useEffect(() => {
    const unsubscribe = useDepthGatewayStore.subscribe((state) =>
      setEngaged(state.transform.active || state.transform.armed)
    );
    return unsubscribe;
  }, []);

  // Mobile performance tier: cap the drawing-buffer pixel ratio (phones
  // report DPR ~3, so [1, 1.4] is the dominant GPU lever) and drop MSAA
  // (expensive on a high-DPR panel; the dpr cap carries edge quality).
  const isMobile = tier === "mobile";
  const dpr: [number, number] = isMobile ? [1, 1.4] : [1, 1.75];

  return (
    <Canvas
      key={glEpoch}
      className="home-v2-stage__canvas-inner"
      camera={{
        fov: getCameraFov(viewportAspect()),
        near: 0.1,
        far: 100,
        position: CAMERA_START,
      }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(lx, ly, lz);
        const canvas = gl.domElement;
        const onLost = (e: Event) => {
          // Preventing default lets the browser restore the context
          // (otherwise `webglcontextrestored` never fires).
          e.preventDefault();
        };
        const onRestored = () => setGlEpoch((n) => n + 1);
        canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
      }}
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: !isMobile,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }}
      frameloop={engaged ? "always" : "demand"}
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
      <LatentWormholeWalls />
      <LatentTopographyContours />
      <CelestialMotes />
      <ScrollStreaks />
      <AstrogationField isMobile={isMobile} />
      <GatewayWorld />
      {/* BrandmarkAccretionShell — inside-out intelligence-layer
          shell that accretes around the brandmark as it travels
          (substrate brain at Navigate; solar-system source orbits
          at Encode; outer surfaces skin at Build). Mounted AFTER
          the gate world so its additive line geometry overlays
          gate geometry rather than being occluded by it. Tracks
          `getBrandmarkWorldPosition` per frame; lands co-located
          with `SubstrateMorphCloud` (inside IntelligenceGate) so
          the assembled shell wraps the substrate sphere at the
          climax. See ADR-013 + the shell-into-corridor pass. */}
      <BrandmarkAccretionShell />
    </Canvas>
  );
}
