"use client";

/**
 * D · DISH. A dodecagonal plate, the house housing (the carrier's own
 * twelve sides, ADR-070 U34), after Scan::Tron and Atranik. NO SPHERE: the
 * owner refused a sphere and its orbit on the equilibrium (ADR-143 U8).
 *
 * - ADOPT: dust from the rim spirals in to the core's seat.
 * - THE LAYER: the core, a column of 47 point rings in five bands (heaviest
 *   at the bottom), read by a gold scan that rises through it.
 * - AUTOMATE: three pylons on the rim, prompt · tool · agent, each as tall as
 *   its rung runs without a person (illustrative). Motes leave the core's
 *   foot along a conduit to their rung's pylon, dealt 12 · 5 · 7, and climb
 *   it. Three dim pads on the rim are the streams still done by hand.
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

const RIM = [5.3, 5.0] as const;
const INNER = 3.8;
const SEAT = 2.1;
const CORE_R = 1.35;
const RING_PITCH = 0.075;
const BAND_GAP = 0.2;
const CORE_Y0 = 0.25;
const PAD_R = 4.4;
const PYLONS = [
  { a: (135 * Math.PI) / 180, h: 1.0 },
  { a: (72 * Math.PI) / 180, h: 2.0 },
  { a: (8 * Math.PI) / 180, h: 3.3 },
] as const;
const HAND_A = [(196 * Math.PI) / 180, (206 * Math.PI) / 180, (216 * Math.PI) / 180];
const PHASE = Math.PI / 12;

/** The core's rings: each ring's height, and which band it is in. */
const coreRings = (() => {
  const out: { y: number; band: number }[] = [];
  let y = CORE_Y0;
  FLOW_SHAPES.forEach((s, b) => {
    for (let k = 0; k < s.skills; k++) {
      out.push({ y, band: b });
      y += RING_PITCH;
    }
    y += BAND_GAP - RING_PITCH;
  });
  return out;
})();
const CORE_TOP = coreRings[coreRings.length - 1].y + 0.1;

export const DISH_TRACKERS: TrackerDef[] = [
  { key: "TRK 01", label: "Adopt" },
  { key: "TRK 02", label: `The layer · ${FLOW_SKILLS} Skills` },
  { key: "TRK 03", label: `${FLOW_SHAPES[0].label} · ${FLOW_SHAPES[0].skills}` },
  ...FLOW_RUNGS.map((r, i) => ({ key: `TRK 0${4 + i}`, label: `${r.label} · ${r.count}` })),
  { key: "TRK 07", label: `By hand · ${FLOW_RUNS.hand}` },
];

export const DISH_CAMERA = {
  azimuthDeg: 28,
  elevationDeg: 30,
  distance: 23,
  target: [0, 1.4, 0] as P3,
  fov: 30,
};

export function DishScene({
  palette,
  trackers,
}: {
  palette: HoloPalette;
  trackers: RefObject<(HTMLElement | null)[]>;
}) {
  const scan = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (scan.current)
      scan.current.position.y = CORE_Y0 + frac(clock.elapsedTime / 7) * (CORE_TOP - CORE_Y0);
  });

  const plate = useMemo(() => {
    const spokes: P3[] = [];
    for (let i = 0; i < 12; i++) {
      const a = PHASE + (i / 12) * TAU;
      spokes.push(onCircle([0, 0, 0], INNER, "y", a), onCircle([0, 0, 0], RIM[1], "y", a));
    }
    const stipple: P3[] = [];
    for (let i = 0; i < 520; i++) {
      const r = SEAT + 0.2 + rand(i, 4) * (INNER - SEAT - 0.4);
      stipple.push(onCircle([0, 0, 0], r, "y", rand(i, 5) * TAU));
    }
    return {
      rims: [RIM[0], RIM[1], INNER].map((r) => ringPts([0, 0, 0], r, "y", 12, PHASE)),
      seat: ringPts([0, 0, 0], SEAT, "y"),
      foot: ringPts([0, 0, 0], CORE_R + 0.2, "y"),
      spokes,
      stipple,
    };
  }, []);

  const core = useMemo(() => {
    const pts: P3[] = [];
    for (const ring of coreRings)
      for (let k = 0; k < 48; k++)
        pts.push(onCircle([0, ring.y, 0], CORE_R, "y", (k / 48) * TAU + ring.band * 0.07));
    const seams = FLOW_SHAPES.slice(1).map((_, b) => {
      const first = coreRings.findIndex((r) => r.band === b + 1);
      return ringPts([0, coreRings[first].y - BAND_GAP / 2, 0], CORE_R + 0.06, "y");
    });
    const rails: P3[] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + PHASE;
      rails.push(
        onCircle([0, CORE_Y0 - 0.1, 0], CORE_R + 0.1, "y", a),
        onCircle([0, CORE_TOP, 0], CORE_R + 0.1, "y", a)
      );
    }
    return {
      pts,
      seams,
      rails,
      bottom: ringPts([0, CORE_Y0 - 0.1, 0], CORE_R + 0.1, "y"),
      top: ringPts([0, CORE_TOP, 0], CORE_R + 0.1, "y"),
    };
  }, []);

  const pylons = useMemo(
    () =>
      PYLONS.map((p) => {
        const base = onCircle([0, 0, 0], PAD_R, "y", p.a);
        const conduit = [
          onCircle([0, 0.01, 0], CORE_R + 0.25, "y", p.a),
          onCircle([0, 0.01, 0], PAD_R - 0.55, "y", p.a),
        ];
        return {
          pads: [0.55, 0.36].map((r) => ringPts([base[0], 0.01, base[2]], r, "y")),
          mast: [base, [base[0], p.h, base[2]]] as P3[],
          beacon: [0.34, 0.22].map((r) => ringPts([base[0], p.h, base[2]], r, "y")),
          conduit,
          top: [base[0], p.h, base[2]] as P3,
        };
      }),
    []
  );
  const handPads = useMemo(
    () => HAND_A.map((a) => ringPts(onCircle([0, 0.01, 0], 4.6, "y", a), 0.18, "y", 24)),
    []
  );

  const tracked = useTracked([
    onCircle([0, 0, 0], RIM[0], "y", PHASE + TAU * 0.62),
    [0, CORE_TOP + 0.3, 0],
    onCircle([0, CORE_Y0 + 0.4, 0], CORE_R + 0.2, "y", Math.PI * 0.25),
    ...pylons.map((p) => [p.top[0], p.top[1] + 0.3, p.top[2]] as P3),
    onCircle([0, 0.1, 0], 4.6, "y", HAND_A[1]),
  ]);

  /* adoption: dust spirals in from the rim to the seat */
  const inflow = useMemo(
    () => (i: number, t: number, out: Float32Array, o: number) => {
      const s = frac(t / 8 + rand(i, 1));
      const r = RIM[1] - s * (RIM[1] - CORE_R - 0.15);
      const a = rand(i, 2) * TAU + s * 2.4;
      const p = onCircle([0, 0.06 + smoothstep(0.8, 1, s) * 0.25, 0], r, "y", a);
      out[o] = p[0];
      out[o + 1] = p[1];
      out[o + 2] = p[2];
      return smoothstep(0, 0.1, s) * (1 - smoothstep(0.85, 1, s)) * 0.8;
    },
    []
  );
  /* automation: out along the conduit, up the rung's pylon */
  const outflow = useMemo(
    () => (i: number, t: number, out: Float32Array, o: number) => {
      const s = frac(t / 6 + rand(i, 6));
      const p = PYLONS[rungOf(i)];
      let pt: P3;
      if (s < 0.5) {
        const u = s / 0.5;
        pt = onCircle([0, 0.04, 0], CORE_R + 0.25 + u * (PAD_R - CORE_R - 0.25), "y", p.a);
      } else {
        const base = onCircle([0, 0, 0], PAD_R, "y", p.a);
        pt = [base[0], ((s - 0.5) / 0.5) * p.h, base[2]];
      }
      out[o] = pt[0];
      out[o + 1] = pt[1];
      out[o + 2] = pt[2];
      return smoothstep(0, 0.06, s) * (1 - smoothstep(0.9, 1, s));
    },
    []
  );

  return (
    <>
      {plate.rims.map((pts, i) => (
        <Ring
          key={i}
          points={pts}
          color={palette.gold}
          opacity={i === 0 ? 0.85 : 0.5}
          width={i === 0 ? 1.3 : 1}
          palette={palette}
        />
      ))}
      <Ring points={plate.seat} color={palette.structure} opacity={0.45} palette={palette} />
      <Ring points={plate.foot} color={palette.structure} opacity={0.6} palette={palette} />
      <Segs pairs={plate.spokes} color={palette.gold} opacity={0.45} palette={palette} />
      <Dots
        points={plate.stipple}
        color={palette.machine}
        size={1.6}
        opacity={palette.additive ? 0.45 : 0.6}
        palette={palette}
      />

      <Dots
        points={core.pts}
        color={palette.structure}
        size={1.8}
        opacity={palette.additive ? 0.7 : 0.8}
        palette={palette}
      />
      {core.seams.map((pts, i) => (
        <Ring key={i} points={pts} color={palette.gold} opacity={0.75} palette={palette} />
      ))}
      <Ring points={core.bottom} color={palette.gold} opacity={0.9} width={1.3} palette={palette} />
      <Ring points={core.top} color={palette.gold} opacity={0.9} width={1.3} palette={palette} />
      <Segs pairs={core.rails} color={palette.structure} opacity={0.22} palette={palette} />
      <group ref={scan}>
        <Ring
          points={ringPts([0, 0, 0], CORE_R + 0.22, "y")}
          color={palette.accent}
          opacity={0.95}
          width={1.6}
          palette={palette}
        />
      </group>

      {pylons.map((p, i) => (
        <group key={i}>
          {p.pads.map((pts, k) => (
            <Ring key={k} points={pts} color={palette.structure} opacity={0.7} palette={palette} />
          ))}
          <Ring points={p.conduit} color={palette.gold} opacity={0.5} dashed palette={palette} />
          <Ring
            points={p.mast}
            color={i === 2 ? palette.accent : palette.structure}
            opacity={0.85}
            width={1.4}
            palette={palette}
          />
          {p.beacon.map((pts, k) => (
            <Ring key={k} points={pts} color={palette.accent} opacity={0.9} palette={palette} />
          ))}
        </group>
      ))}
      {handPads.map((pts, i) => (
        <Ring key={i} points={pts} color={palette.structure} opacity={0.28} palette={palette} />
      ))}

      <Motes
        count={110}
        step={inflow}
        color={palette.structure}
        size={4}
        opacity={0.7}
        palette={palette}
      />
      <Motes count={120} step={outflow} color={palette.gold} size={6} palette={palette} />
      <TrackerSync points={tracked} els={trackers} />
    </>
  );
}
