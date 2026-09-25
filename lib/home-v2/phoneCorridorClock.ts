/**
 * phoneCorridorClock — the phone's paint clock, and the seats that ride it
 * (ADR-125, U1).
 *
 * On the phone every beat of the Arc was composed at exactly ONE scroll
 * position: the camera dolly is one smoothstep from `DOLLY_HOLD_END` to 1, the
 * DOM title/caption scale is `referenceDistance / distance`, and at the
 * Navigate park the camera moves ~40 world units per unit of paint — so the
 * frame the owner photographed existed for ±14px of scroll at 390×844. Nothing
 * on the page could land on it, and a reader who stopped "a bit too far" saw
 * the elements too small or half out of view.
 *
 * ADR-125's first cut answered that with 80svh PLATEAUS and one-flick-one-beat
 * (`scroll-snap-stop: always`) — and the owner read it as the travel gone:
 * "it just jumps from Navigate to Encode to Build without that smooth
 * transition, which is the entire shtick of our website". A pass that moves the
 * whole park-to-park distance in 50svh runs at 2.6× the desktop's pace (3.9×
 * at its smoothstep peak) between seats that cut every flick short; the
 * epilogue, plain linear scroll with no seat, still glided. U1 is his second
 * decision (2026-09-25): CONTINUOUS TRAVEL, SOFT LANDINGS.
 *
 * This module owns the phone's SCHEDULE as svh of scroll from the pin and
 * derives everything else from it:
 *
 *   - `phonePaintProgress(p)` — the corridor's normalised progress (raw scrub
 *     progress ÷ `EPILOGUE_START`, what `useDepthScroll` already computes)
 *     mapped onto `paintProgress`: a short DWELL at each park (the paint is
 *     held for a thumb's nudge — shorter than one snap radius, so every rest
 *     inside it is pulled onto the seat) and a CRUISE across each pass — a
 *     sine ramp in, a linear middle at ONE speed for all three passes, a sine
 *     ramp out. Zero paint velocity at both dwell edges (a slow drag never
 *     "clicks" off a beat); the middle half of every pass IS the desktop's
 *     linear grammar, at 1.33× its pace.
 *   - `phoneCorridorSeats()` — FOUR snap targets, as fractions of the SCRUB:
 *     each dwell's first frame, `normal` proximity. A rest within the root's
 *     snap reach lands on the composed frame; a rest further out is travel,
 *     and a nudge lands the beat. No `always` anywhere: a flick glides.
 *   - `MOBILE_THOUGHTFORM_END` — the thesis dwell's end, DERIVED (it was a
 *     literal 0.30 in `sceneGeom`), and the exit fade's start beside it.
 *
 * The park values are taken BY REFERENCE from `corridorMap` so a dwell is
 * byte-identical to the desktop's park by construction, never by a copied
 * literal. The PASSES are derived too: what the schedule leaves after the
 * thesis, the three dwells and the tail, split in the desktop's own paint
 * ratios, so every pass runs at the same `PHONE_PASS_SPEED`. `STAGE_SVH` is
 * the one mirrored literal — the phone stage's `height: 820svh` in
 * home-v2.css — and `tests/lib/phone-corridor-clock.test.ts` pins the two
 * against each other, together with the pre-chunk height reservation on
 * `.home-corridor-host`.
 *
 * ⚠ THREE-FREE AND DOM-FREE: `lib/rail-manifest/clickToNavigate.ts` reads
 * the seat fractions and sits in the landing's static graph
 * (`landing-import-doctrine`). Imports are `corridorMap` and nothing else.
 *
 * ⚠ THE TAIL IS NOT OPTIONAL. The epilogue's camera pose starts from paint 1
 * (`CAMERA_END`), so a clock that ended on the Build park would pop the camera
 * on the epilogue's first frame. The tail is a leg of the schedule; the test
 * asserts it is at least a quarter screen.
 */

import { BEAT_PARK_CENTRES, DOLLY_HOLD_END, clamp01 } from "@/lib/home-v2/corridorMap";

// ── The stage, mirrored ─────────────────────────────────────────────

/** The corridor stage's height, in svh — `home-v2.css` `.home-v2-stage`
 *  (both the base and the ≤760 declaration) and the ≤960 pre-chunk
 *  reservation on `.home-corridor-host`. Pinned by the unit test. */
export const STAGE_SVH = 820;
/** The sticky cell — one screen. */
export const STAGE_CELL_SVH = 100;
/** What `useDepthScroll` divides the stage's travel by: stage − cell. */
export const SCRUB_SVH = STAGE_SVH - STAGE_CELL_SVH;
/** Fraction of the scrub that belongs to the calibrated corridor; the rest
 *  is the epilogue's own channel. Moved here from `useDepthScroll` (same
 *  value: `620 / 820 ≈ 0.7561`), which re-imports it. */
export const EPILOGUE_START = 620 / 820;
/** The corridor's scroll span, in svh from the pin. */
export const CORRIDOR_SVH = SCRUB_SVH * EPILOGUE_START;

// ── The schedule (svh of scroll from the pin) ───────────────────────

/** Owner, 2026-09-25 (ADR-125): the thesis rest is 100svh (was 163). Owner,
 *  the same day (U1): the Arc travels — the 80svh holds become a DWELL and
 *  the passes take the rest of the corridor at one speed. */
export const PHONE_CORRIDOR_LEGS = {
  /** The thesis rest frame, held at paint 0 — the frame under the hero's
   *  curtain, and the seat the first flick lands on. */
  thesisHold: 40,
  /** Paint 0 → `DOLLY_HOLD_END`: the mark's rise to centre, and the copy +
   *  diagram's exit fade over its last `THESIS_EXIT_SVH`. */
  thesisRise: 60,
  /** Every beat's dwell — the one dial. ≈200px at 844: a thumb's nudge on
   *  the composed frame, and SHORTER THAN ONE SNAP RADIUS (Blink pulls a
   *  rest within about a third of the snapport), so no rest inside a dwell
   *  is left un-pulled; the 80svh plateau had 115px of un-pulled middle. */
  dwell: 24,
  /** The last leg, paint → 1, linear: what the epilogue's camera starts from. */
  tail: 40,
} as const;

/** The cruise's ramps: the share of a pass spent easing in, and again easing
 *  out. Sine ramps, so the paint velocity is zero at each dwell's edge and
 *  the middle half of the pass runs at the linear speed. */
export const PASS_RAMP = 0.25;

/** The thesis copy + diagram fade out over the LAST part of the rise, so
 *  the composition leaves the frame as the flight begins. ~276px at 844,
 *  the fade's own length before ADR-125 (0.06 of a 4595px corridor). */
export const THESIS_EXIT_SVH = 32;

export type PhoneCorridorPhase = "thesis" | "navigate" | "encode" | "build";

export type PhoneCorridorEase = "hold" | "linear" | "cruise";

export type PhoneCorridorLeg = {
  id:
    | "thesis-hold"
    | "thesis-rise"
    | "pass-navigate"
    | "navigate"
    | "pass-encode"
    | "encode"
    | "pass-build"
    | "build"
    | "tail";
  /** svh from the pin. */
  start: number;
  end: number;
  /** paint at `start` / `end`. A hold has `from === to`. */
  from: number;
  to: number;
  ease: PhoneCorridorEase;
};

/** The peak paint velocity of an ease, as a multiple of the leg's mean
 *  (`(to − from) / (end − start)`). The cruise's peak is the linear middle's
 *  speed, `1 / (1 − 2e + 4e/π)` for ramps of `e`: 1.222 at a quarter, against
 *  a smoothstep's 1.5 and a smootherstep's 1.875. */
export function passPeakFactor(ease: PhoneCorridorEase): number {
  if (ease === "cruise") return 1 / (1 - 2 * PASS_RAMP + (4 * PASS_RAMP) / Math.PI);
  return 1;
}

/** The cruise: `f(0) = 0`, `f(1) = 1`, `f'(0) = f'(1) = 0`, a linear middle at
 *  slope `k` between sine ramps of `PASS_RAMP` each — continuous in value and
 *  in velocity at both joins by `k`'s definition. */
export function cruise(t: number): number {
  const e = PASS_RAMP;
  const k = passPeakFactor("cruise");
  const ramp = (u: number) => k * ((2 * e) / Math.PI) * (1 - Math.cos((Math.PI * u) / (2 * e)));
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t <= e) return ramp(t);
  if (t >= 1 - e) return 1 - ramp(1 - t);
  return ramp(e) + k * (t - e);
}

function parkOf(beat: "navigate" | "diagnostic" | "intelligence"): number {
  const v = BEAT_PARK_CENTRES[beat];
  if (v === undefined) throw new Error(`phoneCorridorClock: no park for ${beat}`);
  return v;
}

/** The passes' common speed, paint per svh: the three park-to-park paint
 *  deltas over what the corridor leaves after the thesis, the three dwells
 *  and the tail. The desktop's pace is `1 / CORRIDOR_SVH`; this is 1.33× it
 *  (the pre-ADR-125 phone flew at 1.27× and nobody called it a jump). */
export const PHONE_PASS_SPEED = (() => {
  const L = PHONE_CORRIDOR_LEGS;
  const paint = parkOf("intelligence") - DOLLY_HOLD_END;
  const svh = CORRIDOR_SVH - L.thesisHold - L.thesisRise - 3 * L.dwell - L.tail;
  if (svh <= 0) throw new Error("phoneCorridorClock: the schedule leaves no room for the passes");
  return paint / svh;
})();

/** The schedule, cumulative. Built once; every reader walks this. */
export const PHONE_CORRIDOR_SCHEDULE: readonly PhoneCorridorLeg[] = (() => {
  const L = PHONE_CORRIDOR_LEGS;
  const nav = parkOf("navigate");
  const enc = parkOf("diagnostic");
  const bld = parkOf("intelligence");
  const legs: PhoneCorridorLeg[] = [];
  let at = 0;
  const push = (
    id: PhoneCorridorLeg["id"],
    len: number,
    from: number,
    to: number,
    ease: PhoneCorridorEase
  ) => {
    legs.push({ id, start: at, end: at + len, from, to, ease });
    at += len;
  };
  const pass = (from: number, to: number) => (to - from) / PHONE_PASS_SPEED;
  push("thesis-hold", L.thesisHold, 0, 0, "hold");
  push("thesis-rise", L.thesisRise, 0, DOLLY_HOLD_END, "linear");
  push("pass-navigate", pass(DOLLY_HOLD_END, nav), DOLLY_HOLD_END, nav, "cruise");
  push("navigate", L.dwell, nav, nav, "hold");
  push("pass-encode", pass(nav, enc), nav, enc, "cruise");
  push("encode", L.dwell, enc, enc, "hold");
  push("pass-build", pass(enc, bld), enc, bld, "cruise");
  push("build", L.dwell, bld, bld, "hold");
  const tail = CORRIDOR_SVH - at;
  if (Math.abs(tail - L.tail) > 1e-6) {
    throw new Error("phoneCorridorClock: the schedule does not close on the corridor");
  }
  push("tail", tail, bld, 1, "linear");
  return legs;
})();

/** Where the thesis dwell ends, as corridor progress — the value
 *  `sceneGeom.getThoughtformMobilePhase` fades the copy + diagram out
 *  toward. Was the literal `0.30`. */
export const MOBILE_THOUGHTFORM_END =
  PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === "thesis-rise")!.end / CORRIDOR_SVH;
/** Where that fade starts: the last `THESIS_EXIT_SVH` of the rise. */
export const MOBILE_THESIS_EXIT_START =
  (PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === "thesis-rise")!.end - THESIS_EXIT_SVH) /
  CORRIDOR_SVH;

// ── The clock ───────────────────────────────────────────────────────

/**
 * Corridor progress (0..1 across the corridor's span) → paintProgress on the
 * phone. Monotonic non-decreasing, continuous in value AND velocity at every
 * seam, `f(0) = 0`, `f(1) = 1`; held at each park across its dwell.
 */
export function phonePaintProgress(progress: number): number {
  const s = clamp01(progress) * CORRIDOR_SVH;
  for (const leg of PHONE_CORRIDOR_SCHEDULE) {
    if (s > leg.end) continue;
    if (leg.ease === "hold") return leg.from;
    const t = clamp01((s - leg.start) / (leg.end - leg.start));
    const k = leg.ease === "cruise" ? cruise(t) : t;
    return leg.from + (leg.to - leg.from) * k;
  }
  return 1;
}

// ── The seats ───────────────────────────────────────────────────────

export type PhoneCorridorSeat = {
  id: PhoneCorridorPhase;
  /** Fractions of the SCRUB (stage − cell): what an absolute child of the
   *  stage spends as `calc(f * (100% − 100svh))`. `top` is the dwell's first
   *  frame — the aligned position; `height` is the dwell, capped at
   *  `SEAT_BOX_MAX_SVH`. */
  top: number;
  height: number;
};

/** ⚠ A SEAT'S BOX MAY NEVER BE AS TALL AS THE SNAPPORT. A snap area taller
 *  than the scrollport is a COVERING area: every position where it covers the
 *  screen is a legitimate rest, and a rest just past it is pulled back to the
 *  area's END — measured on ADR-125's first cut, where a 120svh box pulled
 *  seven consecutive rests back onto a mid-flight frame at its foot. A seat
 *  is a POSITION (its top); the box only has to exist, so it is capped at
 *  half a screen. */
export const SEAT_BOX_MAX_SVH = 50;

const DWELLS: { phase: PhoneCorridorPhase; leg: PhoneCorridorLeg["id"] }[] = [
  { phase: "thesis", leg: "thesis-hold" },
  { phase: "navigate", leg: "navigate" },
  { phase: "encode", leg: "encode" },
  { phase: "build", leg: "build" },
];

function legById(id: PhoneCorridorLeg["id"]): PhoneCorridorLeg {
  const leg = PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === id);
  if (!leg) throw new Error(`phoneCorridorClock: no leg ${id}`);
  return leg;
}

/**
 * The four seats: each dwell's first frame (the aligned position), `normal`
 * proximity — never `always`. Between them the passes are travel: a rest
 * inside a seat's reach is pulled onto the composed frame, a rest further out
 * is a mid-flight frame the reader chose, and a nudge lands the beat.
 */
export function phoneCorridorSeats(): PhoneCorridorSeat[] {
  return DWELLS.map(({ phase, leg }) => {
    const dwell = legById(leg);
    return {
      id: phase,
      top: dwell.start / SCRUB_SVH,
      height: Math.min(dwell.end - dwell.start, SEAT_BOX_MAX_SVH) / SCRUB_SVH,
    };
  });
}

/** A beat's seat as a fraction of the mount's runway (offsetHeight − vh),
 *  for the rail manifest's click-to-navigate on the phone. */
export function phoneSeatFraction(phase: PhoneCorridorPhase): number {
  const dwell = DWELLS.find((p) => p.phase === phase);
  if (!dwell) throw new Error(`phoneCorridorClock: no dwell for ${phase}`);
  return legById(dwell.leg).start / SCRUB_SVH;
}

/** The corridor's span in CSS px for a layout viewport height — what the
 *  tests convert the schedule with. */
export function phoneCorridorPx(viewportHeightPx: number): number {
  return (CORRIDOR_SVH / 100) * viewportHeightPx;
}

/** A leg's scroll range in px from the pin, for a viewport height. */
export function phoneLegPx(
  id: PhoneCorridorLeg["id"],
  viewportHeightPx: number
): { start: number; end: number } {
  const leg = legById(id);
  const k = viewportHeightPx / 100;
  return { start: leg.start * k, end: leg.end * k };
}
