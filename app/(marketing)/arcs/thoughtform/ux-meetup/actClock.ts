/**
 * The act's clock (ADR-156 U3): where every dot of the particle artifact is,
 * as a PURE function of the scroll, the beats' tops and the drawings' parked
 * anchors. Scrolling back plays it back; nothing is stateful.
 *
 * The beats are welded (`ux-meetup.css`): each parks at the previous one's
 * top plus 0.62 of a tail, and holds its words until 0.45 of its own tail.
 * The dots move only in those seams and in the machine's own hold:
 *
 *   content parked   on the content lane's blocks
 *   seam 1           content dots re-seat on the products beat's blocks;
 *                    the products lane's dots fill in out of its ghosts
 *   products parked  both lanes held
 *   seam 2           every dot crosses to its panel's tile on the machine
 *   machine parked   the dots stream along their ribbon into the housing
 *                    and turn gold in the model
 *   fold             the gathered dots fade as the beat folds
 *
 * ⚠ PURE: no DOM. `TalkAct` measures; this decides.
 */

export const ACT_BEATS = ["proof-content", "proof-products", "absorbed"] as const;

export interface Pt {
  x: number;
  y: number;
}

/** Each anchor at its beat's PARKED seat, in viewport pixels. */
export interface ActAnchors {
  /** The content and products blocks on the first timeline, by date. */
  c2: readonly (Pt | null)[];
  p2: readonly (Pt | null)[];
  /** The same blocks on the second timeline. */
  c3: readonly (Pt | null)[];
  p3: readonly (Pt | null)[];
  /** The machine's tiles, per panel, in the panels' order. */
  tiles: readonly [readonly (Pt | null)[], readonly (Pt | null)[]];
  /** Each ribbon's middle: the intake. */
  ribbon: readonly [Pt | null, Pt | null];
  model: Pt | null;
}

export interface ActClock {
  /** The three beats' tops in document pixels. */
  tops: readonly [number, number, number];
  /** One beat's tail in pixels. */
  tail: number;
}

export interface ActDot {
  x: number;
  y: number;
  alpha: number;
  gold: boolean;
}

export const DOTS_PER_BLOCK = 14;
const BLOCKS = 4;
const SCATTER = 7;
const GATHER = 10;

/** Where a beat's words start to leave (UNTYPE ≈ 0.45 of the tail) and where
 *  the next beat parks (0.62): the seams the dots travel in. */
const LEAVE = 0.4;
const NEXT = 0.62;
const SETTLE = 0.05;

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

interface DotSeed {
  lane: 0 | 1;
  block: number;
  ox: number;
  oy: number;
  gx: number;
  gy: number;
  delay: number;
}

/** The pool, built once: identity is the index, for the whole act. */
export const ACT_POOL: readonly DotSeed[] = (() => {
  const rnd = mulberry32(2026);
  const out: DotSeed[] = [];
  for (const lane of [0, 1] as const) {
    for (let block = 0; block < BLOCKS; block++) {
      for (let k = 0; k < DOTS_PER_BLOCK; k++) {
        const ang = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd());
        const gang = rnd() * Math.PI * 2;
        const gr = Math.sqrt(rnd());
        out.push({
          lane,
          block,
          ox: Math.cos(ang) * r * SCATTER,
          oy: Math.sin(ang) * r * SCATTER * 0.55,
          gx: Math.cos(gang) * gr * GATHER,
          gy: Math.sin(gang) * gr * GATHER * 0.55,
          delay: rnd() * 0.5,
        });
      }
    }
  }
  return out;
})();

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** The dots at a scroll position, or `null` outside the act. */
export function actFrame(y: number, clock: ActClock, a: ActAnchors): ActDot[] | null {
  const T = clock.tail;
  const [t0, t1, t2] = clock.tops;
  if (T <= 0 || y < t0 || y > t2 + NEXT * T) return null;

  const seam1 = [t0 + LEAVE * T, t1 + SETTLE * T] as const;
  const seam2 = [t1 + LEAVE * T, t2 + SETTLE * T] as const;
  const stream = [t2 + SETTLE * T, t2 + LEAVE * T] as const;
  const fold = [t2 + LEAVE * T, t2 + NEXT * T] as const;

  const out: ActDot[] = [];
  for (const d of ACT_POOL) {
    const on2 = (d.lane === 0 ? a.c2 : a.p2)[d.block];
    const on3 = (d.lane === 0 ? a.c3 : a.p3)[d.block];
    const tile = a.tiles[d.lane][d.block];
    const intake = a.ribbon[d.lane];
    const model = a.model;
    if (!on2 || !on3 || !tile || !intake || !model) return null;

    const at = (p: Pt) => ({ x: p.x + d.ox, y: p.y + d.oy });
    let p: Pt;
    let alpha = 1;
    let gold = false;

    if (y < seam1[0]) {
      p = at(on2);
      // The products lane is still a ghost on the first timeline.
      alpha = d.lane === 0 ? smooth((y - t0) / (0.04 * T)) : 0;
    } else if (y < seam1[1]) {
      const u = smooth((y - seam1[0]) / (seam1[1] - seam1[0]));
      p = lerp(at(on2), at(on3), u);
      alpha = d.lane === 0 ? 1 : u;
    } else if (y < seam2[0]) {
      p = at(on3);
    } else if (y < seam2[1]) {
      const u = smooth((y - seam2[0]) / (seam2[1] - seam2[0]));
      p = lerp(at(on3), at(tile), u);
    } else if (y < stream[1]) {
      const s = (y - stream[0]) / (stream[1] - stream[0]);
      const local = clamp01((s - d.delay) / 0.5);
      const gathered = { x: model.x + d.gx, y: model.y + d.gy };
      p =
        local < 0.5
          ? lerp(at(tile), intake, smooth(local / 0.5))
          : lerp(intake, gathered, smooth((local - 0.5) / 0.5));
      gold = local >= 0.5;
    } else {
      p = { x: model.x + d.gx, y: model.y + d.gy };
      gold = true;
      alpha = 1 - smooth((y - fold[0]) / (fold[1] - fold[0]));
    }
    out.push({ x: p.x, y: p.y, alpha, gold });
  }
  return out;
}
