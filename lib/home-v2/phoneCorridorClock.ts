/**
 * phoneCorridorClock — the phone's paint clock, and the seats that ride it
 * (ADR-125).
 *
 * On the phone every beat of the Arc was composed at exactly ONE scroll
 * position: the camera dolly is one smoothstep from `DOLLY_HOLD_END` to 1, the
 * DOM title/caption scale is `referenceDistance / distance`, and at the
 * Navigate park the camera moves ~40 world units per unit of paint — so the
 * frame the owner photographed existed for ±14px of scroll at 390×844. Nothing
 * on the page could land on it, and a reader who stopped "a bit too far" saw
 * the elements too small or half out of view.
 *
 * This module owns the phone's SCHEDULE as svh of scroll from the pin and
 * derives everything else from it:
 *
 *   - `phonePaintProgress(p)` — the corridor's normalised progress (raw scrub
 *     progress ÷ `EPILOGUE_START`, what `useDepthScroll` already computes)
 *     mapped onto `paintProgress`, with a PLATEAU at each park (the paint is
 *     held, so the frame is composed for a whole hold) and a smoothstep across
 *     each pass (zero paint velocity at both plateau edges — easy in, easy
 *     out; a slow drag never "clicks" off a beat).
 *   - `phoneCorridorSeats()` — the snap targets, as fractions of the SCRUB:
 *     every plateau's first frame (`always` — one flick steps one beat, up and
 *     down) and its last frame (`normal`, ADR-123's `.vw-phone-snap` idiom, so
 *     a rest in a pass is pulled back onto the picture it just left or forward
 *     onto the next).
 *   - `MOBILE_THOUGHTFORM_END` — the thesis dwell's end, DERIVED (it was a
 *     literal 0.30 in `sceneGeom`), and the exit fade's start beside it.
 *
 * The park values are taken BY REFERENCE from `corridorMap` so a plateau is
 * byte-identical to the desktop's park by construction, never by a copied
 * literal. `STAGE_SVH` is the one mirrored literal — the phone stage's
 * `height: 820svh` in home-v2.css — and `tests/lib/phone-corridor-clock.test.ts`
 * pins the two against each other, together with the pre-chunk height
 * reservation on `.home-corridor-host`.
 *
 * ⚠ THREE-FREE AND DOM-FREE: `lib/rail-manifest/clickToNavigate.ts` reads
 * the seat fractions and sits in the landing's static graph
 * (`landing-import-doctrine`). Imports are `corridorMap` and nothing else.
 *
 * ⚠ THE TAIL IS NOT OPTIONAL. The epilogue's camera pose starts from paint 1
 * (`CAMERA_END`), so a clock that ended on the Build park would pop the camera
 * on the epilogue's first frame. The tail is what the schedule leaves after
 * the last hold; the test asserts it is at least a quarter screen.
 */

import { BEAT_PARK_CENTRES, DOLLY_HOLD_END, clamp01, smoothstep } from "@/lib/home-v2/corridorMap";

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

// ── The schedule (svh of scroll from the pin; the owner's numbers) ──

/** Owner, 2026-09-25: each beat holds 80svh; the thesis rest is 100svh
 *  (was 163); one flick steps one beat. The passes are what is left of
 *  the flight between them, and the tail is what the corridor has left
 *  after the last hold. */
export const PHONE_CORRIDOR_LEGS = {
  /** The thesis rest frame, held at paint 0 — the frame under the hero's
   *  curtain, and the seat the first flick lands on. */
  thesisHold: 40,
  /** Paint 0 → `DOLLY_HOLD_END`: the mark's rise to centre, and the copy +
   *  diagram's exit fade over its last `THESIS_EXIT_SVH`. */
  thesisRise: 60,
  /** The flight into Navigate. */
  passNavigate: 60,
  /** Every beat's hold — the one dial. */
  hold: 80,
  /** Navigate → Encode. */
  passEncode: 50,
  /** Encode → Build. */
  passBuild: 50,
} as const;

/** The thesis copy + diagram fade out over the LAST part of the rise, so
 *  the composition leaves the frame as the flight begins. ~276px at 844,
 *  the fade's own length before ADR-125 (0.06 of a 4595px corridor). */
export const THESIS_EXIT_SVH = 32;

export type PhoneCorridorPhase = "thesis" | "navigate" | "encode" | "build";

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
  ease: "hold" | "linear" | "smooth";
};

function parkOf(beat: "navigate" | "diagnostic" | "intelligence"): number {
  const v = BEAT_PARK_CENTRES[beat];
  if (v === undefined) throw new Error(`phoneCorridorClock: no park for ${beat}`);
  return v;
}

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
    ease: PhoneCorridorLeg["ease"]
  ) => {
    legs.push({ id, start: at, end: at + len, from, to, ease });
    at += len;
  };
  push("thesis-hold", L.thesisHold, 0, 0, "hold");
  push("thesis-rise", L.thesisRise, 0, DOLLY_HOLD_END, "linear");
  push("pass-navigate", L.passNavigate, DOLLY_HOLD_END, nav, "smooth");
  push("navigate", L.hold, nav, nav, "hold");
  push("pass-encode", L.passEncode, nav, enc, "smooth");
  push("encode", L.hold, enc, enc, "hold");
  push("pass-build", L.passBuild, enc, bld, "smooth");
  push("build", L.hold, bld, bld, "hold");
  const tail = CORRIDOR_SVH - at;
  if (tail <= 0) throw new Error("phoneCorridorClock: the schedule overruns the corridor");
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
 * phone. Monotonic non-decreasing, continuous at every seam, `f(0) = 0`,
 * `f(1) = 1`; held at each park across its whole hold.
 */
export function phonePaintProgress(progress: number): number {
  const s = clamp01(progress) * CORRIDOR_SVH;
  for (const leg of PHONE_CORRIDOR_SCHEDULE) {
    if (s > leg.end) continue;
    if (leg.ease === "hold") return leg.from;
    const t = clamp01((s - leg.start) / (leg.end - leg.start));
    const k = leg.ease === "smooth" ? smoothstep(0, 1, t) : t;
    return leg.from + (leg.to - leg.from) * k;
  }
  return 1;
}

// ── The seats ───────────────────────────────────────────────────────

export type PhoneCorridorSeat = {
  id:
    | "thesis"
    | "thesis-out"
    | "navigate"
    | "navigate-out"
    | "encode"
    | "encode-out"
    | "build"
    | "build-out";
  /** Fractions of the SCRUB (stage − cell): what an absolute child of the
   *  stage spends as `calc(f * (100% − 100svh))`. `span` is the stretch the
   *  seat NAMES — its plateau, or the pass after it up to the next plateau;
   *  `height` is its BOX, the span capped at `SEAT_BOX_MAX_SVH`. */
  top: number;
  height: number;
  span: number;
  /** `always` on a plateau's first frame — one flick steps one beat. */
  stop: "always" | "normal";
};

/** ⚠ A SEAT'S BOX MAY NEVER BE AS TALL AS THE SNAPPORT. A snap area taller
 *  than the scrollport is a COVERING area: every position where it covers the
 *  screen is a legitimate rest, and a rest just past it is pulled back to the
 *  area's END — measured on the first cut, where the 120svh `thesis-out` box
 *  (the rise plus the pass into Navigate) pulled seven consecutive rests back
 *  onto a mid-flight frame at its foot. A seat is a POSITION (its top); the
 *  box only has to exist, so it is capped at half a screen and the stretch a
 *  seat names lives in `span`, which is what the guards classify against. */
export const SEAT_BOX_MAX_SVH = 50;

const PLATEAUS: { phase: PhoneCorridorPhase; leg: PhoneCorridorLeg["id"] }[] = [
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
 * The eight seats, tiling the corridor's span: each plateau (its first frame
 * is the aligned position, `always`) and the stretch after it up to the next
 * plateau (its first frame is the plateau's LAST composed frame, `normal`).
 */
export function phoneCorridorSeats(): PhoneCorridorSeat[] {
  const out: PhoneCorridorSeat[] = [];
  for (let i = 0; i < PLATEAUS.length; i++) {
    const { phase, leg } = PLATEAUS[i];
    const hold = legById(leg);
    const next = i + 1 < PLATEAUS.length ? legById(PLATEAUS[i + 1].leg) : null;
    const outEnd = next ? next.start : CORRIDOR_SVH;
    const holdSpan = hold.end - hold.start;
    const outSpan = outEnd - hold.end;
    out.push({
      id: phase,
      top: hold.start / SCRUB_SVH,
      height: Math.min(holdSpan, SEAT_BOX_MAX_SVH) / SCRUB_SVH,
      span: holdSpan / SCRUB_SVH,
      stop: "always",
    });
    out.push({
      id: `${phase}-out`,
      top: hold.end / SCRUB_SVH,
      height: Math.min(outSpan, SEAT_BOX_MAX_SVH) / SCRUB_SVH,
      span: outSpan / SCRUB_SVH,
      stop: "normal",
    });
  }
  return out;
}

/** A beat's seat as a fraction of the mount's runway (offsetHeight − vh),
 *  for the rail manifest's click-to-navigate on the phone. */
export function phoneSeatFraction(phase: PhoneCorridorPhase): number {
  const plateau = PLATEAUS.find((p) => p.phase === phase);
  if (!plateau) throw new Error(`phoneCorridorClock: no plateau for ${phase}`);
  return legById(plateau.leg).start / SCRUB_SVH;
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
