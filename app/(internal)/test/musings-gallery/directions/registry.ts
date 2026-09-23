import type { ComponentType } from "react";

import { Chapters, ChaptersCards, ChaptersLedger } from "./Chapters";
import { Codex } from "./Codex";
import { Columns } from "./Columns";
import { Feature } from "./Feature";
import type { DirectionProps } from "./kit";
import { MemoryMap } from "./MemoryMap";
import { Missions } from "./Missions";
import type { CoverKind } from "./NoteCover";
import { Starmap } from "./Starmap";
import { Store } from "./Store";
import { Transmissions } from "./Transmissions";

/**
 * /test/musings-gallery — the direction registry.
 *
 * THE QUESTION THIS LAB ASKS. The head of `#musings` is settled (ADR-121 U2 —
 * it hangs from the services line). What sits under it is not: the owner's
 * read of the hover row was that it "looks bad", and the row's own stills show
 * why — a cover of dot grid around one small glyph, and titles the strips cut
 * mid-word. The site is a terminal on a ship with a HUD; the rails are its
 * navigation. The gallery may be classic in structure, and it has to be
 * better.
 *
 * ⚠ `v0` IS PRODUCTION, MOUNTED, NOT REBUILT — the station with no `gallery`,
 * i.e. the row the landing ships. Every other direction is mounted IN THE
 * STATION'S `gallery` SLOT, under the real head, pinned stage, decode and
 * arrival, so a comparison is between compositions and never between two
 * heads.
 *
 * ⚠ NO FLAG, EVER (ADR-070 U35). A winner is promoted into the station with
 * its own ADR, and the losers are deleted with their guards.
 */

export const MG_DIRECTION_IDS = [
  "v0",
  "v1",
  "v2",
  "v3",
  "v4",
  "v5",
  "v6",
  "v7",
  "v8",
  "v9",
  "v10",
  "v11",
] as const;
export type MgDirectionId = (typeof MG_DIRECTION_IDS)[number];

export const isDirectionId = (v: string | null): v is MgDirectionId =>
  (MG_DIRECTION_IDS as readonly string[]).includes(v ?? "");

/** The knobs a direction reads; the shell shows a control for each. */
export type MgKnob = "cover" | "thumbs" | "dek";

export interface MgDirection {
  id: MgDirectionId;
  label: string;
  /** What the direction claims, in one sentence. */
  thesis: string;
  /** What it was built from — a reference, or the seed. */
  provenance: string;
  /** The round it was built in. */
  round: 1 | 2 | 3 | 4;
  /** The knobs it reads, in the order the console shows them. */
  knobs?: readonly MgKnob[];
  /** Its own default cover, when it draws one and `?cover=` is unset. */
  cover?: CoverKind;
}

export const MG_DIRECTIONS: Readonly<Record<MgDirectionId, MgDirection>> = {
  v0: {
    id: "v0",
    label: "Row",
    thesis: "The shipped row: the newest note open, the rest strips that open on hover.",
    provenance: "Production (ADR-121), after U2's head seat. The control.",
    round: 1,
  },
  v1: {
    id: "v1",
    label: "Codex",
    thesis: "Master and detail: an index of notes beside the one you are reading about.",
    provenance:
      "CP2077 codex/journal · Starfield starmap panel · the /arcs log + dossier (ADR-118).",
    round: 1,
  },
  v2: {
    id: "v2",
    label: "Starmap",
    thesis:
      "The Arc, plotted: every note a waypoint at its date, in its beat's lane, on one route.",
    provenance: "Starfield star map · the amber terminal instruments · ADR-078's program board.",
    round: 1,
  },
  v3: {
    id: "v3",
    label: "Terminal store",
    thesis: "Equal portrait cards; the one you are on opens in place with its summary and readout.",
    provenance: "Vilimovský STORE ACCESS · CP2077 4ST store · Marathon armory · Brand Codex STACK.",
    round: 1,
  },
  v4: {
    id: "v4",
    label: "Chapters",
    thesis:
      "A contents page of whole, large titles; the open one grows into a feature with the note's drawn cover.",
    provenance:
      "A chapter select read as a book · the Dragonfly writing list · the outcomes dial (ADR-106) as the cover.",
    round: 2,
    knobs: ["cover", "thumbs"],
    cover: "dial",
  },
  v5: {
    id: "v5",
    label: "Memory map",
    thesis: "The archive as 128 cells; every note takes cells in proportion to its words.",
    provenance: "A random seed (docs/design/musings-gallery/seed-memory-map.md).",
    round: 1,
  },
  v6: {
    id: "v6",
    label: "Feature",
    thesis:
      "Cohere's blog: the newest note as a feature on the left, the feed of the rest on the right, riding the runway when it overflows.",
    provenance: "cohere.com/blog (the owner's reference) · the folder plate · the drawn cover.",
    round: 3,
    knobs: ["cover"],
    cover: "dial",
  },
  v7: {
    id: "v7",
    label: "Columns",
    thesis:
      "Prime Intellect's row, collapsing less: one housing of columns, the open one carrying the picture, the closed ones keeping their whole title.",
    provenance:
      "primeintellect.ai's Customer Stories (the owner's reference) · the folder plate · the drawn cover.",
    round: 3,
    knobs: ["cover", "dek"],
    cover: "dial",
  },
  v8: {
    id: "v8",
    label: "Transmissions",
    thesis:
      "A comms panel: the manifest as a roster table, then the open transmission — sender well, framed header, the body, the signal.",
    provenance:
      "Starfield's ship crew roster · Cyberpunk 2077's NEW MESSAGES panel · the framed-key readout.",
    round: 3,
    knobs: ["cover"],
    cover: "raster",
  },
  v9: {
    id: "v9",
    label: "Missions",
    thesis:
      "The notes filed under the Arc: three lanes, NAVIGATE · ENCODE · BUILD, the open entry expanding in place.",
    provenance:
      "Starfield's missions and The Outer Worlds' journal, read as a log grouped by kind · the Chapters mechanic.",
    round: 3,
  },
  v10: {
    id: "v10",
    label: "Chapters · ledger",
    thesis:
      "v4 with its rows tightened to one line each — mark, date, title, chip, length — and a compact feature with a square cover at the row's end.",
    provenance: "v4 (the owner's pick), the rows tightened; the Dragonfly writing list's density.",
    round: 4,
    knobs: ["cover"],
    cover: "dial",
  },
  v11: {
    id: "v11",
    label: "Chapters · cards",
    thesis:
      "v4 with every note a folder card — thumbnail, title, meta, chip — the open card a horizontal feature with the cover a square at its height.",
    provenance:
      "v4 (the owner's pick), the rows tightened into plates; the proof card's folder skin.",
    round: 4,
    knobs: ["cover"],
    cover: "dial",
  },
};

/**
 * The drawings. A TOTAL record over every id but the control, so the compiler
 * is the guard: an id registered above and missing here does not build (the
 * config lab's lesson — two hand-written chains ending in a bare `else` once
 * mounted the wrong variant in silence).
 */
export const MG_GALLERIES: Readonly<
  Record<Exclude<MgDirectionId, "v0">, ComponentType<DirectionProps>>
> = {
  v1: Codex,
  v2: Starmap,
  v3: Store,
  v4: Chapters,
  v5: MemoryMap,
  v6: Feature,
  v7: Columns,
  v8: Transmissions,
  v9: Missions,
  v10: ChaptersLedger,
  v11: ChaptersCards,
};
