/**
 * The absorption machine (ADR-156 U3), by the anatomy method: a real
 * mechanism whose workings ARE the idea, its parts listed, every line ending
 * on a part. The owner's brief: digital content and digital products,
 * "absorbed by these frontier AI labs ... as a sort of artifact, a sort of
 * machine".
 *
 * THE MACHINE, part by part (the parts list is `ABSORPTION_PARTS`, counted by
 * the test, 40 or more):
 * · two PANELS on the floor, front left and front right, each a plate with
 *   four tiles standing on it (what the panel holds);
 * · two RIBBONS of eight wires, each from its panel's inner edge into a port
 *   on the machine's face: the intake;
 * · the HOUSING, the frontier lab, at the back of the floor;
 * · a row of COMPUTE racks standing beside it;
 * · the MODEL, the one gold block, seated on the housing;
 * · the INTERFACE, a plate held over the model by four struts;
 * · the AGENTS, small units in front of the housing, each wired up to the
 *   interface's front corner: the people's way in now runs through them.
 *
 * ⚠ The framing's one projection (`framing/iso.ts`); crop derived; nothing
 * lettered in the SVG. PURE.
 */

import { type WorldPt, frameAround } from "../../framing/floor";
import {
  type IsoBox,
  type IsoFrame,
  type Pt,
  isoBox,
  isoDepth,
  isoFraction,
  isoGrid,
  isoPath,
  isoProject,
} from "../../framing/iso";

export const AB_FLOOR = { w: 12, d: 12 } as const;

type Part = { id: string; kind: string; box: IsoBox };

const box = (a: number, b: number, w: number, d: number, z: number, h: number): IsoBox => ({
  a,
  b,
  w,
  d,
  z,
  h,
});

/** Content on the left (along `b`), products on the right (along `a`). */
export const PANEL_BOXES = [box(0.6, 6.4, 3.4, 3.4, 0, 0.16), box(6.4, 0.6, 3.4, 3.4, 0, 0.16)] as const;

/** Four tiles on a panel, two by two, rising a little toward the machine. */
function tiles(panel: IsoBox, side: 0 | 1): IsoBox[] {
  const s = 1.05;
  const g = 0.45;
  const out: IsoBox[] = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const a = panel.a + 0.4 + i * (s + g);
      const b = panel.b + 0.4 + j * (s + g);
      const h = 0.35 + 0.18 * (side === 0 ? i + j : i + j);
      out.push(box(a, b, s, s, panel.z + panel.h, h));
    }
  }
  return out;
}

export const HOUSING = box(6.2, 6.2, 4.2, 4.2, 0, 2.6);
export const MODEL = box(7.4, 7.4, 1.8, 1.8, 2.6, 0.9);
export const INTERFACE = box(6.6, 6.6, 3.4, 3.4, 4.2, 0.08);
/** Compute racks: a row standing on the floor's right, in front of the
 *  housing's right-hand face, where the view from the front corner sees
 *  them (behind the housing they were hidden by it). */
export const RACKS: IsoBox[] = [0, 1, 2, 3, 4].map((i) => box(11.0, 0.7 + i * 0.95, 0.6, 0.62, 0, 1.6));
/** Agents: small units in front of the housing, on the diagonal. */
export const AGENTS: IsoBox[] = [
  box(3.9, 5.1, 0.55, 0.55, 0, 0.55),
  box(4.6, 4.6, 0.55, 0.55, 0, 0.55),
  box(5.1, 3.9, 0.55, 0.55, 0, 0.55),
];

export const ABSORPTION_PARTS: Part[] = [
  ...PANEL_BOXES.map((b, i) => ({ id: `panel-${i}`, kind: "panel", box: b })),
  ...PANEL_BOXES.flatMap((p, i) =>
    tiles(p, i as 0 | 1).map((b, j) => ({ id: `tile-${i}-${j}`, kind: "tile", box: b }))
  ),
  { id: "housing", kind: "housing", box: HOUSING },
  { id: "model", kind: "model", box: MODEL },
  { id: "interface", kind: "interface", box: INTERFACE },
  ...RACKS.map((b, i) => ({ id: `rack-${i}`, kind: "rack", box: b })),
  ...AGENTS.map((b, i) => ({ id: `agent-${i}`, kind: "agent", box: b })),
];

/** The eight wires of a ribbon: parallel runs from a panel's inner edge into
 *  a port on the housing's face, at the port's height. */
const WIRES = 8;
export function ribbons(): { panel: 0 | 1; wires: WorldPt[][] }[] {
  const out: { panel: 0 | 1; wires: WorldPt[][] }[] = [];
  // Content (left panel): its inner edge is a = 4.0; the housing's left face is a = 6.2.
  const left: WorldPt[][] = [];
  for (let k = 0; k < WIRES; k++) {
    const b = 6.9 + k * 0.32;
    left.push([
      { a: 4.0, b, z: 0.16 },
      { a: 5.1, b, z: 0.16 },
      { a: 5.1, b, z: 1.1 },
      { a: 6.2, b, z: 1.1 },
    ]);
  }
  out.push({ panel: 0, wires: left });
  // Products (right panel): its inner edge is b = 4.0; the housing's right face is b = 6.2.
  const right: WorldPt[][] = [];
  for (let k = 0; k < WIRES; k++) {
    const a = 6.9 + k * 0.32;
    right.push([
      { a, b: 4.0, z: 0.16 },
      { a, b: 5.1, z: 0.16 },
      { a, b: 5.1, z: 1.1 },
      { a, b: 6.2, z: 1.1 },
    ]);
  }
  out.push({ panel: 1, wires: right });
  return out;
}

/** Four struts holding the interface over the model. */
export function struts(): WorldPt[][] {
  const z0 = HOUSING.z + HOUSING.h;
  const z1 = INTERFACE.z;
  const c = [
    [INTERFACE.a + 0.2, INTERFACE.b + 0.2],
    [INTERFACE.a + INTERFACE.w - 0.2, INTERFACE.b + 0.2],
    [INTERFACE.a + 0.2, INTERFACE.b + INTERFACE.d - 0.2],
    [INTERFACE.a + INTERFACE.w - 0.2, INTERFACE.b + INTERFACE.d - 0.2],
  ];
  return c.map(([a, b]) => [
    { a, b, z: z0 },
    { a, b, z: z1 },
  ]);
}

/** Each agent wired up to the interface's front corner. */
export function agentWires(): WorldPt[][] {
  const to = { a: INTERFACE.a, b: INTERFACE.b, z: INTERFACE.z };
  return AGENTS.map((g) => {
    const top = { a: g.a + g.w / 2, b: g.b + g.d / 2, z: g.h };
    return [top, { a: top.a, b: top.b, z: to.z }, to];
  });
}

export const WIRE_COUNT = 2 * WIRES + 4 /* struts */ + AGENTS.length;

export function absorptionFrame(): IsoFrame {
  const pts: WorldPt[] = [
    { a: 0, b: 0, z: 0 },
    { a: AB_FLOOR.w, b: 0, z: 0 },
    { a: AB_FLOOR.w, b: AB_FLOOR.d, z: 0 },
    { a: 0, b: AB_FLOOR.d, z: 0 },
    { a: INTERFACE.a, b: INTERFACE.b + INTERFACE.d, z: INTERFACE.z + INTERFACE.h },
    { a: INTERFACE.a + INTERFACE.w, b: INTERFACE.b, z: INTERFACE.z + INTERFACE.h },
  ];
  return frameAround(pts, { l: 150, r: 150, t: 40, b: 40 }, 34);
}

export function absorptionGrid(f: IsoFrame) {
  return isoGrid(0, 0, AB_FLOOR.w, AB_FLOOR.d, 0, 3, f);
}

const path3 = (pts: readonly WorldPt[], f: IsoFrame) =>
  isoPath(pts.map((p) => isoProject(p.a, p.b, p.z, f)));

/** Parts with paths, FARTHEST FIRST; wires as paths. */
export function absorptionScene(f: IsoFrame) {
  /* ⚠ FARTHEST FIRST, and at one footprint the HIGHER part later: the
     model sits on the housing at the same centre, and painting it first put
     the gold block under the housing's top face. */
  const key = (b: IsoBox) => isoDepth(b.a + b.w / 2, b.b + b.d / 2) - b.z * 0.01;
  const parts = ABSORPTION_PARTS.map((p) => ({ ...p, paths: isoBox(p.box, f) })).sort(
    (p, q) => key(q.box) - key(p.box)
  );
  return {
    parts,
    ribbons: ribbons().map((r) => ({ panel: r.panel, d: r.wires.map((w) => path3(w, f)).join(" ") })),
    struts: struts().map((w) => path3(w, f)),
    agents: agentWires().map((w) => path3(w, f)),
  };
}

const GAP = 14;
const out = (p: Pt, dx: number, f: IsoFrame) => isoFraction({ x: p.x + dx, y: p.y }, f);

/** Where each word sits, with its leader from the part it names. */
export function absorptionSeats(f: IsoFrame) {
  const side = (b: IsoBox) => isoBox(b, f).side;
  const leftOf = (b: IsoBox) => isoProject(b.a, b.b + b.d, b.z + b.h / 2, f);
  const seat = (anchor: Pt, dx: number) => ({
    seat: out(anchor, dx, f),
    leader: isoPath([anchor, { x: anchor.x + dx - Math.sign(dx) * 3, y: anchor.y }]),
  });
  return {
    content: seat(leftOf(PANEL_BOXES[0]), -GAP),
    /* Under the panel's front edge: to its right stand the racks. */
    products: (() => {
      const p = PANEL_BOXES[1];
      const foot = isoProject(p.a + p.w * 0.55, p.b, 0, f);
      const at = { x: foot.x, y: foot.y + 30 };
      return { seat: isoFraction(at, f), leader: isoPath([foot, { x: at.x, y: at.y - 4 }]) };
    })(),
    machine: seat(side(HOUSING), GAP),
    compute: seat(side(RACKS[0]), GAP),
    model: seat(isoProject(MODEL.a, MODEL.b + MODEL.d, MODEL.z + MODEL.h / 2, f), -GAP * 4),
    interface: seat(isoProject(INTERFACE.a, INTERFACE.b + INTERFACE.d, INTERFACE.z, f), -GAP),
    /* Under the agents' row, centred: beside it the panels' words sit. */
    agents: (() => {
      const mid = AGENTS[1];
      const foot = isoProject(mid.a + mid.w / 2, mid.b + mid.d / 2, 0, f);
      const at = { x: foot.x, y: foot.y + 34 };
      return { seat: isoFraction(at, f), leader: isoPath([foot, { x: at.x, y: at.y - 4 }]) };
    })(),
  };
}
