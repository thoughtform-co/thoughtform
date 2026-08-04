/**
 * variants — the lab's VARIANT REGISTRY.
 *
 * The Intelligence Map went through five design rounds and two of them were
 * rejected outright. Deleting the rejects deleted the ARGUMENT, so this lab now
 * keeps every round reachable at `?v=<id>` and prints what each one was and how
 * it was judged. Three of the entries are the OWNER'S OWN HTML prototypes,
 * embedded byte-exact; two of the rejected rounds survive only as screenshots,
 * so they are contact sheets rather than instruments.
 *
 * ── KINDS ─────────────────────────────────────────────────────────────────
 *   `casefile`  the variant is a live instrument and is judged INSIDE the real
 *               proof-casefile chrome (that is the whole point of this lab —
 *               the panel geometry snaps to the HUD rail's tick ladder).
 *   `archive`   an owner-authored standalone page. It gets the FULL panel area
 *               and renders in an iframe so it looks exactly like his file.
 *   `stills`    a dead round. A dark contact sheet of the shoot that killed it.
 */

export type VariantKind = "casefile" | "archive" | "stills";

export interface Variant {
  /** The `?v=` value. */
  id: string;
  /** The strip's chip label. Two or three glyphs, PT Mono 9px. */
  chip: string;
  kind: VariantKind;
  /** What it is. */
  title: string;
  /** ONE provenance line: what it is · when · how it was judged. */
  provenance: string;
  /** `archive` only — the file inside `lab-archive/`. */
  file?: string;
  /** `stills` only — the directory inside `lab-archive/stills/`. */
  stills?: string;
}

export const VARIANTS: readonly Variant[] = [
  {
    id: "5",
    chip: "V5",
    kind: "casefile",
    title: "Three-level console",
    provenance:
      "ROUND 5 · 2026-08-04 · THE OWNER'S CONSOLE V3, RESTRUCTURED — ONE ARCHITECTURE AT THREE ZOOM LEVELS · CURRENT",
  },
  {
    id: "4",
    chip: "V4",
    kind: "casefile",
    title: "Cartesian instrument",
    provenance:
      "ROUND 4 REV B · 2026-08-04 · SCHEMATIC + BOUNDED CARTESIAN PLOT, REAL-PIXEL GEOMETRY · KEEPER",
  },
  {
    id: "console3",
    chip: "C3",
    kind: "archive",
    title: "Owner console v3",
    file: "console-v3.html",
    provenance:
      "OWNER-AUTHORED · 2026-08-04 · FOUR RANGES, ONE LAYOUT EACH · “GETTING CLOSE” BUT THE RANGES READ DISCOMBOBULATED — THE BASE FOR V5",
  },
  {
    id: "proto2",
    chip: "P2",
    kind: "archive",
    title: "Owner prototype v2",
    file: "prototype-v2.html",
    provenance:
      "OWNER-AUTHORED · 2026-08-03 · SPATIAL POLAR FIELD, THREE SEMANTIC RANGES + GUIDED AUTO-TRACE · SUPERSEDED BY CONSOLE V3",
  },
  {
    id: "proto1",
    chip: "P1",
    kind: "archive",
    title: "Owner prototype v1",
    file: "prototype-v1.html",
    provenance:
      "OWNER-AUTHORED · 2026-08-03 · THE FIRST SPATIAL FIELD — SAME ARCHITECTURE AS V2, NO AUTO-TRACE · SUPERSEDED",
  },
  {
    id: "r3",
    chip: "R3",
    kind: "stills",
    title: "Round 3 stills",
    stills: "r3",
    provenance:
      "ROUND 3 · 2026-08-04 · POLAR PORT OF PROTOTYPE V2 · REJECTED — ASPECT SQUISH, CIRCLES, FLOATING TEXT, NO PANEL CHROME",
  },
  {
    id: "r2",
    chip: "R2",
    kind: "stills",
    title: "Round 2 stills",
    stills: "r2",
    provenance:
      "ROUND 2 · 2026-08-04 · THREE INSTRUMENT VARIANTS (RADAR / ORBITAL / CIRCUIT) · BYPASSED — THE OWNER BUILT THE ANSWER HIMSELF",
  },
  {
    id: "r1",
    chip: "R1",
    kind: "stills",
    title: "Round 1 stills",
    stills: "r1",
    provenance:
      "ROUND 1 · 2026-08-04 · WORK CARDS IN LABELLED BANDS · REJECTED — “A GLORIFIED POWERPOINT”",
  },
];

export const DEFAULT_VARIANT = "5";

export const VARIANT_BY_ID = new Map(VARIANTS.map((v) => [v.id, v]));

export function readVariant(raw: string | string[] | undefined): Variant {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return VARIANT_BY_ID.get(value ?? "") ?? VARIANT_BY_ID.get(DEFAULT_VARIANT)!;
}

/** Cleans a still's filename into a caption. `depth2-team-dark-1280.png` →
 *  `DEPTH2 · TEAM · DARK · 1280`. */
export function stillCaption(file: string): string {
  return file
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .replace(/^\d+[-_]/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();
}
