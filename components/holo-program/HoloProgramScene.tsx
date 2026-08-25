"use client";

/**
 * HoloProgramScene — the portfolio's trajectory, drawn as a held instrument.
 *
 * Each dated waypoint is a coaxial ring on one time axis receding into
 * depth; a ring's RADIUS is the adoption reach at its date, so the flat
 * board's step ladder and this drawing encode ONE curve. The seat — the
 * terminus — is the single gold object.
 *
 * ⚠ IT ARRIVES ONCE AND THEN IT IS STILL (ADR-021, ADR-078). The rings
 * stroke on in DATE ORDER, so watching it arrive is watching the record
 * happen; at progress 1 every write stops, the demand frameloop stops with
 * it, and the grain freezes because nothing resamples it. There is no idle
 * animation on this estate — the motion budget is arrival, pointer-look and
 * a hover response that settles.
 *
 * ⚠ THE DOM IS THE LABEL LAYER AND IT DOES NOT MOVE. Seven server-rendered
 * stations sit at `left: var(--at)` and the SCENE is solved to meet them
 * (`solveAxisX`), not the other way round — no per-frame projection, no
 * writes back into the DOM, and the pointer amplitude is capped so the
 * rings breathe under their labels rather than swim out from under them.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  buildAccentArc,
  buildAxisPoints,
  buildDropStems,
  buildGroundGrid,
  buildLadderPoints,
  buildParallelPoints,
  buildPriorDiamond,
  buildRingPoints,
  buildTickField,
  disposeAll,
} from "./holoProgramBuilders";
import {
  ARRIVAL_MS,
  PARALLEL_DY,
  POINTER_AMPLITUDE,
  REST_PITCH,
  REST_YAW,
  RING_SEGMENTS,
  SEAT_INNER_K,
  W_AXIS,
  W_GROUND,
  W_LADDER,
  W_PARALLEL,
  W_PRIORS,
  W_SEAT,
  holoLayout,
  type HoloWaypoint,
} from "./holoProgramGeom";
import { readHoloHover } from "./hoverRef";
import {
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { clamp01 } from "@/lib/math";

/** Ken Perlin smootherstep, with the degenerate-edge guard the corridor's
 *  rings carry (a zero-width window must resolve, not divide by zero). */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const DAWN = new THREE.Color(COLOR_SURFACES);
const GREEN = new THREE.Color(COLOR_SOURCES);
const GOLD = new THREE.Color(SERVICES_GOLD);

/** The first ring's accent rides its OWN ring's window, not the seat's — it
 *  is the opening mark of the record, and it lights when that ring closes. */
const W_FIRST_ACCENT: readonly [number, number] = [0.2, 0.42];

/** Resting opacities. Structure sits well below the accents so the three
 *  bloom donors are the only things that reach the 0.42 threshold. */
const O_RING = 0.78;
const O_SEAT = 0.95;
const O_AXIS = 0.5;
const O_TICK = 0.3;
/** ⚠ The graticule is the quietest thing on the plate. At 0.12 it measured
 *  as the LOUDEST — a full-width mesh has far more ink than seven rings, so
 *  equal alpha is not equal presence. Area is the multiplier. */
const O_GRID = 0.032;
const O_STEM = 0.1;
const O_LADDER = 0.72;
const O_PARALLEL = 0.34;
const O_PRIOR = 0.3;

export interface HoloProgramSceneProps {
  waypoints: readonly HoloWaypoint[];
  /** Arms the arrival. False holds the instrument at progress 0 (nothing
   *  drawn) so the beat can wait behind the hero's curtain. */
  armed: boolean;
  /** Skips the choreography and resolves everything drawn — the reduced-motion
   *  path, and the lab's "show me the rest state" control. */
  still?: boolean;
  /** Fires on the first committed frame. The mount promotes `data-holo` to
   *  "live" from THIS, never from the gate passing — a class written before
   *  there are pixels is what makes a flat→canvas swap pop. */
  onReady?: () => void;
  /** Lab hook: replays the arrival. Changing the value restarts the clock. */
  replayToken?: number;
}

export function HoloProgramScene({
  waypoints,
  armed,
  still = false,
  onReady,
  replayToken = 0,
}: HoloProgramSceneProps) {
  const { invalidate, size } = useThree();
  const rigRef = useRef<THREE.Group>(null);

  const aspect = size.height > 0 ? size.width / size.height : 2.6;

  /* The layout is solved per ASPECT, at mount and on resize only — never per
     frame. `size` changes are the only input, so a resize re-solves and
     nothing else does. */
  const layout = useMemo(() => holoLayout(waypoints, aspect), [waypoints, aspect]);

  const ringData = useMemo(
    () => layout.rings.map((ring) => buildRingPoints(ring.x, ring.radius, ring.seat ? GOLD : DAWN)),
    [layout]
  );

  const seatRing = layout.rings.find((r) => r.seat) ?? layout.rings[layout.rings.length - 1];
  const firstRing = layout.rings[0];

  const seatInner = useMemo(
    () => (seatRing ? buildRingPoints(seatRing.x, seatRing.radius * SEAT_INNER_K, GOLD) : null),
    [seatRing]
  );

  const ticks = useMemo(() => buildTickField(layout), [layout]);
  /* The graticule, and two things about it were measured rather than chosen.
     ⚠ WIDER AND DEEPER than the course it sits under: cropped to the axis'
     own span it rendered as a torn trapezoid stranded in one corner, because
     a plane has to run past the frame to read as a ground rather than as an
     object lying on one. ⚠ And SPARSE, because the plot is SHORT — the same
     grid that grounded the drawing in a 352px lab band compressed into
     hatching in the page's 266px field. A graticule's density is read
     against the box it lands in, never against the units it was authored
     in. */
  const grid = useMemo(
    () => buildGroundGrid(layout.axisFrom - 3.4, layout.axisTo + 3.4, 4.2, 0.95, 0.95),
    [layout]
  );
  const stems = useMemo(() => buildDropStems(layout), [layout]);

  const axisPoints = useMemo(() => buildAxisPoints(layout.priorTo, layout.axisTo), [layout]);
  const priorPoints = useMemo(() => buildAxisPoints(layout.priorFrom, layout.priorTo), [layout]);
  const ladderPoints = useMemo(() => buildLadderPoints(layout), [layout]);
  const parallelPoints = useMemo(
    () => buildParallelPoints(layout.axisFrom, layout.axisTo, PARALLEL_DY),
    [layout]
  );

  /* The priors sit BEFORE the axis origin — Starhaven and Latent Land are
     not rings, because a radius would claim an adoption level this record
     never gives them. Two marks and a dashed run-in is the honest amount. */
  const priorMarks = useMemo(() => {
    const span = layout.priorTo - layout.priorFrom;
    return [0.34, 0.68].map((t) => buildPriorDiamond(layout.priorFrom + span * t));
  }, [layout]);

  /* The three accent arcs — the ONLY additive geometry, and the only thing
     bright enough for Bloom to lift and the aberration to fringe. */
  const accentSeat = useMemo(
    () => (seatRing ? buildAccentArc(seatRing.x, seatRing.radius, 0.7) : null),
    [seatRing]
  );
  const accentSeatInner = useMemo(
    () => (seatRing ? buildAccentArc(seatRing.x, seatRing.radius * SEAT_INNER_K, 0.44) : null),
    [seatRing]
  );
  const accentFirst = useMemo(
    () => (firstRing ? buildAccentArc(firstRing.x, firstRing.radius, 0.42) : null),
    [firstRing]
  );

  useEffect(() => () => disposeAll(ticks.geometry, grid, stems), [ticks.geometry, grid, stems]);

  /* ── Refs the frame writes through ─────────────────────────────────── */
  const ringRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const tickRef = useRef<THREE.LineSegments>(null);
  const seatInnerRef = useRef<ComponentRef<typeof Line>>(null);
  const axisRef = useRef<ComponentRef<typeof Line>>(null);
  const priorRef = useRef<ComponentRef<typeof Line>>(null);
  const priorMarkRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const ladderRef = useRef<ComponentRef<typeof Line>>(null);
  const parallelRef = useRef<ComponentRef<typeof Line>>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const stemRef = useRef<THREE.LineSegments>(null);
  const accentRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);

  const progress = useRef(0);
  const ready = useRef(false);
  const pointer = useRef({ yaw: 0, pitch: 0 });
  const pointerTarget = useRef({ yaw: 0, pitch: 0 });
  const hoverGain = useRef<Record<string, number>>({});

  /* Replay / arm changes rewind the clock. `still` resolves it outright —
     the reduced-motion path must land on the finished drawing, never on a
     half-drawn one. */
  useEffect(() => {
    progress.current = still ? 1 : 0;
    invalidate();
  }, [replayToken, still, armed, invalidate]);

  /* Pointer-look. A window listener rather than canvas hover, because the
     canvas is `pointer-events: none` — the DOM stations own the pointer and
     the instrument must still respond to a cursor crossing them. */
  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerTarget.current.yaw = nx * POINTER_AMPLITUDE;
      pointerTarget.current.pitch = ny * POINTER_AMPLITUDE * 0.6;
      invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [still, invalidate]);

  useFrame((_, delta) => {
    /* ── The arrival clock ─────────────────────────────────────────── */
    if (still) {
      progress.current = 1;
    } else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (delta * 1000) / ARRIVAL_MS);
    }
    const p = progress.current;

    /* ── The rig: rest pose plus damped pointer-look ───────────────── */
    const k = Math.min(1, delta * 4);
    pointer.current.yaw += (pointerTarget.current.yaw - pointer.current.yaw) * k;
    pointer.current.pitch += (pointerTarget.current.pitch - pointer.current.pitch) * k;
    const rig = rigRef.current;
    if (rig) {
      // ⚠ 'YXZ' is the arithmetic twin of `applyRig` in holoProgramGeom —
      // three composes it as Ry·Rx, i.e. pitch locally then yaw about world
      // Y. Change one and the rings leave their labels.
      rig.rotation.set(
        REST_PITCH + pointer.current.pitch,
        REST_YAW + pointer.current.yaw,
        0,
        "YXZ"
      );
    }

    /* ── The record, drawn in its own order ────────────────────────── */
    const hovered = readHoloHover();

    layout.rings.forEach((ring, i) => {
      const line = ringRefs.current[i];
      if (!line) return;
      const reveal = smootherstep(ring.reveal[0], ring.reveal[1], p);
      line.geometry.instanceCount = Math.max(0, Math.ceil(reveal * RING_SEGMENTS));

      // Hover damps toward a brighter, slightly heavier ring and SETTLES —
      // an event-driven response, not an animation.
      const want = hovered === ring.id ? 1 : 0;
      const gain = hoverGain.current[ring.id] ?? 0;
      const next = gain + (want - gain) * Math.min(1, delta * 8);
      hoverGain.current[ring.id] = Math.abs(next - want) < 1e-3 ? want : next;

      const base = ring.seat ? O_SEAT : O_RING;
      line.material.opacity = Math.min(1, base * (1 + 0.42 * next));
      line.material.linewidth = (ring.seat ? 2.6 : 1.75) * (1 + 0.2 * next);
      // The draw gate: a fat line is expensive, so an undrawn ring is not
      // drawn at all rather than drawn at zero.
      line.visible = reveal > 0.001;
    });

    if (seatInnerRef.current && seatRing) {
      const r = smootherstep(W_SEAT[0], W_SEAT[1], p);
      seatInnerRef.current.geometry.instanceCount = Math.max(0, Math.ceil(r * RING_SEGMENTS));
      seatInnerRef.current.visible = r > 0.001;
    }

    /* Ticks populate per ring, just after that ring's stroke closes — which
       is only possible because the buffer is ordered ring by ring. */
    if (tickRef.current) {
      let drawn = 0;
      for (let i = 0; i < layout.rings.length; i++) {
        const ring = layout.rings[i];
        const t = smootherstep(ring.reveal[1] - 0.02, ring.reveal[1] + 0.06, p);
        const [, count] = ticks.ranges[i];
        drawn += Math.ceil((t * count) / 2) * 2;
      }
      tickRef.current.geometry.setDrawRange(0, drawn);
      tickRef.current.visible = drawn > 0;
    }

    /** Reveal one fat line. `segments` is its real segment count — a fat
     *  line renders one instance per segment, so capping `instanceCount`
     *  above the true count would silently stop being a draw-on. */
    const setLine = (
      ref: ComponentRef<typeof Line> | null,
      window_: readonly [number, number],
      base: number,
      segments: number
    ) => {
      if (!ref) return;
      const r = smootherstep(window_[0], window_[1], p);
      if (segments > 0) ref.geometry.instanceCount = Math.max(0, Math.ceil(r * segments));
      ref.material.opacity = segments > 0 ? base : base * r;
      ref.visible = r > 0.001;
    };

    setLine(axisRef.current, W_AXIS, O_AXIS, axisPoints.length - 1);
    setLine(ladderRef.current, W_LADDER, O_LADDER, ladderPoints.length - 1);
    // Dashed lines cannot stroke-draw-on (a dash pattern has no single
    // leading edge), so they FADE — the corridor's rings make the same call.
    // `segments: 0` is what selects that path.
    setLine(priorRef.current, W_PRIORS, O_PRIOR, 0);
    setLine(parallelRef.current, W_PARALLEL, O_PARALLEL, 0);
    priorMarkRefs.current.forEach((ref) => setLine(ref, W_PRIORS, O_PRIOR + 0.2, 0));

    const groundR = smootherstep(W_GROUND[0], W_GROUND[1], p);
    if (gridRef.current) {
      (gridRef.current.material as THREE.LineBasicMaterial).opacity = O_GRID * groundR;
      gridRef.current.visible = groundR > 0.01;
    }
    if (stemRef.current) {
      const r = smootherstep(W_PARALLEL[0], W_PARALLEL[1], p);
      (stemRef.current.material as THREE.LineBasicMaterial).opacity = O_STEM * r;
      stemRef.current.visible = r > 0.01;
    }
    if (tickRef.current) {
      (tickRef.current.material as THREE.LineBasicMaterial).opacity = O_TICK;
    }

    /* The bloom donors brighten last — the instrument resolves onto its
       terminus rather than lighting up all at once. */
    const seatGain = smootherstep(W_SEAT[0], W_SEAT[1], p);
    accentRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const gain = i === 2 ? smootherstep(W_FIRST_ACCENT[0], W_FIRST_ACCENT[1], p) : seatGain;
      ref.material.opacity = gain;
      ref.visible = gain > 0.01;
    });

    /* ── First pixels, then the mount may say "live" ───────────────── */
    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }

    /* ── Keep the loop alive only while something is unsettled ─────── */
    const arriving = !still && armed && p < 1;
    const pointerMoving =
      Math.abs(pointerTarget.current.yaw - pointer.current.yaw) > 1e-4 ||
      Math.abs(pointerTarget.current.pitch - pointer.current.pitch) > 1e-4;
    const hoverMoving = Object.entries(hoverGain.current).some(
      ([id, g]) => Math.abs((hovered === id ? 1 : 0) - g) > 1e-3
    );
    if (arriving || pointerMoving || hoverMoving) invalidate();
  });

  return (
    <group ref={rigRef}>
      {/* The graticule — chrome, and nothing is measured against it. */}
      <lineSegments ref={gridRef} geometry={grid}>
        <lineBasicMaterial
          color={DAWN}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments ref={stemRef} geometry={stems}>
        <lineBasicMaterial color={DAWN} transparent opacity={0} depthWrite={false} />
      </lineSegments>

      {/* The time axis, and the priors running in ahead of it. */}
      <Line
        ref={axisRef}
        points={axisPoints}
        color={COLOR_SURFACES}
        lineWidth={1.2}
        transparent
        opacity={0}
        depthWrite={false}
      />
      <Line
        ref={priorRef}
        points={priorPoints}
        color={COLOR_SURFACES}
        lineWidth={1}
        dashed
        dashSize={0.06}
        gapSize={0.07}
        transparent
        opacity={0}
        depthWrite={false}
      />
      {priorMarks.map((pts, i) => (
        <Line
          key={`prior-${i}`}
          ref={(el) => {
            priorMarkRefs.current[i] = el;
          }}
          points={pts}
          color={COLOR_SURFACES}
          lineWidth={1.1}
          transparent
          opacity={0}
          depthWrite={false}
        />
      ))}

      {/* The course: one ring per dated waypoint. */}
      {layout.rings.map((ring, i) => (
        <Line
          key={ring.id}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          points={ringData[i].points}
          vertexColors={ringData[i].colors}
          lineWidth={ring.seat ? 2.4 : 1.5}
          transparent
          opacity={ring.seat ? O_SEAT : O_RING}
          depthWrite={false}
        />
      ))}

      {/* The seat's inner ring — the doublet that reads as SEATED rather
          than as an eighth station. */}
      {seatInner ? (
        <Line
          ref={seatInnerRef}
          points={seatInner.points}
          vertexColors={seatInner.colors}
          lineWidth={1.3}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      ) : null}

      <lineSegments ref={tickRef} geometry={ticks.geometry}>
        <lineBasicMaterial color={DAWN} transparent opacity={0} depthWrite={false} />
      </lineSegments>

      {/* The adoption ladder — the one green thing, because green is the
          human everywhere on this estate. */}
      <Line
        ref={ladderRef}
        points={ladderPoints}
        color={GREEN}
        lineWidth={1.8}
        transparent
        opacity={0}
        depthWrite={false}
      />

      {/* The platform track that ran beside the course. ONE rail, because
          the record gives one log row. */}
      <Line
        ref={parallelRef}
        points={parallelPoints}
        color={SERVICES_GOLD}
        lineWidth={1}
        dashed
        dashSize={0.09}
        gapSize={0.11}
        transparent
        opacity={0}
        depthWrite={false}
      />

      {/* The three bloom donors. */}
      {[accentSeat, accentSeatInner, accentFirst].map((pts, i) =>
        pts ? (
          <Line
            key={`accent-${i}`}
            ref={(el) => {
              accentRefs.current[i] = el;
            }}
            points={pts}
            color={i === 2 ? COLOR_SURFACES : SERVICES_GOLD}
            lineWidth={i === 0 ? 3 : 2}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        ) : null
      )}
    </group>
  );
}
