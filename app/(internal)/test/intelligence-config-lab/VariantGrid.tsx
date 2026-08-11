"use client";

import {
  Cartridge,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  BOARD,
  FS,
  Field,
  type CellType,
  TRACK,
  Wire,
  OwnerPlate,
  barSpecs,
  cellSpecs,
  charsFor,
  groupsOf,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 7 · GRID — hairlines instead of boxes.
 *
 * The most reductive of the seven. There are no housings at all: the answers
 * sit in a strict 2 × 3 modular grid whose only chrome is the rules between
 * cells, and each row is one question. Every unit the shipped drawing spent
 * on six rectangles and their padding goes to air and type instead — the
 * cells are 170 units tall holding two lines of 18, which is the largest
 * type-to-chrome ratio on the board.
 *
 * ⚠ THE CENTRE RULE IS THE CABLE. The grid needs a vertical divider and the
 * card needs a run to its answers; making them the same object is the only
 * honest way to have both in one width — so the bus drops out of the card and
 * becomes the column separator, tapping left and right at every row. The
 * horizontal rules BREAK where it passes: a rule that crosses a conductor
 * draws a short.
 */

export const GRID_VIEWBOX = "36 48 828 912";

const OWNER = { x: 210, y: 72, w: 480, h: 96 } as const;
const CHIP = { x: 318, y: 200, w: 264, h: 204 } as const;
const CHIP_B = CHIP.y + CHIP.h;

const GRID_TOP = 430;
const ROW_H = 170;
const ROW_Y = [GRID_TOP, GRID_TOP + ROW_H, GRID_TOP + ROW_H * 2] as const;
const GRID_BOTTOM = GRID_TOP + ROW_H * 3;

/** The bus's half-width — the rules stop here and resume on the far side. */
const BUS_HALF = 12;
const PAD = 20;
const CELL_MEASURE = BOARD.mid - BOARD.x0 - PAD - BUS_HALF - 8;

const T: CellType = { keyFs: FS.key, valueFs: FS.vWide, measure: CELL_MEASURE, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function gridLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const groups = groupsOf(pda);
  const specs: LetterSpec[] = [
    ...barSpecs("grid.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
    {
      slot: "grid.owner.k",
      text: "WHO OWNS IT",
      fs: FS.key,
      track: TRACK.key,
      measure: 280,
    },
    { slot: "grid.owner", text: pda.owner, fs: FS.owner, track: TRACK.v, measure: 300 },
    {
      slot: "grid.owner.decides",
      text: "DECIDES ALONE",
      fs: FS.key,
      track: TRACK.key,
      measure: 145,
    },
    {
      slot: "grid.owner.autonomy",
      text: pda.autonomy,
      fs: FS.autonomy,
      track: TRACK.v,
      measure: 145,
    },
  ];
  if (pda.ownerNote) {
    specs.push({
      slot: "grid.owner.note",
      text: pda.ownerNote,
      fs: FS.key,
      track: TRACK.v,
      measure: OWNER.w - 40,
    });
  }
  for (const g of groups) {
    specs.push({
      slot: `grid.${g.part}.q`,
      text: g.q,
      fs: FS.q,
      track: TRACK.q,
      measure: CELL_MEASURE,
    });
    for (const cell of g.cells) {
      specs.push(...cellSpecs(`grid.${g.part}.${cell.key}`, cell, T));
    }
  }
  return specs;
}

export function VariantGrid({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const groups = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

  /** A horizontal rule, broken where the bus passes through it. */
  const rule = (y: number, key: string) => (
    <g key={key} stroke="var(--pda-hair2)">
      <line x1={BOARD.x0} y1={y} x2={BOARD.mid - BUS_HALF} y2={y} />
      <line x1={BOARD.mid + BUS_HALF} y1={y} x2={BOARD.x1} y2={y} />
    </g>
  );

  return (
    <>
      <OwnerPlate {...OWNER} work={pda} ownerFs={FS.owner} led={led} />

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

      {/* The bus IS the grid's centre rule. */}
      <Wire
        pts={[
          [BOARD.mid, CHIP_B],
          [BOARD.mid, GRID_BOTTOM],
        ]}
        n={4}
        stroke={wire}
        dashed={led}
      />

      {[...ROW_Y, GRID_BOTTOM].map((y, i) => rule(y, `r${i}`))}

      {groups.map((g, gi) => {
        const y = ROW_Y[gi];
        const tapY = y + 78;
        return (
          <g key={g.part}>
            {/* Taps, left and right, at the row's answer line. */}
            <Wire
              pts={[
                [BOARD.mid - BUS_HALF, tapY],
                [BOARD.mid - BUS_HALF - 34, tapY],
              ]}
              n={3}
              stroke={gi === 0 ? green : wire}
              dashed={led}
            />
            <Wire
              pts={[
                [BOARD.mid + BUS_HALF, tapY],
                [BOARD.mid + BUS_HALF + 34, tapY],
              ]}
              n={3}
              stroke={wire}
              dashed={led}
            />
            <text
              x={BOARD.x0 + PAD}
              y={y + 30}
              fontSize={FS.q}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {g.q}
            </text>
            <Field x={BOARD.x0 + PAD} y={y + 42} cell={g.cells[0]} t={T} led={led} />
            <Field x={BOARD.mid + BUS_HALF + PAD} y={y + 42} cell={g.cells[1]} t={T} led={led} />
          </g>
        );
      })}

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
