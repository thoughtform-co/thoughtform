import type { ComponentType } from "react";

import { Chapters } from "./Chapters";
import { Codex } from "./Codex";
import type { DirectionProps } from "./kit";
import { MemoryMap } from "./MemoryMap";
import { Starmap } from "./Starmap";
import { Store } from "./Store";

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

export const MG_DIRECTION_IDS = ["v0", "v1", "v2", "v3", "v4", "v5"] as const;
export type MgDirectionId = (typeof MG_DIRECTION_IDS)[number];

export const isDirectionId = (v: string | null): v is MgDirectionId =>
  (MG_DIRECTION_IDS as readonly string[]).includes(v ?? "");

export interface MgDirection {
  id: MgDirectionId;
  label: string;
  /** What the direction claims, in one sentence. */
  thesis: string;
  /** What it was built from — a reference, or the seed. */
  provenance: string;
}

export const MG_DIRECTIONS: Readonly<Record<MgDirectionId, MgDirection>> = {
  v0: {
    id: "v0",
    label: "Row",
    thesis: "The shipped row: the newest note open, the rest strips that open on hover.",
    provenance: "Production (ADR-121), after U2's head seat. The control.",
  },
  v1: {
    id: "v1",
    label: "Codex",
    thesis: "Master and detail: an index of notes beside the one you are reading about.",
    provenance:
      "CP2077 codex/journal · Starfield starmap panel · the /arcs log + dossier (ADR-118).",
  },
  v2: {
    id: "v2",
    label: "Starmap",
    thesis:
      "The Arc, plotted: every note a waypoint at its date, in its beat's lane, on one route.",
    provenance: "Starfield star map · the amber terminal instruments · ADR-078's program board.",
  },
  v3: {
    id: "v3",
    label: "Terminal store",
    thesis: "Equal portrait cards; the one you are on opens in place with its summary and readout.",
    provenance: "Vilimovský STORE ACCESS · CP2077 4ST store · Marathon armory · Brand Codex STACK.",
  },
  v4: {
    id: "v4",
    label: "Chapters",
    thesis:
      "A contents page of whole, large titles; the open one grows into a feature with the note's drawn cover.",
    provenance:
      "A chapter select read as a book · the Dragonfly writing list · the outcomes dial (ADR-106) as the cover.",
  },
  v5: {
    id: "v5",
    label: "Memory map",
    thesis: "The archive as 128 cells; every note takes cells in proportion to its words.",
    provenance: "A random seed (docs/design/musings-gallery/seed-memory-map.md).",
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
};
