"use client";

import { CONFIG_VIEWBOX } from "./PdaConfiguration";
import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import type { FlightRect } from "./pdaFlight";
import type { PdaEntry } from "./PdaEntry";
import { CARD_BOX, Cartridge } from "./pdaGlyphs";
import type { PdaWork } from "./pdaRecord";
import { SUBSTRATE_VIEWBOX } from "./PdaSubstrate";

/**
 * READING 01 · THE WORK — the grid of twenty, ported from
 * `thoughtform-intelligence-map-v18.html`. Every coordinate below is the
 * owner's. ⚠ Do not re-derive them: a drawing whose proportions have been
 * "tidied" is a different drawing.
 *
 * ⚠ Readings 02 and 03 have their own files (`PdaConfiguration`,
 * `PdaSubstrate`) — this one keeps the shared `VIEW_BOX` record, declared at
 * the foot where every layout it reads from already exists.
 */

/**
 * EACH READING CROPS ITS OWN VIEWBOX (ADR-063 U1), AND EVERY CROP IS ELASTIC
 * NOW (2026-08-12).
 *
 * `meet` scales by the MINIMUM of the two box ratios, so a crop cut to fit one
 * field shape letterboxes at every other one — and the console's field runs
 * from 1.22 landscape on a laptop to 0.76 portrait on a tall monitor. ADR-070
 * U12 solved that for reading 02 by measuring the crop from the field; U15
 * generalises it, because 01 and 03 were carrying the identical defect (117px
 * of dead width and **265px of dead panel** respectively, with every guard
 * green). See `pdaFit` for the mechanism, and each reading's own `*Layout`
 * for where its extension goes.
 *
 * ⚠ RE-MEASURE AFTER ANY GEOMETRY CHANGE. These are bounds, not opinions:
 * `tests/lib/pda-viewbox.test.ts` re-checks them against the drawings'
 * declared extents, and the smoke measures real glyph boxes against them.
 */

/** The start pose as inline custom properties. `flPdaDock` reads these. */
function dockVars(entry: PdaEntry): React.CSSProperties | undefined {
  if (entry.kind !== "flight") return undefined;
  return {
    "--dx": `${entry.dx}px`,
    "--dy": `${entry.dy}px`,
    "--dk": entry.dk,
  } as React.CSSProperties;
}

/* ── 01 · the work ──────────────────────────────────────────────────────
   Four across, five down. Twenty cartridges is a shape, not a budget — the
   grid is what makes the estate legible at a glance, and the foot prints how
   many of the record it is showing. */
const COLS = 4;
const ROWS = 5;
const CARD_W = CARD_BOX.w;
const CARD_H = CARD_BOX.h;
/** The block's own top-left. Fixed: the crop moves around it, never it. */
const GRID_X = 12;
const GRID_Y = 22;
/** The reference gutters — the 192 / 158 pitches, less the card. */
const GUT_X0 = 16;
const GUT_Y0 = 22;

/**
 * ⚠ THE GUTTERS ARE WHERE A WIDER OR TALLER PANEL GOES, AND THEY ARE CAPPED.
 *
 * This grid is the one reading whose content is near-SQUARE (752 × 768) inside
 * a field that runs 1.22 landscape to 0.76 portrait, so it letterboxes at both
 * ends: 117px of dead width at 1280×720 and 92px of dead height at the owner's
 * 845 × 950 (257px at 2560×1440). The cards cannot absorb it — `CARD_W/H` is
 * ADR-069's flight destination and the morph asserts the two rects stay
 * similar to within 0.005 — so the gutters do.
 *
 * Past the cap the grid would stop reading as a grid and start reading as
 * twenty objects that happen to be aligned, so the remainder becomes margin
 * instead and `cropAround` splits it. At the caps the block is 872 × 928,
 * about a third of a card between neighbours on both axes.
 *
 * ⚠ WIDTH CAPS AT THE GUTTER'S OWN CEILING (120 = 3 gaps × 40) AND NOT ONE
 * UNIT FURTHER, because `xMidYMin` already centres the horizontal letterbox —
 * growing the crop past what the gutters can take would buy nothing and only
 * shrink `meet`'s numerator against a wider box. HEIGHT keeps growing to 620,
 * because the vertical letterbox is anchored at the TOP: there, a crop that
 * grows converts a band under the grid into air split above and below it.
 */
const GUT_X_MAX = 56;
const GUT_Y_MAX = 62;
const WORK_FIT: FitSpec = {
  cropW: COLS * CARD_W + (COLS - 1) * GUT_X0 + 28,
  cropH: ROWS * CARD_H + (ROWS - 1) * GUT_Y0 + 24,
  maxW: (COLS - 1) * (GUT_X_MAX - GUT_X0),
  maxH: 620,
};

export interface WorkLayout {
  gutX: number;
  gutY: number;
  block: FlightRect;
  marginX: number;
  marginY: number;
  crop: string;
}

/**
 * THE GRID AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it.
 *
 * ⚠ Elasticity buys ZERO type here — `meet` is unchanged by construction (see
 * `pdaFit`). It removes dead panel, which is all it claims to do. Reading 01's
 * rendered type is still the standing density question ADR-063 §Outstanding
 * records, and no amount of crop work touches it.
 */
export function workLayout(ext: FitExt): WorkLayout {
  const gutX = Math.min(GUT_X_MAX, GUT_X0 + ext.extW / (COLS - 1));
  const gutY = Math.min(GUT_Y_MAX, GUT_Y0 + ext.extH / (ROWS - 1));
  const block: FlightRect = {
    x: GRID_X,
    y: GRID_Y,
    w: COLS * CARD_W + (COLS - 1) * gutX,
    h: ROWS * CARD_H + (ROWS - 1) * gutY,
  };
  const box = cropAround(block, WORK_FIT.cropW + ext.extW, WORK_FIT.cropH + ext.extH);
  return { gutX, gutY, block, marginX: box.marginX, marginY: box.marginY, crop: box.crop };
}

export const workExt = (fieldAspect: number) => fitExt(WORK_FIT, fieldAspect);

/** The grid at rest — what the labs mount and what every guard measures from. */
export const WORK_LAYOUT_0 = workLayout({ extW: 0, extH: 0 });

/**
 * Slot `i`'s box on a given grid. The flight's source and its destination are
 * the same object, so both homes are published.
 *
 * ⚠ THE LAYOUT IS REQUIRED, not defaulted. Reading 02's crop and card have
 * moved with the field since ADR-070 U12 and this grid does now too, so a
 * flight computed against the resting grid would land the card wherever the
 * laptop would have put it. A default argument is exactly how that bug gets
 * written; making the compiler ask for the live board is cheaper than a test.
 */
export const gridRect = (i: number, layout: WorkLayout): FlightRect => ({
  x: GRID_X + (i % COLS) * (CARD_W + layout.gutX),
  y: GRID_Y + Math.floor(i / COLS) * (CARD_H + layout.gutY),
  w: CARD_W,
  h: CARD_H,
});

/**
 * A cartridge that flies gets a HEAD START. The grid paints in document order,
 * so a returning record crosses cartridges drawn after it; letting them begin
 * a breath later keeps the travel legible without reordering the DOM, which
 * would reorder the tab sequence with it.
 */
const RASTER_LEAD_MS = 90;

export function ViewWork({
  works,
  hover,
  onHover,
  onOpen,
  still,
  selId,
  showSel,
  entry,
  layout,
}: {
  works: readonly PdaWork[];
  hover: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  still: boolean;
  /** The record the reader has open, if they have opened one. */
  selId: string;
  showSel: boolean;
  entry: PdaEntry;
  /** The grid at this field's shape — the same object the flight measures. */
  layout: WorkLayout;
}) {
  return (
    <>
      {works.map((w, i) => {
        const slot = gridRect(i, layout);
        const isSel = showSel && w.id === selId;
        /* The selected record carries the transition; everything else rasters.
           ⚠ The flight is NOT gated on `still` — see pda.css. */
        const flies = isSel && entry.kind === "flight";
        const blooms = isSel && entry.kind === "bloom" && !still;
        const cls = flies
          ? "fl-pda-hit fl-pda-dock"
          : blooms
            ? "fl-pda-hit fl-pda-bloom"
            : `fl-pda-hit${still ? "" : " fl-pda-in"}`;

        return (
          <g
            className={cls}
            key={w.id}
            style={
              flies
                ? dockVars(entry)
                : still || blooms
                  ? undefined
                  : {
                      animationDelay: `${(entry.kind === "flight" ? RASTER_LEAD_MS : 0) + i * 22}ms`,
                    }
            }
            role="button"
            tabIndex={0}
            aria-label={`${w.title}, ${w.configured ? `${w.lane} lane` : "person-led"}${
              isSel ? ", open" : ""
            }`}
            onClick={() => onOpen(w.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(w.id);
              }
            }}
            onMouseEnter={() => onHover(w.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(w.id)}
            onBlur={() => onHover(null)}
          >
            <Cartridge
              x={slot.x}
              y={slot.y}
              w={CARD_W}
              h={CARD_H}
              state={hover === w.id ? "hot" : w.configured ? "cfg" : "led"}
              work={w}
              sel={isSel}
            />
          </g>
        );
      })}
    </>
  );
}

/**
 * THE CROPS AT REST — one per reading, and production renders none of them
 * unchanged. `PdaConsole` measures the field once and asks each reading's own
 * layout for the crop that fits it; this record is the resting proportion the
 * labs mount and the guards measure against.
 */
export const VIEW_BOX: Record<1 | 2 | 3, string> = {
  1: WORK_LAYOUT_0.crop,
  2: CONFIG_VIEWBOX,
  3: SUBSTRATE_VIEWBOX,
};
