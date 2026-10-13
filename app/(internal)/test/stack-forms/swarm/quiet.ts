/* S4·C · SWARM, QUIET: the least it can be (owner, 2026-10-13, of S4: "a
   bit too much like a Christmas decoration. Maybe we need to make it a bit
   more minimalistic").

   One even lattice of equal dots for all three plates: the same dot, the
   same pitch, nothing random. The team and the agents are dim; the layer is
   gold, and that tone is the only thing that lights it. What a plate holds
   is the same dot, a little brighter, on the same lattice. The layer's
   three strata are three single rows down each wall. Nothing falls,
   nothing drifts, there is no field behind it and no line in it.

   No React; the canvas is handed in. The lattice is S4's own. */

import { HEX, PLATES, poseAt, type Tone } from "../model";

import {
  type Cells,
  cellsOf,
  fitLattice,
  inside,
  kOf,
  type Lattice,
  offsets,
  outline,
  px,
  py,
  tierSizes,
} from "./dots";
import type { SwarmPainter } from "./useSwarmCanvas";

/** How long the one pass of brightness takes to go down the stack and back. */
const PASS = 18;

interface QuietPop {
  count: number;
  x: Int32Array;
  y: Int32Array;
  /** 1 where the plate holds something (or, on the layer, on a wall). */
  lit: Uint8Array;
}

export interface QuietPlate {
  pop: QuietPop;
  mask: Int32Array;
  tone: Tone;
  /** The plain dot's light and the lit one's, 0..1 of the tone. */
  light: readonly [number, number];
  corner: { x: number; y: number };
}

export interface QuietScene {
  L: Lattice;
  /** The one dot, device px. */
  dot: number;
  plates: [QuietPlate, QuietPlate, QuietPlate];
  /** The plates' own dots, all told. It is not lettered on the drawing (three
      labels and nothing else); it is left on the root for whoever counts. */
  dots: number;
  labelX: number;
}

function pack(dots: [number, number, boolean][]): QuietPop {
  /* plain first, lit after: a plate changes paint once */
  const sorted = [...dots.filter((d) => !d[2]), ...dots.filter((d) => d[2])];
  return {
    count: sorted.length,
    x: Int32Array.from(sorted.map((d) => d[0])),
    y: Int32Array.from(sorted.map((d) => d[1])),
    lit: Uint8Array.from(sorted.map((d) => (d[2] ? 1 : 0))),
  };
}

export function buildQuiet(w: number, h: number, dpr: number): QuietScene {
  const L = fitLattice(w, h, dpr);
  const all: Cells = { i0: 0, i1: L.m, j0: 0, j1: L.m };

  const plates = PLATES.map((plate): QuietPlate => {
    const top = kOf(L, plate.body[plate.body.length - 1].z1);
    const held = plate.features
      .filter((f) => f.kind !== "rail" && f.kind !== "stratum")
      .map((f) => cellsOf(L, f.box));
    const dots: [number, number, boolean][] = [];
    /* the layer alone has walls: one row a stratum, where the stratum
       stands, so the three keep clear of the top's own edge at any size */
    if (plate.lit) {
      const rows = new Set(plate.body.map((b) => kOf(L, b.z0)));
      for (const k of rows) {
        for (let i = 0; i <= L.m; i++) dots.push([px(L, i, L.m), py(L, i, L.m, k), true]);
        for (let j = 0; j < L.m; j++) dots.push([px(L, L.m, j), py(L, L.m, j, k), true]);
      }
    }
    for (let i = 0; i <= L.m; i++)
      for (let j = 0; j <= L.m; j++)
        dots.push([px(L, i, j), py(L, i, j, top), held.some((c) => inside(c, i, j))]);
    return {
      pop: pack(dots),
      mask: outline(L, all, 0, top),
      tone: plate.lit ? "gold" : "bone",
      light: plate.lit ? [0.92, 0.66] : [0.25, 0.56],
      corner: { x: px(L, L.m, 0), y: py(L, L.m, 0, Math.round(top / 2)) },
    };
  }) as QuietScene["plates"];

  return {
    L,
    dot: tierSizes(L)[1],
    plates,
    dots: plates.reduce((sum, p) => sum + p.pop.count, 0),
    labelX: px(L, L.m, 0) + 13 * L.a * L.g,
  };
}

const rgbOf = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const GROUND = rgbOf(HEX.void);
/** A tone at `a` of itself over the ground, as one opaque colour. */
function over(tone: Tone, a: number): string {
  const c = rgbOf(HEX[tone]);
  const [r, g, b] = c.map((v, n) => Math.round(GROUND[n] + (v - GROUND[n]) * Math.min(1, a)));
  return `rgb(${r}, ${g}, ${b})`;
}

/** The one pass of brightness: where it is, in plates, at `t` seconds. It
    starts and rests above the stack, so the rest frame is the plain one. */
function passAt(t: number): number {
  const at = (t % PASS) / PASS;
  const there = at < 0.5 ? at * 2 : 2 - at * 2;
  return -1.1 + there * 4.2;
}

export function paintQuiet(
  ctx: CanvasRenderingContext2D,
  S: QuietScene,
  open: number,
  t: number,
  el: HTMLElement,
  dpr: number
) {
  const { L, dot } = S;
  const off = offsets(L, poseAt(open));
  const pass = passAt(t);
  ctx.clearRect(0, 0, L.w, L.h);
  const labels = el.querySelectorAll<HTMLElement>("[data-sfs-plain]");
  if (el.dataset.sfsDots !== String(S.dots)) el.dataset.sfsDots = String(S.dots);

  /* painter's order, the ground as the mask */
  for (const i of [2, 1, 0] as const) {
    const p = S.plates[i];
    const dy = off[i];
    ctx.fillStyle = HEX.void;
    ctx.beginPath();
    ctx.moveTo(p.mask[0], p.mask[1] + dy);
    for (let q = 2; q < p.mask.length; q += 2) ctx.lineTo(p.mask[q], p.mask[q + 1] + dy);
    ctx.closePath();
    ctx.fill();

    /* the pass lifts a plate a little as it goes through it, and no more */
    const lift = Math.exp(-((pass - i) ** 2) / 0.32) * (i === 1 ? 0.08 : 0.16);
    let lit = -1;
    for (let q = 0; q < p.pop.count; q++) {
      if (p.pop.lit[q] !== lit) {
        lit = p.pop.lit[q];
        ctx.fillStyle = over(p.tone, p.light[lit] + lift);
      }
      ctx.fillRect(p.pop.x[q] - (dot >> 1), p.pop.y[q] + dy - (dot >> 1), dot, dot);
    }

    /* its name: a dotted run out to it, level with its corner */
    const y = p.corner.y + dy;
    ctx.fillStyle = over("bone", 0.3);
    for (let n = 2; n < 12; n++) {
      const size = L.g * Math.max(1, L.b - 3);
      ctx.fillRect(p.corner.x + n * L.a * L.g - (size >> 1), y - (size >> 1), size, size);
    }
    const label = labels[i];
    if (label) {
      label.style.left = `${S.labelX / dpr}px`;
      label.style.top = `${y / dpr}px`;
    }
  }
}

export const QUIET: SwarmPainter<QuietScene> = { build: buildQuiet, paint: paintQuiet };
