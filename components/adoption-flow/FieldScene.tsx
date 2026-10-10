"use client";

/**
 * C · FIELD. A ruled surface over a graticule (the wireframe-surface
 * reference). Across: adoption to automation. Up: how long the work runs
 * without a person (illustrative heights; the record gives the order).
 *
 * - Low and restless on the left, where the team learns by hand; a row of
 *   three bars there for the streams still done by hand.
 * - A gold band where it is written down: 47 gold beads in five groups, one
 *   per Skill, on the surface's centre line.
 * - Three plateaus, prompt · tool · agent, each with one bar per stream
 *   (12 · 5 · 7) in the back row. Motes ride the centre line and stop at
 *   the end of their rung's plateau.
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
  rungOf,
} from "@/lib/adoption-flow/record";

import {
  Dots,
  frac,
  Motes,
  type P3,
  rand,
  Ring,
  Segs,
  smoothstep,
  type TrackerDef,
  TrackerSync,
  useTracked,
} from "./flowKit";

const X0 = -6;
const X1 = 6;
const ZH = 2.4;
const STRANDS = 11;
const SZ = 1.6;
const DX = 0.08;
const BAND = { x0: -2.4, x1: -0.5 } as const;
const PLATEAU = [
  { x0: 0.2, x1: 1.8, h: 1.0 },
  { x0: 2.5, x1: 3.9, h: 2.0 },
  { x0: 4.6, x1: 5.9, h: 3.3 },
] as const;
const HAND = { x0: -5.4, x1: -4.3, h: 0.34 } as const;
const BAR_Z = -2.15;

/** The surface's height on its centre line. */
function H(x: number): number {
  return (
    0.22 +
    0.78 * smoothstep(-0.5, 0.2, x) +
    1.0 * smoothstep(1.8, 2.5, x) +
    1.3 * smoothstep(3.9, 4.6, x)
  );
}
/** The restlessness of the hand-led side: zero on the centre line. */
function ripple(x: number, z: number, t: number): number {
  const live = 1 - smoothstep(-3.2, -2.2, x);
  return (
    live *
    (Math.abs(z) / SZ) *
    0.16 *
    (Math.sin(2.3 * x + 1.7 * z + 0.9 * t) + 0.5 * Math.sin(5.1 * x - 2.9 * z - 1.3 * t))
  );
}
const surf = (x: number, z: number, t: number): P3 => [
  x,
  H(x) * (1 - 0.14 * (z / SZ) ** 2) + ripple(x, z, t),
  z,
];

const strandZ = (k: number) => -SZ + (2 * SZ * k) / (STRANDS - 1);
const xs = (() => {
  const out: number[] = [];
  for (let x = X0 + 0.2; x <= X1 + 1e-6; x += DX) out.push(x);
  return out;
})();

export const FIELD_TRACKERS: TrackerDef[] = [
  { key: "TRK 01", label: `By hand · ${FLOW_RUNS.hand}` },
  { key: "TRK 02", label: "Adopt" },
  { key: "TRK 03", label: `The layer · ${FLOW_SKILLS} Skills` },
  ...FLOW_RUNGS.map((r, i) => ({ key: `TRK 0${4 + i}`, label: `${r.label} · ${r.count}` })),
  { key: "TRK 07", label: "Time without a person" },
];

export const FIELD_CAMERA = {
  azimuthDeg: 30,
  elevationDeg: 24,
  distance: 21,
  target: [0.3, 1.2, 0] as P3,
  fov: 30,
};

function buildSurface(t: number): P3[] {
  const out: P3[] = [];
  for (let k = 0; k < STRANDS; k++) {
    if (k === (STRANDS - 1) / 2) continue;
    const z = strandZ(k);
    for (let i = 0; i < xs.length - 1; i++) out.push(surf(xs[i], z, t), surf(xs[i + 1], z, t));
  }
  for (let i = 0; i < xs.length; i += 3) {
    for (let k = 0; k < STRANDS - 1; k++)
      out.push(surf(xs[i], strandZ(k), t), surf(xs[i], strandZ(k + 1), t));
  }
  return out;
}

export function FieldScene({
  palette,
  trackers,
}: {
  palette: HoloPalette;
  trackers: RefObject<(HTMLElement | null)[]>;
}) {
  const surfGeom = useRef<THREE.BufferGeometry | null>(null);
  const surface = useMemo(() => buildSurface(0), []);
  useFrame(({ clock }) => {
    const g = surfGeom.current;
    if (!g) return;
    const pts = buildSurface(clock.elapsedTime);
    const arr = g.attributes.position.array as Float32Array;
    pts.forEach((p, i) => arr.set(p, i * 3));
    g.attributes.position.needsUpdate = true;
  });

  const grid = useMemo(() => {
    const fine: P3[] = [];
    for (let x = X0; x <= X1 + 1e-6; x += 0.5) fine.push([x, 0, -ZH], [x, 0, ZH]);
    for (let z = -ZH; z <= ZH + 1e-6; z += 0.4) fine.push([X0, 0, z], [X1, 0, z]);
    const frame: P3[] = [
      [X0, 0, -ZH],
      [X1, 0, -ZH],
      [X1, 0, ZH],
      [X0, 0, ZH],
      [X0, 0, -ZH],
    ];
    const ticks: P3[] = [];
    for (let x = X0; x <= X1 + 1e-6; x += 0.5)
      ticks.push([x, 0, ZH], [x, 0, ZH + (Math.round(x * 2) % 4 === 0 ? 0.32 : 0.16)]);
    return { fine, frame, ticks };
  }, []);

  const centre = useMemo(() => xs.map((x) => surf(x, 0, 0)), []);

  /* 47 beads in five groups across the band, on the centre line */
  const beads = useMemo(() => {
    const gap = 0.12;
    const span = BAND.x1 - BAND.x0 - gap * (FLOW_SHAPES.length - 1);
    const pitch = span / FLOW_SKILLS;
    const out: P3[] = [];
    let x = BAND.x0 + pitch / 2;
    for (const s of FLOW_SHAPES) {
      for (let k = 0; k < s.skills; k++) {
        out.push([x, H(x) + 0.04, 0]);
        x += pitch;
      }
      x += gap;
    }
    return out;
  }, []);
  const bandEdges = useMemo(
    () =>
      [BAND.x0, BAND.x1].map((x) =>
        Array.from({ length: STRANDS }, (_, k) => surf(x, strandZ(k), 0))
      ),
    []
  );

  /* one bar per stream in the back row */
  const bars = useMemo(() => {
    const rows = [
      { ...HAND, n: FLOW_RUNS.hand, accent: false, dim: true },
      ...PLATEAU.map((p, i) => ({ ...p, n: FLOW_RUNGS[i].count, accent: i === 2, dim: false })),
    ];
    return rows.map((row) => {
      const segs: P3[] = [];
      const caps: P3[] = [];
      for (let k = 0; k < row.n; k++) {
        const x =
          row.n === 1 ? (row.x0 + row.x1) / 2 : row.x0 + ((row.x1 - row.x0) * k) / (row.n - 1);
        segs.push([x, 0, BAR_Z], [x, row.h, BAR_Z]);
        caps.push([x, row.h, BAR_Z]);
      }
      return { segs, caps, accent: row.accent, dim: row.dim };
    });
  }, []);

  const post = useMemo(() => {
    const ticks: P3[] = [];
    for (let y = 0; y <= 4 + 1e-6; y += 0.25)
      ticks.push([X0, y, -ZH], [X0 + (Math.round(y * 4) % 4 === 0 ? 0.3 : 0.15), y, -ZH]);
    return {
      line: [
        [X0, 0, -ZH],
        [X0, 4.1, -ZH],
      ] as P3[],
      ticks,
    };
  }, []);

  const tracked = useTracked([
    [(HAND.x0 + HAND.x1) / 2, HAND.h + 0.25, BAR_Z],
    surf(-4.2, SZ, 0),
    [(BAND.x0 + BAND.x1) / 2, H(-1.4) + 0.5, 0],
    ...PLATEAU.map((p) => [(p.x0 + p.x1) / 2, p.h + 0.35, BAR_Z] as P3),
    [X0, 4.15, -ZH],
  ]);

  const step = useMemo(
    () => (i: number, t: number, out: Float32Array, o: number) => {
      const s = frac(t / 10 + rand(i, 1));
      const end = PLATEAU[rungOf(i)].x1;
      const x = X0 + 0.3 + s * (end - X0 - 0.3);
      out[o] = x;
      out[o + 1] = H(x) + 0.05;
      out[o + 2] = (rand(i, 2) - 0.5) * 0.12;
      return smoothstep(0, 0.05, s) * (1 - smoothstep(0.9, 1, s));
    },
    []
  );

  return (
    <>
      <Segs
        pairs={grid.fine}
        color={palette.grid}
        opacity={palette.additive ? 0.08 : 0.12}
        palette={palette}
      />
      <Ring points={grid.frame} color={palette.structure} opacity={0.45} palette={palette} />
      <Segs pairs={grid.ticks} color={palette.structure} opacity={0.55} palette={palette} />
      <Ring points={post.line} color={palette.structure} opacity={0.6} palette={palette} />
      <Segs pairs={post.ticks} color={palette.structure} opacity={0.55} palette={palette} />

      <Segs
        pairs={surface}
        color={palette.structure}
        opacity={palette.additive ? 0.26 : 0.34}
        palette={palette}
        geomRef={surfGeom}
      />
      <Ring points={centre} color={palette.accent} opacity={0.95} width={1.6} palette={palette} />
      {bandEdges.map((pts, i) => (
        <Ring
          key={i}
          points={pts}
          color={palette.gold}
          opacity={0.8}
          width={1.2}
          palette={palette}
        />
      ))}
      <Dots points={beads} color={palette.gold} size={3} opacity={0.95} palette={palette} />

      {bars.map((b, i) => (
        <group key={i}>
          <Segs
            pairs={b.segs}
            color={b.accent ? palette.accent : palette.structure}
            opacity={b.dim ? 0.3 : 0.6}
            palette={palette}
          />
          <Dots
            points={b.caps}
            color={b.accent ? palette.accent : palette.structure}
            size={3}
            opacity={b.dim ? 0.35 : 0.9}
            palette={palette}
          />
        </group>
      ))}

      <Motes count={120} step={step} color={palette.gold} size={6} palette={palette} />
      <TrackerSync points={tracked} els={trackers} />
    </>
  );
}
