/**
 * The four connection grammars under judgement.
 *
 * This is ONE design — the field-log casefile — asked one question four
 * times: how much drawn connection does an unframed composition need before
 * it reads as a single instrument rather than four loose blocks? `a`–`c` are
 * three decreasing answers; `d` is the enclosed control, kept so the open
 * plane has something to beat.
 *
 * Same 4-field contract as the section-menu / anchor / card-face /
 * proof-dossier labs: `thesis` = what to look for, `provenance` = the
 * instrument grammar it leans on.
 */
export interface FllVariant {
  id: "a" | "b" | "c" | "d" | "e";
  label: string;
  thesis: string;
  provenance: string;
}

export const FLL_VARIANTS: readonly FllVariant[] = [
  {
    id: "a",
    label: "A · Docked marks",
    thesis:
      "Both section rules run the full band and terminate in gold junction diamonds sitting ON the site's rails, at the tick heights they were drawn to. Judge whether the casefile reads as bolted into the frame — or whether the diamonds are four decorations pretending to be structure.",
    provenance: "v13 R1 — junction diamonds on the rails, no connector lines",
  },
  {
    id: "b",
    label: "B · Rail waypoints",
    thesis:
      "The same composition with the junction pairing dropped: only compass diamonds on the rail guides mark those heights, and they belong to the rail rather than to the casefile. Quieter — judge whether the connection survives being implied.",
    provenance: "v13 R2 — bearing marks alone",
  },
  {
    id: "c",
    label: "C · Crosshairs only",
    thesis:
      "Every horizontal rule removed. Four corner crosshairs and the column split are all that hold the composition together. This is the purest read of 'individual frames, a bit connected' — judge whether the blocks still cohere or start to float.",
    provenance: "v12 W2 no-lines — corner registration marks alone",
  },
  {
    id: "d",
    label: "D · Notched shell",
    thesis:
      "The control. The whole casefile seated in one chamfered CRT plate — gold gradient edge, glass body, scanlines. This is the enclosed frame you said you did not want; it is here so the argument against it can be made from a screenshot rather than from memory.",
    provenance: "v12 W3 — the .svc-plate chamfer shell",
  },
  {
    id: "e",
    label: "E · Reticle marks",
    thesis:
      "The Arc's own registration grammar, borrowed whole: dotted gold crosses at the four corners of the casefile, and every rule redrawn as a dashed run instead of a solid hairline. On arrival the crosses ride out from the column split to the band edges, the way the corridor's caption reticle rides its aperture open. The connective tissue stops being lines and becomes texture — judge whether that reads as the same instrument as the corridor, or as noise at this scale.",
    provenance: "the corridor caption card's `.home-v2-reticle__cross` (home-v2.css)",
  },
];
