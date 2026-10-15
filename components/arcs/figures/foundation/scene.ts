/**
 * The foundation act (ADR-156 U5): one scene across two beats.
 *
 * WHAT IT CAN MAKE: one example faces the reader, framed; when its turn ends
 * it turns into a standing sheet and joins a stack receding to the side, the
 * way Unsiloed stands its sheets (owner, 2026-10-15: "stack and rotate along
 * the x-axis ... a bit more diagonal ... stacked on the sides").
 * THE NEW INTERFACE: the standing sheets tip over on their x-axis and settle
 * as plates, the foundations, carrying their own pictures; above them a
 * machine mind assembles from particles, a brain whose folds are circuit
 * traces; its tendrils reach down and plug into every plate.
 *
 * ⚠ ONE PROJECTION: the true isometric of the owner's stack-forms and
 * substrate labs (30 degrees; +x down-right, +y down-left, +z up). A sheet is
 * a plane with a corner and two axes; every pose is that plane in 3D,
 * projected EXACTLY into an SVG `matrix()`, so a picture on a sheet is
 * drawn on the sheet, never faked.
 *
 * ⚠ PURE: the act's component measures and paints; this decides.
 */

export const VB = { w: 1440, h: 820 } as const;

/** Pixels per world unit, and the isometric basis. */
const U = 34;
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

/** Where the scene's two origins sit: the side stack and the foundations. */
const STACK_O: P2 = { x: 240, y: 300 };
const PLATES_O: P2 = { x: 690, y: 560 };

/** The facing pose: a flat card, right of centre, reading size. */
export const FACING = { x: 600, y: 100, s: 1.3 } as const;

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

/** Standing in the side stack: slot `i`, newest in front (larger y). */
const STACK_STEP = 1.05;
function standing(i: number): M6 {
  return sheetMatrix({ x: 0, y: i * STACK_STEP, z: SHEET.h }, 0, STACK_O);
}

/** The foundations: plate `i` lying at its height, the first at the bottom. */
export const PLATE_RISE = 0.7;
export const PLATE_DEPTH = SHEET.h;
function lyingAt(i: number, theta: number): M6 {
  /* A true tip-over: the sheet's bottom edge is the hinge, fixed at
     (y = depth, z = the plate's height), and its top falls back about it, so
     at 90 degrees it lies with its face up across y 0..depth. */
  const z = i * PLATE_RISE;
  const p0: V3 = {
    x: 0,
    y: PLATE_DEPTH - PLATE_DEPTH * Math.sin(theta),
    z: z + SHEET.h * Math.cos(theta),
  };
  return sheetMatrix(p0, theta, PLATES_O);
}

export interface SheetPose {
  m: M6;
  /** 0 hidden, 1 shown: a sheet appears, it never fades in. */
  shown: boolean;
  /** The one facing the reader (its words are up). */
  facing: boolean;
  /** Its ghosts' offset for depth, in world y (standing) or z (lying). */
  depth: number;
}

/** A card's share of the first beat, and where its turn ends. */
const HOLD = 0.62;

/**
 * Every sheet at the act's clock: `a` the first beat's progress (what it can
 * make), `b` the second's (the new interface; 0 until it parks).
 */
export function sheetPoses(n: number, a: number, b: number): SheetPose[] {
  const out: SheetPose[] = [];
  for (let i = 0; i < n; i++) {
    const u = clamp01(a) * n - i;
    const arrive = i === 0 ? 0 : HOLD - 1;
    let m: M6;
    let shown = u >= arrive;
    let facing = false;
    if (b <= 0) {
      if (!shown) m = facingMatrix();
      else if (i === n - 1 || u < HOLD) {
        m = facingMatrix();
        facing = true;
      } else {
        m = mix(facingMatrix(), standing(i), smooth((u - HOLD) / (1 - HOLD)));
      }
    } else {
      shown = true;
      // The last card leaves the facing pose for the stack first, then every
      // sheet tips over and settles, staggered from the first to the last.
      const from = i === n - 1 ? mix(facingMatrix(), standing(i), smooth(b / 0.12)) : standing(i);
      const t = smooth((b - 0.08 - i * 0.035) / 0.28);
      if (t <= 0) m = from;
      else {
        const theta = (t * Math.PI) / 2;
        const target = lyingAt(i, theta);
        m = mix(from, target, smooth(Math.min(1, t * 1.15)));
      }
    }
    out.push({ m, shown, facing, depth: 0.18 });
  }
  return out;
}

// ── The machine mind ───────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MindDot {
  /** Its seat on the brain, in the viewBox. */
  x: number;
  y: number;
  /** Where it starts, scattered, before the mind assembles. */
  sx: number;
  sy: number;
  /** On a circuit trace (gold) or the cortex between (dawn). */
  trace: boolean;
  /** Front-facing (bright) or behind (dim). */
  front: number;
  delay: number;
}

const BRAIN_C: V3 = { x: SHEET.w / 2, y: SHEET.h / 2, z: 0 };

/** The mind's centre in world space, above the top plate. */
export function mindCentre(n: number): V3 {
  return { x: BRAIN_C.x, y: BRAIN_C.y, z: (n - 1) * PLATE_RISE + 5.8 };
}

let mindCache: MindDot[] | null = null;

/**
 * The brain: two hemispheres (ellipsoids, a groove between them along x),
 * the cerebellum under the back, sampled as dots; circuit traces routed over
 * the cortex in its own latitude and longitude, orthogonal like a board.
 */
export function mindDots(n: number): MindDot[] {
  if (mindCache) return mindCache;
  const rnd = mulberry32(1956);
  const c = mindCentre(n);
  const dots: MindDot[] = [];
  const R = { x: 4.1, y: 3.0, z: 2.5 };
  // A grid in (lon, lat) on each hemisphere; traces walk the grid.
  const LON = 64;
  const LAT = 30;
  const onTrace = new Set<string>();
  for (let t = 0; t < 46; t++) {
    let lo = Math.floor(rnd() * LON);
    // Kept off the crown: walked round the pole, a trace reads as a target.
    let la = 3 + Math.floor(rnd() * (LAT - 12));
    let horiz = rnd() < 0.5;
    const segs = 4 + Math.floor(rnd() * 7);
    for (let s = 0; s < segs; s++) {
      const len = 2 + Math.floor(rnd() * 5);
      for (let k = 0; k < len; k++) {
        onTrace.add(`${(lo + LON) % LON},${la}`);
        if (horiz) lo += 1;
        else la = Math.max(2, Math.min(LAT - 9, la + (rnd() < 0.5 ? 1 : -1)));
      }
      if (rnd() < 0.7) horiz = !horiz;
    }
  }
  for (let li = 0; li < LAT; li++) {
    const lat = -Math.PI / 2 + ((li + 0.5) / LAT) * Math.PI;
    for (let lo = 0; lo < LON; lo++) {
      const lon = (lo / LON) * Math.PI * 2;
      for (const side of [-1, 1] as const) {
        // A hemisphere: half an ellipsoid on each side of the groove (y).
        let nx = Math.cos(lat) * Math.cos(lon);
        let ny = Math.cos(lat) * Math.sin(lon);
        const nz = Math.sin(lat);
        if (Math.sign(ny) !== side && Math.abs(ny) > 0.02) continue;
        ny = side * Math.abs(ny);
        // Flatter underneath, a frontal lobe a little fuller.
        const zScale = nz < 0 ? 0.7 : 1;
        const p: V3 = {
          x: c.x + nx * R.x * (nx > 0 ? 1.06 : 1),
          y: c.y + ny * R.y + side * 0.18,
          z: c.z + nz * R.z * zScale,
        };
        // The crown thinned: its latitude rows would read as a target.
        if (rnd() < (nz > 0.86 ? 0.85 : 0.35)) continue;
        const q = proj(p, PLATES_O);
        const trace = onTrace.has(`${lo},${li}`);
        // Front-facing toward the viewer of this isometric: +x, +y, +z.
        const front = (nx + ny + nz) / Math.sqrt(3);
        const ang = rnd() * Math.PI * 2;
        const rad = 260 + rnd() * 340;
        dots.push({
          x: q.x,
          y: q.y,
          sx: q.x + Math.cos(ang) * rad,
          sy: q.y + Math.sin(ang) * rad * 0.6,
          trace,
          front,
          delay: rnd() * 0.35,
        });
        nx = 0;
      }
    }
  }
  // The cerebellum and the stem, under the back.
  for (let k = 0; k < 260; k++) {
    const u = rnd() * Math.PI * 2;
    const v = Math.acos(2 * rnd() - 1);
    const p: V3 = {
      x: c.x - 2.2 + Math.sin(v) * Math.cos(u) * 1.2,
      y: c.y + Math.sin(v) * Math.sin(u) * 1.5,
      z: c.z - 1.5 + Math.cos(v) * 0.7,
    };
    const q = proj(p, PLATES_O);
    dots.push({ x: q.x, y: q.y, sx: q.x + (rnd() - 0.5) * 600, sy: q.y + (rnd() - 0.5) * 400, trace: false, front: 0.2, delay: rnd() * 0.35 });
  }
  mindCache = dots;
  return dots;
}

/** A tendril from under the mind to plate `i`'s socket on its right edge. */
export function tendril(i: number, n: number): P2[] {
  const c = mindCentre(n);
  const from: V3 = { x: c.x + (i - (n - 1) / 2) * 0.7, y: c.y + 0.6, z: c.z - 2.0 };
  const z = i * PLATE_RISE;
  const to: V3 = { x: SHEET.w, y: SHEET.h * (0.2 + 0.6 * (i / Math.max(1, n - 1))), z };
  // Out past the stack's side first, then in level with the plate: a cable
  // that goes round the stack and plugs in, never one drawn across it.
  // (+x, -y) is level to the right on screen in this isometric.
  const c1: V3 = { x: from.x + 3.4, y: from.y - 3.0, z: from.z - 0.8 };
  const c2: V3 = { x: SHEET.w + 3.0 + i * 0.2, y: to.y, z: z + 0.2 };
  const pts: P2[] = [];
  for (let k = 0; k <= 32; k++) {
    const t = k / 32;
    const u = 1 - t;
    const w0 = u * u * u;
    const w1 = 3 * u * u * t;
    const w2 = 3 * u * t * t;
    const w3 = t * t * t;
    pts.push(
      proj(
        {
          x: w0 * from.x + w1 * c1.x + w2 * c2.x + w3 * to.x,
          y: w0 * from.y + w1 * c1.y + w2 * c2.y + w3 * to.y,
          z: w0 * from.z + w1 * c1.z + w2 * c2.z + w3 * to.z,
        },
        PLATES_O
      )
    );
  }
  return pts;
}

/** The plate's label seat: along its front-left edge, in the viewBox. */
export function plateLabel(i: number): P2 {
  return proj({ x: 0, y: SHEET.h, z: i * PLATE_RISE }, PLATES_O);
}

/** The mind's label seat. */
export function mindLabel(n: number): P2 {
  const c = mindCentre(n);
  return proj({ x: c.x - 3.6, y: c.y + 2.6, z: c.z + 1.4 }, PLATES_O);
}

export { clamp01 };
