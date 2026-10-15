/**
 * The foundation act (ADR-156 U5, U6): one scene across three beats.
 *
 * WHAT IT CAN MAKE: one example faces the reader, a framed slab with depth;
 * when its turn ends it turns on its x-axis and lies down in the stack on the
 * left, in the very pose it keeps in the next beat, on a little grid; the
 * y-axis beside it is MODEL CAPABILITIES and grows with every plate (owner,
 * 2026-10-15: "it's actually the y-axis that needs to grow because that
 * represents the model's capabilities").
 * THE NEW INTERFACE: the stack moves to the centre, layer by layer, a
 * cascade; the machine mind (`mind.ts`) stands above it and its tendrils plug
 * into every plate.
 * AN INTELLIGENCE: the mind alone turns to face the reader, between a tool
 * and a collaborator.
 *
 * ⚠ ONE PROJECTION: the true isometric of the owner's stack-forms and
 * substrate labs (30 degrees; +x down-right, +y down-left, +z up). A sheet is
 * a plane with a corner and two axes; every pose is that plane in 3D,
 * projected EXACTLY into an SVG `matrix()`, so a picture on a sheet is
 * drawn on the sheet, never faked. The mind's camera at its isometric pose
 * is the same projection.
 *
 * ⚠ PURE: the act's component measures and paints; this decides.
 */

export const VB = { w: 1440, h: 820 } as const;

/** Pixels per world unit, and the isometric basis. */
export const U = 34;
const C30 = Math.cos(Math.PI / 6);
const EX = [C30 * U, 0.5 * U] as const;
const EY = [-C30 * U, 0.5 * U] as const;
const EZ = [0, -U] as const;

export interface V3 {
  x: number;
  y: number;
  z: number;
}
export interface P2 {
  x: number;
  y: number;
}

/** A world point onto the viewBox, from an origin. */
export function proj(p: V3, o: P2): P2 {
  return {
    x: o.x + p.x * EX[0] + p.y * EY[0] + p.z * EZ[0],
    y: o.y + p.x * EX[1] + p.y * EY[1] + p.z * EZ[1],
  };
}

/** A sheet's face in local pixels. */
export const CARD = { w: 560, h: 315 } as const;
/** The sheet in world units: 16:9, as the pictures. */
export const SHEET = { w: 8, h: 4.5 } as const;

/**
 * The stack: plate `i` lies `rise` above the last and `step` further along
 * x, so the stack climbs the capability axis on the diagonal; `thick` is a
 * plate's slab.
 */
export const PLATE = { rise: 1.05, step: 0.6, thick: 0.16 } as const;

/** The stack's origins: on the left beside the facing card, then centred. */
export const STACK_L: P2 = { x: 318, y: 400 };
export const STACK_C: P2 = { x: 596, y: 536 };

/** The facing pose: a flat card, right of the stack, reading size. */
export const FACING = { x: 700, y: 118, s: 1.14 } as const;
/** The facing slab's depth: its back face, up and to the right. */
const FACE_DEPTH: P2 = { x: 16, y: -12 };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** An affine matrix [a b c d e f] for local card pixels. */
export type M6 = [number, number, number, number, number, number];

/**
 * A sheet in 3D: its top-left corner `p0`, its width along +x, and its
 * downward axis rotated about x by `theta` (0: standing, the face down along
 * -z; 90 degrees: lying, the face along +y). Projected exactly.
 */
function sheetMatrix(p0: V3, theta: number, o: P2): M6 {
  const ux: V3 = { x: SHEET.w / CARD.w, y: 0, z: 0 };
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  const uy: V3 = { x: 0, y: (s * SHEET.h) / CARD.h, z: (-c * SHEET.h) / CARD.h };
  const O = proj(p0, o);
  const a = ux.x * EX[0] + ux.y * EY[0] + ux.z * EZ[0];
  const b = ux.x * EX[1] + ux.y * EY[1] + ux.z * EZ[1];
  const cc = uy.x * EX[0] + uy.y * EY[0] + uy.z * EZ[0];
  const d = uy.x * EX[1] + uy.y * EY[1] + uy.z * EZ[1];
  return [a, b, cc, d, O.x, O.y];
}

const facingMatrix = (): M6 => [FACING.s, 0, 0, FACING.s, FACING.x, FACING.y];

const mix = (m: M6, n: M6, t: number): M6 => m.map((v, i) => lerp(v, n[i], t)) as M6;

/** Plate `i` turning down into its seat: a true tip about its bottom edge. */
function lyingAt(i: number, theta: number, o: P2): M6 {
  const p0: V3 = {
    x: i * PLATE.step,
    y: SHEET.h - SHEET.h * Math.sin(theta),
    z: i * PLATE.rise + SHEET.h * Math.cos(theta),
  };
  return sheetMatrix(p0, theta, o);
}

export interface SheetPose {
  m: M6;
  /** A sheet appears, it never fades in. */
  shown: boolean;
  /** The one facing the reader (its words are up). */
  facing: boolean;
  /** Its slab: the back face's offset from the front, in the viewBox. */
  depth: P2;
  /** The ghost sheets behind a facing card, 1 up, 0 gone. */
  ghosts: number;
  /** Lying in the stack: its grid and its axis tick are up. */
  seated: boolean;
}

/** A card's share of its slot, and where its turn ends. */
const HOLD = 0.62;
/** The share of the first beat the cards take; the rest is the stack's. */
export const CARDS_END = 0.84;
/** The cascade to the centre, at the first beat's end: plate by plate. */
const CASCADE = { from: 0.86, each: 0.016, span: 0.06 } as const;

/** Where plate `i`'s stack origin is at the first beat's progress `a`. */
export function plateOrigin(i: number, a: number): P2 {
  const t = smooth((a - CASCADE.from - i * CASCADE.each) / CASCADE.span);
  return { x: lerp(STACK_L.x, STACK_C.x, t), y: lerp(STACK_L.y, STACK_C.y, t) };
}

/**
 * Every sheet at the first beat's progress `a` (past 1: the stack has
 * landed in the centre, for the second beat).
 */
export function sheetPoses(n: number, a: number): SheetPose[] {
  const out: SheetPose[] = [];
  for (let i = 0; i < n; i++) {
    const u = (clamp01(a) / CARDS_END) * n - i;
    const arrive = i === 0 ? -Infinity : HOLD - 1;
    const o = plateOrigin(i, a);
    const lie = lyingAt(i, Math.PI / 2, o);
    const lieDepth: P2 = { x: 0, y: PLATE.thick * U };
    if (u < arrive) {
      out.push({ m: facingMatrix(), shown: false, facing: false, depth: FACE_DEPTH, ghosts: 0, seated: false });
    } else if (u < HOLD) {
      out.push({ m: facingMatrix(), shown: true, facing: true, depth: FACE_DEPTH, ghosts: 1, seated: false });
    } else if (u < 1) {
      const t = (u - HOLD) / (1 - HOLD);
      const theta = (Math.PI / 2) * smooth(t);
      const w = smooth(Math.min(1, t * 1.6));
      out.push({
        m: mix(facingMatrix(), lyingAt(i, theta, o), w),
        shown: true,
        facing: false,
        depth: { x: lerp(FACE_DEPTH.x, lieDepth.x, w), y: lerp(FACE_DEPTH.y, lieDepth.y, w) },
        ghosts: 1 - smooth(t * 3),
        seated: false,
      });
    } else {
      out.push({ m: lie, shown: true, facing: false, depth: lieDepth, ghosts: 0, seated: true });
    }
  }
  return out;
}

/** The stack's far corner past its last plate, in plate units. */
const reach = (n: number) => (n - 1) * PLATE.step + SHEET.w;

/** The floor under the stack, its grid, and its two axes, from an origin. */
export const FLOOR = { z: -0.45, x0: -1.1, y0: -0.8, y1: SHEET.h + 1.1, pad: 0.6 } as const;

export interface Axes {
  /** The floor's grid, one path. */
  grid: string;
  /** The y-axis's foot: MODEL CAPABILITIES rises from here, a plate at a
      time (`capabilityTop`). */
  foot: P2;
  /** A tick per plate on it. */
  ticks: P2[];
  /** The floor's front edge, unlettered. */
  x: [P2, P2];
}

/** How high the capability axis stands over its foot, in world z, when
    `count` plates are in the stack: a margin past the highest. */
export const capabilityTop = (count: number) => (count > 0 ? (count - 1) * PLATE.rise + 1.3 : 0.8);

const pathOf = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

export function axesAt(n: number, o: P2): Axes {
  const x1 = reach(n) + FLOOR.pad;
  const z = FLOOR.z;
  const lines: string[] = [];
  for (let x = FLOOR.x0; x <= x1 + 1e-6; x += 0.5) {
    lines.push(pathOf([proj({ x, y: FLOOR.y0, z }, o), proj({ x, y: FLOOR.y1, z }, o)]));
  }
  for (let y = FLOOR.y0; y <= FLOOR.y1 + 1e-6; y += 0.5) {
    lines.push(pathOf([proj({ x: FLOOR.x0, y, z }, o), proj({ x: x1, y, z }, o)]));
  }
  const foot: V3 = { x: FLOOR.x0, y: FLOOR.y1, z };
  const ticks: P2[] = [];
  for (let i = 0; i < n; i++) ticks.push(proj({ ...foot, z: i * PLATE.rise }, o));
  return {
    grid: lines.join(" "),
    foot: proj(foot, o),
    ticks,
    x: [proj(foot, o), proj({ x: x1 + 0.4, y: FLOOR.y1, z }, o)],
  };
}

/** Plate `i`'s front-left corner (its tick's leader ends here). */
export function plateCorner(i: number, o: P2): P2 {
  return proj({ x: i * PLATE.step, y: SHEET.h, z: i * PLATE.rise }, o);
}

/** Plate `i`'s socket on its right edge, where a tendril plugs in. */
export function plateSocket(i: number, n: number, o: P2): P2 {
  const y = SHEET.h * (0.8 - 0.6 * (i / Math.max(1, n - 1)));
  return proj({ x: i * PLATE.step + SHEET.w, y, z: i * PLATE.rise }, o);
}

/** A cubic from `a` to `b`, leaving `a` along `da` and arriving along `db`. */
export function cable(a: P2, b: P2, da: P2, db: P2, k = 28): P2[] {
  const c1 = { x: a.x + da.x, y: a.y + da.y };
  const c2 = { x: b.x + db.x, y: b.y + db.y };
  const out: P2[] = [];
  for (let j = 0; j <= k; j++) {
    const t = j / k;
    const u = 1 - t;
    const w0 = u * u * u;
    const w1 = 3 * u * u * t;
    const w2 = 3 * u * t * t;
    const w3 = t * t * t;
    out.push({
      x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x,
      y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y,
    });
  }
  return out;
}

/** The isometric's +x on screen, a unit: a plate's right edge faces it. */
export const SCREEN_X: P2 = { x: C30, y: 0.5 };

export { clamp01, lerp };
