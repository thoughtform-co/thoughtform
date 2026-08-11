"use client";

import {
  Cartridge,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  BOARD,
  FS,
  TRACK,
  Wire,
  OwnerPlate,
  QLabel,
  barSpecs,
  charsFor,
  groupsOf,
  ownerSpecs,
  valueInk,
  valueLines,
  valueSpecs,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 4 · RAIL — the plate carries the answer, the rail carries the question.
 *
 * The city's own law, applied here: *nothing is lettered on a unit plate.*
 * Every key leaves its box and lines up on an outboard rail down the left,
 * right-aligned against a single edge; what remains in the field is the
 * ANSWER ALONE, at **fs 22** — twice the shipped size.
 *
 * With the key gone the measure is 615 units, so all six answers letter on
 * one line with room to spare, and six rows read as one list rather than as
 * six boxes. The reference precedent is the security-systems board, where
 * `W 4035 / C 2047` hang OUTSIDE the frame they belong to.
 *
 * ⚠ THERE ARE NO HOUSINGS AND THAT IS THE POINT — a hairline per row does the
 * work six rectangles were doing. The cable moves to the right margin and
 * runs the full depth of the list, tapping in at each question.
 */

export const RAIL_VIEWBOX = "36 48 828 912";

const OWNER = { x: 210, y: 72, w: 480, h: 96 } as const;
const CHIP = { x: 318, y: 200, w: 264, h: 204 } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;

/** The rail's own edge, and the field that starts after it. */
const RAIL_X = 205;
const FIELD_X = 225;
const KEY_MEASURE = RAIL_X - BOARD.x0;
const VAL_MEASURE = BOARD.x1 - FIELD_X;

const GROUP_TOP = [440, 612, 784] as const;
const ROW_H = 62;
const GROUP_H = 28 + ROW_H * 2;

/** The bus runs OUTSIDE the board, in the crop's right margin. */
const BUS_X = 852;
const BAR_MEASURE = CHIP.w - 26;

export function railLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const groups = groupsOf(pda);
  const specs: LetterSpec[] = [
    ...ownerSpecs("rail.owner", pda, {
      ownerFs: FS.owner,
      measure: 300,
      autoMeasure: 118,
      noteMeasure: OWNER.w - 40,
    }),
    ...barSpecs("rail.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
  for (const g of groups) {
    specs.push({
      slot: `rail.${g.part}.q`,
      text: g.q,
      fs: FS.q,
      track: TRACK.q,
      measure: BOARD.x1 - BOARD.x0,
    });
    for (const cell of g.cells) {
      specs.push({
        slot: `rail.${g.part}.${cell.key}.k`,
        text: cell.key,
        fs: 11,
        track: TRACK.key,
        measure: KEY_MEASURE,
      });
      /* cap 1 — the row is 62 units and a second line at fs 22 would land
         28 units past its floor. 615 units is 41 characters against a worst
         case of 25, so nothing in the record wants one; the overflow line is
         still declared at measure 0 so a future value that does fails loudly
         rather than losing its tail. */
      specs.push(
        ...valueSpecs(`rail.${g.part}.${cell.key}.v`, cell.value, FS.vHero, VAL_MEASURE, 1)
      );
    }
  }
  return specs;
}

export function VariantRail({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const groups = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

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

      {/* The bus: out of the card's FLOOR, across just above the list, then
          down the margin its full depth.
          ⚠ It used to leave the card's right FLANK at mid-height, which put a
          270-unit horizontal leg through empty space and made the run read as
          a bracket drawn around the rows rather than as a feed into them. A
          conductor should hug what it serves. */}
      <Wire
        pts={[
          [CHIP_R - 60, CHIP_B],
          [CHIP_R - 60, GROUP_TOP[0] - 20],
          [BUS_X, GROUP_TOP[0] - 20],
          [BUS_X, GROUP_TOP[2] + GROUP_H - 20],
        ]}
        n={5}
        stroke={wire}
        dashed={led}
      />

      {/* The rail itself — one edge every key answers to. */}
      <line
        x1={RAIL_X}
        y1={GROUP_TOP[0] + 24}
        x2={RAIL_X}
        y2={GROUP_TOP[2] + GROUP_H}
        stroke="var(--pda-hair2)"
      />

      {groups.map((g, gi) => {
        const top = GROUP_TOP[gi];
        return (
          <g key={g.part}>
            <QLabel x={BOARD.x0} y={top + 20} text={g.q} />
            <Wire
              pts={[
                [BUS_X, top + 28 + ROW_H],
                [BOARD.x1, top + 28 + ROW_H],
              ]}
              n={4}
              stroke={gi === 0 ? green : wire}
              dashed={led}
            />
            {g.cells.map((cell, i) => {
              const rowY = top + 28 + i * ROW_H;
              const base = rowY + 38;
              return (
                <g key={cell.key}>
                  <line
                    x1={BOARD.x0}
                    y1={rowY}
                    x2={BOARD.x1}
                    y2={rowY}
                    stroke="var(--pda-hair2)"
                    opacity={i === 0 ? 1 : 0.55}
                  />
                  <text
                    x={RAIL_X - 14}
                    y={base}
                    textAnchor="end"
                    fontSize={11}
                    letterSpacing=".22em"
                    fill="var(--pda-txt2)"
                  >
                    {cell.key}
                  </text>
                  {valueLines(cell.value, FS.vHero, VAL_MEASURE, 1).map((line, li) => (
                    <text
                      key={li}
                      x={FIELD_X}
                      y={base}
                      fontSize={FS.vHero}
                      letterSpacing=".08em"
                      fill={valueInk(cell.kind, led)}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
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
