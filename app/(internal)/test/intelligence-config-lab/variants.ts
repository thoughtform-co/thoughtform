import type {
  CaseMapChain,
  CaseMapDistrict,
  CaseMapShape,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

import type { PdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

/**
 * /test/intelligence-config-lab — the variant contract and the shared kit.
 *
 * Nine drawings of ONE work stream's intelligence configuration, judged side
 * by side in the real console chrome. `shipped` is ADR-070's board, mounted
 * from production; the other eight are QUALITY-OF-LIFE REFINEMENTS answering
 * the owner's brief (2026-08-11): the board reads cramped, the panels can be
 * smaller, the type must be bigger, WHO OWNS IT belongs to the centrepiece,
 * and the cable stays.
 *
 * ⚠ `seated` IS THE SECOND ROUND, not a peer of the first seven — it is
 * `tight` with the owner's notes ON `tight` applied (bigger card, the base
 * brought up, the dashed hairline replaced by structure). Judge it against
 * `tight`, not against the spread.
 *
 * ⚠ THE FOUR ARCHETYPES ARE RETIRED (die · chain · section · schematic).
 * They answered a different question — what SHAPE the drawing should be — and
 * the switchboard won it on 2026-08-09. ADR-070's own Left-open note said to
 * delete the losers rather than keep five; git history is the archive.
 *
 * ⚠ ALL SEVEN USE THE PRODUCTION CROP `36 48 828 912`, not the archetypes'
 * 1000×760. The comparison against `shipped` is only worth making if both are
 * drawn in the same box, and promotion is then a copy rather than a re-fit.
 * That also raises the floor: nothing here letters under 10 (at the binding
 * preset the meet is 0.540, so 7.5 would render 4.05px against a 4.3 gate).
 *
 * ⚠ THE LAB PAGE IS MECHANICALLY UNGUARDED. `cases-registry.test.ts` walks
 * `CASES` + `PROJECT_CASES` objects, never component code — so every string a
 * variant letters must come from the record or a derived count, and
 * `tests/lib/config-lab-fit.test.ts` re-checks the envelope over everything
 * `lettering()` declares. A lettered string that is not in `lettering()` is a
 * defect, not an economy.
 */

/* ── The variant registry (field-log-lab's 4-field contract) ───────────── */

export type IclVariantId =
  | "shipped"
  | "tight"
  | "fused"
  | "bands"
  | "rail"
  | "satellite"
  | "ledger"
  | "grid"
  | "seated";

export interface IclVariantDef {
  id: IclVariantId;
  label: string;
  thesis: string;
  provenance: string;
}

export const ICL_VARIANTS: readonly IclVariantDef[] = [
  {
    id: "shipped",
    label: "Shipped (the baseline)",
    thesis:
      "The board as it stands. Its answer cards are 158 units tall around an ink band of 51 — 68% dead space, six times over — while the value letters at 11.5 and the QUESTION letters at 14, larger than the answer it introduces. That is the cramping: small type in oversized boxes.",
    provenance:
      "PdaConfiguration.ViewConfiguration, mounted from production at its own crop. The lab's local copy is deleted: two drawings claiming to be the same one is how a lab goes stale.",
  },
  {
    id: "tight",
    label: "1 · Tight",
    thesis:
      "THE CONTROL. Identical seats, identical cables, identical width chain — only the cell height (158 → 94) and the type ladder move. The question drops to 11, the key to 10, the answer rises to 16. Answers the one question the others cannot: how much of this was never layout at all.",
    provenance:
      "CP2077's item tooltip runs a ~3× label:value ratio inside a tight panel. Hierarchy from size contrast, never from panel size.",
  },
  {
    id: "fused",
    label: "2 · Fused",
    thesis:
      "The seat is part of the machine it answers for. WHO OWNS IT becomes the head of the centrepiece — one stepped object, welded at a seam with contact ticks. The dashed authority line is DELETED: if the fusion reads, the line was never carrying the relation, the distance was.",
    provenance:
      "The owner's own note that WHO OWNS IT is integral to the centrepiece, taken literally. Socket-and-collar, not plate-and-wire.",
  },
  {
    id: "bands",
    label: "3 · Bands",
    thesis:
      "Stop fighting a portrait crop. Three full-width rows instead of two tall side nodes: the measure goes 212 → 336, so EVERY value in the record letters on one line at 18. The cable becomes a backplane down the gutter, tapping left and right into each band.",
    provenance:
      "A portrait crop wants rows. The band rules break where the bus passes — a rule that crosses a conductor draws a short.",
  },
  {
    id: "rail",
    label: "4 · Rail",
    thesis:
      "The plate carries the answer, the rail carries the question. Every key leaves its box and lines up on an outboard rail; what stays in the field is the ANSWER ALONE at fs 22, twice the shipped size. Six rows read as one list rather than six boxes.",
    provenance:
      "The city's law — nothing is lettered on a unit plate — plus the security-systems board, where labels hang outside the frame they belong to.",
  },
  {
    id: "satellite",
    label: "5 · Satellite",
    thesis:
      "Less housing, more conductor — ADR-070's founding thesis, re-applied. No boxes at all: a pod is a hairline, a key and an answer. Everything saved goes to a k 2.0 centrepiece and to cables with real length, doglegged through channels of their own.",
    provenance:
      "The pods gave up 28 units of width so the wiring could have 44. The variant's argument, paid for in its only currency.",
  },
  {
    id: "ledger",
    label: "6 · Ledger",
    thesis:
      "A configuration is a record — read it as one column. Centrepiece and seat hold a tall left column; all six answers become one right-hand list of hairline rows in the order the questions are asked. Nothing is arranged around anything.",
    provenance:
      "CP2077's target-scan panel: small dim keys, large bright values, one reading order. The spine is both the column rule and the cable.",
  },
  {
    id: "grid",
    label: "7 · Grid",
    thesis:
      "Hairlines instead of boxes. A strict 2 × 3 modular grid, one question per row, rules as the only chrome. The largest type-to-chrome ratio on the board — and the centre rule IS the cable, because the grid needs a divider and the card needs a run.",
    provenance:
      "Swiss modular IA in the house palette. Everything six rectangles and their padding were costing, spent on air and type.",
  },
  {
    id: "seated",
    label: "8 · Seated",
    thesis:
      "TIGHT, WITH THE AUTHORITY MADE STRUCTURAL — the owner's three notes on Tight, answered. The card becomes the largest object on the board (k 1.5 → 1.875, the width chain re-derived around it), WHERE IT RUNS comes up to meet it (264 → 130 units of drop, margins derived rather than eyeballed), and the dashed hairline is replaced by a splayed, chamfered PYLON the card sits on.",
    provenance:
      "ADR-070 U5's law kept, not broken: the seat may never be a data bundle. The distinction moves from WEIGHT to MATERIAL — authority is structure, data is conductors. Nothing flows down a pylon; it bears load, so it survives being drawn thick.",
  },
];

export const iclVariant = (id: string | null): IclVariantDef =>
  ICL_VARIANTS.find((v) => v.id === id) ?? ICL_VARIANTS[0];

/* ── The record slice every variant draws from ─────────────────────────── */

export interface IclRecord {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  chains: readonly CaseMapChain[];
  skills: readonly CaseSkillEntry[];
}

/** What every experimental variant receives: the projected drawing record
 *  (`toPdaWork` — the same projection the shipped reading letters), the raw
 *  record entry, and the full slice for substrate/chain derivations. */
export interface IclVariantProps {
  pda: PdaWork;
  work: CaseMapWork;
  record: IclRecord;
}

/* ── Fit arithmetic — the same model pdaGlyphs documents ───────────────────
   PT Mono's advance is ~0.6 em and TRACKING ADDS TO IT, so the factor is
   `0.6 + track`: 0.68 at the value tracking (.08em), 0.74 at the header
   tracking (.14em), 0.82 at the chrome tracking (.22em). `MONO_ADVANCE`
   (0.68) is this formula evaluated at .08em. */

export const adv = (fs: number, track: number) => fs * (0.6 + track);

/** One lettered string, declared so the fit test can measure the DRAWING'S
 *  OWN inputs rather than re-deriving its own. */
export interface LetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it, see `adv`. */
  track: number;
  /** The measure the text must fit, in authoring units. */
  measure: number;
}

export const specWidth = (s: LetterSpec) => s.text.length * adv(s.fs, s.track);

/* The archetypes' drawing helpers (hvh / vhv / bundleOffsets / hatchTicks) and
   their record derivations (shapeSkills / shapeSymbols / substrateCaption /
   chainNeighbours / neighbourLine / taps) left with the four archetypes on
   2026-08-11. The refinement set draws from `configKit.tsx` instead, which
   holds the one thing all seven share: the content, the type ladder and the
   ribbon wrapper. Git history is the archive. */
