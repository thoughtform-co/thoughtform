"use client";

/**
 * ShellStack — Build accretion layer. Docks the assembled intelligence
 * layer (substrate sphere + Encode judgment orbits) into the full
 * stack: trusted sources feed in from the left (green lanes), headless
 * surfaces fan out to the right (dawn diamonds).
 *
 * Ported from the FUNNEL variant in the intelligence-artifact lab.
 * No group spin — the directional flow is the read. Geometry emerges
 * via `foldEmerge` + `petalStagger`, not opacity ramps.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
  STACK_FAN_COUNT,
  STACK_FAN_HALF_HEIGHT,
  STACK_LANE_COUNT,
  STACK_LANE_Y_RANGE,
  STACK_MOTES_PER_LANE,
  STACK_MOTES_PER_RAY,
  STACK_PIP_SCALE,
  STACK_SOURCES_X,
  STACK_SUBSTRATE_X,
  STACK_SURFACES_X,
} from "./shellGeom";

interface ShellStackProps {
  layerKey: "stack";
  reducedMotion?: boolean;
}

const SOURCE_LANE_OPACITY = 0.65;
const SOURCE_PIP_OPACITY = 0.95;
const SURFACE_FAN_OPACITY = 0.6;
const SURFACE_PIP_OPACITY = 0.9;

// ── Slot-in tuning (2026-06-08 reveal-polish) ─────────────────────
//
// Each cluster slides in from off-screen toward the substrate:
// sources from far LEFT, surfaces from far RIGHT. The cluster X
// offset is driven by the cluster's outer stagger window; the
// existing `foldEmerge` scale stays so the cluster "lands" with a
// soft overshoot on arrival. On top, each per-item pip / fan tip
// gets its own staggered scale snap so the parts read as slotting
// into the machine in sequence.

/** Outer cluster stagger overlap. 0.30 gives a clear sources →
 *  surfaces handoff while still feeling like one motion. */
const STACK_CLUSTER_OVERLAP = 0.3;

/** Off-screen X offset at cluster stagger = 0. Picked so the cluster
 *  is clearly outside the gate frame at parked distance 6.2 (FOV 38°,
 *  16:9). Negative for sources, positive for surfaces. */
export const STACK_SLOT_X_OFFSET = 8;

/** Per-item lock stagger inside its cluster's window. Each lane/fan
 *  tip's scale snaps from a starting floor up to 1.0 in sequence,
 *  so the parts read as plugging in one-by-one instead of arriving
 *  as one block. */
const STACK_ITEM_OVERLAP = 0.55;
/** Per-item scale floor — pips start at this scale and snap to 1.0
 *  on lock. Small enough to read as a snap, large enough that the
 *  pip is still visible during slide so the eye tracks it. */
const STACK_ITEM_SCALE_FLOOR = 0.6;
/** Soft landing overshoot peak on each item (additive to 1.0 at the
 *  mid of the per-item curve, decays to 0 at full lock). */
const STACK_ITEM_OVERSHOOT = 0.12;

function smootherStack(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Per-item lock progress + scale. Used for source pips and surface
 *  tips (both rendered as individually-positioned meshes/groups, so
 *  each can scale independently of the cluster geometry). */
export function stackItemLock(
  clusterStagger: number,
  idx: number,
  total: number
): { scale: number; locked: number } {
  if (total <= 0) return { scale: 1, locked: 1 };
  const s = petalStagger(clusterStagger, idx, total, STACK_ITEM_OVERLAP);
  const eased = smootherStack(s);
  const base = STACK_ITEM_SCALE_FLOOR + (1 - STACK_ITEM_SCALE_FLOOR) * eased;
  const overshoot = Math.sin(Math.PI * s) * STACK_ITEM_OVERSHOOT * (1 - s);
  return { scale: base + overshoot, locked: s };
}

export function ShellStack({ layerKey, reducedMotion = false }: ShellStackProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const sourcesGroupRef = useRef<THREE.Group>(null);
  const surfacesGroupRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const surfaceMotesRef = useRef<THREE.Points>(null);
  // Per-pip / per-tip group refs so we can apply per-item scale + lock
  // snap independently while the parent cluster slides in.
  const sourcePipRefs = useRef<(THREE.Group | null)[]>([]);
  const surfaceTipRefs = useRef<(THREE.Group | null)[]>([]);
  // Capture pre-stagger lane materials' base opacities so we can fade
  // the lane and fan lines on with the cluster (the line geometry is
  // a single buffer, not per-lane).
  const sourceLanePeakOp = useRef(SOURCE_LANE_OPACITY);
  const surfaceFanPeakOp = useRef(SURFACE_FAN_OPACITY);

  const sourceLaneEnds = useMemo(() => {
    const starts: Array<[number, number, number]> = [];
    const ends: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      const t = i / (STACK_LANE_COUNT - 1);
      const y = lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, t);
      starts.push([STACK_SOURCES_X, y, 0]);
      ends.push([STACK_SUBSTRATE_X - 0.85, y * 0.25, 0]);
    }
    return { starts, ends };
  }, []);

  const surfaceFanEnds = useMemo(() => {
    const dests: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      const t = i / (STACK_FAN_COUNT - 1);
      const y = lerp(-STACK_FAN_HALF_HEIGHT, STACK_FAN_HALF_HEIGHT, t);
      dests.push([STACK_SURFACES_X, y, 0]);
    }
    return dests;
  }, []);

  const sourcePipPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      const t = i / (STACK_LANE_COUNT - 1);
      const y = lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, t);
      out.push([STACK_SOURCES_X, y, 0]);
    }
    return out;
  }, []);

  const geoms = useMemo(() => {
    const sourceLanes = buildLaneLinesGeometry(
      STACK_LANE_COUNT,
      STACK_SOURCES_X,
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
    const surfacePipOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const surfacePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_PIP_SCALE);

    return {
      sourceLanes,
      surfaceFan,
      sourceMotes,
      surfaceMotes,
      sourcePipFilled,
      surfacePipOutline,
      surfacePipFilled,
    };
  }, [sourceLaneEnds, surfaceFanEnds]);

  const mats = useMemo(
    () => ({
      sourceLanes: makeLineMaterial(COLOR_SOURCES, SOURCE_LANE_OPACITY, false),
      surfaceFan: makeLineMaterial(COLOR_SURFACES, SURFACE_FAN_OPACITY, false),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY, 0.05, false),
      surfaceMotes: makePointsMaterial(COLOR_SURFACES, SOURCE_PIP_OPACITY, 0.05, false),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY),
      surfacePipOutline: makeLineMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY, true),
      surfacePipFilled: makeMeshMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY * 0.94),
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
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, epilogueProgress, active, armed } =
      useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).stack;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    // Epilogue fade-out: the sources/interfaces stack is the FIRST
    // thing to clear as the user scrolls past Build, so the sphere
    // is reading clean before the news cards arrive. Smoothstepped
    // so the stream lines and pips ease out together instead of a
    // hard cut. Hide entirely once invisible to spare the GPU.
    const ep = epilogueProgress;
    const epEased = ep <= 0 ? 0 : ep >= 1 ? 1 : ep * ep * (3 - 2 * ep);
    const epFade = 1 - epEased;
    if (epFade <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Cluster-level staggers: sources arrive first, surfaces follow
    // with a soft overlap so the read flows left → right into the
    // central layer.
    const sourcesStagger = petalStagger(reveal, 0, 2, STACK_CLUSTER_OVERLAP);
    const surfacesStagger = petalStagger(reveal, 1, 2, STACK_CLUSTER_OVERLAP);

    // Fold-emerge gives a soft landing overshoot on the cluster scale
    // — `foldEmerge` already overshoots 1.0 around the mid of the
    // stagger and settles to 1.0 at the end (existing behavior). We
    // keep it as a polish landing on top of the new X-slide.
    const sourcesFold = foldEmerge(sourcesStagger);
    const surfacesFold = foldEmerge(surfacesStagger);
    const sourcesScale = sourcesFold.scale;
    const surfacesScale = surfacesFold.scale;

    // Cluster X-slide: at stagger 0 the group sits OFF-SCREEN on its
    // own side; at stagger 1 it's at the parked X = 0 (relative to
    // the brandmark world position). The slide uses a smootherstep
    // so the cluster doesn't pop in halfway.
    const sourcesSlideT = reducedMotion ? 1 : smootherStack(sourcesStagger);
    const surfacesSlideT = reducedMotion ? 1 : smootherStack(surfacesStagger);
    const sourcesX = -STACK_SLOT_X_OFFSET * (1 - sourcesSlideT);
    const surfacesX = STACK_SLOT_X_OFFSET * (1 - surfacesSlideT);

    if (sourcesGroupRef.current) {
      sourcesGroupRef.current.visible = sourcesScale > EMERGE_EPSILON;
      sourcesGroupRef.current.scale.setScalar(sourcesScale);
      sourcesGroupRef.current.position.set(sourcesX, 0, 0);
    }
    if (surfacesGroupRef.current) {
      surfacesGroupRef.current.visible = surfacesScale > EMERGE_EPSILON;
      surfacesGroupRef.current.scale.setScalar(surfacesScale);
      surfacesGroupRef.current.position.set(surfacesX, 0, 0);
    }

    // Fade lane / fan line opacities with the cluster slide so the
    // streams don't fully appear until the parts have arrived. Pips
    // are individually scaled below. Epilogue fade is applied as a
    // simple multiplier so every material dims together as the user
    // scrolls into the news-card beat.
    mats.sourceLanes.opacity = sourcesSlideT * sourceLanePeakOp.current * epFade;
    mats.surfaceFan.opacity = surfacesSlideT * surfaceFanPeakOp.current * epFade;
    mats.sourceMotes.opacity = sourcesSlideT * SOURCE_PIP_OPACITY * epFade;
    mats.surfaceMotes.opacity = surfacesSlideT * SOURCE_PIP_OPACITY * epFade;
    mats.sourcePip.opacity = SOURCE_PIP_OPACITY * epFade;
    mats.surfacePipOutline.opacity = SURFACE_PIP_OPACITY * epFade;
    mats.surfacePipFilled.opacity = SURFACE_PIP_OPACITY * 0.94 * epFade;

    // Per-pip lock snap: each pip eases from STACK_ITEM_SCALE_FLOOR
    // up to ~1.0 with a small overshoot on its own stagger window
    // inside the cluster — reads as "each pip plugs into its slot
    // in sequence" rather than the cluster appearing as one block.
    for (let i = 0; i < sourcePipRefs.current.length; i++) {
      const node = sourcePipRefs.current[i];
      if (!node) continue;
      const { scale } = reducedMotion
        ? { scale: 1 }
        : stackItemLock(sourcesStagger, i, sourcePipRefs.current.length);
      node.scale.setScalar(scale);
    }
    for (let i = 0; i < surfaceTipRefs.current.length; i++) {
      const node = surfaceTipRefs.current[i];
      if (!node) continue;
      const { scale } = reducedMotion
        ? { scale: 1 }
        : stackItemLock(surfacesStagger, i, surfaceTipRefs.current.length);
      node.scale.setScalar(scale);
    }

    if (!reducedMotion) {
      const t = clock.elapsedTime;
      if (sourceMotesRef.current && sourcesScale > EMERGE_EPSILON) {
        advanceLinearMotes(geoms.sourceMotes, (t / 3.4) % 1);
      }
      if (surfaceMotesRef.current && surfacesScale > EMERGE_EPSILON) {
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
        {surfaceFanEnds.map((pos, i) => (
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
