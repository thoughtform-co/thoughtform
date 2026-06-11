"use client";

/**
 * ShellStack — Build accretion layer (stack v3.1, 2026-06-10 polish r4).
 *
 * Two compact registry columns flanking the intelligence-layer
 * sphere: 5 trusted-source rows (green) on the left, 6 headless-
 * surface rows (dawn) on the right. Each row is a diamond pip whose
 * stream BLENDS INTO the sphere as a curved magnetic-field line:
 *
 *   - SOURCE streams flow from the pip toward the sphere, then wrap
 *     partway AROUND the globe (radius just above the dotted shell)
 *     like a field line being captured — fading out along the wrap
 *     so the energy reads as absorbed into the substrate.
 *   - SURFACE streams emerge FROM a wrap around the sphere (fading
 *     in from the orbit) and straighten out to their tip pip — the
 *     same field-line read in reverse: capability radiating out of
 *     the layer onto each surface.
 *
 *   Upper rows wrap over the top of the sphere; lower rows wrap
 *   under it; alternating Z-drift pushes successive wraps in front
 *   of / behind the globe so the bundle reads volumetric, organic —
 *   not a ruled diagram. The v3 aperture-port diamonds (the "rotated
 *   squares") are gone; the curve itself is the connection.
 *
 * Layout fixes carried from stack v3:
 *
 *   - Column X computed LIVE from the camera frustum via
 *     `getStackColumnLocalX(aspect)` — fits every desktop aspect.
 *   - Per-row pips lock in sequence (`stackItemLock`) with
 *     DIRECTIONAL slides (2026-06-10 flow pass): source pips arrive
 *     from outside-left (inputs captured), surface tips emerge from
 *     the sphere side and slide out to their column (outputs
 *     emitted). No cluster-level overshoot.
 *   - DOM chips: source chips grow inward toward the sphere;
 *     surface chips sit PAST their tips, extending outward —
 *     destinations at the end of the output lines (sceneGeom
 *     anchors + CopyAnchors origins).
 *
 * Motes flow along the same curves (sampled polylines), so the
 * particle flow and the field lines agree exactly.
 *
 * Epilogue exit (2026-06-11): on BUILD_OUT the stack does NOT fade —
 * it DRAINS in flow order (one final cycle through the layer).
 * Source lines reel INTO the sphere via `setDrawRange` trim, each
 * pip riding its own field line in and getting swallowed at the
 * junction; surface lines then drain OUTWARD from the sphere to
 * their tips, which close with a small outward release. Motes
 * accelerate and converge into the shrinking windows. Opacity only
 * sweeps the last faint fragments at each side's window end. See
 * `stackDrainRow` / `stackDrainCluster` in shellGeom.
 */

import { extend, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  COLOR_SOURCES,
  COLOR_SURFACES,
  PYLON_CAP_SIZE,
  lerp,
} from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  makeLineMaterial,
  makeMeshMaterial,
  makePointsMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { band, epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedAccretionLayers, getSmoothedEpilogueProgress } from "../motionFollower";
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
  STACK_TIP_INNER_SCALE,
  STACK_TIP_OUTLINE_SCALE,
  STACK_TIP_RELEASE_DRIFT,
  stackDrainCluster,
  stackDrainRow,
} from "./shellGeom";

// `<line>` collides with the SVG intrinsic; the typed alias
// `<threeLine>` needs the runtime catalog entry (see
// ShellSubstrateGyro for the original registration — repeating it
// here is idempotent and keeps this module self-sufficient).
extend({ ThreeLine: THREE.Line });

interface ShellStackProps {
  layerKey: "stack";
  reducedMotion?: boolean;
}

const SOURCE_STREAM_OPACITY = 0.7;
const SOURCE_PIP_OPACITY = 0.95;
const SURFACE_STREAM_OPACITY = 0.62;
const SURFACE_PIP_OPACITY = 0.9;

/** Cluster-level stagger overlap. 0.30 gives a clear sources →
 *  surfaces handoff while still feeling like one motion. */
const STACK_CLUSTER_OVERLAP = 0.3;
/** Per-row lock stagger inside its cluster's window. */
const STACK_ITEM_OVERLAP = 0.55;
const STACK_ITEM_SCALE_FLOOR = 0.6;
const STACK_ITEM_OVERSHOOT = 0.12;

// ── Field-stream curve tuning (polish round 4) ────────────────────
//
// The wrap orbit sits just outside the dotted globe
// (`SUBSTRATE_GYRO_GLOBE_RADIUS` 0.72) and inside the gimbal rings
// (1.0+), so the field lines hug the sphere without colliding with
// the ring cage.
/** Orbit radius where the stream meets the sphere (junction). */
const STREAM_ORBIT_R0 = 0.86;
/** Orbit radius at the wrap tail — tightens slightly so the line
 *  reads as being captured by the sphere. */
const STREAM_ORBIT_R1 = 0.78;
/** Wrap sweep (radians). ~66° of orbit per stream. */
const STREAM_WRAP_SWEEP = 1.15;
/** Out-of-plane Z drift at the wrap tail. Alternates sign per row so
 *  successive wraps pass in front of / behind the globe. */
const STREAM_WRAP_Z = 0.26;
/** Tail colour multiplier — the wrap fades toward the void so the
 *  stream reads as absorbed / emitted rather than chopped. */
const STREAM_TAIL_FADE = 0.05;
/** Vertical spread of the junction points on the sphere (radians off
 *  the horizontal axis, scaled by the row's normalised Y). */
const STREAM_ENTRY_SPREAD = 0.5;
const STREAM_SAMPLES_APPROACH = 16;
const STREAM_SAMPLES_WRAP = 20;

function smootherStack(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Per-row lock progress + scale + inward slide. */
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

function readLiveAspect(): number {
  if (typeof window === "undefined" || !window.innerHeight) return 16 / 9;
  return window.innerWidth / window.innerHeight;
}

/** Live aspect ratio with a debounced resize listener — keys the
 *  geometry `useMemo` chain so the columns rebuild on resize. */
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

// ── Field-stream curve builders ───────────────────────────────────

interface StreamCurve {
  /** Sampled polyline in FLOW order (pip → wrap tail for sources;
   *  wrap tail → tip for surfaces). */
  points: THREE.Vector3[];
  /** Flat RGB per point (vertexColors). */
  colors: number[];
}

/** Quadratic Bezier sample. */
function qBezier(p0: THREE.Vector3, c: THREE.Vector3, p1: THREE.Vector3, t: number): THREE.Vector3 {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const d = t * t;
  return new THREE.Vector3(
    a * p0.x + b * c.x + d * p1.x,
    a * p0.y + b * c.y + d * p1.y,
    a * p0.z + b * c.z + d * p1.z
  );
}

/** SOURCE stream: pip → swoop toward the sphere → wrap around it.
 *  Flow order: index 0 at the pip, last index at the faded wrap
 *  tail. Upper rows wrap over the top (theta decreasing from ~π);
 *  lower rows wrap under the bottom. */
function buildSourceStream(y0: number, colX: number, rowIdx: number): StreamCurve {
  const base = new THREE.Color(COLOR_SOURCES);
  const points: THREE.Vector3[] = [];
  const colors: number[] = [];

  const yNorm = y0 / Math.max(0.001, STACK_LANE_Y_RANGE);
  // Junction on the LEFT hemisphere: theta near π, offset by the
  // row's vertical position so upper rows meet the sphere high.
  const theta0 = Math.PI - yNorm * STREAM_ENTRY_SPREAD;
  const junction = new THREE.Vector3(
    Math.cos(theta0) * STREAM_ORBIT_R0,
    Math.sin(theta0) * STREAM_ORBIT_R0,
    0
  );
  const p0 = new THREE.Vector3(-colX, y0, 0);
  // Control point: mostly horizontal pull from the pip so the stream
  // leaves the column flat, then bends into the sphere.
  const ctrl = new THREE.Vector3(lerp(p0.x, junction.x, 0.62), lerp(p0.y, junction.y, 0.18), 0);

  for (let s = 0; s < STREAM_SAMPLES_APPROACH; s++) {
    const t = s / STREAM_SAMPLES_APPROACH; // excludes 1 (junction owned by wrap)
    points.push(qBezier(p0, ctrl, junction, t));
    colors.push(base.r, base.g, base.b);
  }

  // Wrap: upper rows sweep over the top (theta decreasing), lower
  // rows under the bottom (theta increasing). Z alternates per row.
  const sweepDir = y0 >= 0 ? -1 : 1;
  const zDir = rowIdx % 2 === 0 ? 1 : -1;
  for (let s = 0; s <= STREAM_SAMPLES_WRAP; s++) {
    const t = s / STREAM_SAMPLES_WRAP;
    const theta = theta0 + sweepDir * STREAM_WRAP_SWEEP * t;
    const r = lerp(STREAM_ORBIT_R0, STREAM_ORBIT_R1, t);
    const z = Math.sin((t * Math.PI) / 2) * STREAM_WRAP_Z * zDir;
    points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    const fade = 1 - (1 - STREAM_TAIL_FADE) * t;
    colors.push(base.r * fade, base.g * fade, base.b * fade);
  }

  return { points, colors };
}

/** SURFACE stream: faint wrap around the sphere → emerges on the
 *  right → straightens out to the tip. Flow order: index 0 at the
 *  faded wrap tail, last index at the tip pip. */
function buildSurfaceStream(y1: number, colX: number, rowIdx: number): StreamCurve {
  const base = new THREE.Color(COLOR_SURFACES);
  const points: THREE.Vector3[] = [];
  const colors: number[] = [];

  const yNorm = y1 / Math.max(0.001, STACK_FAN_HALF_HEIGHT);
  // Junction on the RIGHT hemisphere: theta near 0, offset by row Y.
  const theta1 = yNorm * STREAM_ENTRY_SPREAD;
  // Wrap tail sits deeper around the sphere: upper rows arrive from
  // over the top (theta1 + sweep), lower rows from under the bottom.
  const sweepDir = y1 >= 0 ? 1 : -1;
  const zDir = rowIdx % 2 === 0 ? -1 : 1;

  for (let s = 0; s < STREAM_SAMPLES_WRAP; s++) {
    const t = s / STREAM_SAMPLES_WRAP; // 0 = tail, 1 = junction (owned by bezier start below)
    const theta = theta1 + sweepDir * STREAM_WRAP_SWEEP * (1 - t);
    const r = lerp(STREAM_ORBIT_R1, STREAM_ORBIT_R0, t);
    const z = Math.sin(((1 - t) * Math.PI) / 2) * STREAM_WRAP_Z * zDir;
    points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
    const fade = STREAM_TAIL_FADE + (1 - STREAM_TAIL_FADE) * t;
    colors.push(base.r * fade, base.g * fade, base.b * fade);
  }

  const junction = new THREE.Vector3(
    Math.cos(theta1) * STREAM_ORBIT_R0,
    Math.sin(theta1) * STREAM_ORBIT_R0,
    0
  );
  const p1 = new THREE.Vector3(colX, y1, 0);
  const ctrl = new THREE.Vector3(lerp(p1.x, junction.x, 0.62), lerp(p1.y, junction.y, 0.18), 0);

  for (let s = 0; s <= STREAM_SAMPLES_APPROACH; s++) {
    const t = s / STREAM_SAMPLES_APPROACH;
    points.push(qBezier(junction, ctrl, p1, t));
    colors.push(base.r, base.g, base.b);
  }

  return { points, colors };
}

function curveToGeometry(curve: StreamCurve): THREE.BufferGeometry {
  const positions = new Float32Array(curve.points.length * 3);
  for (let i = 0; i < curve.points.length; i++) {
    positions[i * 3] = curve.points[i].x;
    positions[i * 3 + 1] = curve.points[i].y;
    positions[i * 3 + 2] = curve.points[i].z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(curve.colors), 3));
  return g;
}

/** Sample a polyline at normalised u ∈ [0,1) (linear between the two
 *  nearest samples). */
function samplePolyline(points: THREE.Vector3[], u: number, out: THREE.Vector3): void {
  const n = points.length;
  if (n === 0) {
    out.set(0, 0, 0);
    return;
  }
  const f = Math.max(0, Math.min(0.99999, u)) * (n - 1);
  const i = Math.floor(f);
  const frac = f - i;
  const a = points[i];
  const b = points[Math.min(n - 1, i + 1)];
  out.set(lerp(a.x, b.x, frac), lerp(a.y, b.y, frac), lerp(a.z, b.z, frac));
}

interface CurveMotes {
  geometry: THREE.BufferGeometry;
  /** Per-mote: which curve + phase offset. */
  laneIdx: Uint8Array;
  phase: Float32Array;
}

function buildCurveMotes(curveCount: number, motesPerCurve: number): CurveMotes {
  const total = curveCount * motesPerCurve;
  const positions = new Float32Array(total * 3);
  const laneIdx = new Uint8Array(total);
  const phase = new Float32Array(total);
  for (let c = 0; c < curveCount; c++) {
    for (let m = 0; m < motesPerCurve; m++) {
      const i = c * motesPerCurve + m;
      laneIdx[i] = c;
      // Deterministic phase scatter (golden-ratio stride) so motes
      // distribute evenly without RNG flicker across rebuilds.
      phase[i] = (m / motesPerCurve + c * 0.618) % 1;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry, laneIdx, phase };
}

const MOTE_SAMPLE = new THREE.Vector3();
/** Scratch for the source-pip swallow ride (epilogue drain). */
const PIP_RIDE = new THREE.Vector3();

function advanceCurveMotes(
  motes: CurveMotes,
  curves: StreamCurve[],
  flowT: number,
  laneFront?: Float32Array
): void {
  const posAttr = motes.geometry.getAttribute("position") as THREE.BufferAttribute;
  const arr = posAttr.array as Float32Array;
  for (let i = 0; i < motes.phase.length; i++) {
    const curve = curves[motes.laneIdx[i]];
    if (!curve) continue;
    // Epilogue drain: remap the cyclic phase into the lane's remaining
    // visible window [front, 1] so motes converge with their draining
    // line instead of riding through erased geometry.
    const front = laneFront ? laneFront[motes.laneIdx[i]] : 0;
    const u = front + ((motes.phase[i] + flowT) % 1) * (1 - front);
    samplePolyline(curve.points, u, MOTE_SAMPLE);
    arr[i * 3] = MOTE_SAMPLE.x;
    arr[i * 3 + 1] = MOTE_SAMPLE.y;
    arr[i * 3 + 2] = MOTE_SAMPLE.z;
  }
  posAttr.needsUpdate = true;
}

export function ShellStack({ layerKey, reducedMotion = false }: ShellStackProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const sourcesGroupRef = useRef<THREE.Group>(null);
  const surfacesGroupRef = useRef<THREE.Group>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const surfaceMotesRef = useRef<THREE.Points>(null);
  const sourcePipRefs = useRef<(THREE.Group | null)[]>([]);
  const surfaceTipRefs = useRef<(THREE.Group | null)[]>([]);

  const liveAspect = useStackLiveAspect();
  const colX = useMemo(() => getStackColumnLocalX(liveAspect), [liveAspect]);

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

  // Parked pip / tip positions — the per-frame slide writes
  // `position.x` toward these column anchors.
  const sourcePipPositions = useMemo(
    () => sourceYs.map((y) => [-colX, y, 0] as [number, number, number]),
    [colX, sourceYs]
  );
  const surfaceTipPositions = useMemo(
    () => surfaceYs.map((y) => [colX, y, 0] as [number, number, number]),
    [colX, surfaceYs]
  );

  // Field-stream curves + geometries (rebuilt on column-X change).
  const streams = useMemo(() => {
    const sourceCurves = sourceYs.map((y, i) => buildSourceStream(y, colX, i));
    const surfaceCurves = surfaceYs.map((y, i) => buildSurfaceStream(y, colX, i));
    return {
      sourceCurves,
      surfaceCurves,
      sourceGeoms: sourceCurves.map(curveToGeometry),
      surfaceGeoms: surfaceCurves.map(curveToGeometry),
    };
  }, [colX, sourceYs, surfaceYs]);

  const motes = useMemo(
    () => ({
      source: buildCurveMotes(STACK_LANE_COUNT, STACK_MOTES_PER_LANE),
      surface: buildCurveMotes(STACK_FAN_COUNT, STACK_MOTES_PER_RAY),
    }),
    []
  );

  // Per-lane drain fronts (0 = intact, 1 = fully consumed) — per-frame
  // mutable scratch shared by the line drawRanges, pip rides, and mote
  // window remaps.
  const laneFrontsRef = useRef({
    source: new Float32Array(STACK_LANE_COUNT),
    surface: new Float32Array(STACK_FAN_COUNT),
  });
  // Accumulated mote flow phase. Replaces `clock.elapsedTime / period`
  // so the drain can RAMP the flow speed without phase jumps.
  const flowPhase = useRef({ source: 0, surface: 0 });

  const geoms = useMemo(() => {
    const sourcePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_PIP_SCALE);
    const surfacePipOutline = buildDiamondGeometry(PYLON_CAP_SIZE * STACK_TIP_OUTLINE_SCALE);
    const surfacePipFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * STACK_TIP_INNER_SCALE);
    return { sourcePipFilled, surfacePipOutline, surfacePipFilled };
  }, []);

  const mats = useMemo(
    () => ({
      // vertexColors carry the per-point wrap fade; material opacity
      // carries the cluster reveal envelope.
      sourceStream: new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: SOURCE_STREAM_OPACITY,
        depthWrite: false,
      }),
      surfaceStream: new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: SURFACE_STREAM_OPACITY,
        depthWrite: false,
      }),
      sourceMotes: makePointsMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY, 0.045, false),
      surfaceMotes: makePointsMaterial(COLOR_SURFACES, SOURCE_PIP_OPACITY, 0.045, false),
      sourcePip: makeMeshMaterial(COLOR_SOURCES, SOURCE_PIP_OPACITY),
      surfacePipOutline: makeLineMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY, true),
      surfacePipFilled: makeMeshMaterial(COLOR_SURFACES, SURFACE_PIP_OPACITY * 0.94),
    }),
    []
  );

  useEffect(() => {
    return () => {
      streams.sourceGeoms.forEach((g) => g.dispose());
      streams.surfaceGeoms.forEach((g) => g.dispose());
      motes.source.geometry.dispose();
      motes.surface.geometry.dispose();
      geoms.sourcePipFilled.dispose();
      geoms.surfacePipOutline.dispose();
      geoms.surfacePipFilled.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [streams, motes, geoms, mats]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { active, armed } = useDepthGatewayStore.getState().transform;
    // Smoothed epilogue scrub — same channel as the camera so the
    // BUILD_OUT drain glides with the flight (2026-06-11).
    const epilogueProgress = getSmoothedEpilogueProgress();
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getSmoothedAccretionLayers().stack;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }

    // ── Epilogue BUILD_OUT — "final cycle" drain ──────────────────
    // Not an opacity fade: the stack completes one last transmission
    // and is consumed by the substrate in flow order. Source lines
    // reel INTO the sphere (the planet-to-be inhales its inputs);
    // surface lines then drain OUTWARD to their tips (the last pulse
    // leaves the layer). See shellGeom `stackDrainRow`.
    const epAbsorb = epilogueBand(epilogueProgress, "BUILD_OUT");
    if (epAbsorb >= 1 - EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Per-lane drain fronts — sources reel first, surfaces trail, so
    // the final pulse passes through the sphere left to right.
    const laneFronts = laneFrontsRef.current;
    for (let i = 0; i < STACK_LANE_COUNT; i++) {
      laneFronts.source[i] = reducedMotion ? 0 : stackDrainRow(epAbsorb, 0, i, STACK_LANE_COUNT);
    }
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      laneFronts.surface[i] = reducedMotion ? 0 : stackDrainRow(epAbsorb, 1, i, STACK_FAN_COUNT);
    }
    const srcCluster = reducedMotion ? 0 : stackDrainCluster(epAbsorb, 0);
    const srfCluster = reducedMotion ? 0 : stackDrainCluster(epAbsorb, 1);
    // The geometry does the storytelling; opacity only sweeps the last
    // faint fragments (wrap tails, bunched motes) at each side's
    // window end. Reduced motion keeps the calm whole-band fade.
    const srcTailFade = reducedMotion ? 1 - epAbsorb : 1 - band(srcCluster, 0.8, 1);
    const srfTailFade = reducedMotion ? 1 - epAbsorb : 1 - band(srfCluster, 0.8, 1);

    const sourcesStagger = petalStagger(reveal, 0, 2, STACK_CLUSTER_OVERLAP);
    const surfacesStagger = petalStagger(reveal, 1, 2, STACK_CLUSTER_OVERLAP);
    const sourcesSlideT = reducedMotion ? 1 : smootherStack(sourcesStagger);
    const surfacesSlideT = reducedMotion ? 1 : smootherStack(surfacesStagger);

    if (sourcesGroupRef.current) {
      sourcesGroupRef.current.visible =
        sourcesSlideT > EMERGE_EPSILON && srcTailFade > EMERGE_EPSILON;
    }
    if (surfacesGroupRef.current) {
      surfacesGroupRef.current.visible =
        surfacesSlideT > EMERGE_EPSILON && srfTailFade > EMERGE_EPSILON;
    }

    // Stream + mote opacities track the cluster stagger so the field
    // lines fade up as their side arrives (build-in); the drain exit
    // stays geometric apart from the tail sweep.
    mats.sourceStream.opacity = sourcesSlideT * SOURCE_STREAM_OPACITY * srcTailFade;
    mats.surfaceStream.opacity = surfacesSlideT * SURFACE_STREAM_OPACITY * srfTailFade;
    mats.sourceMotes.opacity = sourcesSlideT * SOURCE_PIP_OPACITY * srcTailFade;
    mats.surfaceMotes.opacity = surfacesSlideT * SOURCE_PIP_OPACITY * srfTailFade;
    mats.sourcePip.opacity = SOURCE_PIP_OPACITY * srcTailFade;
    mats.surfacePipOutline.opacity = SURFACE_PIP_OPACITY * srfTailFade;
    mats.surfacePipFilled.opacity = SURFACE_PIP_OPACITY * 0.94 * srfTailFade;

    // Line drain — trim each polyline from its FLOW-ORIGIN end so the
    // field line is consumed in its own travel direction: source lines
    // vanish pip-first into the sphere; surface lines lift off the
    // sphere and dissolve out toward their tips.
    streams.sourceGeoms.forEach((g, i) => {
      const n = (g.getAttribute("position") as THREE.BufferAttribute).count;
      const start = Math.min(n - 1, Math.floor(laneFronts.source[i] * (n - 1)));
      g.setDrawRange(start, n - start);
    });
    streams.surfaceGeoms.forEach((g, i) => {
      const n = (g.getAttribute("position") as THREE.BufferAttribute).count;
      const start = Math.min(n - 1, Math.floor(laneFronts.surface[i] * (n - 1)));
      g.setDrawRange(start, n - start);
    });

    // Per-row dock — directional flow semantics (2026-06-10 flow
    // pass): SOURCES are inputs, so their pips ARRIVE from outside-
    // left and slide right into the column (captured by the sphere).
    // SURFACES are outputs, so their tips EMERGE from the sphere
    // side (inside-right) and slide further right to their parked
    // column — emitted along the field line, not delivered against
    // its flow. Both sides therefore travel left → right, matching
    // the source→sphere→surface pipeline and the motes' direction.
    for (let i = 0; i < sourcePipRefs.current.length; i++) {
      const node = sourcePipRefs.current[i];
      if (!node) continue;
      if (reducedMotion) {
        node.scale.setScalar(1);
        node.position.x = -colX;
        continue;
      }
      const lock = stackItemLock(sourcesStagger, i, sourcePipRefs.current.length);
      const drain = laneFronts.source[i];
      if (drain > EMERGE_EPSILON) {
        // Swallow ride: the pip is the head of its reeling line — it
        // travels its own curve to the sphere junction and shrinks to
        // nothing as the substrate captures it.
        const curve = streams.sourceCurves[i];
        const uJunction = STREAM_SAMPLES_APPROACH / (curve.points.length - 1);
        samplePolyline(curve.points, Math.min(drain, uJunction), PIP_RIDE);
        node.position.set(PIP_RIDE.x, PIP_RIDE.y, PIP_RIDE.z);
        node.scale.setScalar(lock.scale * (1 - band(drain, uJunction * 0.5, uJunction)));
      } else {
        node.scale.setScalar(lock.scale);
        node.position.set(-colX - STACK_ROW_SLIDE_LOCAL_X * (1 - lock.slide), sourceYs[i], 0);
      }
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
      const drain = laneFronts.surface[i];
      if (drain > EMERGE_EPSILON) {
        // Release: the tip holds while its line drains toward it, then
        // closes — collapsing with a small outward drift as the last
        // pulse leaves the system.
        const release = band(drain, 0.72, 0.98);
        node.scale.setScalar(lock.scale * (1 - release));
        node.position.x = colX + STACK_TIP_RELEASE_DRIFT * release;
      } else {
        node.scale.setScalar(lock.scale);
        node.position.x = colX - STACK_ROW_SLIDE_LOCAL_X * (1 - lock.slide);
      }
    }

    // Motes ride the field-line curves — sources flow pip → wrap
    // (absorbed into the sphere); surfaces flow wrap → tip (emitted
    // out of the sphere). Different periods keep the two sides from
    // reading as a synchronised metronome. During the drain the flow
    // ACCELERATES (the final pulse rushes through) — phase accumulates
    // via delta so the speed ramp never jumps.
    if (!reducedMotion) {
      flowPhase.current.source =
        (flowPhase.current.source + (delta / 5.2) * (1 + 2.5 * srcCluster)) % 1;
      flowPhase.current.surface =
        (flowPhase.current.surface + (delta / 6.4) * (1 + 2.5 * srfCluster)) % 1;
      if (sourceMotesRef.current && sourcesSlideT > EMERGE_EPSILON) {
        advanceCurveMotes(
          motes.source,
          streams.sourceCurves,
          flowPhase.current.source,
          laneFronts.source
        );
      }
      if (surfaceMotesRef.current && surfacesSlideT > EMERGE_EPSILON) {
        advanceCurveMotes(
          motes.surface,
          streams.surfaceCurves,
          flowPhase.current.surface,
          laneFronts.surface
        );
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={sourcesGroupRef} visible={false}>
        {streams.sourceGeoms.map((g, i) => (
          <threeLine
            key={`stack-src-stream-${i}`}
            geometry={g}
            material={mats.sourceStream}
            frustumCulled={false}
          />
        ))}
        <points
          ref={sourceMotesRef}
          geometry={motes.source.geometry}
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
        {streams.surfaceGeoms.map((g, i) => (
          <threeLine
            key={`stack-srf-stream-${i}`}
            geometry={g}
            material={mats.surfaceStream}
            frustumCulled={false}
          />
        ))}
        <points
          ref={surfaceMotesRef}
          geometry={motes.surface.geometry}
          material={mats.surfaceMotes}
          frustumCulled={false}
        />
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
