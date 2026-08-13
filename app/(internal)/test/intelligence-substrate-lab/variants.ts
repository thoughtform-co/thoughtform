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

export type IslVariantId =
  | "shipped"
  | "strata"
  | "table"
  | "tree"
  | "seals"
  | "density"
  | "field"
  | "rack"
  | "gallery"
  | "registry"
  | "terminal"
  | "cards";

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
      "⚠ THE BASELINE IS NOW DIRECTION 11, PROMOTED (2026-08-13). This is no longer the pin grid — the cards shipped, so the baseline and `11 · Cards` draw the same composition from different sources: this one from the Loop case's own `skills` reservoir, that one from the lab fixture. Compare them for drift, not for direction. The pin grid it replaced (five patterns × eight departments, one mark per crossing) is in git history and in ADR-070 U15; ⚠ THE 5 × 8 CROSSING IS NOT DRAWN ANYWHERE ON THE SITE NOW, by owner ruling — `crossing()` still projects it and its arithmetic is still guarded.",
    provenance:
      "PdaSubstrate.ViewSubstrate, ADR-070 U16 — mounted ELASTIC, at whatever layout the current preset's field asks for, exactly as the landing does. It mounted at rest until the promotion, which at p1280 drew a 430-unit card into a 763-unit crop and left 182px of dead panel: a preview of a drawing the site never served.",
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
  {
    id: "rack",
    label: "7 · Skill rack",
    thesis:
      "Round three, and the reading the owner's brief actually asks for: the SUBSTRATE across the SKILLS. The pin grid's identity gutter is kept verbatim (name · gloss · CUT BY {ab}), the tap matrix is replaced by ONE PIP PER ENCODED SKILL on a shared pitch — Pattern's 14 span the rack, Stakeholder's 5 stop a third of the way across, the mass argument is the length of the row you can count. The tapping departments letter under each rack in their pin-grid column positions, the cutter's code in green, so the crossing stays answerable by looking.",
    provenance:
      "The plan's own copy — 'these 7 skills are all Voice; these 14 are all Pattern — and they span departments' — drawn as five racks on a shared scale. The recommended winner.",
  },
  {
    id: "gallery",
    label: "8 · Gallery",
    thesis:
      "The field card, made concrete. S4's five module-cards (already the same object as reading 02's configuration module), and one pip per encoded Skill down the window's left rail — so the card that ships with the pattern's PHYSICS also ships with the pattern's COUNT. Foot stays SKILLS / CUT BY. Trades the same thing S1/S2/S4 traded (the crossing) for what neither the pin grid nor the rack carry (each test drawn as its own physics).",
    provenance:
      "The owner's mockup, frame S4, with a pip ladder added down each window. An evaluation method is a test you can count AND a test you can picture: this card carries both.",
  },
  {
    id: "registry",
    label: "9 · Registry",
    thesis:
      "Round three — the SPECIFIC SKILL, made visible. Five printed columns side by side, one per pattern, each headed by name + count. Under each head the pattern's Skills print vertically: title on top (wrapped to two lines where needed), team code below. Reads like the back-matter index of a book: mass IS how far the column runs, grouping IS the layout, team IS the code line. The pattern's flagship encode prints in green — the shipped surface's `CUT BY` grammar carried down from the district level to the Skill level.",
    provenance:
      "The owner's brief, taken directly: 'the specific skill should be visible.' A sibling of the shipped pin grid — same 47 Skills, drawn as an index instead of a crossing. Draws from `sampleSkills.ts`, the lab-local mirror of `/claude-adoption` (loop_aether) with 14 teams and 47 encoded titles.",
  },
  {
    id: "terminal",
    label: "10 · Terminal",
    thesis:
      "The opposite pole from the registry: ONE printed roster of 47 Skills, sorted pattern → team → title, five thin section rules marking the boundaries. Each row has title · team · owner in cold mono, cutter lines carry a small green ● CUT tag. No chart, no colour, no shape — the type IS the reading. Coldest register on the surface, the honest test of whether type alone can carry the substrate claim.",
    provenance:
      "The compiled-index / system-dump register — Thoughtform's newspaper-of-record voice at its coldest. Same fixture as `registry`; the difference is entirely one of composition, not of content.",
  },
  {
    id: "cards",
    label: "11 · Cards",
    thesis:
      "EXTRACTION. Each encoded Skill is a PLATE — a 16-unit slab with a 3-unit accent at its left edge — and the plates stack from the header down; fourteen of those accents are a bus, five are a short one, so the card claims \"these all draw on one thing\" instead of listing words under a heading. The pattern's physics field fills whatever the stack leaves, BELOW it: the plates are what has been encoded, the field is the material they came out of, and a five-Skill card showing more raw field than a fourteen is the drawing making its point. The foot prints what the substrate MEANS in the record's own gloss; the count is a numeral beside the name.",
    provenance:
      'Round three, second pass. The owner on the first: the foot\'s `SKILLS 07 · CUT BY CRE` was "meaningless text", and the labels were "a boring ass text list". The foot became the sentence. The list was first redrawn as an explicit tapped bus — and at meet 0.646 the 1-unit spine alpha\'d away and left a dash and a dot per row, i.e. bullets. The accent bar carries the same reading at a weight the meet cannot erase. Labels are the fixture\'s `shortTitle` shorthand, capped at 14 characters; the flagship encode takes green.',
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
