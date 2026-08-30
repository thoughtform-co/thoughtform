import type { CardFaceVariant } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";

/**
 * The three routes under judgement (ADR-050 candidate).
 *
 * `face` feeds `ServicesCardRing`'s `faceVariant` prop, so v0 bakes the
 * shipped stack byte-identically — the reference has to be the real thing or
 * the comparison is worthless. `openPlate` gates the DOM spec plate.
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
    label: "V3 · Emblem",
    face: "emblem",
    openPlate: false,
    thesis:
      "The tight composition with a DRAWN per-service figure where the photograph was — keynote broadcasts, workshop is a working lattice, embedded interleaves two fields, guided build is a route with waypoints. Everything else is byte-identical to V1, so the comparison is one variable: does the centre of a services card carry the practitioner, or the work? Across ~40 cards in the Brand Codex reference set, not one carries the practitioner.",
    provenance: "card-reference-analysis.md · STACK archetype · cardEmblem.ts",
  },
  {
    id: "v4",
    label: "V4 · Halftone",
    face: "halftone",
    openPlate: false,
    thesis:
      "The photograph KEPT, but re-screened into square halftone cells after the tone pass — the move the reference set itself makes when a person stays in the frame (a runner dithered and perforated with the brandmark punched through). It answers the vanity question the other way: the subject is still you, but it reads as material the system processed rather than as a headshot dropped into a card.",
    provenance: "card-reference-analysis.md §The portrait question · STACK",
  },
  {
    id: "v5",
    label: "V5 · Inverted",
    face: "inverted",
    openPlate: false,
    thesis:
      "The INVERTED archetype: the figure fills the card and the name drops to the foot under the lede, so the eye enters through the image and lands on the words. The reference set uses this for the one thesis card in a set — it is the variation that proves the system, and a set of four all-inverted cards would have no system left to prove.",
    provenance: "card-reference-analysis.md §C · INVERTED",
  },
  {
    id: "v6",
    label: "V6 · Instrument",
    face: "instrument",
    openPlate: false,
    thesis:
      "The INSTRUMENT archetype: the field IS a readout. Runs / Group / Format / Language — the engagement's own record, drawn as a ruled spec sheet instead of hidden inside the drawer. This is the family every other Thoughtform instrument already belongs to (the casefile console, the intelligence map, the wireframes), and the services ring is the house's only surface that is NOT in it. No invented figures: every row is a ServiceSpec field the site already publishes.",
    provenance: "card-reference-analysis.md §E · INSTRUMENT",
  },
  {
    id: "v7",
    label: "V7 · Poster",
    face: "poster",
    openPlate: false,
    thesis:
      "The POSTER STACK, the purest form in the set (TALON, Atomic Tessellator): figure in the middle third, the service NAME bled large and unframed across the foot, no paragraph at all. Three registers and nothing else — the claim and the name sit at opposite ends with the field holding them apart. The most confident of the six, and the one that gives up the most information.",
    provenance: "card-reference-analysis.md §A · STACK / poster weighting",
  },
];
