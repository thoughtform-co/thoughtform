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
  QLabel,
  barSpecs,
  charsFor,
  groupSpecs,
  groupsOf,
  lineBox,
  ownerSpecs,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 2 · FUSED — the seat is part of the machine it answers for.
 *
 * The owner's note, taken literally: WHO OWNS IT stops being a plate floating
 * above the card on a dashed line and becomes the TOP OF THE CENTREPIECE —
 * one stepped object, welded at a seam with contact ticks drawn across it so
 * the join is a join rather than an abutment.
 *
 * ⚠ THE BAR STAYS ON THE CARD'S FACE, and a capture caught why. A third step
 * below the card meant withholding `Cartridge`'s `bar` prop, which un-hid its
 * native lane/autonomy row — so `WIDE` printed twice, once labelled
 * `DECIDES ALONE` on the collar and once bare on the card. This surface has
 * removed a console head, a foot and a designator for exactly that
 * (ADR-063 U1, ADR-070 U8); a variant may not reintroduce it for a
 * composition. Two elements, one seam.
 *
 * ⚠ THE COLLISION ITSELF IS GONE (2026-08-13): the card's foot is the shared
 * lane METER now and `autonomy` came off it entirely, so withholding `bar` no
 * longer prints anything twice. The rule this variant was decided under still
 * stands — it just no longer has this particular way of being broken.
 *
 * ⚠ THE DASHED AUTHORITY LINE IS DELETED HERE, AND THAT IS THE VARIANT. Every
 * other drawing on this surface says "answerable-to" with a dashed run; this
 * one says it by making the seat structural. If the fusion reads, the line was
 * never carrying the relation — the distance was.
 *
 * The collar overhangs the card by 98 a side. That is not decoration: at
 * fs 17 the worst seat (`THE PERSON DOES THE WORK`) letters 277u, and it has
 * to clear `DECIDES ALONE`'s 107u right column inside the same band. 460 is
 * the width where the two columns cannot meet — authority spans the machine.
 */

export const FUSED_VIEWBOX = "36 48 828 912";

const NODE_W = 234;
const CELL_W = 232;
const CELL_H = 94;
const CELL_GAP = 6;
const HEAD_H = 44;
const NODE_H = HEAD_H + CELL_H * 2 + CELL_GAP + 4;
const BASE_W = CELL_W * 2 + CELL_GAP + 2;
const BASE_H = HEAD_H + CELL_H + 4;

/** The stepped centre: collar → card, touching. */
const COLLAR = { x: 220, y: 200, w: 460, h: 100 } as const;
const CHIP = { x: 318, y: 300, w: 264, h: 204 } as const;

const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;
const RIGHT_X = CHIP_R + 24;
/** Seated below the collar rather than centred on the card — the collar is
 *  460 wide and would otherwise cross both side nodes. */
const NODE_Y = 310;
const BASE_X = BOARD.mid - BASE_W / 2;
const BASE_Y = BOARD.y1 - BASE_H;

const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - 24, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;

export function fusedLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  return [
    ...ownerSpecs("fused.owner", pda, {
      ownerFs: FS.owner,
      measure: 270,
      autoMeasure: 160,
      noteMeasure: COLLAR.w - 40,
    }),
    ...groupSpecs("fused.runs", runs, FS.q, NODE_W - 32, T),
    ...groupSpecs("fused.rch", rch, FS.q, NODE_W - 32, T),
    ...groupSpecs("fused.whr", whr, FS.q, BASE_W - 32, T),
    ...barSpecs("fused.bar", pda.cfg.bar, FS.bar, BAR_MEASURE),
  ];
}

export function VariantFused({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const [runs, rch, whr] = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const barLines = wrapLines(pda.cfg.bar, charsFor(BAR_MEASURE, FS.bar));

  /** The weld: contact ticks across a seam, the way a cartridge is keyed into
   *  a socket. Four per seam, inset from the narrower of the two edges. */
  const seam = (x: number, w: number, y: number) => (
    <g stroke={green} opacity="0.8">
      {Array.from({ length: 4 }, (_, i) => {
        const sx = x + w * (0.2 + i * 0.2);
        return <line key={i} x1={sx} y1={y - 5} x2={sx} y2={y + 5} />;
      })}
    </g>
  );

  const node = (x: number, y: number, w: number, h: number, gi: 0 | 1 | 2, stacked: boolean) => {
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
      {/* ── The collar: the seat, drawn as the head of the centrepiece. Its
              bottom edge is SQUARE — it is welded, not a separate housing. ── */}
      <g>
        <path
          d={`M${COLLAR.x + 14},${COLLAR.y} H${COLLAR.x + COLLAR.w} V${COLLAR.y + COLLAR.h} H${COLLAR.x} V${COLLAR.y + 14} Z`}
          fill={led ? "rgba(255, 255, 255, 0.02)" : "rgba(126, 159, 102, 0.09)"}
          stroke={green}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <text
          x={COLLAR.x + 20}
          y={COLLAR.y + 30}
          fontSize={FS.key}
          letterSpacing=".22em"
          fill="var(--pda-txt2)"
        >
          WHO OWNS IT
        </text>
        <text
          x={COLLAR.x + 20}
          y={COLLAR.y + 34 + lineBox(FS.owner)}
          fontSize={FS.owner}
          letterSpacing=".08em"
          fill={green}
        >
          {pda.owner}
        </text>
        {pda.ownerNote ? (
          <text
            x={COLLAR.x + 20}
            y={COLLAR.y + 40 + lineBox(FS.owner) + lineBox(FS.key)}
            fontSize={FS.key}
            letterSpacing=".08em"
            fill="var(--pda-txt2)"
          >
            {pda.ownerNote}
          </text>
        ) : null}
        <text
          x={COLLAR.x + COLLAR.w - 20}
          y={COLLAR.y + 30}
          textAnchor="end"
          fontSize={FS.key}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          DECIDES ALONE
        </text>
        <text
          x={COLLAR.x + COLLAR.w - 20}
          y={COLLAR.y + 34 + lineBox(FS.owner)}
          textAnchor="end"
          fontSize={FS.autonomy}
          letterSpacing=".08em"
          fill="var(--pda-hot)"
        >
          {pda.autonomy}
        </text>
      </g>
      {seam(CHIP.x, CHIP.w, CHIP.y)}

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

      {node(BOARD.x0, NODE_Y, NODE_W, NODE_H, 0, true)}
      {node(RIGHT_X, NODE_Y, NODE_W, NODE_H, 1, true)}
      {node(BASE_X, BASE_Y, BASE_W, BASE_H, 2, false)}

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
