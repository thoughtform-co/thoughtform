/**
 * lib/musings/shelfMath — the shelf's geometry (ADR-119 U1). Pure, three-free.
 *
 * The owner, on the live read of ADR-119's rack (2026-09-22): _"I do not want
 * a copy of the services flow where we have cards rotating around it. I only
 * want the scroll to happen horizontally, but the blog posts that are not in
 * view should be rotated 90° so we see the side. It's like putting LPs or CDs
 * in a closet or on a shelf, where you see the back instead of the front, or
 * the side instead of the front."_
 *
 * So this is not Cover Flow and the difference is not a matter of degree. A
 * rack FANS: every card is partly turned, partly visible, and the reader is
 * looking at five covers at five angles. A shelf has exactly TWO states —
 * facing out, or turned a full 90° and showing a spine — and it is the
 * SHELF that slides so the open one is in front of the reader.
 *
 * ⚠ THE TWO STATES ARE ONE PIVOT AND TWO PRE-ROTATED PLANES, WHICH IS WHAT
 * MAKES A TURNED CARD OCCUPY A SPINE'S WIDTH RATHER THAN NOTHING. A single
 * plane rotated 90° about its own centre projects to a line; rotated about
 * its LEFT EDGE it projects to a line at that edge. Either way there is
 * nothing on screen to read. The object is therefore the real one: a slab
 * with a face and a spine, hinged at one edge —
 *
 *   `.mu-card`         the pivot, `rotateY(0)` open / `rotateY(90deg)` closed,
 *                      `transform-origin: left center`
 *   `.mu-card__front`  the face, unrotated, `SHELF_*` wide
 *   `.mu-card__spine`  the spine, pre-rotated `rotateY(-90deg)` about the same
 *                      edge, `SHELF_SPINE_PX` wide
 *
 * At the pivot's 90° the two transforms compose to the identity on the spine
 * (90 − 90 = 0), so it faces the reader occupying exactly `SHELF_SPINE_PX`,
 * while the face is edge-on. At 0° they are the other way round. One angle
 * drives both, and nothing cross-fades.
 *
 * ⚠ THE PIVOT TURNS **AWAY** FROM THE READER (`+90`, which maps the face's
 * +x to −z). At −90 the face swings toward the reader instead and, under the
 * rig's perspective, reaches over its neighbour on the way.
 *
 * ⚠ IT IS DATA, NOT A RENDER — ADR-002's law, kept from the rack this
 * replaces: the geometry is emitted as a transform STRING that the one writer
 * assigns, and nothing here touches React.
 *
 * What is GONE with the fan, and why each: the five-deep slot table (a shelf
 * has no depth ladder — a spine either fits on the shelf or does not), the
 * per-card opacity and arrival blur (a closed card is not a dimmed card, it
 * is a card seen edge-on, and both of those are grouping properties that
 * would have flattened the pivot's 3D context), and the fly-in from a stacked
 * plane (the beat's arrival is the aperture now, per the owner's own order:
 * the head decodes, then the cards come into view).
 */
import { clamp01, smoothstep } from "@/lib/math";

/**
 * The spine's width, in px.
 *
 * ⚠ MIRRORED BY HAND IN `musings.css` AS `--mu-spine`, and
 * `tests/lib/musings-shelf.test.ts` asserts the two carry the same number.
 * The track is laid out here and the spine is drawn there, so a disagreement
 * is a shelf whose slabs overlap or stand apart with nothing erroring.
 */
export const SHELF_SPINE_PX = 46;

/** The air between two slabs on the track, in px. Mirrored as `--mu-shelf-gap`. */
export const SHELF_GAP_PX = 10;

export interface ShelfGeom {
  /** The face's own width, measured off the live card (`offsetWidth`). */
  w: number;
  spine: number;
  gap: number;
}

export function shelfGeom(w: number): ShelfGeom {
  return { w: Math.max(1, w), spine: SHELF_SPINE_PX, gap: SHELF_GAP_PX };
}

/**
 * Each slab's HINGE — its left edge — measured along the track from the
 * track's own origin.
 *
 * The extent a slab occupies is what the reader can see of it: the open one
 * takes its full face, every other one takes a spine. That is the whole of
 * the layout, and it is why the shelf re-flows when the open card changes —
 * one card widens, the rest close up, and every slab moves in one gesture.
 */
export function shelfHinges(n: number, open: number, g: ShelfGeom): number[] {
  const xs: number[] = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    xs.push(x);
    x += (i === open ? g.w : g.spine) + g.gap;
  }
  return xs;
}

/** The track's full width, gaps between slabs only. */
export function shelfWidth(n: number, g: ShelfGeom): number {
  if (n <= 0) return 0;
  return g.w + (n - 1) * g.spine + (n - 1) * g.gap;
}

/**
 * Slab `i`'s offset from the SHELF'S LEFT END, in px.
 *
 * ⚠ **THE SHELF STANDS STILL AND THE OPEN SLAB TRAVELS ALONG IT**, which is
 * the whole of the owner's object: a row of records on a shelf does not slide
 * past you when you pull one out — you pull one out, the rest close up, and
 * the shelf is where it was. The first cut centred the open slab on the rig
 * instead, and at three posts that put a 420px card in the middle of a 1200px
 * band under a head banded across the whole of it: one object floating in the
 * centre of a composition whose every other element is on the band's left
 * edge. Left-anchored, the head, the shelf and the way out are one column.
 *
 * ⚠ The value is measured to the slab's HINGE, not its centre, because that
 * is where the pivot's `transform-origin` is — a centre-referenced offset
 * would be right for the open card and half a face out for every closed one.
 * ⚠ And the travel is BOUNDED by construction: at `MUSINGS_RACK_MAX` posts the
 * open slab's furthest seat is `(max − 1) × (spine + gap)`, 336px, inside the
 * editorial band at every viewport this rung opens at.
 */
export function shelfOffset(i: number, n: number, open: number, g: ShelfGeom): number {
  const xs = shelfHinges(n, open, g);
  if (!xs.length) return 0;
  return xs[Math.min(n - 1, Math.max(0, i))];
}

export interface ShelfPose {
  /** Ready for `element.style.transform`. */
  transform: string;
  /** Degrees — 0 open, `SHELF_TURN` closed. Published for the guards. */
  turn: number;
  zIndex: number;
}

/** The angle a closed slab is turned through, in degrees. */
export const SHELF_TURN = 90;

/**
 * A slab's pose.
 *
 * ⚠ THE ORDER IS `translateY` → `translateX` → `rotateY`, AND THE ROTATION IS
 * LAST. Transforms compose left to right in the element's own frame, so a
 * rotation before the translation would carry the slide into the turned
 * frame and send a closed slab backward into the scene instead of along the
 * shelf.
 */
export function shelfPose(i: number, n: number, open: number, g: ShelfGeom): ShelfPose {
  const dx = shelfOffset(i, n, open, g);
  const turn = i === open ? 0 : SHELF_TURN;
  return {
    transform: ["translateY(-50%)", `translateX(${dx.toFixed(2)}px)`, `rotateY(${turn}deg)`].join(
      " "
    ),
    turn,
    /* The open slab paints over its neighbours. Nothing overlaps at rest —
       the track gives every slab its own extent — but a slab mid-turn sweeps
       through the space beside it, which is exactly when the reader is
       looking. */
    zIndex: i === open ? 30 : 10,
  };
}

/**
 * The open slab for a fractional position.
 *
 * ⚠ IT IS A DETENT, BY THE OWNER'S RULING — "each scroll step advances one
 * card" — so the index is ROUNDED and the travel between two slabs is a CSS
 * transition, not a scrubbed angle. A continuously scrubbed shelf was offered
 * beside it and refused: the open card is never quite still, which is the one
 * thing a card carrying a title and a summary has to be. It is also what
 * makes the two states TWO: a scrubbed shelf has every slab at its own angle,
 * which is the fan this replaces.
 */
export function shelfIndex(i: number, n: number): number {
  if (n <= 0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(i)));
}

/**
 * The shelf's clock, from the station's own progress.
 *
 * `entry` is the beat's arrival — the head's decode and the cards' aperture
 * both hang off it — and `index` is the fractional position the detent
 * rounds. The windows are fractions of the pinned travel, so the runway's
 * length is a dial and never a re-tune of these.
 */
export interface ShelfClock {
  entry: number;
  index: number;
  /** The whole-shelf idle yaw, in degrees. */
  drift: number;
  /** The masthead's own clock: 0 blank, 1 fully resolved. */
  head: number;
}

export const SHELF_ENTRY = [0.0, 0.16] as const;
export const SHELF_READ = [0.24, 0.94] as const;
export const SHELF_HEAD_IN = [0.08, 0.24] as const;
export const SHELF_HEAD_OUT = [0.84, 0.94] as const;

/**
 * The shelf's own arrival — a BOUNDED BURST on a hysteresis, not a channel.
 *
 * The owner's order, stated in one sentence: _"the text should appear with a
 * glitch effect, and then the cards should come into view."_ So the head
 * decodes first (`SHELF_HEAD_IN`) and the slabs materialise after it, which
 * is what puts `SHELF_ARRIVE_IN` past the head's own window.
 *
 * ⚠ IT IS A BURST BECAUSE IT HAS A DIRECTION AND A PROGRESS VALUE DOES NOT
 * (ADR-021's one sanctioned exception, ADR-101 §A's `arriveNext`). The two
 * thresholds are a hysteresis so a reader resting on the edge does not
 * re-trigger it every frame.
 * ⚠ AND THE CLOSE IS AT `SHELF_ARRIVE_END`, PAST THE READING BAND'S OWN END
 * (0.94) — a shelf that shut while the last slab was still being read would
 * take the reading away to play an animation.
 */
export const SHELF_ARRIVE_IN = 0.26;
export const SHELF_ARRIVE_OUT = 0.22;
export const SHELF_ARRIVE_END = 0.97;

export type ShelfArrive = "await" | "in" | "out";

/**
 * The next arrival state, given the last one and the station's progress.
 *
 * ⚠ COPIED from `turnClock.ts`'s `arriveNext` — seven lines, and a landing
 * component importing a route module is a dependency in the wrong direction
 * (the arcs already say this of `pda.css`). Lifting it to `lib/` is the
 * follow-up; the copy is pinned against the original's own behaviour.
 *
 * ⚠ NaN LEAVES THE STATE ALONE: a rect read during a relayout can hand this a
 * non-finite value, and the one thing a burst must never do is fire because a
 * measurement was briefly unavailable.
 * ⚠ AND A DEEP RELOAD SEEDS `in`, NOT `await` — landing mid-beat plays the
 * arrival once and ends on the cascade's own identity, which is what the
 * reader would have seen had they scrolled to it. Seeding `await` there would
 * leave the shelf hidden until they scrolled back and forward again.
 * ⚠ `await` IS NOT `out`. Both paint nothing; `out` plays the close and
 * `await` has never been seen, and collapsing them shuts the shelf on the way
 * IN.
 */
export function shelfArrive(prev: ShelfArrive | null, p: number): ShelfArrive {
  const at = prev ?? "await";
  if (!Number.isFinite(p)) return at;
  if (p >= SHELF_ARRIVE_END) return at === "in" ? "out" : at;
  if (p >= SHELF_ARRIVE_IN) return "in";
  if (p <= SHELF_ARRIVE_OUT) return at === "in" ? "out" : at;
  return at;
}

/**
 * How many characters of a typed run are shown at `f`.
 *
 * ⚠ IT ROUNDS UP FROM THE FIRST NON-ZERO FRACTION, so the first character
 * appears the instant the run opens rather than a twelfth of the way through
 * it — a typewriter that starts on an empty line for a fifth of its window
 * reads as a stall, not as typing.
 */
export function typedCount(len: number, f: number): number {
  if (len <= 0) return 0;
  const t = clamp01(f);
  if (t <= 0) return 0;
  return Math.max(1, Math.min(len, Math.ceil(t * len)));
}

export function shelfClock(p: number, n: number): ShelfClock {
  const t = clamp01(p);
  const entry = smoothstep(SHELF_ENTRY[0], SHELF_ENTRY[1], t);

  /* The reading band is divided by the GAPS between cards, not by the cards:
     n cards have n − 1 steps, so the first card is open for the whole
     approach and the last one holds to the end of the band. */
  const read = clamp01((t - SHELF_READ[0]) / Math.max(0.001, SHELF_READ[1] - SHELF_READ[0]));
  const index = read * Math.max(0, n - 1);

  /* A shelf is looked ALONG, so a few degrees of standing yaw is what makes
     the spines read as a row receding rather than as a strip of tabs. It is
     constant once the beat has arrived — never a function of `read`, which
     would swing the whole shelf every time a card turned. */
  const drift = -4 * smoothstep(0.4, 1, entry);

  /* ⚠ ONE SCALAR, RISING THEN FALLING, AND THAT IS WHAT MAKES THE DECODE
     REVERSIBLE FOR NOTHING. `scrambleFrame` is PURE in its `t` (the house's one
     decode kernel), so a clock that falls runs the same frames backwards and
     the head un-types on the way out with no second job, no latch and no
     state to get wrong — which is exactly why `advanceScrambles` may not be
     used here: it DROPS finished jobs, and a dropped job is a latch nothing
     can unwind (ADR-095's law, `turnDecode.ts`'s idiom).
     ⚠ AND ITS ABSENT VALUE IS 1, NOT 0. The sheet reads `var(--mu-head, 1)`
     and the writer only ever blanks a run it is also going to fill, so a
     reader with no script, on a phone or under reduced motion gets the head
     whole — the house's polarity law, one station over (ADR-101 §A). */
  const head =
    smoothstep(SHELF_HEAD_IN[0], SHELF_HEAD_IN[1], t) *
    (1 - smoothstep(SHELF_HEAD_OUT[0], SHELF_HEAD_OUT[1], t));

  return { entry, index, drift, head };
}
