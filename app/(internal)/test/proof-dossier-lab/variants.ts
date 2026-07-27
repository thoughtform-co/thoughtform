import type { DossierCascade } from "@/components/landing/home-v2/services/dossier/ProofDossier";

/**
 * The four cuts under judgement.
 *
 * Unlike the proof-highlight lab these are not four different designs —
 * the dossier is ONE design, and each variant isolates a single decision
 * the owner has to make about it. `thesis` = the question that cut asks;
 * `provenance` = the instrument grammar it leans on. Same 4-field contract
 * as the section-menu / anchor / card-face labs.
 */
export interface PdlVariant {
  id: "a" | "b" | "c" | "d";
  label: string;
  cascade: DossierCascade;
  density: "regular" | "dense";
  thesis: string;
  provenance: string;
}

export const PDL_VARIANTS: readonly PdlVariant[] = [
  {
    id: "a",
    label: "A · Cascade",
    cascade: "stack",
    density: "regular",
    thesis:
      "The two inactive phases peek as title bars only, offset up-right. Judge whether the stack reads as a filing system — three documents, one on top — or as clutter above the panel you are trying to read.",
    provenance: "CP2077 cascading document stack + the services-plate glass body",
  },
  {
    id: "b",
    label: "B · Peek",
    cascade: "peek",
    density: "regular",
    thesis:
      "The same stack with the clip released, so a band of each inactive panel's content shows behind. Judge whether real content peeking earns its noise, or whether the bars alone said enough.",
    provenance: "same stack, clip-path released 24px",
  },
  {
    id: "c",
    label: "C · Flat",
    cascade: "flat",
    density: "regular",
    thesis:
      "No stack at all — the soft keys alone swap one panel in place. Judge whether the cascade was carrying meaning or just height, which is the question that decides 760px laptops.",
    provenance: "Marconi soft-key row, nothing behind it",
  },
  {
    id: "d",
    label: "D · Dense",
    cascade: "stack",
    density: "dense",
    thesis:
      "The cascade with the air trimmed — smaller bars, tighter padding, shorter type. The escape hatch if A wins on composition but loses on the height budget.",
    provenance: "A, at the 72svh ceiling",
  },
];
