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
  /** Zero-padded pole bearing ("01" / "02") prefixed to the cap's telemetry
   *  line (ADR-049 U9, the `tools-rail-register__index` grammar). STAGE-ONLY
   *  instrument chrome — deliberately NOT in the static `.crail` fallback,
   *  the same live-chrome divergence class as the readout's live values. */
  bearing?: string;
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
      bearing: "01",
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
      bearing: "02",
    },
  ] as readonly ContinuumStop[],
  /** The instrument readout under the rail — LIVE since ADR-049 U9. The
   *  corridor projector writes the two value spans every frame with
   *  complementary weights of the slider head's sweep (they always sum to
   *  1.00 — "the ratio shifts with every prompt", per the lede), so the
   *  readout proves the instrument is real instead of printing a frozen
   *  pair. `rest` is the initial/SSR text: the head parked at the centre
   *  seat. The static `.crail` fallback keeps its own hardcoded string.
   *
   *  LOCKSTEP with the assembly type-on in continuum-stage.css: the
   *  `steps()` glyph counts there mirror these rendered string lengths
   *  ("Nav · Tool 0.50 — Collab 0.50" = 29). Update both when copy
   *  changes — a stale count types at the wrong cadence. */
  readout: { prefix: "Nav", toolLabel: "Tool", collabLabel: "Collab", rest: "0.50" },
  cta: { label: "See the practice", href: "#practice" },
  /**
   * M2 "survey plate" chrome — parity with the Services masthead
   * (`ServicesMasthead` / ADR-044, 2026-07-21). The stage's two-column head
   * reads as two surveyed panels of the same terminal instrument as
   * services, each carrying a PT-Mono designation and a coordinate stamp;
   * the lede also carries the one gold state chip. Purely presentational —
   * the coord strings reuse the same handoff datum services renders, not
   * live geometry.
   */
  survey: {
    titleDesig: "CTM / TITLE · 01",
    briefDesig: "CTM / LEDE · 02",
    state: "Open",
    titleCoord: "0344 / 0260",
    briefCoord: "1588 / 0260",
  },
} as const;
