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
];
