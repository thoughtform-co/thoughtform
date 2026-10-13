/* S3 · READOUT, as geometry. PURE: the lab's model and nothing else.

   The stack as a display reads it. Each plate is its 8 x 8 grid of cells,
   and every cell that is drawn holds one MODULE: a capsule link lying along
   one of the plate's two axes, or a node where the two meet. A cell right of
   the plate's diagonal lies along y, a cell left of it along x, so each row
   of cells at one distance from the back corner projects to a V pointing at
   the front corner: the rows are stacked chevrons, and the diagonal is a
   spine of nodes.

   What a module's state says is read off the model, never invented:
     held     the cell belongs to something the plate holds (a workstream,
              the chip, an agent's module)
     rail     the team's rail of tools, along one edge
     lit      the layer, the one lit plate: every cell
     nominal  a cell of the plate that holds nothing
   The plates differ in kind as they do in the model: the team is a full
   floor with four clusters on it, the layer is thick and lit with its three
   strata as three courses on its walls, the agents are a board: a ring, a
   chip, four modules and the wires between them. */

import {
  type Feature,
  fitFrame,
  type Frame,
  type Plate,
  PLATES,
  type Pose,
  poseAt,
  project,
  type Pt,
  SIDE,
  unitOf,
} from "../model";

export const W = 1600;
export const H = 1000;
/** The stack stands left of the frame's middle; its registers take the right. */
const STACK_X = 700;
/** Seated for the opened pose, so opening the stack never rescales it. */
export const FRAME: Frame = fitFrame(W, H, poseAt(1), { pad: 92, cx: STACK_X, cy: H / 2 });
export const U = unitOf(FRAME);

export type State = "nominal" | "held" | "rail" | "lit";

export interface Module {
  kind: "link" | "node";
  /** Its middle, in the drawing, for the plate at lift 0. */
  x: number;
  y: number;
  /** Degrees: +30 lies along the plate's x, -30 along its y. */
  rot: number;
  state: State;
  /** The id of the feature it belongs to, if any. */
  feature: string | null;
  i: number;
  j: number;
}

/* a face module, in units of the drawing: a cell is U along its axis and
   about 0.87 U across, so this leaves a seam on every side */
export const LINK = { l: 0.8 * U, t: 0.44 * U };
/* a module on the layer's wall: one stratum high */
export const COURSE = { l: 0.8 * U, t: 0.22 * U };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** The block of cells a feature takes: as many cells a side as its size is
    worth (a cell is one unit; 1.3 units earns one), nearest its middle. */
function blockOf(f: Feature): { i0: number; i1: number; j0: number; j1: number } {
  const { x0, x1, y0, y1 } = f.box;
  if (f.kind === "rail") {
    /* a strip: every cell whose middle lies in it */
    const cells = (a: number, b: number) => {
      const lo = Math.ceil(a - 0.5);
      const hi = Math.floor(b - 0.5);
      return [clamp(lo, 0, SIDE - 1), clamp(hi, 0, SIDE - 1)] as const;
    };
    const [i0, i1] = cells(x0, x1);
    const [j0, j1] = cells(y0, y1);
    return { i0, i1, j0, j1 };
  }
  const n = Math.max(1, Math.round((x1 - x0) / 1.3));
  const i0 = clamp(Math.round((x0 + x1) / 2 - n / 2), 0, SIDE - n);
  const j0 = clamp(Math.round((y0 + y1) / 2 - n / 2), 0, SIDE - n);
  return { i0, i1: i0 + n - 1, j0, j1: j0 + n - 1 };
}

/** Which feature, if any, a cell of a plate belongs to. */
function featureAt(plate: Plate, i: number, j: number): Feature | null {
  for (const f of plate.features) {
    if (f.kind === "stratum") continue;
    const b = blockOf(f);
    if (i >= b.i0 && i <= b.i1 && j >= b.j0 && j <= b.j1) return f;
  }
  return null;
}

function moduleAt(
  i: number,
  j: number,
  z: number,
  state: State,
  feature: string | null,
  at: (x: number, y: number, z: number) => Pt
): Module {
  const [x, y] = at(i + 0.5, j + 0.5, z);
  return {
    kind: i === j ? "node" : "link",
    x,
    y,
    rot: i > j ? -30 : 30,
    state,
    feature,
    i,
    j,
  };
}

/** A plate's face modules, back row first. `at` projects a point of the
    plate's own space; the isometric by default, a plan for the registers. */
export function modulesOf(
  plate: Plate,
  at: (x: number, y: number, z: number) => Pt = (x, y, z) => project(FRAME, x, y, z)
): Module[] {
  const out: Module[] = [];
  for (let j = 0; j < SIDE; j++)
    for (let i = 0; i < SIDE; i++) {
      const f = featureAt(plate, i, j);
      if (plate.key === "layer") {
        out.push(moduleAt(i, j, plate.top, "lit", null, at));
        continue;
      }
      if (plate.key === "agents") {
        /* a board: only its rim is capsules; what stands on it is drawn as
           what it is (`PARTS`) */
        const rim = i === 0 || j === 0 || i === SIDE - 1 || j === SIDE - 1;
        if (rim) out.push(moduleAt(i, j, plate.body[0].z1, "nominal", null, at));
        continue;
      }
      out.push(
        moduleAt(
          i,
          j,
          plate.top,
          f ? (f.kind === "rail" ? "rail" : "held") : "nominal",
          f?.id ?? null,
          at
        )
      );
    }
  return out;
}

export const FACES: readonly Module[][] = PLATES.map((p) => modulesOf(p));

/** What stands on the agents' board: the chip and the four modules, each a
    small solid of its own, a different kind of thing from a capsule. */
export const PARTS: readonly Feature[] = PLATES[2].features;
/** The corner cut off each of them, in units: the one chamfer of the kit. */
export const PART_CUT = 0.3;

/** The layer's three strata, each a course of modules along its two walls. */
export interface CourseLink {
  x: number;
  y: number;
  rot: number;
  stratum: number;
}
export const COURSES: readonly CourseLink[] = PLATES[1].body.flatMap((b, stratum) => {
  const z = (b.z0 + b.z1) / 2;
  const out: CourseLink[] = [];
  for (let n = 0; n < SIDE; n++) {
    const [lx, ly] = project(FRAME, n + 0.5, SIDE, z);
    out.push({ x: lx, y: ly, rot: 30, stratum });
    const [rx, ry] = project(FRAME, SIDE, n + 0.5, z);
    out.push({ x: rx, y: ry, rot: -30, stratum });
  }
  return out;
});

/** The layer's front row, left corner to right: fifteen cells. The module
    that stands for how far the stack is opened walks along it. */
export const FRONT: readonly (readonly [number, number])[] = [
  ...Array.from({ length: SIDE - 1 }, (_, k) => [k, SIDE - 1] as const),
  [SIDE - 1, SIDE - 1] as const,
  ...Array.from({ length: SIDE - 1 }, (_, k) => [SIDE - 1, SIDE - 2 - k] as const),
];
export const selectedOf = (open: number) => Math.round(open * (FRONT.length - 1));

/** Counts a register may print: every one of them is of things drawn. */
export const COUNTS = PLATES.map((p, n) => {
  const face = FACES[n];
  const walls = p.key === "layer" ? COURSES.length : 0;
  const parts = p.key === "agents" ? PARTS : [];
  return {
    modules: face.length + walls + parts.length,
    held: face.filter((m) => m.state === "held").length + parts.length,
    rail: face.filter((m) => m.state === "rail").length,
    lit: face.filter((m) => m.state === "lit").length + walls,
    /** Modules drawn for one held thing, by feature id. */
    of: (id: string) =>
      face.filter((m) => m.feature === id).length + parts.filter((f) => f.id === id).length,
  };
});
export const TOTAL = COUNTS.reduce((a, c) => a + c.modules, 0);

/* -- the frame's furniture ------------------------------------------------- */

export const BOX = { x0: 36, y0: 40, x1: W - 36, y1: H - 40 };

/** The stack's three corners in the drawing, for a plate at lift 0 and a
    height z: left, front, right. */
export const corner = {
  left: (z: number) => project(FRAME, 0, SIDE, z),
  front: (z: number) => project(FRAME, SIDE, SIDE, z),
  right: (z: number) => project(FRAME, SIDE, 0, z),
};

/** Where height z sits on the drawing's own vertical scale: the datum is the
    layer's floor (the layer holds still), read at the stack's side corners. */
export const zToY = (z: number) => corner.left(z)[1];

/** A plate's shift on the drawing in a pose: straight up or down. */
export const shiftOf = (pose: Pose, i: 0 | 1 | 2) => -pose.lift[i] * U;

/* -- the registers: three blocks right of the stack, three plans left ------ */

/** Each plate's bus lands here; its register is built round the landing. */
export const BUS_Y = [300, 500, 700] as const;
const STUB = 14;
/** The longest 45-degree jog a lead makes: the closed stack's outer plates. */
const JOG = 100;
/** Where the buses stop and fan out to the register's rows. */
export const FAN_X = Math.round(corner.right(0)[0]) + STUB + JOG + STUB;
/** Where every row of a register starts. */
export const ROW_X = FAN_X + 36;
export const ROW_PITCH = 22;
export const REG_X1 = BOX.x1 - 34;
const WIRE_PITCH = 4;

/** The plans stand as far left of the stack as the registers do right. */
export const PLAN = { cell: 18, x1: Math.round(corner.left(0)[0]) - STUB - JOG - STUB };
export const PLAN_SIDE = PLAN.cell * SIDE;
/** A plan's cells stand this far inside its frame. */
export const PLAN_PAD = 8;
export const PLAN_X0 = PLAN.x1 - PLAN_PAD - PLAN_SIDE;
export const PLAN_LINK = { l: 0.8 * PLAN.cell, t: 0.42 * PLAN.cell };

/** A plan's projection: the plate seen from above, back corner top-left. */
export const planAt =
  (n: number) =>
  (x: number, y: number): Pt => [PLAN_X0 + x * PLAN.cell, BUS_Y[n] - PLAN_SIDE / 2 + y * PLAN.cell];

/** A polyline moved sideways by `d` (positive to the right of travel, y
    down), its corners mitred, so parallel wires stay parallel through a turn. */
export function offsetLine(pts: readonly Pt[], d: number): Pt[] {
  if (d === 0) return pts.map((p) => [p[0], p[1]] as Pt);
  const normals: Pt[] = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const dx = pts[k + 1][0] - pts[k][0];
    const dy = pts[k + 1][1] - pts[k][1];
    const len = Math.hypot(dx, dy) || 1;
    normals.push([-dy / len, dx / len]);
  }
  return pts.map((p, k) => {
    const a = normals[Math.max(0, k - 1)];
    const b = normals[Math.min(normals.length - 1, k)];
    const m = 1 + a[0] * b[0] + a[1] * b[1];
    return [p[0] + ((a[0] + b[0]) / m) * d, p[1] + ((a[1] + b[1]) / m) * d] as Pt;
  });
}

/** Level out of `from`, one 45-degree jog onto the level of `toY`, level on
    to `toX`. With no change of level it is one straight run. */
function lead(from: Pt, toX: number, toY: number): Pt[] {
  const dir = Math.sign(toX - from[0]) || 1;
  const dy = toY - from[1];
  if (Math.abs(dy) < 0.5) return [from, [toX, toY]];
  const x1 = from[0] + dir * STUB;
  return [from, [x1, from[1]], [x1 + dir * Math.abs(dy), toY], [toX, toY]];
}

/** The middle of a plate's wall, where its bus and its lead leave it. */
const WAIST = PLATES.map((p) => (p.key === "layer" ? p.top / 2 : p.body[0].z1 / 2));

export interface Bus {
  /** One wire for each thing the plate holds, plate to row. */
  wires: Pt[][];
  /** Where each wire ends: the start of its row. */
  rows: Pt[];
}

/** A plate's bus in a pose: as many wires as it holds things, out of its
    right corner, through one jog, then fanned to its register's rows. The
    outer wires turn first, so no wire crosses another. */
export function busOf(pose: Pose, n: 0 | 1 | 2): Bus {
  const count = PLATES[n].holds.length;
  const [cx, cy] = corner.right(WAIST[n]);
  const from: Pt = [cx, cy + shiftOf(pose, n)];
  const spine = lead(from, FAN_X, BUS_Y[n]);
  const wires: Pt[][] = [];
  const rows: Pt[] = [];
  for (let k = 0; k < count; k++) {
    const o = (k - (count - 1) / 2) * WIRE_PITCH;
    const run = offsetLine(spine, o);
    const rowY = BUS_Y[n] + (k - (count - 1) / 2) * ROW_PITCH;
    const y0 = BUS_Y[n] + o;
    const turn = FAN_X + 8 + Math.min(k, count - 1 - k) * 6;
    const rise = rowY - y0;
    const cut = Math.min(4, Math.abs(rise) / 2);
    const s = Math.sign(rise);
    const fan: Pt[] =
      Math.abs(rise) < 0.5
        ? [[ROW_X, rowY]]
        : [
            [turn - cut, y0],
            [turn, y0 + s * cut],
            [turn, rowY - s * cut],
            [turn + cut, rowY],
            [ROW_X, rowY],
          ];
    wires.push([...run, ...fan]);
    rows.push([ROW_X, rowY]);
  }
  return { wires, rows };
}

/** A plate's lead to its plan in a pose: one line out of its left corner. */
export function planLeadOf(pose: Pose, n: 0 | 1 | 2): Pt[] {
  const [cx, cy] = corner.left(WAIST[n]);
  return lead([cx, cy + shiftOf(pose, n)], PLAN.x1, BUS_Y[n]);
}

/** The two rails the stack rides: plumb at its left and its right corner,
    as long as the stack's whole travel (its opened pose), a tick at every
    whole unit of height. In any other pose the rails run on past the plates,
    so the room the stack has left to open is on the drawing. */
const FAR = poseAt(1);
export const RAILS = (["left", "right"] as const).map((side) => {
  const at = corner[side];
  const zTop = FAR.lift[0] + PLATES[0].top;
  const zBot = FAR.lift[2];
  const ticks: number[] = [];
  for (let z = Math.ceil(zBot); z <= Math.floor(zTop); z++) ticks.push(at(z)[1]);
  return { side, x: at(0)[0], y0: at(zTop)[1], y1: at(zBot)[1], ticks, zTop, zBot };
});

/** What drops through a gap, in the drawing: from each thing the upper plate
    holds, plumb down onto the plate below. The team's four workstreams land
    on the layer; the layer's three strata land, as one bus, on the chip. */
export interface Drop {
  x: number;
  y0: number;
  y1: number;
}
export function dropsOf(pose: Pose, upper: 0 | 1): Drop[] {
  if (upper === 0) {
    return PLATES[0].features
      .filter((f) => f.kind === "tile")
      .map((f) => {
        const b = blockOf(f);
        const [px, py] = [(b.i0 + b.i1 + 1) / 2, (b.j0 + b.j1 + 1) / 2];
        const [x, y0] = project(FRAME, px, py, 0);
        const y1 = project(FRAME, px, py, PLATES[1].top)[1];
        return { x, y0: y0 + shiftOf(pose, 0), y1: y1 + shiftOf(pose, 1) };
      });
  }
  const chip = PLATES[2].features.find((f) => f.kind === "chip")!;
  const [x, y0] = project(FRAME, SIDE / 2, SIDE / 2, 0);
  const y1 = project(FRAME, SIDE / 2, SIDE / 2, chip.box.z1)[1];
  return PLATES[1].holds.map((_, k) => ({
    x: x + (k - 1) * WIRE_PITCH,
    y0: y0 + shiftOf(pose, 1),
    y1: y1 + shiftOf(pose, 2),
  }));
}

/** The state of the whole stack, in a word a reader could check. */
export const stateWord = (openPct: number) =>
  openPct === 0 ? "Closed" : openPct === 100 ? "Opened" : "Part open";
