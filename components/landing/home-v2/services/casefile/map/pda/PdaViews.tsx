"use client";

import type { CaseMapStream, CaseMapStreamKey } from "@/lib/cases/types";

import { CONFIG_VIEWBOX } from "./PdaConfiguration";
import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import type { FlightRect } from "./pdaFlight";
import type { PdaEntry } from "./PdaEntry";
import { CARD_BOX, Cartridge } from "./pdaGlyphs";
import { type LetterSpec, adv } from "./pdaLetters";
import { RUN_MODES, RUN_MODE_LABEL, STREAM_ORDER, WORK_COLUMN_SLOTS } from "../mapProjection";
import type { PdaWork, WorkPlan } from "./pdaRecord";

/**
 * READING 01 · THE WORK — the MARKETING ESTATE on two axes (ADR-126, owner
 * 2026-09-26: "cluster it like that so that when people see it they
 * immediately see, 'Hey this is actually representative of our marketing
 * team'" … "maybe really show some axes").
 *
 * Three columns, one per creative workstream (production · operations ·
 * review — the owner's own three), each climbing from a prompt to a tool to
 * an agent, with the person-led work last, under a PT Mono group head per
 * run. Both axes are the RECORD: the column is the stream's own `stream`
 * field, the row its run mode (`runModeOf`). It replaces the 4×5 grid of
 * twenty ported from `thoughtform-intelligence-map-v18.html` — the estate of
 * every department, which put legal, finance and engineering beside the
 * studio's work in front of a CMO.
 *
 * ⚠ A STRICT LATTICE OF BOTH AXES DOES NOT FIT THIS CONSOLE. A band's height
 * is its worst cell, any plausible split puts three or four streams in one
 * cell, and the lattice runs eight card-rows tall — 3.9px of title at
 * 1280×720. Stepped groups keep both axes readable: a column head, then runs
 * of cards under their group heads, ragged feet being the record.
 *
 * ⚠ THE CARTRIDGE IS UNTOUCHED. Its box (`CARD_BOX`) is ADR-069's flight
 * destination — the core on reading 02 IS this glyph at `CORE_K` — and its
 * type is `pda-card.test.ts`'s. What changed is where the cards SIT.
 *
 * ⚠ Reading 02 has its own file (`PdaConfiguration`) — this one keeps the
 * shared `VIEW_BOX` record, declared at the foot where every layout it reads
 * from already exists. Reading 03 left the rail (ADR-126); `PdaCarrier` stays
 * on disk with its lab until the owner has read the two readings live.
 */

/**
 * EACH READING CROPS ITS OWN VIEWBOX (ADR-063 U1), AND EVERY CROP IS ELASTIC
 * (2026-08-12). `meet` scales by the MINIMUM of the two box ratios, so a crop
 * cut to fit one field shape letterboxes at every other one — and the
 * console's field runs from 1.22 landscape on a laptop to 0.76 portrait on a
 * tall monitor. See `pdaFit` for the mechanism, and `workLayout` below for
 * where this reading's extension goes.
 *
 * ⚠ RE-MEASURE AFTER ANY GEOMETRY CHANGE. These are bounds, not opinions:
 * `tests/lib/pda-viewbox.test.ts` re-checks them against the drawing's
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
   Three columns, `WORK_COLUMN_SLOTS` cards each at most, twelve on the live
   record. The foot prints how many of the record it is showing. */
const COLS = STREAM_ORDER.length;
const CARD_W = CARD_BOX.w;
const CARD_H = CARD_BOX.h;
/** The block's own top-left. Fixed: the crop moves around it, never it. */
const GRID_X = 12;
const GRID_Y = 22;
/** The reference gutters — the 192 / 158 pitches, less the card. */
const GUT_X0 = 16;
const GUT_Y0 = 22;

/**
 * THE TWO HEADS, IN PT MONO CHROME. The column head letters the workstream
 * (`streams[].name`, uppercased) on a baseline `COL_HEAD_FS` under the
 * block's top and takes `COL_HEAD_H` of the column; each run's group head
 * (`A PROMPT` · `A TOOL` · `AN AGENT` · `BY HAND`) sits in a `GROUP_H` band
 * above its cards, its baseline `GROUP_BASE` into the band.
 *
 * ⚠ 12 IS THE FLOOR THE OWNER SET (ADR-070 U10) and both heads letter AT it:
 * the column head at .14em (the header tracking) and the group head at
 * .18em (the code tracking), so "CREATIVE OPERATIONS" — 19 characters, the
 * widest head — is 168.7 units against the card's 176. Their measures are
 * declared in `workLettering` and walked by `pda-work-fit.test.ts`.
 */
export const COL_HEAD_FS = 12;
export const COL_HEAD_TRACK = 0.14;
const COL_HEAD_H = 26;
export const GROUP_FS = 12;
export const GROUP_TRACK = 0.18;
const GROUP_H = 24;
const GROUP_BASE = 14;

/**
 * ⚠ THE GUTTERS ARE WHERE A WIDER OR TALLER PANEL GOES, AND THEY ARE CAPPED.
 *
 * The block is near-SQUARE (588 wide against ~740 tall at the ceiling) inside
 * a field that runs 1.22 landscape to 0.76 portrait, so it letterboxes at
 * both ends. The cards cannot absorb it — `CARD_W/H` is ADR-069's flight
 * destination and the morph asserts the two rects stay similar to within
 * 0.005 — so the gutters do. Past the cap the columns would stop reading as
 * columns, so the remainder becomes margin and `cropAround` splits it.
 *
 * ⚠ THE COLUMNS ARE A PORTRAIT BLOCK IN A LANDSCAPE FIELD at every laptop
 * (588 × 756 at the ceiling, against 603 × 493 at 1280×720), so the reading
 * is height-bound there and the width is where the slack goes: the gutters
 * open to 100 units — 57 % of a card, and three LABELLED columns read as
 * three columns at that spacing where an unlabelled 4×5 grid stopped reading
 * as a grid at 56. Past the cap `xMidYMin` centres what is left; at the
 * binding field the clamp still buys half the letterbox the resting crop
 * would leave (`pda-viewbox` asserts it). HEIGHT keeps growing to 620, because
 * the vertical letterbox is anchored at the TOP: there, a crop that grows
 * converts a band under the block into air split above and below it.
 */
const GUT_X_MAX = 100;
const GUT_Y_MAX = 62;

/**
 * THE CEILING BLOCK — one column head, `WORK_COLUMN_SLOTS` group heads and
 * `WORK_COLUMN_SLOTS` cards per column. The crop is derived from it rather
 * than from the live record, so `VIEW_BOX[1]` stays a constant, `pdaFit` is
 * untouched and the flight's arithmetic never depends on how many streams a
 * column happens to hold; the live block is CENTRED in it (`cropAround`).
 * The registry refuses a fifth card per column, which would fall off the
 * ceiling rather than clip.
 */
const ceilingH = (gutY: number) =>
  COL_HEAD_H + WORK_COLUMN_SLOTS * (GROUP_H + CARD_H) + (WORK_COLUMN_SLOTS - 1) * gutY;
const WORK_FIT: FitSpec = {
  cropW: COLS * CARD_W + (COLS - 1) * GUT_X0 + 28,
  cropH: ceilingH(GUT_Y0) + 24,
  maxW: (COLS - 1) * (GUT_X_MAX - GUT_X0),
  maxH: 620,
};

/** A placed column head, group head or card. Cards carry the slot the flight
 *  reads — the one object the render and the flight share. */
export type WorkPlaced =
  | { kind: "col"; stream: CaseMapStreamKey; x: number; y: number }
  | { kind: "head"; stream: CaseMapStreamKey; label: string; x: number; y: number }
  | { kind: "card"; id: string; i: number; rect: FlightRect };

export interface WorkLayout {
  gutX: number;
  gutY: number;
  block: FlightRect;
  marginX: number;
  marginY: number;
  crop: string;
  placed: readonly WorkPlaced[];
  /** Every card's slot by id — `slotRect` reads this. */
  slots: Readonly<Record<string, FlightRect>>;
}

/**
 * THE READING AT ONE FIELD SHAPE. Pure, so `pda-viewbox` and `pda-flight` can
 * walk it — and it takes the PLAN, never a default: the flight measures its
 * source against this object, and a layout computed for the resting record
 * would land the card wherever the laptop would have put it.
 *
 * ⚠ Elasticity buys ZERO type here — `meet` is unchanged by construction (see
 * `pdaFit`). It removes dead panel, which is all it claims to do. What buys
 * type on this reading is DENSITY: twelve cards where there were twenty.
 */
export function workLayout(ext: FitExt, plan: WorkPlan): WorkLayout {
  const gutX = Math.min(GUT_X_MAX, GUT_X0 + ext.extW / Math.max(1, COLS - 1));
  const gutY = Math.min(GUT_Y_MAX, GUT_Y0 + ext.extH / Math.max(1, WORK_COLUMN_SLOTS - 1));
  const placed: WorkPlaced[] = [];
  const slots: Record<string, FlightRect> = {};
  let i = 0;
  let bottom = GRID_Y;
  plan.columns.forEach((col, c) => {
    const x = GRID_X + c * (CARD_W + gutX);
    placed.push({ kind: "col", stream: col.stream, x, y: GRID_Y + COL_HEAD_FS });
    let y = GRID_Y + COL_HEAD_H;
    for (const run of col.runs) {
      placed.push({ kind: "head", stream: col.stream, label: run.label, x, y: y + GROUP_BASE });
      y += GROUP_H;
      run.ids.forEach((id, n) => {
        if (n > 0) y += gutY;
        const rect = { x, y, w: CARD_W, h: CARD_H };
        placed.push({ kind: "card", id, i, rect });
        slots[id] = rect;
        i += 1;
        y += CARD_H;
      });
      y += gutY;
    }
    bottom = Math.max(bottom, y - gutY);
  });
  const block: FlightRect = {
    x: GRID_X,
    y: GRID_Y,
    w: COLS * CARD_W + (COLS - 1) * gutX,
    h: Math.max(bottom - GRID_Y, 1),
  };
  /* The crop is the CEILING's, grown by the field's extension; the live block
     — shorter than the ceiling on any record with fewer than four runs in a
     column — is centred in it, which is what keeps a ragged reading from
     pooling its slack under the last card (ADR-070 U14's law). */
  /* ⚠ THE CROP IS THE REST CROP PLUS THE EXTENSION — never the grown ceiling
     plus the extension again: the gutters already spend `extH` (three of
     them, a third each), so adding it twice put 21px of dead panel under the
     block at 2560×1440 on the first cut. Past `GUT_Y_MAX` the block stops
     growing and the remainder is margin, split (ADR-070 U14). */
  const box = cropAround(block, WORK_FIT.cropW + ext.extW, WORK_FIT.cropH + ext.extH);
  return {
    gutX,
    gutY,
    block,
    marginX: box.marginX,
    marginY: box.marginY,
    crop: box.crop,
    placed,
    slots,
  };
}

export const workExt = (fieldAspect: number) => fitExt(WORK_FIT, fieldAspect);

/**
 * THE CEILING PLAN — every column holding one card in each of the four runs,
 * i.e. the tallest reading the record could ever ask for. What the labs mount
 * at rest and what every guard measures the crop against; the ids are
 * synthetic and never rendered.
 */
export function workCeilingPlan(): WorkPlan {
  const columns = STREAM_ORDER.map((stream) => ({
    stream,
    runs: RUN_MODES.map((mode) => ({
      mode,
      label: RUN_MODE_LABEL[mode].toUpperCase(),
      ids: [`ceiling-${stream}-${mode}`],
    })),
  }));
  return { columns, ids: columns.flatMap((c) => c.runs.flatMap((r) => r.ids)) };
}

/** The reading at rest, at the ceiling — the resting crop every guard measures from. */
export const WORK_LAYOUT_0 = workLayout({ extW: 0, extH: 0 }, workCeilingPlan());

/**
 * A card's slot on a given layout. The flight's source and its destination
 * are the same object, so both homes are published.
 *
 * ⚠ THE LAYOUT IS REQUIRED, not defaulted, and this is a RENAME of
 * `gridRect(i, layout)`, never an alias: an alias that answered for every id
 * kept eleven flight loops green over identical rects (ADR-085 U2). A missing
 * id throws — the console only asks for ids on the plan the layout was built
 * from, so a throw here is a wiring defect, never a record one.
 */
export function slotRect(layout: WorkLayout, id: string): FlightRect {
  const r = layout.slots[id];
  if (!r) throw new Error(`[pda] ${id} has no slot on this layout`);
  return r;
}

/**
 * WHAT THE READING LETTERS BESIDE THE CARDS, declared with its measure so
 * `pda-work-fit.test.ts` walks the drawing's own inputs. The cards' strings
 * are `pda-card.test.ts`'s and are not repeated here. A column head may run
 * the card's full width (176) — the next column is a gutter away — and a group
 * head the same.
 */
export function workLettering(layout: WorkLayout, streams: readonly CaseMapStream[]): LetterSpec[] {
  const name = (k: CaseMapStreamKey) => (streams.find((s) => s.key === k)?.name ?? k).toUpperCase();
  const out: LetterSpec[] = [];
  for (const p of layout.placed) {
    if (p.kind === "col") {
      out.push({
        slot: `col.${p.stream}.head`,
        text: name(p.stream),
        fs: COL_HEAD_FS,
        track: COL_HEAD_TRACK,
        measure: CARD_W,
      });
    } else if (p.kind === "head") {
      out.push({
        slot: `col.${p.stream}.run.${p.label}`,
        text: p.label,
        fs: GROUP_FS,
        track: GROUP_TRACK,
        measure: CARD_W,
      });
    }
  }
  return out;
}

/** The widest head the ladder can letter, in units — for the guard's comment. */
export const workHeadWidth = (text: string, fs: number, track: number) =>
  text.length * adv(fs, track);

/**
 * A cartridge that flies gets a HEAD START. The reading paints in document
 * order, so a returning record crosses cartridges drawn after it; letting them
 * begin a breath later keeps the travel legible without reordering the DOM,
 * which would reorder the tab sequence with it.
 */
const RASTER_LEAD_MS = 90;

export function ViewWork({
  works,
  streams,
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
  /** The record's triple — the column heads letter its names. */
  streams: readonly CaseMapStream[];
  hover: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  still: boolean;
  /** The record the reader has open, if they have opened one. */
  selId: string;
  showSel: boolean;
  entry: PdaEntry;
  /** The reading at this field's shape — the same object the flight measures. */
  layout: WorkLayout;
}) {
  const byId = new Map(works.map((w) => [w.id, w] as const));
  const name = (k: CaseMapStreamKey) => (streams.find((s) => s.key === k)?.name ?? k).toUpperCase();
  return (
    <>
      {layout.placed.map((p) => {
        if (p.kind === "col") {
          return (
            <text
              key={`col-${p.stream}`}
              x={p.x}
              y={p.y}
              fontSize={COL_HEAD_FS}
              letterSpacing={`${COL_HEAD_TRACK}em`}
              fill="var(--pda-ink)"
            >
              {name(p.stream)}
            </text>
          );
        }
        if (p.kind === "head") {
          return (
            <text
              key={`head-${p.stream}-${p.label}`}
              x={p.x}
              y={p.y}
              fontSize={GROUP_FS}
              letterSpacing={`${GROUP_TRACK}em`}
              fill="var(--pda-txt2)"
            >
              {p.label}
            </text>
          );
        }
        const w = byId.get(p.id);
        if (!w) return null;
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
                      animationDelay: `${(entry.kind === "flight" ? RASTER_LEAD_MS : 0) + p.i * 22}ms`,
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
              x={p.rect.x}
              y={p.rect.y}
              w={CARD_W}
              h={CARD_H}
              state={w.configured ? "cfg" : "led"}
              hot={hover === w.id}
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
 * THE CROPS AT REST — one per reading, and production renders neither
 * unchanged. `PdaConsole` measures the field once and asks each reading's own
 * layout for the crop that fits it; this record is the resting proportion the
 * labs mount and the guards measure against. Two since ADR-126.
 */
export const VIEW_BOX: Record<1 | 2, string> = {
  1: WORK_LAYOUT_0.crop,
  2: CONFIG_VIEWBOX,
};
