"use client";

import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  BOARD,
  BarBlock,
  Cell,
  FS,
  type CellType,
  Wire,
  OwnerPlate,
  QLabel,
  barSpecs,
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

const OWNER = { x: 210, y: 160, w: 480, h: 100 } as const;

/**
 * The pylon — a NECK, not a buttress (owner, 2026-08-11: "make the creative
 * lead card a bit more subtle; especially how it connects").
 *
 * ⚠ THIS SIZE IS THE THIRD ATTEMPT AND THE RANGE IS NOW KNOWN. 110→170 over
 * 60 units read as a small dark tab — the dashed hairline's failure in a new
 * shape. 140→240 read as a buttress and took the eye off the card, which is
 * the thing the whole variant exists to make dominant. 64→108 with a shallow
 * splay is the band between them: unmissable as a connection, quiet as an
 * object. The fill drops with it (0.17 → 0.07) and the web lines go — at this
 * width they were two hairlines inside a 64-unit box, which is clutter.
 */
const PYL = {
  y0: OWNER.y + OWNER.h,
  y1: CHIP.y,
  splay: 20,
  topW: 64,
  botW: 108,
} as const;

/**
 * The house pad, and it is back to 12 for a reason worth recording: this
 * variant briefly ran at 10 because `BUDGET + COMMITMENT FACTS` (W-049)
 * wrapped to a silently-sliced third line in a 173-unit measure at the old
 * fs 16. When the owner's legibility ruling brought the ANSWER down to 15,
 * the same measure became 16 characters and the workaround evaporated —
 * `COMMITMENT FACTS` is exactly 16. A constant nudged to dodge one string is
 * always worth re-testing after the thing that caused it moves.
 */
const CELL_PAD = 12;
const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - CELL_PAD * 2, cap: 2 };
/** The base's own measure — 20 characters at fs 15, which is what puts every
 *  interface in the record on one line. */
const TB: CellType = { keyFs: FS.key, valueFs: FS.v, measure: BASE_CELL_W - CELL_PAD * 2, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;
/**
 * ⚠ THE BAR'S BASELINE IS BOXED BETWEEN TWO THINGS. The cartridge's title
 * letters 21.6 with its baseline at `y + 92k` = 512.5, so its descenders
 * reach ~517; a 13-unit label's cap top must clear that, which floors this at
 * ~527. And two lines at fs 12 bottom out 52 below it, which against the
 * card's floor of 595 ceilings it at ~540. 534 is the middle of that band.
 */
const BAR_Y = 534;

export function seatedLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  return [
    ...ownerSpecs("seated.owner", pda, {
      ownerFs: FS.owner,
      measure: 280,
      autoMeasure: 145,
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
          fill={led ? "rgba(255, 255, 255, 0.025)" : "rgba(126, 159, 102, 0.07)"}
          stroke={green}
          strokeDasharray={led ? "5 4" : undefined}
        />
        {/* The fixings where the member meets the plate — the seam is made,
            not assumed. Two ticks are the whole detail at this width. */}
        <g stroke={green} opacity="0.85">
          <line x1={BOARD.mid - 20} y1={PYL.y0 - 4} x2={BOARD.mid - 20} y2={PYL.y0 + 4} />
          <line x1={BOARD.mid + 20} y1={PYL.y0 - 4} x2={BOARD.mid + 20} y2={PYL.y0 + 4} />
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

      {/* ⚠ THE `bar` PROP IS PASSED EMPTY ON PURPOSE, AND THE BAR IS DRAWN
          BELOW IT. `Cartridge` hardcodes its bar block at `fontSize="10"`
          UNSCALED — `k` never reaches it — so on a k 1.875 card the title
          letters 21.6 and the bar letters 10, i.e. 5.4px at the binding
          preset. That is the same rung the owner just ruled illegible.
          Passing the prop (rather than omitting it) is what SUPPRESSES the
          cartridge's native lane/autonomy row; omitting it prints `WIDE` a
          second time, which is the defect that cost `fused` its third step.
          An empty label renders an empty `<text>`, which the readout's walk
          skips — it counts non-empty nodes only.
          ⚠ On promotion this wants a `barFs` prop on `Cartridge` instead;
          production passes nothing today, so adding one is additive. */}
      <Cartridge
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.w}
        h={CHIP.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={CHIP_K}
        bar={{ label: "", lines: [] }}
      />
      <BarBlock
        x={CHIP.x + 13 * CHIP_K}
        y={BAR_Y}
        measure={BAR_MEASURE}
        bar={pda.cfg.bar}
        fs={FS.bar}
        led={led}
      />
    </>
  );
}
