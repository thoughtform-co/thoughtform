import type {
  CardFaceVariant,
  CardTitleStyle,
} from "@/components/landing/home-v2/services/hologram/ServicesCardRing";

/**
 * The directions under judgement.
 *
 * A card is THREE components (owner, 2026-08-30): a title, a paragraph, and a
 * visualization. `face` feeds `ServicesCardRing`'s `faceVariant` prop, so v0
 * bakes the shipped stack byte-identically — the reference has to be the real
 * thing or the comparison is worthless. `openPlate` gates the DOM spec plate.
 *
 * ⚠ EVERY ROW BELOW USES A DIFFERENT VISUALIZATION LANGUAGE. The first pass
 * shipped one dot-lattice under six names with the title moved twice, and the
 * owner called it lazy — correctly: those were re-anchorings of one design, not
 * six designs. The rule for adding a row is that it must differ from every
 * other in WHAT IS DRAWN, not only in where the words sit.
 *
 * Each language reads a specific card on the Brand Codex reference board, named
 * in its `provenance`.
 */
export interface FaceVariant {
  id: string;
  label: string;
  face: CardFaceVariant;
  openPlate: boolean;
  thesis: string;
  provenance: string;
  /**
   * The treatment this row PINS, if it pins one (`FaceComposition.pin`).
   *
   * ⚠ Declared here as well so the console can say so. The chips stay live and
   * keep driving every other row, so a console that went on reading "Title ·
   * STAMP" over a card that is ignoring the chips would be lying about the one
   * row it matters most on.
   */
  pinnedTitle?: CardTitleStyle;
}

export const FACE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "v0",
    label: "V0 · Shipped",
    face: "full",
    openPlate: false,
    thesis:
      "The current bake: chip, includes row, title, lede and CTA over the photo. Five elements, two of them headline weight — the read the owner called overwhelming.",
    provenance: "ADR-029 §4 · reference only",
  },
  {
    id: "v1",
    label: "V1 · Tight face",
    face: "tight",
    openPlate: false,
    thesis:
      "Chip + title + lede + a subtle OPEN chit. The dense meta row and the full-width CTA slab are gone; the paragraph stays, but the title now leads it instead of competing at near-equal size.",
    provenance: "ADR-050 candidate · rest state",
  },
  {
    id: "v2",
    label: "V2 · Tight + spec",
    face: "tight",
    openPlate: true,
    thesis:
      "The tight face, plus the plate that grows out of the card's own rect: 01 / WHAT (lede + breakdown), 02 / HOW (duration, participants, format, language, what they keep). Click the front card.",
    provenance: "ADR-050 candidate · full beat",
  },
  {
    id: "v3",
    label: "V3 · Halftone",
    face: "halftone",
    openPlate: false,
    thesis:
      "The photograph KEPT, re-screened into square halftone cells after the tone pass. It answers the portrait question the other way: still you, but read as material the system processed rather than a headshot dropped into a card. Title top-left, paragraph at the foot — the shipped anchors, so the only change is the treatment.",
    provenance: "The Marketing Memory Co. — the dithered runner",
  },
  {
    id: "v4",
    label: "V4 · Constellation",
    face: "constellation",
    openPlate: false,
    thesis:
      "A GRAPH — and FOUR graphs. The node positions are IDENTICAL on all four cards, because they stand for the same estate of work; what changes is the structure drawn over it, which is what a service does. Keynote is a RADIANT (one source reaches a room that is not wired to itself yet). Workshop is a ROUTE (one workflow walked end to end, both ends marked). Embedded is a MESH (a body that holds itself up, marks seated inside it). Advisory is a SURVEY (five regions, a dashed gold traverse across their marks, and nodes joined to nothing — the person-led work). Title centred at the head, paragraph centred at the foot.",
    provenance: "Indent — 'Your intelligent co-worker' · four figures, one vocabulary",
  },
  {
    id: "v5",
    label: "V5 · Dendrite",
    face: "dendrite",
    openPlate: false,
    thesis:
      "GROWTH: a recursive branching figure built by a rule rather than placed — six primaries from the centre, each forking into finer generations, a junction mark at every branch point and the signal carried at the tips. Title centred at the head, paragraph centred at the foot. The figure is different for every service because the rule runs on its own seed.",
    provenance: "'We're manufacturing biology' — the red dendrite",
  },
  {
    id: "v6",
    label: "V6 · Meridian",
    face: "meridian",
    openPlate: false,
    thesis:
      "A BODY in fine section: twenty-six longitude arcs sweeping pole to pole, crowding at the silhouette exactly as they do on a globe, with one brighter waist ring. The one language here built from curves — and deliberately, because it is the site's OWN armillary vocabulary rather than a borrowed one. Title centred, paragraph centred at the foot.",
    provenance: "'The brain is an unexplored canvas' — the orange sphere",
  },
  {
    id: "v7",
    label: "V7 · Nebula",
    face: "nebula",
    openPlate: false,
    thesis:
      "DENSITY as the subject. No outline anywhere: a lobe emerges only because the marks are denser inside it, and falls off past the rim. The title sits LOW and large over the field with NO paragraph at all — the card carries one claim and a picture, which is the most confident arrangement on the board and the one that gives up the most information.",
    provenance: "'This isn't space, it's your brain'",
  },
  {
    /* ⚠ THIS ROW GAVE UP THE `v8` SLOT (owner, 2026-08-30: "build V8 based on
       the Meridian"). Panel keeps its name and loses its number — a survey
       ordinal marks a position in a survey, and once the survey has a winner it
       is a label pretending to be an order. `?v=panel` reads better anyway. */
    id: "panel",
    label: "Panel",
    face: "panel",
    openPlate: false,
    thesis:
      "NO imagery whatsoever — hairlines divide the field into asymmetric panels and exactly ONE cell is filled, which is the accent's entire budget on the card. The most restrained language on the board and the closest to what this house already draws elsewhere (the intelligence map's divided plate). Title top-left, paragraph at the foot.",
    provenance: "Adaptive — 'Automatically take action across every inbox'",
  },
  {
    id: "v9",
    label: "V9 · Glyph",
    face: "glyph",
    openPlate: false,
    thesis:
      "The ENCODED: a bilaterally symmetric block mark on a coarse lattice — symmetry is what separates a glyph from noise — with a dither spray eroding its edge into the field it was read from. The drawing takes the upper band and the title and paragraph stack together, centred, at the foot.",
    provenance: "The Marketing Memory Co. — the blue block glyph",
  },
];

/**
 * The TITLE treatments — a second, independent axis.
 *
 * ⚠ Worth knowing before judging these: ALMOST NO CARD ON THE REFERENCE BOARD
 * FRAMES ITS TITLE. TALON, Droidrun, Thereby, Indent, Adaptive and both brain
 * cards set theirs as plain type — the title reads as a title because of SIZE
 * and POSITION, not because it is in a box. The frame is a Thoughtform
 * invention (owner, 2026-08-29), which is exactly why it is worth seeing
 * against the alternatives rather than assumed.
 */
export const TITLE_STYLES = ["framed", "chip", "bare", "display", "band", "stamp"] as const;

export const TITLE_NOTE: Record<string, string> = {
  framed:
    "The shipped treatment — a hairline Tensor Gold frame with the leading diamond, 40px. Reads as a labelled key on a device.",
  chip: "The ADR-029 original — a SOLID Tensor Gold stamp with the ink knocked out of it, 34px. The loudest of the six and the only one that spends the accent as a fill rather than a line; ink on gold measures ~8.2:1.",
  bare: "No box, no mark, same 40px. What the reference board does by default: the title is a title because of where it sits, not because it is enclosed.",
  display:
    "No box, 62px. Size alone carries the hierarchy — TALON's move, and the one that makes the card read as a poster rather than a component.",
  band: "44px over a full-width gold rule. The Heading Indicator grammar applied to the title: an active state is a directional edge, never a fill.",
  stamp:
    "36px under a hairline, wide-tracked — the '// LABEL' bearing convention with its ordinal dropped (no ordinals survive on this surface).",
};

/**
 * The HOUSE INSTRUMENTS — appended 2026-08-30 on the owner's brief to "tap into
 * our particle system, our glyphs, whatever, our diagrams".
 *
 * All three take MERIDIAN's approved arrangement (title centred at the head,
 * paragraph centred at the foot) and differ only in the drawing, so choosing
 * between them is a choice about the visual and nothing else.
 */
export const HOUSE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "h1",
    label: "H1 · Sigil",
    face: "sigil",
    openPlate: false,
    thesis:
      "The BRANDMARK ITSELF as a stratified point cloud — not a picture of the mark, the mark: sampleShape hit-tests the real BRANDMARK_FULL_PATHS with the same sampler the corridor's particle painter runs, so this cloud and the landing's brandmark are one artifact at two densities. Each service takes a different density tier off ADR-011's own ladder, so the mark resolves for one and disperses for another. The shape never changes, because it is the brandmark.",
    provenance: "lib/brandmark/sampleShape.ts · ADR-011 density tiers",
  },
  {
    id: "h2",
    label: "H2 · Armillary",
    face: "armillary",
    openPlate: false,
    thesis:
      "The celestial-connector vocabulary composed into one instrument: the five-radius ring ladder with its per-ring dashes, a 36-tick graduated rim, two tilted orbital paths carrying diamond nodes, and the reticle at the centre on its own opaque disc so the orbits pass behind the mark. This is the diagram language the site already speaks between sections, at card scale.",
    provenance: "CelestialConnector/shapes — Rings · BearingTicks · OrbitalNodes · Reticle",
  },
  {
    id: "h3",
    label: "H3 · Crystal",
    face: "crystal",
    openPlate: false,
    thesis:
      "The faceted skill symbol: an outer N-gon, a rotated inner N-gon at half a step, and a facet line from every outer vertex to its two nearest inner ones. The most minimal drawing the house owns — its own primitive calls it 'sharp geometry, diamonds not circles, zero border-radius'. The per-service variable is the FACET COUNT (4 · 5 · 6 · 8), so each card is a different SOLID rather than a different noise.",
    provenance: "CelestialConnector/shapes/CrystalFacet.tsx",
  },
];

/**
 * THE PROPOSAL — the one row that is answering rather than asking.
 *
 * Every row above is a reference read off the board, crossed against six
 * settings of the name and judged side by side. This one is the composition the
 * owner chose, finished: the constellation drawing on the Meridian arrangement,
 * with the two open questions closed.
 *
 * ⚠ IT PINS ITS TITLE TREATMENT, so the treatment chips do not reach it. That
 * is the difference between a proposal and a survey row, and it is deliberate
 * that pressing DISPLAY / FRAMED / STAMP visibly changes twelve cards and not
 * this one.
 *
 * ⚠ AND IT REUSES A LANGUAGE, which the rule above forbids for a survey row and
 * requires here. "Every row is a different drawing" is what stops an exploration
 * from being one design with the text moved; a proposal is the opposite job — it
 * takes the drawing that WON and composes it properly. If this row invented a
 * thirteenth figure it would be a thirteenth question.
 */
export const CANDIDATE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "v8",
    label: "V8 · Service card",
    face: "card",
    openPlate: false,
    pinnedTitle: "display",
    thesis:
      "THE PROPOSAL. The constellation drawing on the Meridian arrangement — title centred at the head, paragraph centred at the foot — with both open questions closed. The title treatment is PINNED to display (a card that changes when you press a chip has not been decided). The drawing's band is SOLVED rather than picked: centred in the space the type leaves at its worst case across all four services, 100 units of clearance at each end, so no card is composed at another card's expense. And the title's datum is measured off the expand chit — a centred title cannot share the chit's centre line the way a top-left one does, so the answer is the opposite of alignment: clear it far enough to read as its own band. The chit itself does not move; the type does.",
    provenance: "Meridian arrangement · constellation drawing · owner 2026-08-30",
  },
];
