/**
 * lib/musings/rowMath — the row's geometry (ADR-119 U2). Pure, three-free.
 *
 * The owner, on the live read of U1's shelf (2026-09-22): _"We want some sort
 * of jukebox carousel rolodex effect where we see the other cards rotated on
 * the x-axis, but now it looks really bad."_ Asked to pick a form, he chose
 * the ROW: the card being read stands upright in the centre, the others sit
 * left and right of it TIPPED BACK about their own horizontal axis, and the
 * row slides sideways as the reader scrolls — _"I don't want a physical shelf
 * or whatever … I don't want any skeuomorphism."_ So the cards are flat panes
 * and the depth is the rotation and the perspective, nothing else: no slab, no
 * lit edge, no spine.
 *
 * ⚠ THE AXIS IS X, AND THE WORD HAS COST THREE PASSES. U0 fanned the cards
 * about Y (a copy of the services ring, which he refused), U1 turned them 90°
 * about Y to show a spine (the shelf, which he refused). `rotateX` is the only
 * rotation this module emits, and the test asserts `rotateY` appears nowhere.
 *
 * ⚠ THE ROW IS CENTRED ON THE CARD BEING READ. U1 anchored the shelf on the
 * band's left edge by a session decision; his first brief said "the card at
 * the centre", and this pass is his ruling that it is: the open card sits on
 * the rig's centre and the row slides past it.
 *
 * ⚠ IT IS DATA, NOT A RENDER — ADR-002's law, kept from the shelf this
 * replaces: the geometry is a transform STRING the one writer assigns.
 */
import { clamp01 } from "@/lib/math";

/**
 * The tip, in degrees. Positive `rotateX` carries the card's top AWAY.
 *
 * 60°, chosen on stills: at 65° a neighbour is a squat sliver whose cover
 * barely reads, at 45° its copy is legible enough to compete with the card
 * being read. 60° shows each neighbour as a card — cover, glyph, title — and
 * keeps it plainly behind the one in front.
 */
export const ROW_TILT = 60;

/**
 * The perspective distance, in px, BAKED INTO EVERY CARD'S OWN TRANSFORM.
 *
 * ⚠ NOT A `perspective` PROPERTY ON AN ANCESTOR, AND THAT IS MEASURED. The
 * first cut put `perspective` on `.mu__rig` with a shared `preserve-3d`
 * context, as U1's shelf did — and inside this sticky, promoted stage the
 * compositor resolved that perspective somewhere other than where
 * `getBoundingClientRect` did: a tipped card's cover glyph PAINTED ~125px
 * right and ~140px below its own reported rect, squashing each neighbour to a
 * 30px sliver under the row's mid-line with every geometry gate green. A
 * `perspective()` function in the card's own matrix is resolved in one place,
 * about the card's own origin — the rig's centre, since every card is seated
 * there — so the painted row and the measured row are the same row.
 */
export const ROW_PERSPECTIVE = 1400;

/** Centre-to-centre distance to the first neighbour, × the face's width. */
export const ROW_PITCH_1 = 0.82;
/** Each further step along the row, × the face's width. */
export const ROW_PITCH_N = 0.62;
/** How far the first neighbour sits back, × the face's width (a floor — see
 *  `rowNearDepth`). */
export const ROW_DEPTH_1 = 0.62;
/** Each further step back, × the face's width. */
export const ROW_DEPTH_N = 0.5;
/**
 * The air, in px, between a tipped card's NEAR edge and the upright card's
 * plane.
 *
 * ⚠ A TIPPED CARD SWINGS ITS BOTTOM EDGE TOWARD THE READER BY `(h/2)·sin(tilt)`.
 * The cards share no 3D context (each carries its own `perspective()`), so the
 * paint order is z-index and the upright card always covers its neighbours —
 * but a neighbour whose near edge stood IN FRONT of the card that covers it
 * would be a drawing that contradicts itself. So the first neighbour's depth
 * is floored on the face's own HEIGHT, not just scaled off its width — a
 * tall, narrow face at the 961px rung is exactly where a width-only depth
 * would put that edge through the card being read.
 */
export const ROW_DEPTH_CLEAR = 24;

export interface RowGeom {
  /** The face's LAYOUT width (`offsetWidth` — a transform does not move it). */
  w: number;
  /** The face's LAYOUT height. */
  h: number;
}

export function rowGeom(w: number, h: number): RowGeom {
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

/** The first neighbour's depth behind the upright card, in px. */
export function rowNearDepth(g: RowGeom): number {
  const reach = (g.h / 2) * Math.sin((ROW_TILT * Math.PI) / 180);
  return Math.max(ROW_DEPTH_1 * g.w, reach + ROW_DEPTH_CLEAR);
}

export interface RowSeat {
  /** Along the row, from the rig's centre, in px. Signed. */
  dx: number;
  /** Back from the upright card's plane, in px. Never negative. */
  z: number;
  /** The tip, in degrees. 0 for the card being read. */
  tilt: number;
}

/** Where a card `d` steps from the open one sits. */
export function rowSeat(d: number, g: RowGeom): RowSeat {
  if (d === 0) return { dx: 0, z: 0, tilt: 0 };
  const k = Math.abs(d);
  const side = Math.sign(d);
  return {
    dx: side * (ROW_PITCH_1 * g.w + (k - 1) * ROW_PITCH_N * g.w),
    z: rowNearDepth(g) + (k - 1) * ROW_DEPTH_N * g.w,
    tilt: ROW_TILT,
  };
}

export interface RowPose {
  /** Ready for `element.style.transform`. */
  transform: string;
  /** Degrees — 0 upright, `ROW_TILT` tipped. Published for the guards. */
  tilt: number;
  zIndex: number;
}

/**
 * A card's pose.
 *
 * ⚠ ONE FUNCTION LIST FOR BOTH STATES, IN ONE ORDER — `perspective` (the eye,
 * about the card's own origin, which is the rig's centre) → `translateX` (the
 * slide) → `translateZ` (the recession) → `rotateX` (the tip). A CSS
 * transition interpolates two transforms function by function only when their
 * lists match; a list that differed between the upright and the tipped pose
 * would snap between detents instead of gliding.
 * ⚠ THE PERSPECTIVE IS FIRST, so every card is seen from one eye: each is
 * seated on the rig's centre (`inset: 0; margin: auto` in the sheet), and the
 * slide comes after the projection, not before it.
 * ⚠ AND THE ROTATION IS LAST, so it turns the card about its own centre at its
 * seat rather than carrying the slide into the tipped frame.
 */
export function rowPose(i: number, n: number, open: number, g: RowGeom): RowPose {
  const d = Math.min(n - 1, Math.max(0, i)) - open;
  const s = rowSeat(d, g);
  return {
    transform: [
      `perspective(${ROW_PERSPECTIVE}px)`,
      `translateX(${s.dx.toFixed(2)}px)`,
      `translateZ(${(-s.z).toFixed(2)}px)`,
      `rotateX(${s.tilt}deg)`,
    ].join(" "),
    tilt: s.tilt,
    /* The card being read paints over its neighbours, and each step out paints
       under the one before it. Depth already orders them inside the 3D
       context; this is the tie-break for the frames in which a card mid-glide
       shares a depth with another. */
    zIndex: Math.max(1, 30 - Math.abs(d)),
  };
}

/**
 * The open card for a fractional position.
 *
 * ⚠ IT IS A DETENT, BY THE OWNER'S RULING — "each scroll step advances one
 * card" (ADR-119) — so the index is ROUNDED and the travel between two cards
 * is a CSS transition, never a scrubbed angle: a card carrying a title and a
 * summary has to be still when it is read.
 */
export function rowIndex(i: number, n: number): number {
  if (n <= 0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(i)));
}

/**
 * The reading band, as fractions of the pinned travel, so the runway's length
 * is a dial and never a re-tune of these. `n` cards have `n − 1` steps: the
 * first card is open for the whole approach and the last holds to the end.
 */
export const ROW_READ = [0.24, 0.94] as const;

export function rowReadIndex(p: number, n: number): number {
  const t = clamp01(p);
  const read = clamp01((t - ROW_READ[0]) / Math.max(0.001, ROW_READ[1] - ROW_READ[0]));
  return read * Math.max(0, n - 1);
}

/**
 * The row's own arrival — a BOUNDED BURST on a hysteresis, not a channel.
 *
 * The owner's order: _"the text should appear with a glitch effect, and then
 * the cards should come into view."_ The head decodes on its own clock the
 * moment the stage parks (`headDecode.ts`); the cards open after it, and the
 * writer additionally holds `in` until the head has resolved.
 *
 * ⚠ IT CLOSES AT `ROW_ARRIVE_END`, PAST THE READING BAND'S OWN END (0.94) — a
 * row that shut while the last card was still being read would take the
 * reading away — and BEFORE the head leaves (`HEAD_LEAVE_AT`), so the exit is
 * the entry run backwards: cards first, then the text.
 */
export const ROW_ARRIVE_IN = 0.26;
export const ROW_ARRIVE_OUT = 0.22;
export const ROW_ARRIVE_END = 0.95;

export type RowArrive = "await" | "in" | "out";

/**
 * The next arrival state, given the last one and the station's progress.
 *
 * ⚠ COPIED from `turnClock.ts`'s `arriveNext` — a landing component importing
 * a route module is a dependency in the wrong direction. Lifting it to `lib/`
 * is the follow-up; the copy is pinned against the original's behaviour.
 * ⚠ NaN LEAVES THE STATE ALONE. ⚠ A DEEP RELOAD SEEDS `in`, NOT `await`.
 * ⚠ `await` IS NOT `out`: both paint nothing, but `out` plays the close and
 * `await` has never been seen.
 */
export function rowArrive(prev: RowArrive | null, p: number): RowArrive {
  const at = prev ?? "await";
  if (!Number.isFinite(p)) return at;
  if (p >= ROW_ARRIVE_END) return at === "in" ? "out" : at;
  if (p >= ROW_ARRIVE_IN) return "in";
  if (p <= ROW_ARRIVE_OUT) return at === "in" ? "out" : at;
  return at;
}
