import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/intelligence-config-lab — look-dev for the CONFIGURATION reading's
 * DRAWING, beside the one that ships.
 *
 * ADR-070 shipped the switchboard and its U9 re-slot, and the owner's brief
 * (2026-08-11) is QUALITY OF LIFE rather than archetype: the board reads
 * cramped, the panels can be smaller, the type must be bigger, WHO OWNS IT
 * belongs to the centrepiece, and the cable stays. Contents and panels are
 * settled — this route is an INFORMATION-ARCHITECTURE question now.
 *
 * ⚠ THE FOUR ARCHETYPES (die · chain · section · schematic) ARE RETIRED. They
 * answered what SHAPE the drawing should be, and the switchboard won that on
 * 2026-08-09; ADR-070's Left-open note said to delete the losers rather than
 * keep five. Git history is the archive.
 *
 * ⚠ AND THE EIGHTH, `seated`, WON — it is on the landing as of ADR-070 U10,
 * so its local copy is deleted and `shipped` mounts it from production.
 *
 * Seven refinements hang beside it, all drawn from the LIVE record inside the
 * REAL console chrome (`ConsoleFrame` + `ConsoleRail` + the `--pda-*`
 * palette). ⚠ They draw in the PRE-U10 crop `36 48 828 912`, which production
 * no longer uses — they are the RECORD of a finished round, not live
 * candidates, and anything genuinely weighed against production again wants
 * re-cropping first or the comparison is between two different boxes:
 *
 *   tight      the control: same seats and cables, only cell height and the
 *              type ladder move
 *   fused      the seat welded to the card as one object; no dashed line
 *   bands      three full-width rows; every value on one line at 18
 *   rail       keys on an outboard rail, the answer alone at fs 22
 *   satellite  no housings; a bigger card and doglegged cables
 *   ledger     one right-hand column of rows; spine doubles as column rule
 *   grid       2 × 3 modular, hairlines only, the centre rule IS the cable
 *
 * ⚠ THIS IS A MEASURING INSTRUMENT, NOT A PICTURE (the imlab law). The
 * readout walks every glyph box live: label-on-label collisions, crop
 * clipping, rendered type floors, canvas overflow. Author at the first
 * preset; read the numbers. `scripts/capture-config-lab.mjs` runs the same
 * gates across the whole matrix and fails loudly.
 *
 * No production file is modified by this route. Promotion of a winning
 * refinement — including re-pointing the ADR-069 flight's dock at its new
 * core — is its own pass, with its own ADR.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Intelligence Configuration Lab — seven refinements (Internal)",
  description:
    "Look-dev for the casefile map console's configuration reading: seven information-architecture refinements beside the shipped board, at real console sizes. The eighth, seated, won and is on the landing.",
  robots: { index: false, follow: false },
};

export default function IntelligenceConfigLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
