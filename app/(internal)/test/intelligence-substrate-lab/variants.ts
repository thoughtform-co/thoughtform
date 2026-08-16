import type {
  PdaShape,
  PdaTeam,
  PdaWork,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseSkillEntry } from "@/lib/cases/types";

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
  | "cards"
  | "backplane"
  | "bus"
  | "cutaway"
  | "hand"
  | "piles"
  | "constellation"
  | "loom"
  | "leaves"
  | "roots"
  | "wheel"
  | "mosaic"
  | "gate"
  | "runs"
  | "grade"
  | "facet"
  | "tanks"
  | "pinbank"
  | "stack"
  | "flasks"
  | "cells"
  | "vats"
  | "inlay";

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

  /* ── Round four · the SELECTED-WORK-AWARE directions ─────────────────
     Rounds one to three all showed the ESTATE. The reader arrives on this
     reading having just opened one configuration, and reading 03 threw
     that context away — the same 47 plates whichever work was selected.
     The three directions below let the SELECTED work stay on screen, so
     the substrate reads as "what THIS configuration is drawing on" rather
     than as a static inventory beside the panel it was mounted on. */
  {
    id: "backplane",
    label: "12 · Backplane (recommended)",
    thesis:
      "The selected configuration's card stays at the R4 core, and the five substrate patterns sit around it as bays — the same housing grammar reading 02 used for WHAT RUNS IT / WHAT IT REACHES / WHERE IT RUNS, now doubled to hold all five patterns. A bay the record TAPS lights and connects with a ribbon; a bay it does not draws its skills but stays dim, so the reader sees what the layer holds AND what this configuration paid for. Skills letter 2–3 representative plates per bay with an honest `+N more`; no legend, no team names, no ordinals. Continuous with reading 02 — same card, same silhouette, same crop width, same ribbon grammar.",
    provenance:
      "The evolution the owner asked for: 'a look and feel and design architecture that builds on top of the previous one.' The R4 handoff's five docks already prove the geometry; this reading swaps their content but keeps their language.",
  },
  {
    id: "bus",
    label: "13 · Unfolded bus",
    thesis:
      "The selected card holds the top-left, and five horizontal rails unfold to its right — one per pattern, tapped rails in gold, untapped rails in dim amber. Every rail seats a pattern name at its head and a strip of representative Skill labels, ending on `+N more`. Ranks strongly for SCANABILITY (five parallel lines, one type, no crossings), weaker on geometric continuity with the R4 board because the reading rearranges the layout rather than replacing modules with bays.",
    provenance:
      "The rack direction (round three) rotated by 90° with a selected card as its source. Where the rack asked 'how much', this asks 'what does THIS one draw on.'",
  },
  {
    id: "cutaway",
    label: "14 · Section cutaway",
    thesis:
      "The board lifts a fraction: reading 02's card floats at the top of the crop, and BELOW GRADE the five substrate patterns sit as horizontal strata. Vertical risers drop from the card to the strata the configuration TAPS; the strata each hold their representative Skill plates embedded in the layer, so the drawing reads as extraction from a real depth. Strongest substrate metaphor and the most literal 'below the estate'; least compact of the three.",
    provenance:
      "The strata direction (round one) with a selected source overhead. The section grammar comes from the shipped brief copy: 'below grade runs the shared substrate — encoded once for one team, tapped by the next.'",
  },

  /* ── Round five · cluster physics (estate-scoped, no cartridge) ────────
     Round four anchored reading 03 on the cartridge frame and the owner's
     verdict was that the frame MEANS a workstream on this surface (it does
     — reading 02 draws the selected work in it). So round five drops the
     cartridge, drops the selected-work dependency, and returns to the
     estate-scoped reading. Every direction here derives from one shared
     principle drawn from the reference boards: a cluster is a PHYSICAL
     BODY OF LIKE OBJECTS whose depth IS the count — a fan, a pile, a
     braid — with ONE exemplar pulled out and lettered, the rest kept as
     silhouettes. All 47 skills are PRESENT as marks (one mark per skill,
     so 14 is visibly heavier than 5), only two letter per cluster. Labels
     stay horizontal (the isometric city died on skewed labels). */
  {
    id: "hand",
    label: "15 · Hand",
    thesis:
      "A pattern is a FANNED DECK of plates from a root pivot — one plate per encoded Skill, the flagship pulled forward and lettered, the rest as silhouettes at their fan angle. Five hands across the crop, and the pattern with fourteen visibly holds a wider fan than the pattern with five. The count numeral sits at the root; the gloss reads under it. Nothing is skewed except the plate silhouettes — labels stay horizontal on unrotated foreground elements.",
    provenance:
      "The Cyberpunk 2077 attribute-of-the-kitsch reference: interfaces of Kitsch draw an option as a fan of layered cards from a corner pivot. On this surface the pivot is the pattern and the fan is its encoded skills. The reference is the composition, not the palette.",
  },
  {
    id: "piles",
    label: "16 · Piles",
    thesis:
      "A pattern is a PILE OF SLABS. Five piles at the crop's floor, one slab per encoded Skill, each slab offset three units up-and-right of the one under it — so a fourteen-pile visibly towers over a five-pile and the mass is drawn rather than counted. The top slab of every pile letters the flagship encode. The count and gloss sit above each pile's peak.",
    provenance:
      "The Cyberpunk 2077 to-do-list quest-log reference: a queue is drawn as a stack of dogeared slabs whose depth reads at a glance. Straight-on 2D, never isometric — a 3D pile of forty-seven slabs would need per-slab labels to disambiguate their edges, and no legible label lands on a 3u-tall visible strip.",
  },
  {
    id: "constellation",
    label: "17 · Constellation",
    thesis:
      "Five pattern nodes ring a central DIAMOND hub that letters the estate's total (47). Each node letters its pattern name, its count and its flagship, and its hub-to-node wire trunk carries ONE conductor per encoded Skill — so a Pattern node arrives with fourteen wires braided and a Stakeholder node with five, and the mass is the ribbon's cross-section. The claim the drawing makes is that everything is one substrate, distributed.",
    provenance:
      "The Cyberpunk 2077 attribute-wheel reference: five attributes ring a central level readout, each connected by a braided trunk whose weight suggests investment. Adopted for role rather than for palette; the trunk-per-skill mapping is what makes the count structural.",
  },
  {
    id: "loom",
    label: "18 · Loom",
    thesis:
      "Five pattern chips on the LEFT, one wire PER SKILL leaving each — 7 · 12 · 9 · 5 · 14 wires, forty-seven in total — braid across the crop into one wide SHARED LAYER chip on the right. The flagship wire per pattern runs green. The convergence is the drawing making the round-three claim structural: encoded once for one team, tapped by the next. There is no legend; the reader counts wires to answer 'how much of Judgment'.",
    provenance:
      "The Cyberpunk 2077 citizens-database reference: two chips joined by a fan of ribbon wires whose count is the connection's weight. The right chip labels its role in one word — SUBSTRATE — because the whole panel already says 'the substrate', and the second signal on it would be noise.",
  },
  {
    id: "leaves",
    label: "19 · Leaves",
    thesis:
      "Each pattern is a SLAB SEEN FORE-EDGE-ON — its long edge a comb of N hairline leaves poking out. Five combs stacked vertically across the crop, one leaf per encoded Skill, the flagship leaf extended and lettered, the rest silhouettes. The count reads as a large numeral beside each pattern's name; the gloss sits under it. A five-leaf comb reads visibly thinner than a fourteen-leaf.",
    provenance:
      "The Cyberpunk 2077 item-cells edges reference: an item's edge carries a comb of thin hairlines that read as record depth without being lettered. Ports well to a pattern-of-skills — a leaf is one encoded Skill on the edge of the shared substrate slab.",
  },
  {
    id: "roots",
    label: "20 · Roots",
    thesis:
      "One horizontal GRADE BUS runs at the crop's floor — the shared substrate. Five trunks rise from it, one per pattern, each carrying N branch stubs (7 · 12 · 9 · 5 · 14) alternating left and right. The flagship branch is extended and lettered. Taller trunks are heavier patterns; the shared bus is the 'one layer' claim drawn explicitly. Nothing crosses anything, and there is no legend.",
    provenance:
      "The Cyberpunk 2077 industrial monitors reference: a distribution bus at the base with modules rising above it. Adopted for role — the bus is the substrate, the trunks are patterns, the branches are the encoded skills — because the trunks-from-a-shared-bus mapping is exactly what the reading is arguing about the layer.",
  },

  /* ── Round six · the definition leads ──────────────────────────────────
     Twenty directions and none landed, and the captures say why in two
     mechanical faults rather than in taste.

     ⚠ THE INCUMBENT IS A ROW OF FIVE CARDS, WHICH IS READING 01's GRID AT
     n=5. Production draws five `housing()` cards in a row; the owner's own
     constraint — it cannot look like the work tab — is broken by the
     PRIMITIVE, before a single string is placed. So round six bans the card
     row outright, and with it round five's fan, pile, comb and hub.

     ⚠ AND THE DEFINITION IS THE FOOTNOTE WHILE BEING THE ANSWER. Each card
     buries its gloss in a 78-unit foot at the type floor, under a large
     empty field, beneath fourteen Skill labels. The reference the owner
     brought — Aether's substrate donut — letters that same sentence at wedge
     scale, and that is the whole reason it reads. Same inverted ladder
     ADR-070 found when a question lettered larger than its answer.

     Round five went the other way: mass became the entire subject and the
     definitions dropped to a line or vanished, so `constellation` says LESS
     than the incumbent while using ~40 % of the panel.

     THE LAW: the definition leads, mass modifies it, the Skills are texture.
     Every direction fills the crop. Each letters its pattern's name, its
     count, its gloss, its `evalMethod` — the record's new field, and the
     first thing on this surface that answers the owner's own word for a
     substrate — and ONE exemplar, the flagship encode, in green ACCENT with
     the label left at full ink.

     ⚠ Three of the five encode mass CONTINUOUSLY (angle, area, depth), which
     round five's `markCount` guard cannot reach, so they export `mass()` and
     the fit test asserts proportionality instead. A direction guarded by
     neither is a direction whose magnitude nobody checked. */
  {
    id: "wheel",
    label: "21 · Wheel",
    thesis:
      "The reference, ported honestly. One ring, five wedges, angle proportional to the Skill count, and a rim of ticks — one per encoded Skill, the flagship extended and green. The centre letters the estate's total. The five label blocks sit in the corners the circle leaves, each carrying name, count, the gloss at reading size and the eval method as a gold key. The claim is PROPORTION OF ONE WHOLE: not five things collected, one thing divided five ways.",
    provenance:
      "The owner's own reference — Aether's `/claude-adoption` substrate donut, where 47 Skills cluster into five wedges each carrying a name, a count and a one-line definition. Adapted rather than copied: the rim chips that name all 47 cannot letter at this panel's meet and carry the owner field the map's envelope refuses, so the roster becomes tick mass and the definition takes its place.",
  },
  {
    id: "mosaic",
    label: "22 · Mosaic",
    thesis:
      "The crop tiled into five blocks with NO gutters, area proportional to the Skill count, one TR+BL cut on the outer boundary alone — so it reads as one machined plate divided rather than five objects collected. That distinction is the whole direction: a gutter makes cards, and cards are the work tab. Each block letters its name and count large, its gloss under them, its eval method as a gold key, over its own physics field at low alpha. 100 % panel efficiency, which at 603 × 493 is the scarcest thing there is.",
    provenance:
      "The Cyberpunk 2077 industrial-monitor boards: one panel divided into labelled fields of unequal size, every field flush against its neighbour, the division itself carrying the hierarchy. Adopted for the division, not the density.",
  },
  {
    id: "gate",
    label: "23 · Gate",
    thesis:
      "A substrate is the TEST work is checked against, so the drawing is five gates. Each row: a run of marks entering from the left — one per encoded Skill, the flagship first and green — meeting a chamfered THRESHOLD plate whose face letters the eval method, with the gloss to its right as the criterion the plate enforces. The name and count ride the plate's head. Furthest of the five from readings 01 and 02, and the only one whose composition is an argument about evaluation rather than about quantity.",
    provenance:
      "The Cyberpunk 2077 sequence-procedure panel: a column of processes each terminating in a state box, read as pass/hold at a glance. Adopted for role — the gate is the eval method, the marks arriving are what has been encoded against it.",
  },
  {
    id: "runs",
    label: "24 · Runs",
    thesis:
      "Five full-width rows, ranked by mass. Name at the left, then the count, then a RUN OF CELLS across the width — one cell per encoded Skill, so fourteen against five is a length you can also count — and the gloss lettered in the space the run leaves, with the eval method as a gold key beneath the name. The calmest and most instrument-like of the five, and the one most likely to survive the binding viewport intact: nothing here is diagonal, radial or nested.",
    provenance:
      "The Cyberpunk 2077 resources monitor: parallel gauges on one baseline, each labelled at its head, magnitude read by length against a shared scale. The house's own ladder, one reading over.",
  },
  {
    id: "grade",
    label: "25 · Grade",
    thesis:
      "The only direction that draws the relation UPWARD to the other two readings without borrowing their silhouette. One rule across the upper third; above it a faint row of unlettered ticks — the work, present but not the subject; below it five strata whose DEPTH is the Skill count, each filled with its own physics field and lettering its name and gloss horizontally inside the band, the eval method at the right margin. The claim is that this is the ground the work stands on.",
    provenance:
      "Round one's `strata` re-cut: the seam idea survived, the eight department buses that cluttered it did not, and the gloss is promoted from caption to subject. The lineage is named rather than hidden — if this wins it wins as strata's second draft.",
  },

  /* ── Round six · b — the wheel, cut straight ────────────────────────────
     The owner's read on 21: the claim is right, the circle is not (this brand
     draws no round shapes but its brand marks), and the labels belong INSIDE
     the wedges. ⚠ THE ENCODING HAD TO INVERT TO DELIVER THAT, and the
     inversion is the design rather than a compromise — see the variant's own
     file. Judge `facet` against `wheel`, not against the other four. */
  {
    id: "facet",
    label: "26 · Facet",
    thesis:
      "The wheel with its circle cut away and its labels brought inside. The count is SPLIT between how wide a wedge is and how far it reaches — the angle goes as the square root of the Skill count and the radius is solved from it — so each wedge's area is exactly its count while angles run 50° to 84° and radii 312 to 440. Not one curve is drawn: two rays, a chord at the hub and a chord at the rim per wedge, with a chamfered plate at the centre carrying the estate's total. Each wedge letters its own name, definition, eval method and exemplar inside itself, horizontally.",
    provenance:
      "Direction 21 under the owner's three notes (2026-08-15): labels inside, less round, a bit asymmetrical. ⚠ Angle-as-count and inside labels are arithmetically incompatible here — a 36° wedge cannot hold `STAKEHOLDER` at any radius this crop affords. Putting the whole count in the RADIUS instead fixed the labels and produced an asterisk: five spikes round a hub, reading as separate points rather than one thing divided. Half the count in each term is what closes them back into a single figure, and area — what a reader actually reads in a pie — stays exact either way.",
  },

  /* ── Round seven · the instrument register ─────────────────────────────
     ⚠ THE FAULT WAS NEVER THE GEOMETRY, IT WAS THE REGISTER (owner,
     2026-08-15: the substrate _"just feels completely out of place"_ beside
     the two settled readings).

     Readings 01 and 02 are drawn as PARTS OF A DEVICE — 01 is a field of
     cartridges, seated and latched and state-marked; 02 is a circuit board,
     opaque modules on a PCB bed with hatched ribbon lanes. Both are panels
     from the Cyberpunk industrial-monitor references, which is the hand this
     whole console is drawn in. It is a PDA.

     And every substrate direction through round six — pie, mosaic, bar rows,
     strata, crossing table, containment, constellation, straight-edged donut
     — is a CHART pasted into that machine. Chamfer a pie chart and it is
     still a pie chart. That mismatch is what twenty-six drawings kept failing
     to fix by adjusting proportion, because proportion was never the problem.

     ⚠ AND THE RECORD'S OWN WORDS SAY WHAT THE SUBSTRATE IS IN A MACHINE:
     teams DRAW ON it, work is a DRAW, the shapes are a RESERVOIR, the layer
     is BELOW GRADE, the reading is EXTRACTION. Supply-side language start to
     finish, while the drawings kept reaching for statistics.

     THE LAW: draw the substrate as the machine's SUPPLY SIDE — the part of
     the device the cartridges draw from. Squint test: does it look like a
     panel off the same instrument as 01 and 02? Round six's CONTENT law is
     untouched (the definition leads, the eval method is lettered, the
     flagship takes a green mark and keeps its ink).

     ⚠ ONE NUMBER SHAPES ALL THREE LAYOUTS. `KNOWN-FAILURE FIXTURES` measures
     195.4u at fs 12 / .14 and a five-across column of this crop is ~176 —
     **the eval method does not fit a five-across layout at any size this
     surface allows.** That is what drove round six into corner blocks and
     full-width rows, and it is why two of these three call out to a ledger
     and the third abandons columns entirely. */
  {
    id: "tanks",
    label: "27 · Tanks",
    thesis:
      "Five vessels standing on one manifold. Fill height is the encoded Skill count, the fill is the pattern's own physics field closed by a bright meniscus, and the wall carries a graduation of one mark per Skill — at a pitch shared by all five, which is what makes them one instrument rather than five differently-scaled pictures. The vessels letter nothing; the reading is called out to a ledger on leaders, which is the reference's own grammar. The claim is the record's own verb: this is what the work draws on.",
    provenance:
      "The Cyberpunk 2077 resources monitor — four vessels with hatched fill levels and a labelled call-out beneath — read literally instead of as a mood. The manifold and the risers are reading 02's `ribbonPaths`, so the supply is made of the same wiring as the configuration board.",
  },
  {
    id: "pinbank",
    label: "28 · Pinbank",
    thesis:
      "ONE housing, five banks, forty-seven pins. The substrate is a single component whose pins leave its edge in five groups, each group a shape of the one layer — and a ledger reads them off. ⚠ The only direction in seven rounds where the substrate is one OBJECT: every predecessor drew five things and then had to argue they were one. It letters no count anywhere, because the pins are the number.",
    provenance:
      "The Cyberpunk 2077 relay-driver / TLM-decoder panel: a vertical chip, numbered pin banks leaving one edge, a side table reading them off. The closest thing in the entire reference set to what this record actually is — and it sat unused for six rounds while the drawings reached for pies.",
  },
  {
    id: "stack",
    label: "29 · Stack",
    thesis:
      "The substrate in SECTION: one housing, five layers, thickness proportional to the encoded Skills, heaviest at the floor because a stack reads as bedrock. Each layer letters its own name, definition, eval method and exemplar at FULL PANEL WIDTH — which is what lets this one carry no ledger at all. The graduation runs down the inner edge at the stack's own shared unit, so the marks are the thickness, counted.",
    provenance:
      "⚠ REPLACES THE DIAMOND LATTICE, on arithmetic. The bio-monitor reference wanted five diamonds sized by area with the name INSIDE and the detail on an attached tab. The diamonds fit — `STAKEHOLDER` inside the smallest needs a half-diagonal of 87.8, putting a touching row of the three heaviest at 801 against 880 available. The TAB cannot be placed: a lattice means edge-touching, and two touching diamonds leave a clear gap of ZERO at their waist. Tabs in a column make it a third marks-plus-ledger; tabs in a block at the foot make it a card grid. The direction could not deliver the one thing that distinguished it.",
  },

  /* ── Round eight · the vessel rig ──────────────────────────────────────
     The owner kept `tanks` and gave it two notes (2026-08-15):

     1. **Make it as visual as the FIELD CARDS.** Direction 6's argument was
        that each pattern renders its OWN TEST — sine baselines for Voice, a
        threshold for Judgment, a lattice of present and absent cases for
        Validation, reader nodes for Stakeholder, a repeating tiling for
        Pattern — and `tanks` had shrunk that to a faint texture inside a small
        fill box. Here the field IS the contents, clipped to the vessel's own
        outline at the field cards' own weight.

     2. ⚠ **THE SILHOUETTE MAY NOT BE THE WORK'S.** _"Skills are built on
        workflows, but they're different — that's why I can't have them be the
        same type of shape, like the square ones."_ A chamfered rectangle on
        this surface IS A CARTRIDGE: reading 01 is twenty of them, reading 02
        seats one at its centre. A substrate drawn in that outline claims to be
        a workstream — the same class of error that got round four rejected. A
        silhouette here is a proper noun.

     ⚠ **AND THE VESSEL IS FULL, ITS HEIGHT THE COUNT.** `tanks` drew five
     equal vessels at different fill levels, which reads as CAPACITY — a
     quantity this record does not publish (U21 named it and let it stand as a
     shared gauge). Sizing the vessel itself removes the implication AND gives
     the field the whole body to paint in, which is what note 1 asked for.

     ⚠ **ONE RIG, THREE OUTLINES** (`vesselRig.tsx`), the discipline `FormCard`
     used for density against field: composition, ledger, manifold, graduation
     and contents are identical across 30–32 and only `vesselPath` changes, so
     the comparison is about the shape and nothing else. */
  {
    id: "flasks",
    label: "30 · Flasks",
    thesis:
      "The vessel rig at a NECKED silhouette — a narrow mouth, a sloped shoulder, a wide body. The reading is what a reservoir looks like when you have to get material into it, and the neck gives each store a top that is unmistakably not a card's. Height is the encoded Skill count, the store is full, and the contents are the pattern's own test clipped to the flask.",
    provenance:
      "The CP2077 resources monitor's vessels, taken as an object rather than as a bar. The neck and shoulder are what carry it furthest from the cartridge outline that means WORKSTREAM everywhere else on this console.",
  },
  {
    id: "cells",
    label: "31 · Cells",
    thesis:
      "The vessel rig at a HEXAGONAL silhouette — widest at the waist, flat top and floor so it stands on the manifold. Nothing else on this surface is drawn this way, which is the whole point of the option: a cell reads as a stored charge rather than as a container, and the substrate is closer to charge than to liquid.",
    provenance:
      "The fuel-cell / battery-cell convention in the industrial-monitor register. Chosen as the outline that shares the least with a chamfered rectangle while still standing flat.",
  },
  {
    id: "vats",
    label: "32 · Vats",
    thesis:
      "The vessel rig at a TAPERED silhouette — a straight-sided vat, narrower at the mouth than at the floor. The quietest of the three: it changes the least about the composition and relies on the taper alone to say this is a store and not a card. If the neck and the hexagon both read as costume, this is the one that is left.",
    provenance:
      "The plainest reading of a supply vessel, kept in the set deliberately as the control — the same role `tight` played in the configuration lab's round two.",
  },

  /* ── Round nine · the owner's pick, given its material ──────────────────
     ⚠ THE OWNER CHOSE 22 `mosaic` AND NAMED WHAT IT LACKS (2026-08-16): the
     composition is right, it wants the texture of 8 `gallery` or 11 `cards`.
     So this is not a new direction — it is mosaic with the two things those
     card drawings have and it does not.

     What was actually wrong with mosaic is measurable rather than a matter of
     taste: its field is inset 16 units from the region and painted at α .34 in
     whatever space the type leaves, so on the three smallest regions the
     material is a smudge under a paragraph. The region reads as a tinted box.
     `gallery` renders the same five physics at `k` 1 / `p` 14 filling a card
     window and they read as five distinguishable MATERIALS, which is the whole
     reason a physics field is on this reading at all.

     ⚠ AND THE FIX IS ZONING, NOT ALPHA. Turning mosaic's field up behind its
     own paragraph is the "dust on the type" failure `cards` already paid for.
     The zones are derived from the type instead — an opaque head sized to one
     line, an opaque foot sized to its own gloss wrap, and every unit between
     them given to the material, bleeding wall to wall so two neighbouring
     fields meet ON the hairline.

     ⚠ IT ALSO ENCODES THE COUNT TWICE, ON PURPOSE, WHICH MOSAIC REFUSED TO DO.
     Mosaic's file argues that area carries the claim alone. Area is a gestalt:
     it shows that Pattern dwarfs Stakeholder and cannot show 14 against 5. The
     graduation at each region's base is the tally that makes the gestalt
     checkable, at one shared pitch so five runs stay comparable. That also
     puts the drawing back inside `markCount`'s reach, which mosaic is
     deliberately outside of. */
  {
    id: "inlay",
    label: "33 · Inlay",
    thesis:
      "Mosaic's plate, with the material actually in it and the copy cut to the bone. The same derived partition — area is the Skill count, no gutters, one outer cut — but each region is now a title with ONE PARAGRAPH under it explaining what that substrate means, over the pattern's own physics filling the rest of the region wall to wall at the field cards' density. The gloss fragment, the eval method and the exemplar's name are gone; the exemplar survives as the one green tick in the graduation at the base of each material, which runs one tick per encoded Skill at a shared pitch across all five, so the area you see is also a number you can count.",
    provenance:
      "22 · Mosaic under two owner notes (2026-08-16): give it the texture of 8 · Gallery or 11 · Cards, then make the copy SUPER SIMPLE — title up, one concise paragraph beneath. The partition is IMPORTED from mosaic rather than re-typed, so the two cannot drift into publishing different areas for one record; gallery contributes the field density, cards the rule that the field sits beside the type and never behind it. ⚠ The paragraphs are LAB COPY: the record's `gloss` is a fragment sized for a 148-unit module, not a sentence, so promotion means a field on `CaseMapShape` exactly as `evalMethod` was.",
  },
];

export const islVariant = (id: string | null): IslVariantDef =>
  ISL_VARIANTS.find((v) => v.id === id) ?? ISL_VARIANTS[0];

/** What every variant receives — the same projection `PdaConsole` hands
 *  production's reading 03. Skills are the full reservoir; `selectedWork`
 *  is the record the reader arrived from (rounds 1–3 ignore both; round-four
 *  directions letter them as the drawing's centre of gravity). Both are
 *  optional so a fixture-only test can build an IslRecord without them. */
export interface IslRecord {
  teams: readonly PdaTeam[];
  shapes: readonly PdaShape[];
  skills?: readonly CaseSkillEntry[];
  selectedWork?: PdaWork;
}

export interface IslVariantProps {
  record: IslRecord;
}
