/* The act's clocks, as arithmetic. PURE.

   The three sections keep their own scroll readers and their own timings;
   nothing here changes one. These are the same formulas, restated from the
   scroll position alone, so the swarm can be asked where it is at any `y`
   without a browser:

     q1   the hop into the steps: 0 with the steps' runway at the screen's
          bottom edge, 1 when it pins (`stack/travel.ts`, `arrivalQ`)
     p1   the steps' pin (`EmbedStack`)
     q2   the hop into the network, the same form one section on
     p2   the network's pin (`NetworkOrg`) */

import {
  AIR,
  ARRIVE_LIT,
  GAP,
  INK_TOP,
  read,
  TRAVEL_END,
} from "@/components/xb-proposal/embed/EmbedStack";
import { ease } from "@/components/xb-proposal/iso";
import { moment, T } from "@/components/xb-proposal/network/NetworkOrg";
import { TURNS } from "@/components/xb-proposal/network/orgLayout";
import { STACK } from "@/components/xb-proposal/stack/travel";

import { clamp01, seg } from "../../stack-forms/model";

/** The two runways, in document px. */
export interface Runways {
  /** Where the opening comes to rest and holds; absent, it does not hold. */
  top?: number;
  esTop: number;
  esH: number;
  xnTop: number;
  xnH: number;
}

export interface Clocks {
  q1: number;
  p1: number;
  q2: number;
  p2: number;
}

/** A clock within a pixel of scroll of either end is at that end. The
    runways are set in `svh`, so where one section hands over to the next is
    seldom a whole pixel, and a page can only be scrolled to one: without
    this a reader stopped on a rest would be a hair into the hop beside it. */
const settle = (t: number, px: number) => (t * px < 1 ? 0 : (1 - t) * px < 1 ? 1 : t);

export function clocksAt(y: number, vh: number, r: Runways): Clocks {
  const esRun = Math.max(1, r.esH - vh);
  const xnRun = Math.max(1, r.xnH - vh);
  return {
    q1: settle(clamp01(1 - (r.esTop - y) / vh), vh),
    p1: settle(clamp01((y - r.esTop) / esRun), esRun),
    q2: settle(clamp01(1 - (r.xnTop - y) / vh), vh),
    p2: settle(clamp01((y - r.xnTop) / xnRun), xnRun),
  };
}

/* -- the steps ---------------------------------------------------------------- */

/** The team plate's top-face middle in the steps' drawing: `EmbedStack`'s
    `FACE_MID`, which is the travel's reference point. */
const FACE_MID = STACK.ref[1];

export interface StepsReading {
  /** Screen px a drawing unit of the steps' 700-wide figure. */
  k: number;
  /** The gap between plates, in drawing units. */
  gap: number;
  /** The drawing's own lift on its stage, CSS px. */
  ty: number;
  step: 0 | 1 | 2;
  stacked: boolean;
  /** How lit each plate is, 0 dim to 1 lit, team first. */
  level: [number, number, number];
}

/** The steps' own reading for a stage of `w` by `h` CSS px (`EmbedStack`'s
    frame, to the letter), and how lit each plate is: the section switches a
    plate on a 420 ms fade; here the same change is a ramp of the scroll, so
    a still at any `p` is a state the reader can hold. */
export function stepsAt(p: number, w: number, h: number): StepsReading {
  const k = w / STACK.vbW;
  const room = h / (2 * k) - (FACE_MID - INK_TOP) - AIR;
  const open = Math.min(GAP.open, Math.max(GAP.min, room));
  const st = read(p, open);
  const centred = h * 0.5 - k * (FACE_MID + st.centre * st.gap);
  const ty = Math.max(centred, k * (AIR - INK_TOP));
  const close = ease(seg(p, TRAVEL_END, 1));
  /* the section's steps change where `centre` and `close` cross a half */
  const toEncode = seg(st.centre, 0.4, 0.6);
  const toBuild = seg(close, 0.4, 0.6);
  const whole = seg(close, 0.9, 0.98);
  return {
    k,
    gap: st.gap,
    ty,
    step: st.step,
    stacked: st.stacked,
    level: [
      Math.max(1 - toEncode, whole),
      Math.max(Math.min(toEncode, 1 - toBuild), whole),
      Math.max(toBuild, whole),
    ],
  };
}

/** On the way in the stack keeps the opening's light, every plate lit, and
    takes the steps' own over the last of the hop (`ARRIVE_LIT`). */
export const arriveLight = (q1: number) => 1 - seg(q1, ARRIVE_LIT, 1);

/* -- the network -------------------------------------------------------------- */

/** Where the second hop ends, on the network's pin: the line that writes the
    bars, and types the courses on them, has crossed the last column
    (`TURN.sweep`). Marketing's frame comes on from here (round 08). */
export const BARS_BY = 0.25;

/** The second hop's one clock: most of it while the network's runway rises
    through the screen, so every plate has left the stack well before the
    steps have scrolled away from under it; the rest over the start of the
    network's pin, where the bars are written. Past 0.7 it runs level with
    the scroll, so the line that writes them crosses at an even pace. */
export const hop2T = (c: Clocks) => 0.7 * c.q2 + 0.3 * seg(c.p2, 0.02, BARS_BY);

/** The owner, 2026-10-14: "When the full swipe is done and reveals the
    frame, the X-Bionic Marketing frame should be shown." The frame comes on
    the moment the line has written the bars, near at once, and its name is
    typed on its band just after (`NetworkOrg`'s `lettered`). */
export const LETTERED = {
  frame: [BARS_BY, BARS_BY + 0.015],
  name: [BARS_BY + 0.005, BARS_BY + 0.06],
} as const;

export { moment as networkAt };

/** Where a team's turn starts on the network's pin, by its seat. */
export const turnOf = (team: number) =>
  T.ribs + (TURNS as readonly number[]).indexOf(team) * T.step;
/** How long a team's turn lasts: its ribbon, then its node. */
export const TURN_LEN = T.draw + T.grow;

/* -- stops, for stills and for the play button ---------------------------------- */

export const STOPS = [
  "arrive",
  "opening",
  "hop1-20",
  "hop1-40",
  "hop1-60",
  "hop1-80",
  "navigate",
  "encode",
  "build",
  "stacked",
  "hop2-25",
  "hop2-50",
  "hop2-75",
  "typing",
  "bars",
  "module",
  "drawback",
  "org",
  "teams-1",
  "teams-3",
  "teams-5",
  "every-team",
] as const;
export type Stop = (typeof STOPS)[number];

/** The scroll position of a named stop, document px. */
export function stopY(name: Stop, vh: number, r: Runways): number {
  const hop1 = (q: number) => r.esTop - vh * (1 - q);
  const es = (p: number) => r.esTop + p * (r.esH - vh);
  const hop2 = (q: number) => r.xnTop - vh * (1 - q);
  const xn = (p: number) => r.xnTop + p * (r.xnH - vh);
  switch (name) {
    case "arrive":
      return r.top ?? hop1(0);
    case "opening":
      return hop1(0);
    case "hop1-20":
      return hop1(0.2);
    case "hop1-40":
      return hop1(0.4);
    case "hop1-60":
      return hop1(0.6);
    case "hop1-80":
      return hop1(0.8);
    case "navigate":
      return es(0);
    case "encode":
      return es(0.5);
    case "build":
      return es(0.8);
    case "stacked":
      return es(1);
    case "hop2-25":
      return hop2(0.45);
    case "hop2-50":
      return hop2(0.9);
    case "hop2-75":
      return xn(0.09);
    case "typing":
      return xn(0.16);
    case "bars":
      return xn(BARS_BY);
    case "module":
      return xn(0.36);
    case "drawback":
      return xn(0.5);
    case "org":
      return xn(0.605);
    case "teams-1":
      return xn(turnOf(TURNS[0]) + TURN_LEN * 0.55);
    case "teams-3":
      return xn(turnOf(TURNS[2]) + TURN_LEN * 0.55);
    case "teams-5":
      return xn(turnOf(TURNS[4]) + TURN_LEN * 0.55);
    case "every-team":
      return xn(1);
  }
}
