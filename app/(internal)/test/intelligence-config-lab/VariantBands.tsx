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
 * 3 · BANDS — stop fighting a portrait crop.
 *
 * The crop is `828 × 912`, i.e. TALLER THAN IT IS WIDE, and the shipped board
 * spends that height on two tall side nodes whose measure is only 212 units.
 * Turn the three questions into full-width rows instead and each answer gets
 * **336 units** — enough that every value in the record, including the worst
 * (`CAMPAIGN + AUDIENCE FACTS`, 25 chars), letters on ONE LINE at fs 18.
 *
 * That is the whole argument: a portrait crop wants rows, and a value that
 * never wraps is a value a reader takes in at a glance.
 *
 * The cable becomes a BACKPLANE. One bundle drops from the card straight down
 * the 60-unit gutter between the two answer columns, tapping left and right
 * into each band — so the wiring runs through the whole drawing rather than
 * stopping at three stubs. The band rules BREAK at the bus rather than
 * crossing it: a conductor and a silkscreen rule that share a pixel read as a
 * short.
 */

export const BANDS_VIEWBOX = "36 48 828 912";

const OWNER = { x: 210, y: 72, w: 480, h: 96 } as const;
const CHIP = { x: 318, y: 250, w: 264, h: 204 } as const;
const CHIP_B = CHIP.y + CHIP.h;

/** Two answer columns with a 60-unit gutter centred on the board's midline —
 *  the gutter IS the bus's route, so it is sized for a 6-wire bundle. */
const COL_W = 360;
const COL_L = BOARD.x0;
const COL_R = BOARD.x1 - COL_W;
const GUTTER_L = COL_L + COL_W;
const GUTTER_R = COL_R;

const BAND_H = 132;
/** The record never wraps at this measure — 336 units is 27 characters at
 *  fs 18 against a 25-character worst case — but the cap is 2, and a cell
 *  sized for one line would let a future value fall out of its own ground. */
const CELL_H = 96;
const BAND_Y = [520, 660, 800] as const;

const T: CellType = { keyFs: FS.key, valueFs: FS.vWide, measure: COL_W - 24, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function bandsLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const groups = groupsOf(pda);
  return [
    ...ownerSpecs("bands.owner", pda, {
      ownerFs: FS.owner,
      measure: 300,
      autoMeasure: 118,
      noteMeasure: OWNER.w - 40,
    }),
    ...groups.flatMap((g) => groupSpecs(`bands.${g.part}`, g, FS.q, 360, T)),
    ...barSpecs("bands.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
}

export function VariantBands({ pda }: IclVariantProps) {
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

      {/* ── The backplane: one bundle the full depth of the answer stack. ── */}
      <Wire
        pts={[
          [BOARD.mid, CHIP_B],
          [BOARD.mid, BAND_Y[2] + BAND_H],
        ]}
        n={6}
        stroke={wire}
        dashed={led}
      />

      {groups.map((g, gi) => {
        const y = BAND_Y[gi];
        const cellY = y + 36;
        const cy = cellY + CELL_H / 2;
        return (
          <g key={g.part}>
            <QLabel x={BOARD.x0} y={y + 22} text={g.q} />
            {/* The band rule, BROKEN at the bus. */}
            <line x1={BOARD.x0} y1={y + 30} x2={GUTTER_L} y2={y + 30} stroke="var(--pda-hair2)" />
            <line x1={GUTTER_R} y1={y + 30} x2={BOARD.x1} y2={y + 30} stroke="var(--pda-hair2)" />
            {/* The taps, left and right off the backplane. The first band's
                left tap carries the Skill, so it takes the provenance green;
                everything else is what the stream reaches or runs on. */}
            <Wire
              pts={[
                [BOARD.mid - 12, cy],
                [GUTTER_L, cy],
              ]}
              n={4}
              stroke={gi === 0 ? green : wire}
              dashed={led}
            />
            <Wire
              pts={[
                [BOARD.mid + 12, cy],
                [GUTTER_R, cy],
              ]}
              n={4}
              stroke={wire}
              dashed={led}
            />
            <Cell x={COL_L} y={cellY} w={COL_W} h={CELL_H} cell={g.cells[0]} t={T} led={led} />
            <Cell x={COL_R} y={cellY} w={COL_W} h={CELL_H} cell={g.cells[1]} t={T} led={led} />
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
