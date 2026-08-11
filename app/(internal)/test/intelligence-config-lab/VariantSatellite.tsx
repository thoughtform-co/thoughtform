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
  Wire,
  OwnerPlate,
  QLabel,
  barSpecs,
  cellSpecs,
  charsFor,
  groupsOf,
  ownerSpecs,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 5 · SATELLITE — less housing, more conductor.
 *
 * ADR-070's founding thesis was that **the wiring is the picture**; the board
 * has been quietly drifting back toward boxes ever since. This variant takes
 * the housings away entirely — a pod is a hairline, a key and an answer — and
 * spends everything it saves on two things the owner asked for: a BIGGER
 * centrepiece (k 2.0, a 352×272 card against the shipped 264×204) and CABLES
 * WITH REAL LENGTH, doglegged through their own channels instead of stubbed
 * across a 24-unit gutter.
 *
 * ⚠ THE CHANNELS ARE WHY THE CARD IS k 1.8 AND NOT k 2.0. A bundle needs a
 * lane of its own to read as a run rather than a stub, and the pods need 200
 * units or the record does not fit them — the fit guard caught it on its
 * first run: `BUDGET + COMMITMENT FACTS` (W-049) wraps to THREE lines in a
 * 170-wide pod at fs 16, and the third was being sliced off silently. So the
 * centrepiece gave back the width instead of the answers giving back their
 * size. The pods are 200, the channels are 32, and the card is still the
 * largest on the board.
 */

export const SATELLITE_VIEWBOX = "36 48 828 912";

const OWNER = { x: 210, y: 78, w: 480, h: 96 } as const;
/** k 1.8 — still the largest centrepiece of the seven (316.8 × 244.8 against
 *  the shipped 264 × 204). `w` and `h` MUST stay `176 × k` / `136 × k` or the
 *  cartridge's internal offsets stop agreeing with its own body path. */
const CHIP_K = 1.8;
const CHIP = { x: 291.6, y: 340, w: 176 * CHIP_K, h: 136 * CHIP_K } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const POD_W = 200;
const SIDE_Y = [340, 450] as const;
/**
 * ⚠ A LANE PER RUN, AND A DEPARTURE POINT PER RUN. Both side bundles used to
 * leave the card at the same point and share one channel, which drew them as
 * a single doubled bundle that forked — the opposite of the reading. Each run
 * now takes its own exit height and its own lane inside the 32-unit gap.
 */
const CH_L = [268, 284] as const;
const CH_R = [616, 632] as const;
const EXIT = [-34, 34] as const;

const BASE_Y = 780;
const BASE_W = 380;

const TSide: CellType = { keyFs: FS.key, valueFs: FS.v, measure: POD_W, cap: 2 };
const TBase: CellType = { keyFs: FS.key, valueFs: FS.vWide, measure: BASE_W, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function satelliteLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  const q = (slot: string, text: string) => ({
    slot,
    text,
    fs: FS.q,
    track: 0.14,
    measure: 280,
  });
  return [
    ...ownerSpecs("sat.owner", pda, {
      ownerFs: FS.owner,
      measure: 280,
      autoMeasure: 145,
      noteMeasure: OWNER.w - 40,
    }),
    q("sat.runs.q", runs.q),
    ...cellSpecs(`sat.runs.${runs.cells[0].key}`, runs.cells[0], TSide),
    ...cellSpecs(`sat.runs.${runs.cells[1].key}`, runs.cells[1], TSide),
    q("sat.rch.q", rch.q),
    ...cellSpecs(`sat.rch.${rch.cells[0].key}`, rch.cells[0], TSide),
    ...cellSpecs(`sat.rch.${rch.cells[1].key}`, rch.cells[1], TSide),
    q("sat.whr.q", whr.q),
    ...cellSpecs(`sat.whr.${whr.cells[0].key}`, whr.cells[0], TBase),
    ...cellSpecs(`sat.whr.${whr.cells[1].key}`, whr.cells[1], TBase),
    ...barSpecs("sat.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
}

export function VariantSatellite({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const [runs, rch, whr] = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

  /** A side pod's field baseline — the wire lands on it, not on the rule. */
  const fieldY = (y: number) => y + 34;

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

      {/* ── The runs, doglegged through their own channels ─────────────── */}
      {SIDE_Y.map((y, i) => (
        <Wire
          key={`l${i}`}
          pts={[
            [CHIP.x, CHIP_CY + EXIT[i]],
            [CH_L[i], CHIP_CY + EXIT[i]],
            [CH_L[i], fieldY(y)],
            [BOARD.x0 + POD_W, fieldY(y)],
          ]}
          n={4}
          pitch={3}
          stroke={green}
          dashed={led}
        />
      ))}
      {SIDE_Y.map((y, i) => (
        <Wire
          key={`r${i}`}
          pts={[
            [CHIP_R, CHIP_CY + EXIT[i]],
            [CH_R[i], CHIP_CY + EXIT[i]],
            [CH_R[i], fieldY(y)],
            [BOARD.x1 - POD_W, fieldY(y)],
          ]}
          n={4}
          pitch={3}
          stroke={wire}
          dashed={led}
        />
      ))}
      <Wire
        pts={[
          [BOARD.mid - 30, CHIP_B],
          [BOARD.mid - 30, BASE_Y - 58],
          [BOARD.x0 + 90, BASE_Y - 28],
          [BOARD.x0 + 90, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [BOARD.mid + 30, CHIP_B],
          [BOARD.mid + 30, BASE_Y - 58],
          [BOARD.x1 - 90, BASE_Y - 28],
          [BOARD.x1 - 90, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />

      {/* ── The pods: a rule, a key, an answer. No box. ─────────────────── */}
      <QLabel x={BOARD.x0} y={SIDE_Y[0] - 22} text={runs.q} />
      {runs.cells.map((c, i) => (
        <g key={c.key}>
          <line
            x1={BOARD.x0}
            y1={SIDE_Y[i]}
            x2={BOARD.x0 + POD_W}
            y2={SIDE_Y[i]}
            stroke="var(--pda-hair2)"
          />
          <Field x={BOARD.x0} y={SIDE_Y[i]} cell={c} t={TSide} led={led} />
        </g>
      ))}

      <QLabel x={BOARD.x1 - POD_W} y={SIDE_Y[0] - 22} text={rch.q} />
      {rch.cells.map((c, i) => (
        <g key={c.key}>
          <line
            x1={BOARD.x1 - POD_W}
            y1={SIDE_Y[i]}
            x2={BOARD.x1}
            y2={SIDE_Y[i]}
            stroke="var(--pda-hair2)"
          />
          <Field x={BOARD.x1 - POD_W} y={SIDE_Y[i]} cell={c} t={TSide} led={led} />
        </g>
      ))}

      <QLabel x={BOARD.x0} y={BASE_Y - 22} text={whr.q} />
      {whr.cells.map((c, i) => {
        const x = i === 0 ? BOARD.x0 : BOARD.x1 - BASE_W;
        return (
          <g key={c.key}>
            <line x1={x} y1={BASE_Y} x2={x + BASE_W} y2={BASE_Y} stroke="var(--pda-hair2)" />
            <Field x={x} y={BASE_Y} cell={c} t={TBase} led={led} />
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
        k={CHIP_K}
        bar={{ label: "THE BAR", lines: barLines }}
      />
    </>
  );
}
