/**
 * continuumStageData — copy for the ADR-049 pinned #continuum rail stage
 * (the capable-desktop path).
 *
 * LOCKSTEP: these strings DUPLICATE the static `.continuum` / `.crail`
 * fallback markup in `public/prototypes/v7/landing-v7-motion.html` (the
 * #continuum station block) — the mobile / reduced-motion / WebGL-fallback
 * surface. Edit BOTH when the copy changes (the accepted dual-source
 * pattern: serviceData / aboutStageData, MAINTENANCE 2026-07-16).
 *
 * `{ em }` segments render as UPRIGHT GOLD (the site's no-italics rule).
 */

export type ContinuumSegment = string | { em: string };

export interface ContinuumStop {
  /** Position on the waist ring: left (Tool) · centre (AI lives here) ·
   *  right (Collaborator) — matching THUMB_TICK_FRACTIONS. */
  pos: "l" | "m" | "r";
  kicker: string;
  /** Mirrors the fallback's `.crail__k--mid` / `--end` colour variants. */
  kickerMod?: "mid" | "end";
  /** One entry per authored line (the fallback's `<br>` splits). */
  title: readonly string[];
  body: string;
}

export const CONTINUUM_STAGE = {
  /** The masthead — restyled to the Services masthead recipe
   *  (`.home-v2-station-header__title`): PP Neue Montreal, uppercase, the
   *  em line rendered gold at weight 500. The line break is authored.
   *  CONCISE by owner direction (2026-07-18): the long thesis statement
   *  ("AI isn't software to command…") was already made upstream AND
   *  restated by the lede — the masthead now poses the question the
   *  instrument answers (the middle stop replies "neither pure tool nor
   *  true collaborator"; the gold line hands to SEE THE PRACTICE). */
  titleLines: [
    { text: "Tool or collaborator?", em: false },
    { text: "Navigation is the skill.", em: true },
  ],
  lede: [
    "Software is commanded. Intelligence is navigated. AI sits on a continuum between ",
    { em: "tool" },
    " and ",
    { em: "collaborator" },
    ", and the ratio shifts with every prompt.",
  ] as readonly ContinuumSegment[],
  /** The tool ↔ collaborator spectrum stops. `pos` maps each onto the
   *  waist ring: left (Tool) · centre (AI lives here) · right
   *  (Collaborator) — matching THUMB_TICK_FRACTIONS. `kicker` reuses the
   *  `.crail__k` type; `kickerMod` mirrors the fallback's --mid / --end
   *  colour variants. */
  stops: [
    {
      pos: "l",
      kicker: "Tool",
      title: ["Executes commands"],
      body: "You provide the thinking. The output is predictable, because you already knew what you wanted.",
    },
    {
      pos: "m",
      kicker: "AI lives here",
      kickerMod: "mid",
      title: ["Neither pure tool", "nor true collaborator"],
      body: "Always both. Every prompt relocates the dot along the rail. Learning where to stand is the skill.",
    },
    {
      pos: "r",
      kicker: "Collaborator",
      kickerMod: "end",
      title: ["Interprets intent"],
      body: "You provide direction and judgment. The output surprises you — in useful ways, if you've learned to navigate.",
    },
  ] as readonly ContinuumStop[],
  /** The instrument readout under the rail. */
  readout: "Nav · Tool 0.00 — Collab 1.00",
  cta: { label: "See the practice", href: "#practice" },
} as const;
