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
  QLabel,
  barSpecs,
  cellSpecs,
  charsFor,
  groupsOf,
  lineBox,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 6 · LEDGER — a configuration is a record; read it as one column.
 *
 * The least diagrammatic of the seven, and deliberately so. The centrepiece
 * and its seat hold a tall left column; all six answers become ONE right-hand
 * column of hairline-separated rows, read top to bottom in the order the
 * questions are asked. Nothing is arranged around anything.
 *
 * The seat's plate STACKS its rows here rather than splitting into two
 * columns — inside a 320-wide column the shipped two-column plate would put
 * a 277u seat through `DECIDES ALONE`'s 107u, so autonomy drops to its own
 * row under a hairline. It costs 40 units of height and buys the owner fs 17.
 *
 * The cable becomes a TRUNK AND A SPINE: one bundle out of the card's flank
 * to a vertical spine, which runs the depth of the list and taps into each
 * question. That spine is also the column rule — a separator that is a
 * conductor, which is the only honest way to have both in this width.
 */

export const LEDGER_VIEWBOX = "36 48 828 912";

const LCOL = { x: BOARD.x0, w: 320 } as const;
const OWNER = { x: LCOL.x, y: 150, w: LCOL.w, h: 140 } as const;
const CHIP = { x: LCOL.x + (LCOL.w - 264) / 2, y: 330, w: 264, h: 204 } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const SPINE_X = 400;
const RCOL_X = 420;
const RCOL_W = BOARD.x1 - RCOL_X;

const GROUP_TOP = [130, 380, 630] as const;
/** 96 holds two lines of 18 stepped at 1.7 em. The record takes one at this
 *  measure (400 units = 32 characters against a 25-character worst), but a
 *  row sized for today's copy is a row that breaks on tomorrow's. */
const ROW_H = 96;
const OWNER_MEASURE = OWNER.w - 40;

const T: CellType = { keyFs: FS.key, valueFs: FS.vWide, measure: RCOL_W - 20, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function ledgerLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const groups = groupsOf(pda);
  const specs: LetterSpec[] = [
    {
      slot: "ledger.owner.k",
      text: "WHO OWNS IT",
      fs: FS.key,
      track: TRACK.key,
      measure: OWNER_MEASURE,
    },
    {
      slot: "ledger.owner",
      text: pda.owner,
      fs: FS.owner,
      track: TRACK.v,
      measure: OWNER_MEASURE,
    },
    {
      slot: "ledger.owner.decides",
      text: "DECIDES ALONE",
      fs: FS.key,
      track: TRACK.key,
      measure: OWNER_MEASURE,
    },
    {
      slot: "ledger.owner.autonomy",
      text: pda.autonomy,
      fs: FS.autonomy,
      track: TRACK.v,
      measure: OWNER_MEASURE,
    },
    ...barSpecs("ledger.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
  if (pda.ownerNote) {
    specs.push({
      slot: "ledger.owner.note",
      text: pda.ownerNote,
      fs: FS.key,
      track: TRACK.v,
      measure: OWNER_MEASURE,
    });
  }
  for (const g of groups) {
    specs.push({
      slot: `ledger.${g.part}.q`,
      text: g.q,
      fs: FS.q,
      track: TRACK.q,
      measure: RCOL_W,
    });
    for (const cell of g.cells) {
      specs.push(...cellSpecs(`ledger.${g.part}.${cell.key}`, cell, T));
    }
  }
  return specs;
}

export function VariantLedger({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const groups = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));
  const cy = (i: number) => GROUP_TOP[i] + 28 + ROW_H;

  return (
    <>
      {/* ── The seat, stacked: the column is too narrow for two. ────────── */}
      <g>
        <path
          d={`M${OWNER.x + 14},${OWNER.y} H${OWNER.x + OWNER.w} V${OWNER.y + OWNER.h} H${OWNER.x} V${OWNER.y + 14} Z`}
          fill={led ? "rgba(255, 255, 255, 0.02)" : "rgba(126, 159, 102, 0.09)"}
          stroke={green}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <text
          x={OWNER.x + 20}
          y={OWNER.y + 28}
          fontSize={FS.key}
          letterSpacing=".22em"
          fill="var(--pda-txt2)"
        >
          WHO OWNS IT
        </text>
        <text
          x={OWNER.x + 20}
          y={OWNER.y + 32 + lineBox(FS.owner)}
          fontSize={FS.owner}
          letterSpacing=".08em"
          fill={green}
        >
          {pda.owner}
        </text>
        {pda.ownerNote ? (
          <text
            x={OWNER.x + 20}
            y={OWNER.y + 38 + lineBox(FS.owner) + lineBox(FS.key)}
            fontSize={FS.key}
            letterSpacing=".08em"
            fill="var(--pda-txt2)"
          >
            {pda.ownerNote}
          </text>
        ) : null}
        <line
          x1={OWNER.x + 20}
          y1={OWNER.y + 88}
          x2={OWNER.x + OWNER.w - 20}
          y2={OWNER.y + 88}
          stroke="var(--pda-hair2)"
        />
        <text
          x={OWNER.x + 20}
          y={OWNER.y + 108}
          fontSize={FS.key}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          DECIDES ALONE
        </text>
        <text
          x={OWNER.x + 20}
          y={OWNER.y + 128}
          fontSize={FS.autonomy}
          letterSpacing=".08em"
          fill="var(--pda-hot)"
        >
          {pda.autonomy}
        </text>
      </g>

      {/* The seat answers for the machine directly beneath it. */}
      <g stroke={green}>
        <line
          x1={CHIP.x + CHIP.w / 2}
          y1={OWNER.y + OWNER.h}
          x2={CHIP.x + CHIP.w / 2}
          y2={CHIP.y}
          strokeDasharray="6 5"
          opacity="0.95"
        />
        <line
          x1={CHIP.x + CHIP.w / 2 - 9}
          y1={CHIP.y}
          x2={CHIP.x + CHIP.w / 2 + 9}
          y2={CHIP.y}
          opacity="0.95"
        />
      </g>

      {/* ── Trunk, spine, taps. The spine doubles as the column rule. ──── */}
      <Wire
        pts={[
          [CHIP_R, CHIP_CY],
          [SPINE_X, CHIP_CY],
        ]}
        n={8}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [SPINE_X, cy(0)],
          [SPINE_X, cy(2)],
        ]}
        n={8}
        stroke={wire}
        dashed={led}
      />
      {groups.map((g, i) => (
        <Wire
          key={g.part}
          pts={[
            [SPINE_X, cy(i)],
            [RCOL_X, cy(i)],
          ]}
          n={4}
          stroke={i === 0 ? green : wire}
          dashed={led}
        />
      ))}

      {groups.map((g, gi) => (
        <g key={g.part}>
          <QLabel x={RCOL_X} y={GROUP_TOP[gi] + 20} text={g.q} />
          {g.cells.map((cell, i) => {
            const rowY = GROUP_TOP[gi] + 28 + i * ROW_H;
            return (
              <g key={cell.key}>
                <line
                  x1={RCOL_X}
                  y1={rowY}
                  x2={BOARD.x1}
                  y2={rowY}
                  stroke="var(--pda-hair2)"
                  opacity={i === 0 ? 1 : 0.55}
                />
                <Field x={RCOL_X} y={rowY + 2} cell={cell} t={T} led={led} />
              </g>
            );
          })}
        </g>
      ))}

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
