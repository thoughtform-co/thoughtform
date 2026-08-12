import type {
  PdaShape,
  PdaTeam,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

/**
 * /test/intelligence-substrate-lab — the variant contract for READING 03.
 *
 * Reading 02 is settled (ADR-070 U11–U14). This route asks the same question
 * one reading over: what should the SUBSTRATE look like, now that the
 * configuration has its own vocabulary?
 *
 * ⚠ THE COMPLAINT IS THAT A PATTERN IS DRAWN AS A MODULE. Production's
 * reading 03 letters its five shapes with `Module` — the same notched-plate
 * glyph as the department `Plate` above it and the same family as reading
 * 02's cards. On this surface that silhouette means A THING THAT RUNS, and a
 * pattern is not one. Same shape reads as same kind.
 *
 * ⚠ AND NOTHING ABOUT THE HIERARCHY IS STRUCTURAL. All five shapes are the
 * same 148×50 box while they hold 5 → 14 Skills and are drawn on by 3 → 8
 * departments. The magnitude exists only as a 9px text line, so the drawing
 * says "five equal things" where the record says one of them is nearly three
 * times the others and universal. The thirty crossing beziers between the two
 * rows are the rest of it: a reader has to TRACE A CURVE to answer "who draws
 * on Judgment?", which is the failure that retired the isometric city.
 *
 * The hierarchy on record is **Skill → pattern → reuse**, and two of those
 * three are currently text. Every variant here makes at least one of them
 * structural.
 *
 * ⚠ THE LAB IS MECHANICALLY UNGUARDED, exactly as the config lab is:
 * `cases-registry.test.ts` walks `CASES` objects, never component code. So
 * every variant declares everything it letters through a pure `lettering()`,
 * and `tests/lib/substrate-lab-fit.test.ts` walks those declarations for fit,
 * for the word cap, for the type floor and for the envelope.
 */

/* ── The variant registry (the field-log-lab 4-field contract) ──────────── */

export type IslVariantId = "shipped" | "strata" | "table" | "tree" | "seals" | "density" | "field";

export interface IslVariantDef {
  id: IslVariantId;
  label: string;
  thesis: string;
  provenance: string;
}

export const ISL_VARIANTS: readonly IslVariantDef[] = [
  {
    id: "shipped",
    label: "Shipped (the baseline)",
    thesis:
      "The crossing as it stands: eight department plates over five shape modules, joined by thirty bezier runs. Every shape is the same box whatever it holds, so magnitude lives in a 9px line — and the relation can only be read by tracing a curve.",
    provenance:
      "PdaViews.ViewSubstrate, mounted from production at its own crop. The lab keeps no copy: two drawings claiming to be the same one is how a lab goes stale.",
  },
  {
    id: "strata",
    label: "1 · Strata",
    thesis:
      "A pattern is a SEAM, not a card. Five full-width bands stacked below a grade line, each one as thick as the Skills it holds — so Pattern is visibly the deep one and Stakeholder the thin one. The departments run as eight vertical buses straight down through the stack, and every tap is a cell where a bus crosses a seam. No line crosses another.",
    provenance:
      "The brief's own copy, taken literally: 'Below grade runs the shared substrate — encoded once for one team, tapped by the next.' A section drawing, not a network.",
  },
  {
    id: "table",
    label: "2 · Crossing table",
    thesis:
      "Stop drawing the relation and TABULATE it. Five rows, eight columns, a filled cell where a department draws on a pattern and a cut cell where it paid to encode one. Zero lines. The Skills count becomes a bar in the row header, so magnitude is still structural, and every relation is answerable by looking rather than tracing.",
    provenance:
      "The board archetype's own finding — the isometric's cost was label-on-label and line-on-line, and a table has neither. It scales if the estate grows a department.",
  },
  {
    id: "tree",
    label: "3 · Containment",
    thesis:
      "One substrate, five patterns inside it, and each pattern as tall as the Skills it holds — a core sample of one pip per Skill down its left edge, so the height is the count rather than a proportion of it. The departments that draw on a pattern are listed inside it. Nothing crosses anything, and nothing is drawn that says nothing.",
    provenance:
      "Round two. The branches went because every node hung off the same root — five lines saying the same thing five times, where nesting says it with no ink. The bodies went from empty hatch to their own Skills, which is what makes the height honest.",
  },
  {
    id: "seals",
    label: "4 · Seals",
    thesis:
      "A pattern is a SIGIL, and what is inside the seal is the test it applies — a register of baselines for Voice, a threshold with a pass rate for Judgment, a lattice of present and absent cases for Validation. Five diamonds, each carrying its own field. It is the one direction that draws what a pattern IS rather than who touches it.",
    provenance:
      "The owner's `Substrate Archetypes` mockup, frame S1, with its own particle generators ported. ⚠ It does NOT draw the crossing — only the department that cut each pattern — which is a real cost against the shipped pin grid.",
  },
  {
    id: "density",
    label: "5 · Density cards",
    thesis:
      "Fill IS the mass. Five cards hatched at a pitch derived from their Skills, so Pattern's fourteen pack the window and Stakeholder's five leave it open — magnitude read as ink rather than as a number beside a name. The jailbreak-card read.",
    provenance:
      "The owner's mockup, frame S2. ⚠ The five hand-tuned pitches are all within 5 % of `78 / skills`, so the drawing derives it: a hand-tuned density stops being true the moment the record moves.",
  },
  {
    id: "field",
    label: "6 · Field cards",
    thesis:
      "The same card as 5, with the hatch replaced by the pattern's own particle field. Density says HOW MUCH and this says WHAT KIND. They share one component, so the comparison is about what a card should carry and nothing else.",
    provenance:
      "The owner's mockup, frame S4. Neither card direction draws the crossing; both trade the relation for character or for mass.",
  },
];

export const islVariant = (id: string | null): IslVariantDef =>
  ISL_VARIANTS.find((v) => v.id === id) ?? ISL_VARIANTS[0];

/** What every variant receives — the same projection `PdaConsole` hands
 *  production's reading 03. */
export interface IslRecord {
  teams: readonly PdaTeam[];
  shapes: readonly PdaShape[];
}

export interface IslVariantProps {
  record: IslRecord;
}
