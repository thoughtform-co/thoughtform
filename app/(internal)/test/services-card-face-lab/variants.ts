import type { CardFaceVariant } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";

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
      "A GRAPH: points distributed on a sphere, projected flat, near neighbours joined by straight chords, depth carried by fade alone. Title and paragraph STACK at the head and the drawing takes the lower two-thirds — the arrangement Indent uses. Reads as a network with structure, which is the closest a drawing gets to saying 'connected intelligence' without a metaphor.",
    provenance: "Indent — 'Your intelligent co-worker'",
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
    id: "v8",
    label: "V8 · Panel",
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
