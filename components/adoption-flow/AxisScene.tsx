"use client";

/**
 * A · AXIS. The equilibrium's grammar (ADR-143 U8) turned to adoption →
 * automation, read left to right on one axis:
 *
 * - ADOPT: the team's work as a crumpled contour mass, drifting, in a
 *   graduated cradle of one tick per workstream (27; the three still done by
 *   hand stay dim).
 * - WRITE IT DOWN: the layer as five gold collars on the axis, one per shape,
 *   each as wide as its Skill count and caged by one strut per Skill (47).
 * - AUTOMATE: a coaxial run of identical rings at one pitch, and three gates
 *   along it. Motes leave the mass, find the axis in the collars and run
 *   down the rings, each stopping at its rung's gate, dealt 12 · 5 · 7.
 */

import { useFrame } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import type * as THREE from "three";

import type { HoloPalette } from "@/components/holo-program/holoPalette";
import {
  FLOW_RUNGS,
  FLOW_RUNS,
  FLOW_SHAPES,
  FLOW_SKILLS,
  FLOW_WORKS,
  rungOf,
} from "@/lib/adoption-flow/record";

import {
  arcPts,
  bracketRing,
  frac,
  Motes,
  onCircle,
  type P3,
  rand,
  Ring,
  ringPts,
  Segs,
  smoothstep,
  TAU,
  type TrackerDef,
  TrackerSync,
  useTracked,
} from "./flowKit";

const MASS = { x: -4.7, r: 1.55, half: 1.6, slices: 30, n: 72 } as const;
const CRADLE_R = 2.15;
const COLLAR_R = 1.2;
const COLLAR_UNIT = 0.072;
const COLLAR_GAP = 0.13;
const RUN = { x0: 2.5, pitch: 0.4, rings: 13, r: 0.92 } as const;
/** The gates' rings along the run (illustrative distances, ladder order). */
const GATE_RING = [1, 5, 12] as const;

const collarSpans = (() => {
  const total =
    FLOW_SHAPES.reduce((s, sh) => s + sh.skills * COLLAR_UNIT, 0) +
    COLLAR_GAP * (FLOW_SHAPES.length - 1);
  let x = -total / 2;
  return FLOW_SHAPES.map((sh) => {
    const span = { x0: x, x1: x + sh.skills * COLLAR_UNIT, shape: sh };
    x = span.x1 + COLLAR_GAP;
    return span;
  });
})();
const LAYER_X0 = collarSpans[0].x0;
const LAYER_X1 = collarSpans[collarSpans.length - 1].x1;
const ringX = (i: number) => RUN.x0 + i * RUN.pitch;
const gateX = GATE_RING.map((i) => ringX(i) + RUN.pitch / 2);

export const AXIS_TRACKERS: TrackerDef[] = [
  { key: "TRK 01", label: `The work · ${FLOW_WORKS} streams` },
  { key: "TRK 02", label: `By hand · ${FLOW_RUNS.hand}` },
  { key: "TRK 03", label: `The layer · ${FLOW_SKILLS} Skills` },
  { key: "TRK 04", label: `${FLOW_SHAPES[0].label} · ${FLOW_SHAPES[0].skills}` },
  ...FLOW_RUNGS.map((r, i) => ({ key: `TRK 0${5 + i}`, label: `${r.label} · ${r.count}` })),
];

export const AXIS_CAMERA = {
  azimuthDeg: 22,
  elevationDeg: 16,
  distance: 24,
  target: [1.0, 0, 0] as P3,
  fov: 30,
};

/** The mass's outline at slice `j`, angle `a`, time `t`: crumpled, drifting. */
function massPoint(j: number, a: number, t: number): P3 {
  const u = (j / (MASS.slices - 1)) * 2 - 1;
  const x = MASS.x + u * MASS.half;
  const env = Math.sqrt(Math.max(0, 1 - u * u)) * MASS.r;
  const crumple =
    1 +
    0.2 * Math.sin(3 * a + 2.1 * u + 0.35 * t) +
    0.11 * Math.sin(7 * a - 3.3 * u - 0.5 * t + 1.3) +
    0.06 * Math.sin(13 * a + 5.2 * u + 0.8 * t + 2.2);
  return onCircle([x, 0, 0], env * crumple, "x", a);
}

export function AxisScene({
  palette,
  trackers,
}: {
  palette: HoloPalette;
  trackers: RefObject<(HTMLElement | null)[]>;
}) {
  const massGeom = useRef<THREE.BufferGeometry | null>(null);

  const massPairs = useMemo(() => {
    const out: P3[] = [];
    for (let j = 0; j < MASS.slices; j++)
      for (let k = 0; k < MASS.n; k++)
        out.push(massPoint(j, (k / MASS.n) * TAU, 0), massPoint(j, ((k + 1) / MASS.n) * TAU, 0));
    return out;
  }, []);

  useFrame(({ clock }) => {
    const g = massGeom.current;
    if (!g) return;
    const arr = g.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    let o = 0;
    for (let j = 0; j < MASS.slices; j++)
      for (let k = 0; k < MASS.n; k++) {
        arr.set(massPoint(j, (k / MASS.n) * TAU, t), o);
        arr.set(massPoint(j, ((k + 1) / MASS.n) * TAU, t), o + 3);
        o += 6;
      }
    g.attributes.position.needsUpdate = true;
  });

  /* the cradle: one tick per workstream, the hand-led ones dim */
  const cradle = useMemo(() => {
    /* under the mass: angle π is straight down on an x-axis circle */
    const a0 = Math.PI * 0.6;
    const a1 = Math.PI * 1.4;
    const lit: P3[] = [];
    const dim: P3[] = [];
    for (let i = 0; i < FLOW_WORKS; i++) {
      const a = a0 + ((a1 - a0) * i) / (FLOW_WORKS - 1);
      const inner = onCircle([MASS.x, 0, 0], CRADLE_R, "x", a);
      const outer = onCircle([MASS.x, 0, 0], CRADLE_R + (i % 5 === 0 ? 0.24 : 0.14), "x", a);
      (i >= FLOW_WORKS - FLOW_RUNS.hand ? dim : lit).push(inner, outer);
    }
    return { arc: arcPts([MASS.x, 0, 0], CRADLE_R, "x", a0 - 0.05, a1 + 0.05, 64), lit, dim, a1 };
  }, []);

  /* the collars: two rims each and one strut per Skill */
  const collars = useMemo(
    () =>
      collarSpans.map((c) => {
        const struts: P3[] = [];
        for (let k = 0; k < c.shape.skills; k++) {
          const a = (k / c.shape.skills) * TAU;
          struts.push(
            onCircle([c.x0, 0, 0], COLLAR_R, "x", a),
            onCircle([c.x1, 0, 0], COLLAR_R, "x", a)
          );
        }
        return {
          ...c,
          struts,
          rimA: ringPts([c.x0, 0, 0], COLLAR_R, "x"),
          rimB: ringPts([c.x1, 0, 0], COLLAR_R, "x"),
        };
      }),
    []
  );

  const runRings = useMemo(
    () => Array.from({ length: RUN.rings }, (_, i) => ringPts([ringX(i), 0, 0], RUN.r, "x")),
    []
  );
  const runRails = useMemo(() => {
    const out: P3[] = [];
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5])
      out.push(
        onCircle([ringX(0), 0, 0], RUN.r, "x", a),
        onCircle([ringX(RUN.rings - 1), 0, 0], RUN.r, "x", a)
      );
    return out;
  }, []);
  const gates = useMemo(() => gateX.map((x) => bracketRing([x, 0, 0], RUN.r + 0.32, "x")), []);

  const tracked = useTracked([
    [MASS.x, MASS.r + 0.5, 0],
    onCircle([MASS.x, 0, 0], CRADLE_R, "x", cradle.a1),
    [(LAYER_X0 + LAYER_X1) / 2, COLLAR_R + 0.35, 0],
    [(collarSpans[0].x0 + collarSpans[0].x1) / 2, -COLLAR_R - 0.15, 0],
    ...gateX.map((x) => [x, RUN.r + 0.36, 0] as P3),
  ]);

  /* motes: born in the mass, found by the axis, run to their rung's gate */
  const step = useMemo(
    () => (i: number, t: number, out: Float32Array, o: number) => {
      const period = 9;
      const s = frac(t / period + rand(i, 1));
      const end = gateX[rungOf(i)];
      const r0 = rand(i, 2);
      const a = rand(i, 3) * TAU + t * (0.3 + r0 * 0.4);
      let p: P3;
      if (s < 0.3) {
        const u = s / 0.3;
        const x = MASS.x - MASS.half * 0.8 + u * (MASS.half * 1.8);
        const rad = MASS.r * 0.8 * (1 - smoothstep(0.55, 1, u)) * (0.4 + 0.6 * r0);
        p = onCircle([x, 0, 0], rad, "x", a);
      } else {
        const u = (s - 0.3) / 0.7;
        const x = MASS.x + MASS.half + u * (end - MASS.x - MASS.half);
        const rad = 0.06 + 0.05 * r0;
        p = onCircle([x, 0, 0], rad, "x", a);
      }
      out[o] = p[0];
      out[o + 1] = p[1];
      out[o + 2] = p[2];
      return smoothstep(0, 0.06, s) * (1 - smoothstep(0.88, 1, s));
    },
    []
  );

  return (
    <>
      <Segs
        pairs={massPairs}
        color={palette.structure}
        opacity={palette.additive ? 0.24 : 0.36}
        palette={palette}
        geomRef={massGeom}
      />
      <Ring points={cradle.arc} color={palette.structure} opacity={0.6} palette={palette} />
      <Segs pairs={cradle.lit} color={palette.structure} opacity={0.8} palette={palette} />
      <Segs pairs={cradle.dim} color={palette.structure} opacity={0.22} palette={palette} />

      <Ring
        points={[
          [MASS.x - MASS.half - 0.8, 0, 0],
          [ringX(RUN.rings - 1) + 0.6, 0, 0],
        ]}
        color={palette.gold}
        opacity={0.45}
        palette={palette}
      />

      {collars.map((c) => (
        <group key={c.shape.key}>
          <Ring points={c.rimA} color={palette.gold} opacity={0.75} width={1.1} palette={palette} />
          <Ring points={c.rimB} color={palette.gold} opacity={0.75} width={1.1} palette={palette} />
          <Segs pairs={c.struts} color={palette.gold} opacity={0.42} palette={palette} />
        </group>
      ))}

      {runRings.map((pts, i) => (
        <Ring
          key={i}
          points={pts}
          color={palette.structure}
          opacity={0.5 - i * 0.012}
          palette={palette}
        />
      ))}
      <Segs pairs={runRails} color={palette.structure} opacity={0.18} palette={palette} />
      {gates.map((g, gi) => (
        <group key={gi}>
          {g.map((pts, k) => (
            <Ring
              key={k}
              points={pts}
              color={palette.structure}
              opacity={0.85}
              width={1.2}
              palette={palette}
            />
          ))}
        </group>
      ))}

      <Motes count={168} step={step} color={palette.gold} size={6} palette={palette} />
      <TrackerSync points={tracked} els={trackers} />
    </>
  );
}
