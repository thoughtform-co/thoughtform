/**
 * The phone stages' clock (ADR-160). PURE: no React, no DOM.
 *
 * Owner, 2026-10-21, on a phone: "make sure that the mobile version isn't
 * just a shitty version of our desktop page … retain our cool transitions
 * from the first sections". The swarm that plays the opening on desktop
 * mounts only at the frame tier, so on a phone each section plays the same
 * beats with its own drawing, pinned in a band and scrubbed by scroll: the
 * steps open and close their plates step by step, the network grows its
 * teams along the ribbon one by one.
 *
 * The grammar is the phone corridor's (ADR-125, `phoneCorridorClock.ts`):
 * a stage DWELLS on each composed frame for less than one snap radius, so a
 * rest inside it is pulled onto its seat, and PASSES between frames on the
 * corridor's cruise, longer than two radii, so a rest mid-pass is travel,
 * never pulled back. Lengths are svh of scroll from the moment the band pins.
 */

import { cruise } from "@/lib/home-v2/phoneCorridorClock";

/** Where a stage runs: a phone with the room for one, and motion allowed.
 *  Below 640px tall (an SE, a phone held landscape) and under reduced motion
 *  every section keeps its static phone layout. 640, not the era runway's
 *  681: a 390-wide iPhone with Safari's bars shows about 664. The sheets
 *  repeat this literal; `xb-phone-stages.test.ts` pins them equal. */
export const PHONE_STAGE_MEDIA =
  "(max-width: 960px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

/** One leg of a stage: a dwell holds the section's clock, a pass moves it. */
export interface StageLeg {
  id: string;
  /** svh of scroll. */
  len: number;
  /** The section's own clock at the leg's start and end. */
  from: number;
  to: number;
}

/** A dwell: ~200px at 844, under one snap radius (Blink pulls a rest within
 *  about a third of the snapport). The phone corridor's own dial. */
export const DWELL_SVH = 24;
/** A pass between two composed frames: over two snap radii. */
export const PASS_SVH = 80;

/** The steps: Navigate, Encode, Build, each a dwell; between them the
 *  desktop reader's two moves (the stack rises to the layer, then closes
 *  about it), each a pass. The clock is `EmbedStack`'s own `read(p)`, whose
 *  step changes fall at 0.25 and 0.75, mid-pass. */
export const STEPS_PHONE_LEGS: readonly StageLeg[] = [
  { id: "navigate", len: DWELL_SVH, from: 0, to: 0 },
  { id: "to-encode", len: PASS_SVH, from: 0, to: 0.5 },
  { id: "encode", len: DWELL_SVH, from: 0.5, to: 0.5 },
  { id: "to-build", len: PASS_SVH, from: 0.5, to: 1 },
  { id: "build", len: DWELL_SVH, from: 1, to: 1 },
];

/** The network: Marketing's module composed, then every team along the
 *  ribbon, then the network whole. The clock is the stage's own, 0 to 1,
 *  which `NetworkOrg` maps onto the desktop's ribbon acts (`T.ribs` to 1),
 *  so the order and pacing of the teams are the desktop's. */
export const NETWORK_PHONE_LEGS: readonly StageLeg[] = [
  { id: "marketing", len: DWELL_SVH, from: 0, to: 0 },
  { id: "every-team", len: 150, from: 0, to: 1 },
  { id: "network", len: DWELL_SVH, from: 1, to: 1 },
];

/** A stage's whole travel, svh. */
export const travelOf = (legs: readonly StageLeg[]) => legs.reduce((s, l) => s + l.len, 0);

/** The section's clock `s` svh after the band pinned: a dwell holds, a pass
 *  runs the corridor's cruise (still at both ends, one speed between). */
export function clockAt(legs: readonly StageLeg[], s: number): number {
  let at = 0;
  for (const leg of legs) {
    if (s < at + leg.len) {
      if (s <= at) return leg.from;
      const t = (s - at) / leg.len;
      return leg.from === leg.to ? leg.from : leg.from + (leg.to - leg.from) * cruise(t);
    }
    at += leg.len;
  }
  return legs.length ? legs[legs.length - 1].to : 0;
}

/** The snap seats: every dwell, from its start, svh after the band pinned. */
export function seatsOf(legs: readonly StageLeg[]): { id: string; at: number; len: number }[] {
  const seats: { id: string; at: number; len: number }[] = [];
  let at = 0;
  for (const leg of legs) {
    if (leg.from === leg.to) seats.push({ id: leg.id, at, len: leg.len });
    at += leg.len;
  }
  return seats;
}
