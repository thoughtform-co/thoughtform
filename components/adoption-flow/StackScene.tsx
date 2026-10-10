"use client";

/**
 * B · EXPLODED STACK. One coaxial stack, tilted, coming apart and closing on a
 * slow breath (anime.js's toolbox, the instrument's organisation altitude,
 * ADR-154 U4), read bottom to top:
 *
 * - the work: the base plate, one tick on its rim per workstream (27; the
 *   three still done by hand dim);
 * - the layer: five plates, heaviest at the bottom, each as thick as its Skill
 *   count and toothed one tooth per Skill (47);
 * - the run modes on top: a prompt ring ticked once per stream (12), a tool
 *   band with one bar per stream (5), an agent cage with one rib per stream
 *   (7), tallest because it runs longest without a person.
 *
 * Motes climb the bore from the work and stop at their rung, dealt 12 · 5 · 7.
 */

import { useFrame } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import type * as THREE from "three";

import type { HoloPalette } from "@/components/holo-program/holoPalette";
import { FLOW_RUNGS, FLOW_RUNS, FLOW_SHAPES, FLOW_WORKS, rungOf } from "@/lib/adoption-flow/record";

import {
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

const THICK = 0.034;
const DISC_R = 1.7;
const BORE_R = 0.5;

type Level =
  | { kind: "work"; h: number; r: number }
  | { kind: "shape"; h: number; r: number; skills: number; key: string }
  | { kind: "prompt" | "tool" | "agent"; h: number; r: number; count: number };

const LEVELS: Level[] = [
  { kind: "work", h: 0.14, r: 2.35 },
  ...[...FLOW_SHAPES].map((s) => ({
    kind: "shape" as const,
    h: s.skills * THICK,
    r: DISC_R,
    skills: s.skills,
    key: s.key,
  })),
  { kind: "prompt", h: 0.1, r: 1.0, count: FLOW_RUNS.prompt },
  { kind: "tool", h: 0.38, r: 1.25, count: FLOW_RUNS.tool },
  { kind: "agent", h: 1.3, r: 0.95, count: FLOW_RUNS.agent },
];

/** Each level's bottom, for a gap `g` between levels, centred on y = 0. */
function levelYs(g: number): number[] {
  const ys: number[] = [];
  let y = 0;
  for (const l of LEVELS) {
    ys.push(y);
    y += l.h + g;
  }
  const total = y - g;
  return ys.map((v) => v - total / 2);
}
const gapAt = (t: number) => 0.16 + 0.62 * (0.5 - 0.5 * Math.cos((TAU * t) / 16));

/** Where each level rests before the first frame moves it. */
const Y_REST = levelYs(gapAt(0));

const RUNG_LEVEL = [LEVELS.length - 3, LEVELS.length - 2, LEVELS.length - 1];

export const STACK_TRACKERS: TrackerDef[] = [
  { key: "TRK 01", label: `The work · ${FLOW_WORKS} streams` },
  ...FLOW_SHAPES.map((s, i) => ({
    key: `TRK 0${2 + i}`,
    label: `${s.label} · ${s.skills}`,
    side: i % 2 === 0 ? ("left" as const) : undefined,
  })),
  ...FLOW_RUNGS.map((r, i) => ({ key: `TRK 0${7 + i}`, label: `${r.label} · ${r.count}` })),
];

export const STACK_CAMERA = {
  azimuthDeg: 18,
  elevationDeg: 14,
  distance: 22,
  target: [0, 0.2, 0] as P3,
  fov: 30,
};

function LevelGeom({ level, palette }: { level: Level; palette: HoloPalette }) {
  const g = useMemo(() => {
    const { h, r } = level;
    const rings: { pts: P3[]; gold: boolean; w: number; op: number }[] = [];
    const lit: P3[] = [];
    const dim: P3[] = [];
    const gold: P3[] = [];
    if (level.kind === "work") {
      rings.push({ pts: ringPts([0, 0, 0], r, "y"), gold: false, w: 1, op: 0.55 });
      rings.push({ pts: ringPts([0, h, 0], r, "y"), gold: false, w: 1.2, op: 0.8 });
      rings.push({ pts: ringPts([0, h, 0], r - 0.32, "y"), gold: false, w: 1, op: 0.45 });
      rings.push({ pts: ringPts([0, h, 0], BORE_R, "y"), gold: true, w: 1, op: 0.7 });
      for (let i = 0; i < FLOW_WORKS; i++) {
        const a = (i / FLOW_WORKS) * TAU;
        (i >= FLOW_WORKS - FLOW_RUNS.hand ? dim : lit).push(
          onCircle([0, h, 0], r - 0.32, "y", a),
          onCircle([0, h, 0], r - 0.06, "y", a)
        );
      }
      for (const a of [0, TAU / 4])
        lit.push(onCircle([0, h, 0], BORE_R + 0.1, "y", a), onCircle([0, h, 0], r - 0.42, "y", a));
      for (const a of [TAU / 2, (3 * TAU) / 4])
        lit.push(onCircle([0, h, 0], BORE_R + 0.1, "y", a), onCircle([0, h, 0], r - 0.42, "y", a));
    } else if (level.kind === "shape") {
      rings.push({ pts: ringPts([0, 0, 0], r, "y"), gold: true, w: 1.1, op: 0.75 });
      rings.push({ pts: ringPts([0, h, 0], r, "y"), gold: true, w: 1.4, op: 0.95 });
      rings.push({ pts: ringPts([0, h, 0], BORE_R, "y"), gold: true, w: 1, op: 0.6 });
      for (let k = 0; k < level.skills; k++) {
        const a = (k / level.skills) * TAU;
        gold.push(onCircle([0, 0, 0], r, "y", a), onCircle([0, h, 0], r, "y", a));
        gold.push(onCircle([0, h, 0], r - 0.26, "y", a), onCircle([0, h, 0], r, "y", a));
      }
    } else {
      const n = level.count;
      const accent = level.kind === "agent";
      const tiers = level.kind === "agent" ? 6 : 2;
      for (let j = 0; j < tiers; j++)
        rings.push({
          pts: ringPts([0, (h * j) / (tiers - 1), 0], r, "y"),
          gold: false,
          w: j === tiers - 1 ? 1.3 : 1,
          op: accent ? 0.85 : 0.7,
        });
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + 0.2;
        if (level.kind === "prompt")
          lit.push(onCircle([0, h, 0], r - 0.18, "y", a), onCircle([0, h, 0], r, "y", a));
        else lit.push(onCircle([0, 0, 0], r, "y", a), onCircle([0, h, 0], r, "y", a));
      }
    }
    return { rings, lit, dim, gold };
  }, [level]);
  return (
    <>
      {g.rings.map((ring, i) => (
        <Ring
          key={i}
          points={ring.pts}
          color={
            ring.gold
              ? palette.gold
              : level.kind === "agent" && i === g.rings.length - 1
                ? palette.accent
                : palette.structure
          }
          width={ring.w}
          opacity={ring.op}
          palette={palette}
        />
      ))}
      {g.lit.length > 0 && (
        <Segs pairs={g.lit} color={palette.structure} opacity={0.7} palette={palette} />
      )}
      {g.dim.length > 0 && (
        <Segs pairs={g.dim} color={palette.structure} opacity={0.2} palette={palette} />
      )}
      {g.gold.length > 0 && (
        <Segs pairs={g.gold} color={palette.gold} opacity={0.65} palette={palette} />
      )}
    </>
  );
}

export function StackScene({
  palette,
  trackers,
}: {
  palette: HoloPalette;
  trackers: RefObject<(HTMLElement | null)[]>;
}) {
  const tilt = useRef<THREE.Group>(null);
  const levelRefs = useRef<(THREE.Group | null)[]>([]);
  const ys = useRef<number[]>(Y_REST);
  const tracked = useTracked(LEVELS.map(() => [0, 0, 0] as P3));

  useFrame(({ clock }) => {
    const y = levelYs(gapAt(clock.elapsedTime));
    ys.current = y;
    LEVELS.forEach((l, i) => {
      const g = levelRefs.current[i];
      if (g) g.position.y = y[i];
      const left = l.kind === "shape" && FLOW_SHAPES.findIndex((s) => s.key === l.key) % 2 === 0;
      const a = left ? Math.PI * 0.75 : Math.PI * 0.25;
      tracked.current[i].set(Math.cos(a) * l.r, y[i] + l.h / 2, Math.sin(a) * l.r);
    });
  });

  const bore = useMemo(() => {
    const y = levelYs(0.8);
    return [
      [0, y[0] - 0.4, 0],
      [0, y[y.length - 1] + LEVELS[LEVELS.length - 1].h + 0.5, 0],
    ] as P3[];
  }, []);

  const step = useMemo(
    () => (i: number, t: number, out: Float32Array, o: number) => {
      const s = frac(t / 7 + rand(i, 1));
      const lv = RUNG_LEVEL[rungOf(i)];
      const y = ys.current;
      const y0 = y[0] + 0.1;
      const y1 = y[lv] + LEVELS[lv].h * 0.5;
      const a = rand(i, 2) * TAU + t * 0.6;
      const r = 0.12 + 0.22 * rand(i, 3);
      const p = onCircle([0, y0 + (y1 - y0) * s, 0], r, "y", a);
      out[o] = p[0];
      out[o + 1] = p[1];
      out[o + 2] = p[2];
      return smoothstep(0, 0.08, s) * (1 - smoothstep(0.86, 1, s));
    },
    []
  );

  return (
    <group ref={tilt} rotation={[0.1, 0, -0.5]}>
      <Ring points={bore} color={palette.gold} opacity={0.4} palette={palette} />
      {LEVELS.map((l, i) => (
        <group
          key={i}
          ref={(el) => {
            levelRefs.current[i] = el;
          }}
          position={[0, Y_REST[i], 0]}
        >
          <LevelGeom level={l} palette={palette} />
        </group>
      ))}
      <Motes count={144} step={step} color={palette.gold} size={6} palette={palette} />
      <TrackerSync points={tracked} els={trackers} group={tilt} />
    </group>
  );
}
