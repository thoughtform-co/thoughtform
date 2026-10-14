/* /test/capability-own: what the four variants of "AI capability your teams
   own." share. PURE: no React, no DOM.

   The owner, 2026-10-14: "I think we got covered where we plug into the
   organization. What isn't really visually clear yet is how we make the
   team self-sufficient … that adoption-to-automation flywheel and embedding
   ourselves in the team. How do we do that?"

   The opening and the steps below it drew the same three things (your team,
   the layer, your agents). The steps keep that. Each variant here draws the
   other thing: the engagement over time, who holds the work, and Thoughtform
   leaving. The shape is the proposal's own (`x-bionic-proposal.ts`, "The
   four weeks", "The fee"): five days on site, then about three a week
   remote, about fourteen in the month, then the team on its own. It is also
   the one Rob Weston wrote back with (2026-10-13): "in person, with the
   team … we then co-work solutions … team members take the lead, supported
   by Thoughtform remotely … at the end of the project your team will be
   self-sufficient." */

export type Pt = readonly [number, number];

/** Every variant draws in a 1200 × 460 frame, the opening's own (`PlugFlow`). */
export const W = 1200;
export const H = 460;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** The four workstreams, in the opening's order (`PlugFlow`'s `TEAMS`) and
    with the vision's own lines (`x-bionic-proposal.ts`, `WORKSTREAMS`). */
export const STREAMS = [
  { id: "strategy", name: "Creative strategy", line: "Briefs with an audience and variants" },
  { id: "production", name: "Creative production", line: "Imagery, motion and copy, at volume" },
  { id: "review", name: "Creative review", line: "Checked against the real product first" },
  { id: "ops", name: "Creative ops", line: "Every ad briefed, named and filed" },
] as const;
export type StreamId = (typeof STREAMS)[number]["id"];

/** The month, as the proposal states it, and what comes after. `days` is
    Thoughtform's days a week; `owned` how many workstreams have an owner
    who runs them by the end of the stretch ("Done when", the four weeks:
    weeks two and three "each priority has an owner", week four "each skill
    has an owner who can change it"). */
export const PHASES = [
  {
    id: "w1",
    when: "Week 1",
    where: "On site",
    who: "Thoughtform inside the team",
    days: 5,
    owned: 0,
  },
  {
    id: "w2",
    when: "Week 2",
    where: "Remote",
    who: "One owner at a time",
    days: 3,
    owned: 1,
  },
  {
    id: "w3",
    when: "Week 3",
    where: "Remote",
    who: "One owner at a time",
    days: 3,
    owned: 2,
  },
  {
    id: "w4",
    when: "Week 4",
    where: "Remote",
    who: "Your team leads",
    days: 3,
    owned: 4,
  },
  {
    id: "after",
    when: "After",
    where: "",
    who: "On its own",
    days: 0,
    owned: 4,
  },
] as const;

/** Thoughtform's days in the month: the proposal's "about 14". */
export const MONTH_DAYS = PHASES.reduce((n, p) => n + p.days, 0);

/** A runway's clock with a hold at either end: the figure stands still for
    the first and last stretch of its scroll, so it is read whole at rest. */
export const held = (p: number, lead = 0.06, tail = 0.08) => seg(p, lead, 1 - tail);

/* -- straight traces ----------------------------------------------------------- */

/** A polyline as an SVG path. */
export const pathOf = (pts: readonly Pt[]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/** Every run of a trace is level, plumb or at 45 degrees (the house law,
    owner 2026-10-12: "everything that connects goes straight"). */
export function isStraight(pts: readonly Pt[]): boolean {
  for (let i = 1; i < pts.length; i++) {
    const dx = Math.abs(pts[i][0] - pts[i - 1][0]);
    const dy = Math.abs(pts[i][1] - pts[i - 1][1]);
    if (dx > 1e-6 && dy > 1e-6 && Math.abs(dx - dy) > 1e-6) return false;
  }
  return true;
}

/** Where a trace drawn left to right has got by `x`: the last point it
    reaches with its x at most `x`, a level or slanted run cut at `x`. */
export function headAt(pts: readonly Pt[], x: number): Pt {
  let at: Pt = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x1 <= x) {
      at = pts[i];
      continue;
    }
    if (x0 <= x && x1 > x) {
      const t = (x - x0) / (x1 - x0);
      at = [x, y0 + (y1 - y0) * t];
    }
    break;
  }
  return at;
}
