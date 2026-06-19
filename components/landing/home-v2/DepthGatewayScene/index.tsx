"use client";

import { useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { BrandmarkAccretionShell } from "./BrandmarkAccretionShell";
import { BrandmarkPhysicsCoreActor } from "./BrandmarkPhysicsCoreActor";
import { CelestialMotes } from "./CelestialMotes";
import { CorridorPhotons } from "./CorridorPhotons";
import { FlyingCameraRig } from "./FlyingCameraRig";
import { GatewayThroat } from "./GatewayThroat";
import { GatewayWorld } from "./gates/GatewayWorld";
import { InterGateCorridor } from "./InterGateCorridor";
import { LatentFieldTunnel } from "./LatentFieldTunnel";
import { LatentWormholeWalls } from "./LatentWormholeWalls";
import { driveMotionFollower } from "./motionFollower";
import { ScrollStreaks } from "./ScrollStreaks";
import { StaticStarfield } from "./StaticStarfield";
import { SubstrateTopography } from "./SubstrateTopography";
import { ThoughtformAtmosphere } from "./ThoughtformAtmosphere";
import {
  CAMERA_START,
  getBrandmarkAccretionLayers,
  getCameraFov,
  getCameraLookAt,
  getThoughtformCenterOffsetX,
} from "./sceneGeom";

/**
 * MotionFollowerDriver — advances the temporal-smoothing follower
 * (see `motionFollower.ts`) once per frame BEFORE every painter
 * (useFrame priority -10). Computes the raw scroll-scrubbed targets
 * from the pure `sceneGeom` envelopes and lets the follower chase
 * them, so the pan + accretion reveals always play out elegantly
 * even when the user flicks through a window in a single frame.
 */
function MotionFollowerDriver() {
  useFrame((_, delta) => {
    const {
      paintProgress,
      epilogueProgress,
      active,
      armed,
      docked,
      dockProgress,
      servicesAmbient,
    } = useDepthGatewayStore.getState().transform;
    const layers = getBrandmarkAccretionLayers(paintProgress);
    // Pass `active || armed || docked || servicesAmbient` so the follower
    // eases continuously across the active <-> armed boundary (corridor
    // entry seam) AND across the dock <-> ambient-hold boundary (corridor
    // exit seam). The previous `active || docked` flag flipped to false
    // during armed, which combined with the follower's `!active` snap
    // rule caused a visible bounce on reverse scroll back across the
    // seam. The follower's snap-on-real-discontinuities (teleport / idle
    // resume) covers genuine jumps; armed and the services ambient hold
    // are continuous neighbours of active/docked.
    driveMotionFollower(
      {
        panOffsetX: getThoughtformCenterOffsetX(paintProgress),
        substrate: layers.substrate,
        orbits: layers.orbits,
        stack: layers.stack,
        epilogue: epilogueProgress,
        // Dissipate target is the raw (smootherstep-ramped) dock scrub
        // while docked. During the services ambient hold the dock has
        // released but the camera + sphere painters should stay parked
        // at the inside-the-sphere pose (dissipate ≈ 1) so the ambient
        // haze reads as a continuation of the dock pose rather than
        // snapping back to the parked-planet view. 0 otherwise so
        // reverse-scroll out of the dock eases the fly-into-sphere
        // back out instead of snapping.
        dissipate: docked ? dockProgress : servicesAmbient ? 1 : 0,
      },
      delta,
      paintProgress,
      active || armed || docked || servicesAmbient
    );
  }, -10);
  return null;
}

/**
 * FrameInvalidator — keeps the render loop running continuously for as
 * long as the corridor is engaged (`active` / `armed` / `docked`).
 *
 * The Canvas runs `frameloop="demand"` while the corridor is fully
 * off-screen so the GPU idles. R3F's demand mode only paints when
 * `invalidate()` is called, and toggling the `frameloop` prop back to
 * `"always"` does NOT reliably restart the internal loop after a demand
 * cycle.
 *
 * The previous version only invalidated on each ENGAGED store *change*.
 * That self-heals re-entry while the user is actively scrolling, but the
 * moment they stop, the store stops changing, no more frames are
 * scheduled, and the loop dies even though the corridor is still on
 * screen and engaged. Every per-frame accumulator then freezes at
 * whatever value it held on the last scroll tick:
 *
 *   - the motion follower's `epilogue` channel stays pinned near 1 after
 *     scrolling back from the services/epilogue, so the substrate gimbal
 *     is stranded in its "planet" state (instrument wireframe faded out
 *     by `buildOutFade`, assembly inflated by `getEpiloguePlanetScale`),
 *     reading as a diffuse scattered cloud instead of the structured
 *     sphere;
 *   - `LatentWormholeWalls`' opacity ramp stays at the value it froze on,
 *     so corridor-wall segments read as missing.
 *
 * A self-perpetuating rAF that calls `invalidate()` every frame WHILE
 * ENGAGED guarantees the follower + painter accumulators keep advancing
 * to their live targets (and snap on resume), so scroll-back always
 * resolves to the correct parked composition. The pump stops the instant
 * the corridor scrolls fully off screen, so the GPU still idles when
 * disengaged. (ADR-018 scroll-reentry fix, v2.)
 */
function FrameInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let engaged = false;

    const isEngaged = () => {
      const t = useDepthGatewayStore.getState().transform;
      // Includes `servicesAmbient` (ADR-021 addendum) so the demand
      // loop keeps the canvas painting during the inside-the-sphere
      // hold beat after the dock has released; without it the
      // interior haze freezes the moment the user stops scrolling
      // inside #services.
      return t.active || t.armed || t.docked || t.servicesAmbient;
    };

    const pump = () => {
      if (!engaged) {
        raf = 0;
        return;
      }
      invalidate();
      raf = requestAnimationFrame(pump);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(pump);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    engaged = isEngaged();
    if (engaged) start();

    const unsubscribe = useDepthGatewayStore.subscribe(() => {
      const next = isEngaged();
      if (next && !engaged) {
        engaged = true;
        start();
      } else if (!next && engaged) {
        engaged = false;
        stop();
        // Paint one final frame so painters settle into their
        // disengaged (hidden) state before the loop idles.
        invalidate();
      }
    });

    return () => {
      engaged = false;
      stop();
      unsubscribe();
    };
  }, [invalidate]);
  return null;
}

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
 *   - SubstrateTopography   : the realm OUTSIDE the wormhole — a
 *                             latent-topography particle landscape
 *                             extending into the distance behind
 *                             the Build station. Invisible across
 *                             the whole corridor; blooms outward
 *                             from the exit threshold across
 *                             [0.848, 0.93], synchronized with the
 *                             exit-glow peak + mouth-ring yield
 *                             (v3.12 realm-transition pass).
 *                             Recedes during the epilogue flyover.
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
 *                             as it travels (gold geodesic at
 *                             Navigate; judgment orbits at Encode;
 *                             stack funnel dock at Build). Tracks
 *                             `getBrandmarkWorldPosition` per frame
 *                             so the shell follows the mark through
 *                             lead mode. Reveals owned by
 *                             `CORRIDOR_TIMELINE.accretion`. The
 *                             mark itself never changes — what
 *                             surrounds it does. At the Build climax
 *                             the assembled shell wraps the
 *                             persistent DOM brandmark (no particle
 *                             substrate sphere — removed 2026-06-06).
 *                             See ADR-013 + the shell-into-corridor
 *                             pass.
 *
 * The ONLY brandmark painter is the DOM-side
 * `ProjectedBrandmarkActor` — its world position is interpolated
 * between gate centres and projected through a mirror camera
 * tracing the same path. The same 2D SVG mark reads across all
 * three phases; there is no longer a particle substrate-cut at
 * Build (`IntelligenceGate` is now an empty placeholder).
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
    return t.active || t.armed || t.docked;
  });
  useEffect(() => {
    const unsubscribe = useDepthGatewayStore.subscribe((state) =>
      setEngaged(state.transform.active || state.transform.armed || state.transform.docked)
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
      {/* Temporal-smoothing follower — must tick before all painters. */}
      <MotionFollowerDriver />
      {/* Re-entry guard — wakes the demand-mode loop when the corridor
          re-engages so scroll-back never strands a cleared buffer. */}
      <FrameInvalidator />
      <FlyingCameraRig />
      <StaticStarfield />
      {/* SubstrateTopography — the realm OUTSIDE the wormhole: a
          latent-topography landscape extending into the distance
          behind the Build station. Invisible across the whole
          corridor; blooms outward from the exit threshold across
          [0.848, 0.93] as the mouth rings yield and the exit glow
          peaks (v3.12 realm-transition pass). */}
      <SubstrateTopography />
      <ThoughtformAtmosphere />
      {/* GatewayThroat — receding dotted echoes of the portal frame
          behind the Thoughtform gate at the parked beat, so the
          portal visibly has an inside (depth hint of the wormhole).
          Welded to the gate's centering pan; boots with the gateway;
          cross-dissolves out (0.125–0.21) as the real leg-1 wormhole
          walls reveal (0.12–0.24). Paints under the gate linework. */}
      <GatewayThroat />
      <InterGateCorridor />
      <LatentFieldTunnel />
      <LatentWormholeWalls />
      {/* CorridorPhotons — sparse fast comets that fly along the
          wormhole rails as a clock-driven life signal (ADR-018,
          polish round 2). Mounted right after the walls so the
          photons paint on top of the rail dots that share their
          path. */}
      <CorridorPhotons />
      {/* LatentTopographyContours (latent-space contour "mandalas" on the
          Navigate -> Encode leg) removed 2026-06-19 per design request —
          they read as busy hand-drawn orbit decoration between stations.
          Re-add `<LatentTopographyContours />` here to restore them. */}
      <CelestialMotes />
      <ScrollStreaks />
      <GatewayWorld />
      {/* BrandmarkAccretionShell — inside-out intelligence layer that
          accretes around the brandmark (substrate at Navigate;
          judgment orbits at Encode; stack funnel at Build). */}
      <BrandmarkAccretionShell />
      {/* BrandmarkPhysicsCoreActor — luminous 3D particle core that
          ignites the moment the camera flies into the corridor
          (ADR-023). Sits inside the accretion shell as the bright
          centre of the intelligence-layer artifact. The DOM SVG
          (`ProjectedBrandmarkActor`) holds at the section-2
          Thoughtform rest, fades across the ignite band, and the
          core takes over for the rest of the corridor. */}
      <BrandmarkPhysicsCoreActor />
    </Canvas>
  );
}
