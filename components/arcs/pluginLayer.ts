/**
 * pluginLayer — the geometry of the opened layer (ADR-153 U6, owner
 * 2026-10-10: "Layer opened"). Pure, server-safe, no react.
 *
 * The vision console's own slab (`components/instrument/Slab.tsx`, a square
 * footprint at the same rise) drawn large: the gold layer the team writes,
 * one lane per skill on its top, each lane carrying the figure its
 * workstream's lane draws on the Loop return (`crewParticles`, mapped onto
 * the lane), and the client's Claude Enterprise as a plain slab under it with
 * its connectors running in from below.
 *
 *   u   runs along a lane, from the front-left edge to the back-right one
 *   v   runs across the lanes, from the back (lane 0) to the front
 *   z   drops down the page
 *
 * ⚠ THE SVG LETTERS NOTHING. Every word is DOM, seated at a fraction of the
 * crop (`seats`), so the drawing's labels never sit on a projected face.
 * ⚠ A GRAIN STAYS A SQUARE ON SCREEN: only its centre is projected, or the
 * particles turn into slivers on the slant.
 */
import type { CrewOutput } from "@/lib/arcs/types";

import { crewParticles, crewSeed, grainPaths, personPath } from "./crewParticles";
import type { CrewGrain, CrewPerson } from "./crewParticles";
import { ISO_ANGLE } from "./framing/iso";

/** The rise of the slab's top: the stage's own floor angle (`framing/iso`),
 *  the one the vision's stack and every Slab are drawn at, so the page shows
 *  one projection. It was 0.375 (20.6 degrees) while the Slab was drawn by
 *  hand, and stayed there for a day after the Slab moved to 22. */
const RISE = Math.tan((ISO_ANGLE * Math.PI) / 180);
/** The footprint, square, in drawing units. */
const SIDE = 200;
/** One lane's depth across `v`, and the air inside it. */
const LANE = 50;
const LANE_PAD = 7;
/** The layer's thickness; the host's drop under it and its own thickness. */
const THICK = 16;
const DROP = 64;
/** The particle drawing's inner box (`crewParticles`' X0…X1, Y0…Y1). */
const PX0 = 14;
const PX1 = 286;
const PY0 = 14;
const PY1 = 86;
/** A grain's side on screen per particle unit, and the floor that keeps the
 *  smallest one a mark. */
const GRAIN_K = 0.72;
const GRAIN_MIN = 0.9;
/** A person's half-diagonal on screen. */
const PERSON_R = 3.6;
/** The connectors' x on screen, under the host's right half (the left half
 *  is the host's own label), and how far each drops below the host. One
 *  length for all three, so their feet step with the slab's own slant and
 *  the three labels sit on three rows: side by side they touched. */
const CONN_X = [240, 300, 360] as const;
const CONN_LEN = 50;

/** The crop: the drawing plus the room its words take, in drawing units. */
export const PLUG_VB = { x: -4, y: -90, w: 424, h: 312 } as const;

type Pt = readonly [number, number];

/** A point on the layer's top (z 0) or below it. */
export function pt(u: number, v: number, z = 0): Pt {
  return [u + v, RISE * (v - u) + z];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const poly = (ps: readonly Pt[]) => `M${ps.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`;

/** The y of the host's lower outline at screen x: where a connector meets it. */
function hostFloor(x: number): number {
  const z = DROP + THICK;
  return x <= SIDE ? z + RISE * x : z + RISE * (2 * SIDE - x);
}

export interface PluginLane {
  id: string;
  output: CrewOutput;
  seed: string;
  keepers?: 1 | 2;
}

export interface PlugLaneDrawing {
  id: string;
  grains: { a: number; d: string }[];
  people: string[];
  traces: string;
}

export interface PlugSeat {
  /** Fractions of the crop, for `--ax` / `--at`. */
  ax: number;
  at: number;
}

export interface PlugDrawing {
  vb: typeof PLUG_VB;
  layer: { top: string; sides: string[] };
  host: { top: string; sides: string[] };
  seams: string;
  connectors: string;
  lanes: PlugLaneDrawing[];
  seats: {
    layer: PlugSeat;
    host: PlugSeat;
    index: PlugSeat[];
    connectors: PlugSeat[];
  };
}

/** Where the lane's figure ends along `u`: a lane whose keepers are added
 *  stops short, so the diamonds stand clear of the marks. */
const laneEnd = (keepers?: number) => (keepers ? 168 : 192);
const LANE_START = 8;

function laneMap(k: number, u1: number) {
  const v0 = k * LANE + LANE_PAD;
  const vk = (LANE - 2 * LANE_PAD) / (PY1 - PY0);
  const uk = (u1 - LANE_START) / (PX1 - PX0);
  return (x: number, y: number): Pt => pt(LANE_START + (x - PX0) * uk, v0 + (y - PY0) * vk);
}

/** A trace's `M … C …` / `M … V …` string, mapped point by point. An affine
 *  map keeps a cubic a cubic, so the control points are all it takes. */
function mapTrace(d: string, map: (x: number, y: number) => Pt): string {
  const tokens = d.match(/[MCVHL]|-?\d*\.?\d+/g) ?? [];
  let out = "";
  let cmd = "";
  let cx = 0;
  let cy = 0;
  const nums: number[] = [];
  const flush = () => {
    if (!cmd) return;
    if (cmd === "V" || cmd === "H") {
      for (const n of nums) {
        if (cmd === "V") cy = n;
        else cx = n;
        const [x, y] = map(cx, cy);
        out += `L${r1(x)} ${r1(y)}`;
      }
    } else {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cx = nums[i];
        cy = nums[i + 1];
        const [x, y] = map(cx, cy);
        out += `${i === 0 ? cmd : " "}${r1(x)} ${r1(y)}`;
      }
    }
    nums.length = 0;
  };
  for (const t of tokens) {
    if (/[MCVHL]/.test(t)) {
      flush();
      cmd = t;
    } else nums.push(Number(t));
  }
  flush();
  return out;
}

function laneDrawing(lane: PluginLane, k: number): PlugLaneDrawing {
  const u1 = laneEnd(lane.keepers);
  const map = laneMap(k, u1);
  const p = crewParticles(lane.output, crewSeed(lane.seed));
  const grains: CrewGrain[] = p.grains.map((g) => {
    const [x, y] = map(g.x + g.s / 2, g.y + g.s / 2);
    const s = r1(Math.max(GRAIN_MIN, g.s * GRAIN_K));
    /* On the gold top a faint grain is no mark at all: the alpha is lifted
     * onto the upper half of its range, the order kept. */
    return { x: r1(x - s / 2), y: r1(y - s / 2), s, a: 0.45 + 0.55 * g.a };
  });
  const own: CrewPerson[] = p.people.map((q) => {
    const [cx, cy] = map(q.cx, q.cy);
    return { cx: r1(cx), cy: r1(cy), r: PERSON_R };
  });
  /* Keepers stand past the figure's end, across the lane's middle. */
  const added: CrewPerson[] = [];
  if (lane.keepers) {
    const mid = k * LANE + LANE / 2;
    const vs = lane.keepers === 2 ? [mid - 9, mid + 9] : [mid];
    for (const v of vs) {
      const [cx, cy] = pt(184, v);
      added.push({ cx: r1(cx), cy: r1(cy), r: PERSON_R });
    }
  }
  return {
    id: lane.id,
    grains: grainPaths(grains),
    people: [...(lane.keepers ? added : own)].map(personPath),
    traces: p.traces.map((d) => mapTrace(d, map)).join(""),
  };
}

const seat = ([x, y]: Pt): PlugSeat => ({
  ax: r1(((x - PLUG_VB.x) / PLUG_VB.w) * 1000) / 1000,
  at: r1(((y - PLUG_VB.y) / PLUG_VB.h) * 1000) / 1000,
});

/** The whole drawing for a set of lanes (one per skill, back to front). */
export function pluginLayer(
  lanes: readonly PluginLane[],
  links: number = CONN_X.length
): PlugDrawing {
  const n = lanes.length;
  const connX = CONN_X.slice(CONN_X.length - Math.max(1, Math.min(links, CONN_X.length)));
  const L = pt(0, 0);
  const T = pt(SIDE, 0);
  const R = pt(SIDE, SIDE);
  const B = pt(0, SIDE);
  const down = (p: Pt, z: number): Pt => [p[0], p[1] + z];

  /* The host's top is hidden where the layer's lower outline crosses it:
   * the host's back edge (DROP − RISE·x) meets the layer's front one
   * (THICK + RISE·x) half way between the two, at any rise. */
  const hL = down(L, DROP);
  const hR = down(R, DROP);
  const hB = down(B, DROP);
  const lB = down(B, THICK);
  const cutX = (DROP - THICK) / (2 * RISE);
  const cutY = (DROP + THICK) / 2;
  const hostTop: Pt[] = [hL, [cutX, cutY], lB, [2 * SIDE - cutX, cutY], hR, hB];
  const hz = DROP + THICK;

  const seams = Array.from({ length: n - 1 }, (_, i) => {
    const v = (i + 1) * LANE;
    const [a, b] = [pt(0, v), pt(SIDE, v)];
    return `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
  }).join("");

  const connectors = connX
    .map((x) => `M${x} ${r1(hostFloor(x))}V${r1(hostFloor(x) + CONN_LEN)}`)
    .join("");

  return {
    vb: PLUG_VB,
    layer: {
      top: poly([L, T, R, B]),
      sides: [
        poly([L, B, down(B, THICK), down(L, THICK)]),
        poly([B, R, down(R, THICK), down(B, THICK)]),
      ],
    },
    host: {
      top: poly(hostTop),
      sides: [poly([hL, hB, down(B, hz), down(L, hz)]), poly([hB, hR, down(R, hz), down(B, hz)])],
    },
    seams,
    connectors,
    lanes: lanes.map((l, k) => laneDrawing(l, k)),
    seats: {
      /* Above the back edge, in the corner the slab leaves empty. */
      layer: seat([4, -66]),
      /* Under the host's left half, clear of its outline and of the
       * connectors, which run under its right half. */
      host: seat([0, hostFloor(100) + 26]),
      /* Past each lane's far end. */
      index: lanes.map((_, k) => seat(pt(SIDE + 12, k * LANE + LANE / 2))),
      connectors: connX.map((x) => seat([x, hostFloor(x) + CONN_LEN + 6])),
    },
  };
}
