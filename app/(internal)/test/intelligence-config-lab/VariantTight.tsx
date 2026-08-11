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
 * 1 · TIGHT — the same board with the ladder inverted. THE CONTROL.
 *
 * Identical seats, identical cables, identical width chain
 * (`24 | 234 | 24 | 264 | 24 | 234 | 24`). The ONLY things that move are the
 * cell height and the type ladder, so this variant answers the one question
 * the others cannot: how much of "cramped" was never layout at all.
 *
 * Sub-cards 158 → 94 (content height), the question 14 → 13, the key 11 → 13
 * and the value 11.5 → 15. The freed 128 units per side node go to the drop,
 * which is the cable the owner asked to keep.
 *
 * The owner plate widens 400 → 480 for one arithmetic reason: the worst seat
 * (`THE PERSON DOES THE WORK`, 24 chars) letters 261u, and inside a 400 plate
 * that meets `DECIDES ALONE`'s right column. The columns cannot meet — so the
 * plate grows rather than the type shrinking.
 *
 * ⚠ ITS BAR IS STILL ILLEGIBLE, AND ONLY `seated` ESCAPES IT. Every variant
 * here passes `bar` to `Cartridge`, which hardcodes `fontSize="10"` UNSCALED
 * — so the bar renders 5.4px at the binding preset whatever `k` is, and it is
 * what holds this drawing's minPx at 5.4 while `seated` reads 6.5. Fixing it
 * means drawing the bar outside the cartridge (see `seated`) or adding a
 * `barFs` prop to `Cartridge` on promotion.
 */

export const TIGHT_VIEWBOX = "36 48 828 912";

const NODE_W = 234;
const CELL_W = 232;
/** Two lines of 16 stepped at 1.7 em bottom out at 84.6 from the cell's top;
 *  94 is that plus the ground's own breathing room. Still 64 units under the
 *  shipped 158, which is the whole point. */
const CELL_H = 94;
const CELL_GAP = 6;
const HEAD_H = 44;
const NODE_H = HEAD_H + CELL_H * 2 + CELL_GAP + 4;
const BASE_W = CELL_W * 2 + CELL_GAP + 2;
const BASE_H = HEAD_H + CELL_H + 4;

const CHIP = { x: 318, y: 335, w: 264, h: 204 } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const RIGHT_X = CHIP_R + 24;
const NODE_Y = CHIP_CY - NODE_H / 2;
const BASE_X = BOARD.mid - BASE_W / 2;
const BASE_Y = BOARD.y1 - BASE_H;

const OWNER = { x: 210, y: 72, w: 480, h: 96 } as const;

/** Pad 12 each side of a 232 cell. At fs 15 that is 20 characters, so the
 *  record's worst value (25) takes two lines and its longest single word
 *  (`RECONCILIATION`, 143u) clears the wall. */
const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - 24, cap: 2 };

const BAR_MEASURE = CHIP.w - 26;

export function tightLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  return [
    ...ownerSpecs("tight.owner", pda, {
      ownerFs: FS.owner,
      measure: 280,
      autoMeasure: 145,
      noteMeasure: OWNER.w - 40,
    }),
    ...groupSpecs("tight.runs", runs, FS.q, NODE_W - 32, T),
    ...groupSpecs("tight.rch", rch, FS.q, NODE_W - 32, T),
    ...groupSpecs("tight.whr", whr, FS.q, BASE_W - 32, T),
    ...barSpecs("tight.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
}

export function VariantTight({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const [runs, rch, whr] = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

  const node = (x: number, y: number, w: number, h: number, q: string, stacked: boolean) => {
    const g = q === runs.q ? runs : q === rch.q ? rch : whr;
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
            x={x + 1 + (stacked ? 0 : i * (CELL_W + CELL_GAP))}
            y={y + HEAD_H + (stacked ? i * (CELL_H + CELL_GAP) : 0)}
            w={CELL_W}
            h={CELL_H}
            cell={c}
            t={T}
            led={led}
          />
        ))}
      </g>
    );
  };

  return (
    <>
      <OwnerPlate {...OWNER} work={pda} ownerFs={FS.owner} led={led} />

      {/* The seat's own connector: ONE DASHED LINE in the plate's own green at
          full weight, never a bundle. The seat is AUTHORITY, not data — it is
          answerable-to rather than feeds-into, and the contrast with the
          nodes' thick bundles is the reading (ADR-070 U5/U6). */}
      <g stroke={green}>
        <line
          x1={BOARD.mid}
          y1={OWNER.y + OWNER.h}
          x2={BOARD.mid}
          y2={CHIP.y}
          strokeDasharray="6 5"
          opacity="0.95"
        />
        <line x1={BOARD.mid - 9} y1={CHIP.y} x2={BOARD.mid + 9} y2={CHIP.y} opacity="0.95" />
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
          [BOARD.mid - 44, BASE_Y - 78],
          [BOARD.mid - 74, BASE_Y - 48],
          [BOARD.mid - 74, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [BOARD.mid + 44, CHIP_B],
          [BOARD.mid + 44, BASE_Y - 78],
          [BOARD.mid + 74, BASE_Y - 48],
          [BOARD.mid + 74, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />

      {node(BOARD.x0, NODE_Y, NODE_W, NODE_H, runs.q, true)}
      {node(RIGHT_X, NODE_Y, NODE_W, NODE_H, rch.q, true)}
      {node(BASE_X, BASE_Y, BASE_W, BASE_H, whr.q, false)}

      <Cartridge
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.w}
        h={CHIP.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={1.5}
        bar={{ label: "THE BAR", lines: barLines }}
      />
    </>
  );
}
