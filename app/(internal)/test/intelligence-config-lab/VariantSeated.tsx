"use client";

import {
  Cartridge,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  BOARD,
  Cell,
  FS,
  type CellType,
  Wire,
  OwnerPlate,
  QLabel,
  barSpecs,
  charsFor,
  groupSpecs,
  groupsOf,
  ownerSpecs,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 8 · SEATED — Tight, with the authority made STRUCTURAL.
 *
 * The owner's three notes on Tight (2026-08-11), answered in order:
 *
 * 1. **WHERE IT RUNS comes up to meet the card.** Tight drops it to the
 *    crop's floor and spans 264 units of cable to reach it; here the gap is
 *    **130**. The composition is balanced against the crop instead of pinned
 *    to its edges — 88 units of margin top and bottom, derived, not eyeballed.
 *
 * 2. **The card is the largest object on the board.** k 1.5 → **1.875**
 *    (264×204 → 330×255). The width chain re-derives around it:
 *    `24 | 199 | 26 | 330 | 26 | 199 | 24`. The side nodes give up 35 units
 *    each so the subject can have 66 — the card is the thing being described,
 *    and on the shipped board it was the same size as the boxes describing it.
 *    The seat is second: 480 wide, and now carrying visible load.
 *
 * 3. ⚠ **THE DASHED LINE IS GONE, REPLACED BY A PYLON** — a splayed,
 *    chamfered structural member that stands on the plate and plugs into the
 *    card's top edge, drawn UNDER the cartridge so the card sits on it.
 *
 * ⚠ AND THE PYLON *KEEPS* ADR-070 U5's LAW RATHER THAN BREAKING IT. That law
 * says the seat is AUTHORITY, not data — answerable-to rather than feeds-into
 * — which is why it may never be one of the nodes' multi-conductor bundles.
 * A dashed hairline was only ONE way to say that, and the owner's verdict is
 * that it says it too quietly to read as a connection at all (U6 already had
 * to take it from `--pda-dim` to full green for the same reason; this is that
 * correction arriving at its conclusion). So the distinction moves from
 * WEIGHT to MATERIAL: **authority is drawn as structure, data as conductors.**
 * Nothing flows down the pylon — it bears load. That is a stronger statement
 * of the same law, and it survives being drawn thick.
 */

export const SEATED_VIEWBOX = "36 48 828 912";

/* ── The width chain, re-derived around a bigger subject ────────────────
   `24 | 199 | 26 | 330 | 26 | 199 | 24` = 828. Change any term and the rest
   must move with it, or the side nodes end up on the crop's wall (U6). */
const NODE_W = 199;
const CELL_W = 197;
const CELL_H = 94;
const CELL_GAP = 6;
const HEAD_H = 44;
const NODE_H = HEAD_H + CELL_H * 2 + CELL_GAP + 4;
/**
 * ⚠ THE BASE CELLS ARE 232, NOT 197, AND THAT IS A DELIBERATE DEPARTURE FROM
 * ADR-070 U4's "one sub-card size across all six".
 *
 * That law exists because the base's old 640 width gave it 316-wide cards
 * holding one short line — disproportion. This is the opposite problem: the
 * side cells are narrow BECAUSE the card took their width, and forcing the
 * base to match spends nothing and costs a wrap (`CHAT + BRIEF TOOL` broke
 * onto two lines at 197, on a row with 340 units of unused board either
 * side). 232 is still inside the law's intent — near enough to read as the
 * same object, wide enough that the record's interfaces letter on one line.
 */
const BASE_CELL_W = 232;
const BASE_W = BASE_CELL_W * 2 + CELL_GAP + 2;
const BASE_H = HEAD_H + CELL_H + 4;

/** k 1.875 exactly: `w = 176k`, `h = 136k`, or the cartridge's internal
 *  offsets stop agreeing with its own body path. */
const CHIP_K = 1.875;
const CHIP = { x: 285, y: 340, w: 176 * CHIP_K, h: 136 * CHIP_K } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const RIGHT_X = CHIP_R + 26;
const NODE_Y = CHIP_CY - NODE_H / 2;
const BASE_X = BOARD.mid - BASE_W / 2;
const BASE_Y = 720;

const OWNER = { x: 210, y: 160, w: 480, h: 110 } as const;

/**
 * The pylon: 70 units of structure between the plate's floor and the card's
 * ceiling, splaying from 140 to 240 so it reads as BEARING rather than
 * joining. ⚠ Its mass is the whole point — the first cut was 110→170 over 60
 * units and rendered as a small dark tab, which is the dashed hairline's
 * failure again in a different shape. A member that carries a plate has to
 * look like it could.
 */
const PYL = {
  y0: OWNER.y + OWNER.h,
  y1: CHIP.y,
  splay: 34,
  topW: 140,
  botW: 240,
} as const;

/**
 * ⚠ THE PADDING IS 10, NOT 12, AND THE GUARD IS WHY. A bigger subject leaves
 * the side cells 197 wide; at the house pad of 12 the measure is 173, which
 * is 15 characters at fs 16 — and `BUDGET + COMMITMENT FACTS` (W-049) then
 * wraps to THREE lines, the third sliced off silently. Two units of padding
 * each side buys the sixteenth character (`COMMITMENT FACTS` is exactly 16),
 * which is the cheapest of the three ways out: the alternatives were
 * shrinking the card the owner asked to make biggest, or dropping the answer
 * to fs 15 after asking for it bigger. Padding is the one term nobody reads.
 */
const CELL_PAD = 10;
const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - CELL_PAD * 2, cap: 2 };
/** The base's own measure — 19 characters at fs 16, which is what puts every
 *  interface in the record on one line. */
const TB: CellType = { keyFs: FS.key, valueFs: FS.v, measure: BASE_CELL_W - CELL_PAD * 2, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function seatedLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  return [
    ...ownerSpecs("seated.owner", pda, {
      ownerFs: FS.owner,
      measure: 300,
      autoMeasure: 118,
      noteMeasure: OWNER.w - 40,
    }),
    ...groupSpecs("seated.runs", runs, FS.q, NODE_W - 32, T),
    ...groupSpecs("seated.rch", rch, FS.q, NODE_W - 32, T),
    ...groupSpecs("seated.whr", whr, FS.q, BASE_W - 32, TB),
    ...barSpecs("seated.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
}

export function VariantSeated({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const [runs, rch, whr] = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

  const l0 = BOARD.mid - PYL.topW / 2;
  const r0 = BOARD.mid + PYL.topW / 2;
  const l1 = BOARD.mid - PYL.botW / 2;
  const r1 = BOARD.mid + PYL.botW / 2;
  const ys = PYL.y1 - PYL.splay;

  const node = (
    x: number,
    y: number,
    w: number,
    h: number,
    gi: 0 | 1 | 2,
    stacked: boolean,
    cw: number,
    t: CellType
  ) => {
    const g = [runs, rch, whr][gi];
    return (
      <g>
        <path
          d={`M${x + 14},${y} H${x + w} V${y + h} H${x} V${y + 14} Z`}
          fill="var(--pda-void)"
          stroke={led ? "var(--pda-txt3)" : "var(--pda-amb)"}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <QLabel x={x + 18} y={y + 30} text={g.q} />
        <line x1={x + 1} y1={y + 38} x2={x + w - 1} y2={y + 38} stroke="var(--pda-hair2)" />
        {g.cells.map((c, i) => (
          <Cell
            key={c.key}
            x={x + 1 + (stacked ? 0 : i * (cw + CELL_GAP))}
            y={y + HEAD_H + (stacked ? i * (CELL_H + CELL_GAP) : 0)}
            w={cw}
            h={CELL_H}
            cell={c}
            t={t}
            led={led}
            pad={CELL_PAD}
          />
        ))}
      </g>
    );
  };

  return (
    <>
      <OwnerPlate {...OWNER} work={pda} ownerFs={FS.owner} led={led} />

      {/* ── THE PYLON. Structure, not signal: filled in the plate's own green,
              splayed into a foot, and drawn BEFORE the cartridge so the card
              sits ON it rather than beside it. The two inner rules are
              material (a member has a web), never conductors — they stop
              short of both ends so they cannot be read as a run. ────────── */}
      <g>
        <path
          d={`M${l0},${PYL.y0} H${r0} L${r1},${ys} V${PYL.y1} H${l1} V${ys} Z`}
          fill={led ? "rgba(255, 255, 255, 0.04)" : "rgba(126, 159, 102, 0.17)"}
          stroke={green}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <g stroke={green} opacity="0.45">
          <line x1={BOARD.mid - 28} y1={PYL.y0 + 10} x2={BOARD.mid - 28} y2={PYL.y1 - 8} />
          <line x1={BOARD.mid + 28} y1={PYL.y0 + 10} x2={BOARD.mid + 28} y2={PYL.y1 - 8} />
        </g>
        {/* The fixings where the member meets the plate — the seam is made,
            not assumed. */}
        <g stroke={green} opacity="0.9">
          <line x1={BOARD.mid - 44} y1={PYL.y0 - 5} x2={BOARD.mid - 44} y2={PYL.y0 + 5} />
          <line x1={BOARD.mid + 44} y1={PYL.y0 - 5} x2={BOARD.mid + 44} y2={PYL.y0 + 5} />
        </g>
      </g>

      <Wire
        pts={[
          [CHIP.x, CHIP_CY],
          [BOARD.x0 + NODE_W, CHIP_CY],
        ]}
        n={8}
        stroke={green}
        dashed={led}
      />
      <Wire
        pts={[
          [CHIP_R, CHIP_CY],
          [RIGHT_X, CHIP_CY],
        ]}
        n={8}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [BOARD.mid - 44, CHIP_B],
          [BOARD.mid - 44, BASE_Y - 62],
          [BOARD.mid - 70, BASE_Y - 36],
          [BOARD.mid - 70, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [BOARD.mid + 44, CHIP_B],
          [BOARD.mid + 44, BASE_Y - 62],
          [BOARD.mid + 70, BASE_Y - 36],
          [BOARD.mid + 70, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />

      {node(BOARD.x0, NODE_Y, NODE_W, NODE_H, 0, true, CELL_W, T)}
      {node(RIGHT_X, NODE_Y, NODE_W, NODE_H, 1, true, CELL_W, T)}
      {node(BASE_X, BASE_Y, BASE_W, BASE_H, 2, false, BASE_CELL_W, TB)}

      <Cartridge
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.w}
        h={CHIP.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={CHIP_K}
        bar={{ label: "THE BAR", lines: barLines }}
      />
    </>
  );
}
