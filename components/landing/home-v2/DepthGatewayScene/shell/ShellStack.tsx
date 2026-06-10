"use client";

/**
 * ShellStack — Build accretion layer (stack v3, 2026-06-10 polish r3).
 *
 * Two compact registry columns flanking the intelligence-layer
 * sphere: 5 trusted-source rows (green) on the left, 6 headless-
 * surface rows (dawn) on the right. Each row is a diamond pip
 * connected to the sphere via a static dotted lane (sources) or
 * fan ray (surfaces), through the existing aperture ports at
 * `±0.85` shell-local.
 *
 * Stack v3 fixes the v2 cropping disaster:
 *
 *   - Column X is computed LIVE from the camera frustum via
 *     `getStackColumnLocalX(aspect)` in `sceneGeom.ts`, so the
 *     layout fits 1.5:1 just as well as 16:9 (the previous fixed
 *     ±2.4 always cropped on narrow desktop aspects).
 *   - Lanes / fan are STATIC channels — only the per-row pips slide
 *     INWARD from a small `STACK_ROW_SLIDE_LOCAL_X` offset, so
 *     nothing inside the cluster ever travels off-screen.
 *   - The cluster-level `foldEmerge` (1.45x position overshoot, the
 *     v2 off-frame culprit) is gone. Reveal cadence comes from the
 *     existing per-row `stackItemLock` stagger only — clean snap
 *     into each lane / port, no dramatic flight-in.
 *   - Surface tip diamonds shrink to match source pip size
 *     (`STACK_TIP_OUTLINE_SCALE` / `STACK_TIP_INNER_SCALE`) — the v2
 *     full-`PYLON_CAP_SIZE` outline read as giant detached diamonds.
 *
 * DOM labels grow INWARD toward the sphere (sources `left-center` →
 * text extends right; surfaces `right-center` → text extends left)
 * via the live column X in `sceneGeom.COPY_ANCHORS` — text can never
 * exit the viewport because it only ever extends toward x = 0.
 *
 * Geometry rebuilds on resize (the column X changes with the live
 * aspect ratio); a debounced `resize` listener updates `liveAspect`
 * state, which keys the `useMemo` chain.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  COLOR_SOURCES,
  COLOR_SURFACES,
  PYLON_CAP_SIZE,
  lerp,
} from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  advanceLinearMotes,
  buildDiamondGeometry,
  buildFanLinesGeometry,
  buildFilledDiamondGeometry,
  buildLaneLinesGeometry,
  buildLinearMotes,
  makeLineMaterial,
  makeMeshMaterial,
  makePointsMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedAccretionLayers } from "../motionFollower";
import { getStackColumnLocalX } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  petalStagger,
  STACK_FAN_COUNT,
  STACK_FAN_HALF_HEIGHT,
  STACK_LANE_COUNT,
  STACK_LANE_Y_RANGE,
  STACK_MOTES_PER_LANE,
  STACK_MOTES_PER_RAY,
  STACK_PIP_SCALE,
  STACK_ROW_SLIDE_LOCAL_X,
  STACK_SUBSTRATE_X,
  STACK_TIP_INNER_SCALE,
  STACK_TIP_OUTLINE_SCALE,
} from "./shellGeom";

interface ShellStackProps {
  layerKey: "stack";
  reducedMotion?: boolean;
}

const SOURCE_LANE_OPACITY = 0.65;
const SOURCE_PIP_OPACITY = 0.95;
const SURFACE_FAN_OPACITY = 0.6;
const SURFACE_PIP_OPACITY = 0.9;

/** Cluster-level stagger overlap. 0.30 gives a clear sources →
 *  surfaces handoff while still feeling like one motion. The
 *  cluster stagger now only drives lane/fan opacity fades + sequences
 *  the per-row stagger; no group position offset. */
const STACK_CLUSTER_OVERLAP = 0.3;
/** Per-row lock stagger inside its cluster's window. Each row
 *  scale-snaps + slides inward a short distance in sequence. */
const STACK_ITEM_OVERLAP = 0.55;
const STACK_ITEM_SCALE_FLOOR = 0.6;
const STACK_ITEM_OVERSHOOT = 0.12;

function smootherStack(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Per-row lock progress + scale + inward slide. Used for source
 *  pips and surface tips. `slide` 0..1 ramps from "outer offset"
 *  (row pre-dock) to 1 (row docked at column X). */
export function stackItemLock(
  clusterStagger: number,
  idx: number,
  total: number
): { scale: number; locked: number; slide: number } {
  if (total <= 0) return { scale: 1, locked: 1, slide: 1 };
  const s = petalStagger(clusterStagger, idx, total, STACK_ITEM_OVERLAP);
  const eased = smootherStack(s);
  const base = STACK_ITEM_SCALE_FLOOR + (1 - STACK_ITEM_SCALE_FLOOR) * eased;
  const overshoot = Math.sin(Math.PI * s) * STACK_ITEM_OVERSHOOT * (1 - s);
  return { scale: base + overshoot, locked: s, slide: eased };
}

/** Compute the live viewport aspect for the stack column layout.
 *  Falls back to 16:9 in non-browser contexts. */
function readLiveAspect(): number {
  if (typeof window === "undefined" || !window.innerHeight) return 16 / 9;
  return window.innerWidth / window.innerHeight;
}

/** React hook: live aspect ratio, debounced resize listener. The
 *  geometry `useMemo` chain depends on this so the lanes/fan rebuild
 *  whenever the column X changes (resize, devtools open/close). */
function useStackLiveAspect(): number {
  const [aspect, setAspect] = useState(() => readLiveAspect());
  useEffect(() => {
    let timer: number | null = null;
    const onResize = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setAspect(readLiveAspect());
      }, 80);
    };
    window.addEventListener("resize", onResize);
    return () => {
      if (timer != null) window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return aspect;
}

export function ShellStack({ layerKey, reducedMotion = false }: ShellStackProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const sourcesGroupRef = useRef<THREE.Group>(null);
  const surfacesGroupRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const surfaceMotesRef = useRef<THREE.Points>(null);
  // Per-pip / per-tip group refs so each row can be independently
  // scaled and slid inward via its `stackItemLock` window.
  const sourcePipRefs = useRef<(THREE.Group | null)[]>([]);
  const surfaceTipRefs = useRef<(THREE.Group | null)[]>([]);
  const sourceLanePeakOp = useRef(SOURCE_LANE_OPACITY);
  const surfaceFanPeakOp = useRef(SURFACE_FAN_OPACITY);

  // Live column X — recomputed on resize via `useStackLiveAspect`. The
  // R3F viewport is also subscribed below for fov/aspect (kept for
  // future fov tuning); this hook is the resize source of truth.
  const liveAspect = useStackLiveAspect();
  const colX = useMemo(() => getStackColumnLocalX(liveAspect), [liveAspect]);
  const r3f = useThree((s) => s.viewport);
  void r3f;

  // Per-row Y positions (5 sources / 6 surfaces). The DOM-side anchor
  // arrays in `sceneGeom.STACK_SOURCE_ITEMS` / `STACK_SURFACE_ITEMS`
  // use the same `lerp(-Y_RANGE, Y_RANGE, ...)` derivation, so DOM
  // labels and canvas pips are guaranteed to share Y values.
  // Per-row Y positions — `STACK_*_COUNT` are constants >= 2, so the
  // divide-by-(count-1) is always safe. Keeping the math inline so
  // TypeScript can verify the literal types match the runtime use.
  const sourceYs = useMemo(() => {
    const out: number[] = [];
    const denom = STACK_LANE_COUNT - 1;
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      out.push(lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, i / denom));
    }
    return out;
  }, []);
  const surfaceYs = useMemo(() => {
    const out: number[] = [];
    const denom = STACK_FAN_COUNT - 1;
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      out.push(lerp(-STACK_FAN_HALF_HEIGHT, STACK_FAN_HALF_HEIGHT, i / denom));
    }
    return out;
  }, []);

  // Source lane endpoints — fixed channels from the column X to the
  // source aperture port at -0.85. Each lane funnels INWARD toward
  // the port: end-Y compresses to 25% of the start-Y so the bundle
  // converges visually as the channels approach the sphere.
  const sourceLaneEnds = useMemo(() => {
    const starts: Array<[number, number, number]> = [];
    const ends: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      const y = sourceYs[i];
      starts.push([-colX, y, 0]);
      ends.push([STACK_SUBSTRATE_X - 0.85, y * 0.25, 0]);
    }
    return { starts, ends };
  }, [colX, sourceYs]);

  // Surface fan destinations — diverging from the surface aperture
  // port at +0.85 to each surface tip at the column X.
  const surfaceFanEnds = useMemo(() => {
    const dests: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      const y = surfaceYs[i];
      dests.push([colX, y, 0]);
    }
    return dests;
  }, [colX, surfaceYs]);

  // Parked pip / tip world positions — these are the ANCHOR points
  // each row slides inward to. Per-frame, each pip's
  // `node.position.x` is set to the slide-blended value below.
  const sourcePipPositions = useMemo(
    () => sourceYs.map((y) => [-colX, y, 0] as [number, number, number]),
    [colX, sourceYs]
  );
  const surfaceTipPositions = useMemo(
    () => surfaceYs.map((y) => [colX, y, 0] as [number, number, number]),
    [colX, surfaceYs]
  );

  const geoms = useMemo(() => {
    const sourceLanes = buildLaneLinesGeometry(
      STACK_LANE_COUNT,
      -colX,
      STACK_SUBSTRATE_X - 0.85,
      STACK_LANE_Y_RANGE,
      0
    );
    const surfaceFan = buildFanLinesGeometry([STACK_SUBSTRATE_X + 0.85, 0, 0], surfaceFanEnds);
    const sourceMotes = buildLinearMotes(
      sourceLaneEnds.starts,
      sourceLaneEnds.ends,
      STACK_MOTES_PER_LANE
    );
    const surfaceStarts: Array<[number, number, number]> = surfaceFanEnds.map(() => [
      STACK_SUBSTRATE_X + 0.85,
      0,
      0,
    ]);
    const surfaceMotes = buildLinearMotes(surfaceStarts, surfaceFanEnds, STACK_MOTES_PER_RAY);
    const sourcePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_PIP_SCALE);
    // Stack v3 (2026-06-10) — surface tips shrink to match the source
    // pip read; was full `PYLON_CAP_SIZE` for the outline.
    const surfacePipOutline = buildDiamondGeometry(PYLON_CAP_SIZE * STACK_TIP_OUTLINE_SCALE);
    const surfacePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_TIP_INNER_SCALE);
    // Aperture ports — kept at the previous size; their position
    // `[±0.85, 0, 0]` is independent of the column X so they sit at
    // a fixed sphere-edge anchor regardless of viewport.
    const aperturePortOutline = buildDiamondGeometry(PYLON_CAP_SIZE * 1.5);
    const aperturePortInner = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.6);

    return {
      sourceLanes,
      surfaceFan,
      sourceMotes,
      surfaceMotes,
      sourcePipFilled,
      surfacePipOutline,
      surfacePipFilled,
      aperturePortOutline,
      aperturePortInner,
    };
  }, [colX, sourceLaneEnds, surfaceFanEnds]);

  const mats = useMemo(
    () => ({
      sourceLanes: makeLineMaterial(COLOR_SOURCES, SOURCE_LANE_OPACITY, false),
      surfaceFan: makeLineMaterial(COLOR_SURFACES, SURFACE_FAN_OPACITY, false),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY, 0.05, false),
      surfaceMotes: makePointsMaterial(COLOR_SURFACES, SOURCE_PIP_OPACITY, 0.05, false),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY),
      surfacePipOutline: makeLineMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY, true),
      surfacePipFilled: makeMeshMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY * 0.94),
      sourceApertureOutline: makeLineMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY, true),
      sourceApertureInner: makeMeshMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY * 0.7),
      surfaceApertureOutline: makeLineMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY, true),
      surfaceApertureInner: makeMeshMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY * 0.7),
    }),
    []
  );

  useEffect(() => {
    return () => {
      geoms.sourceLanes.dispose();
      geoms.surfaceFan.dispose();
      geoms.sourceMotes.geometry.dispose();
      geoms.surfaceMotes.geometry.dispose();
      geoms.sourcePipFilled.dispose();
      geoms.surfacePipOutline.dispose();
      geoms.surfacePipFilled.dispose();
      geoms.aperturePortOutline.dispose();
      geoms.aperturePortInner.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { epilogueProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getSmoothedAccretionLayers().stack;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    const epFade = 1 - epilogueBand(epilogueProgress, "BUILD_OUT");
    if (epFade <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const sourcesStagger = petalStagger(reveal, 0, 2, STACK_CLUSTER_OVERLAP);
    const surfacesStagger = petalStagger(reveal, 1, 2, STACK_CLUSTER_OVERLAP);
    const sourcesSlideT = reducedMotion ? 1 : smootherStack(sourcesStagger);
    const surfacesSlideT = reducedMotion ? 1 : smootherStack(surfacesStagger);

    if (sourcesGroupRef.current) {
      // No cluster-level slide or fold-emerge any more — the cluster
      // group sits at the parked origin; reveal cadence is per-row.
      sourcesGroupRef.current.visible = sourcesSlideT > EMERGE_EPSILON;
      sourcesGroupRef.current.scale.setScalar(1);
      sourcesGroupRef.current.position.set(0, 0, 0);
    }
    if (surfacesGroupRef.current) {
      surfacesGroupRef.current.visible = surfacesSlideT > EMERGE_EPSILON;
      surfacesGroupRef.current.scale.setScalar(1);
      surfacesGroupRef.current.position.set(0, 0, 0);
    }

    // Lane / fan opacity tracks the cluster-level stagger so the
    // channels appear FIRST (waiting to receive their pips), then
    // each row docks into its lane via the per-row slide below.
    mats.sourceLanes.opacity = sourcesSlideT * sourceLanePeakOp.current * epFade;
    mats.surfaceFan.opacity = surfacesSlideT * surfaceFanPeakOp.current * epFade;
    mats.sourceMotes.opacity = sourcesSlideT * SOURCE_PIP_OPACITY * epFade;
    mats.surfaceMotes.opacity = surfacesSlideT * SOURCE_PIP_OPACITY * epFade;
    mats.sourcePip.opacity = SOURCE_PIP_OPACITY * epFade;
    mats.surfacePipOutline.opacity = SURFACE_PIP_OPACITY * epFade;
    mats.surfacePipFilled.opacity = SURFACE_PIP_OPACITY * 0.94 * epFade;
    mats.sourceApertureOutline.opacity = sourcesSlideT * SOURCE_PIP_OPACITY * epFade;
    mats.sourceApertureInner.opacity = sourcesSlideT * SOURCE_PIP_OPACITY * 0.7 * epFade;
    mats.surfaceApertureOutline.opacity = surfacesSlideT * SURFACE_PIP_OPACITY * epFade;
    mats.surfaceApertureInner.opacity = surfacesSlideT * SURFACE_PIP_OPACITY * 0.7 * epFade;

    // Per-row dock: each pip slides INWARD from a small outer offset
    // (`STACK_ROW_SLIDE_LOCAL_X`) to its parked column position, plus
    // the per-row scale snap with a tiny landing overshoot. The slide
    // and the lane channels mean every frame of the animation has the
    // pip inside or just outside its column — never off-screen.
    for (let i = 0; i < sourcePipRefs.current.length; i++) {
      const node = sourcePipRefs.current[i];
      if (!node) continue;
      if (reducedMotion) {
        node.scale.setScalar(1);
        node.position.x = -colX;
        continue;
      }
      const lock = stackItemLock(sourcesStagger, i, sourcePipRefs.current.length);
      node.scale.setScalar(lock.scale);
      // Outer offset blends to 0 as `slide` lerps 0..1.
      node.position.x = -colX - STACK_ROW_SLIDE_LOCAL_X * (1 - lock.slide);
    }
    for (let i = 0; i < surfaceTipRefs.current.length; i++) {
      const node = surfaceTipRefs.current[i];
      if (!node) continue;
      if (reducedMotion) {
        node.scale.setScalar(1);
        node.position.x = colX;
        continue;
      }
      const lock = stackItemLock(surfacesStagger, i, surfaceTipRefs.current.length);
      node.scale.setScalar(lock.scale);
      node.position.x = colX + STACK_ROW_SLIDE_LOCAL_X * (1 - lock.slide);
    }

    if (!reducedMotion) {
      const t = clock.elapsedTime;
      if (sourceMotesRef.current && sourcesSlideT > EMERGE_EPSILON) {
        advanceLinearMotes(geoms.sourceMotes, (t / 3.4) % 1);
      }
      if (surfaceMotesRef.current && surfacesSlideT > EMERGE_EPSILON) {
        advanceLinearMotes(geoms.surfaceMotes, (t / 4.2) % 1);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={sourcesGroupRef} visible={false}>
        <lineSegments
          geometry={geoms.sourceLanes}
          material={mats.sourceLanes}
          frustumCulled={false}
        />
        <points
          ref={sourceMotesRef}
          geometry={geoms.sourceMotes.geometry}
          material={mats.sourceMotes}
          frustumCulled={false}
        />
        {/* Source aperture port — fixed at the sphere edge (-0.85),
            independent of the column X so the funnel reads as
            `pip → channel → port → sphere` regardless of viewport. */}
        <group position={[STACK_SUBSTRATE_X - 0.85, 0, 0]}>
          <lineLoop
            geometry={geoms.aperturePortOutline}
            material={mats.sourceApertureOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.aperturePortInner}
            material={mats.sourceApertureInner}
            frustumCulled={false}
          />
        </group>
        {sourcePipPositions.map((pos, i) => (
          <group
            key={`stack-src-${i}`}
            position={pos}
            ref={(node) => {
              sourcePipRefs.current[i] = node;
            }}
          >
            <mesh
              geometry={geoms.sourcePipFilled}
              material={mats.sourcePip}
              frustumCulled={false}
            />
          </group>
        ))}
      </group>

      <group ref={surfacesGroupRef} visible={false}>
        <lineSegments
          geometry={geoms.surfaceFan}
          material={mats.surfaceFan}
          frustumCulled={false}
        />
        <points
          ref={surfaceMotesRef}
          geometry={geoms.surfaceMotes.geometry}
          material={mats.surfaceMotes}
          frustumCulled={false}
        />
        <group position={[STACK_SUBSTRATE_X + 0.85, 0, 0]}>
          <lineLoop
            geometry={geoms.aperturePortOutline}
            material={mats.surfaceApertureOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.aperturePortInner}
            material={mats.surfaceApertureInner}
            frustumCulled={false}
          />
        </group>
        {surfaceTipPositions.map((pos, i) => (
          <group
            key={`stack-srf-${i}`}
            position={pos}
            ref={(node) => {
              surfaceTipRefs.current[i] = node;
            }}
          >
            <lineLoop
              geometry={geoms.surfacePipOutline}
              material={mats.surfacePipOutline}
              frustumCulled={false}
            />
            <mesh
              geometry={geoms.surfacePipFilled}
              material={mats.surfacePipFilled}
              frustumCulled={false}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
