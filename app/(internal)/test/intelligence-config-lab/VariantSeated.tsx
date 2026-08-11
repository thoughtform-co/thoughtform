"use client";

import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  BarBlock,
  Cell,
  FS,
  type CellType,
  TRACK,
  Wire,
  OwnerPlate,
  QLabel,
  barSpecs,
  groupSpecs,
  groupsOf,
} from "./configKit";
import { type IclRecord, type IclVariantProps, type LetterSpec } from "./variants";

/**
 * 8 · SEATED — the balanced sweep.
 *
 * ⚠ **THE CROP IS WIDER, AND THAT IS THE WHOLE ANSWER TO "WE ARE NOT USING
 * THE REAL ESTATE".** The owner's read was that the margins around the panels
 * are wasted; the measurement says he is looking at a LETTERBOX, not at
 * padding. `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the
 * two box ratios, the crop was PORTRAIT (828×912 = 0.908), and every measured
 * console field is LANDSCAPE — 603×493 (1.223), 679×548 (1.239), 850×760
 * (1.118). So the fit is height-bound at all three and the drawing is
 * horizontally letterboxed by **26 % / 27 % / 19 %** of the field.
 *
 * Widening the crop to **1000×912** costs NOTHING: the fit stays height-bound
 * (the widest crop that still is, is 1020 at p1920), so the meet — and with
 * it every rendered type size — is unchanged. It is 172 authoring units of
 * free width. They go where the owner asked: into the GUTTERS, so the cables
 * have somewhere to run (26 → **60**, more than double), and into the cards.
 *
 * ⚠ This is a LAB crop. ADR-070 U4 made the production crop portrait for a
 * tall-window field of 839×958; none of the three MEASURED desktop consoles
 * is that shape, so promotion has to re-check U4's case rather than assume it.
 *
 * The rest of the sweep, all owner (2026-08-11):
 *   · breathing room — the frames were cropping their own text. Header band
 *     44 → 52, cells 94 → 100 with a 10-unit top inset and 14 of side pad,
 *     and a 12-unit floor under the last cell (`WHAT RUNS IT` was sitting on
 *     its own bottom edge).
 *   · the seat sits higher, in a taller plate with its own inset.
 *   · ONE ink for every answer, and the keys in Tensor gold — see configKit.
 *   · the diagonal hatch and the dashed inset are gone; a divider rule does
 *     the separation they were doing badly.
 *   · the card is k 2.0 (352×272) and the side nodes are EXACTLY its height,
 *     so the three frames share one top and one bottom line.
 */

/* ⚠ 1000 WIDE, NOT 828 — see the header. The extra 172 units are free. */
export const SEATED_VIEWBOX = "0 48 1000 912";

/** This variant's own board — the kit's `BOARD` is scoped to the 828 crop. */
const B = { x0: 30, x1: 970, y0: 72, y1: 945, mid: 500 } as const;

/* ── The width chain: 30 | 234 | 60 | 352 | 60 | 234 | 30 = 1000 ────────── */
const NODE_W = 234;
const CELL_W = 232;
const GUTTER = 60;

const CELL_H = 100;
const CELL_GAP = 8;
const HEAD_H = 52;
const FLOOR = 12;
const NODE_H = HEAD_H + CELL_H * 2 + CELL_GAP + FLOOR;
const BASE_W = CELL_W * 2 + CELL_GAP + 2;
const BASE_H = HEAD_H + CELL_H + FLOOR;

/** k 2.0 — and `NODE_H` lands on 272 too, so the card and both side nodes
 *  share one top edge and one bottom edge. That alignment is the balance. */
const CHIP_K = 2;
const CHIP = { x: 324, y: 302, w: 176 * CHIP_K, h: 136 * CHIP_K } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const RIGHT_X = CHIP_R + GUTTER;
const NODE_Y = CHIP.y;
const BASE_X = B.mid - BASE_W / 2;
const BASE_Y = 724;

/** Taller, wider and inset — the seat had its text against its own ceiling. */
const OWNER = { x: 240, y: 128, w: 520, h: 112 } as const;
const OWNER_PADY = 8;

/** The neck. Third size, and the range is known: 110→170 read as a dark tab,
 *  140→240 as a buttress that took the eye off the card. */
const PYL = { y0: OWNER.y + OWNER.h, y1: CHIP.y, splay: 20, topW: 64, botW: 108 } as const;

const CELL_PAD = 14;
const CELL_PADY = 10;
/** 204 units is 20 characters at fs 15 — the record's worst value takes two
 *  lines and `RECONCILIATION` (143u) clears the wall with 60 to spare. */
const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - CELL_PAD * 2, cap: 2 };
const BAR_MEASURE = CHIP.w - 26;
/** Boxed between the cartridge title's descenders (~491) and the card's floor
 *  minus two lines of 15 (~509). */
const BAR_Y = 505;

export function seatedLettering(
  pda: IclVariantProps["pda"],
  _work: IclVariantProps["work"],
  _record: IclRecord
): LetterSpec[] {
  const [runs, rch, whr] = groupsOf(pda);
  const q = NODE_W - 36;
  return [
    {
      slot: "seated.owner.k",
      text: "WHO OWNS IT",
      fs: FS.key,
      track: TRACK.key,
      measure: 300,
    },
    { slot: "seated.owner", text: pda.owner, fs: FS.owner, track: TRACK.v, measure: 300 },
    {
      slot: "seated.owner.decides",
      text: "DECIDES ALONE",
      fs: FS.key,
      track: TRACK.key,
      measure: 150,
    },
    {
      slot: "seated.owner.autonomy",
      text: pda.autonomy,
      fs: FS.autonomy,
      track: TRACK.v,
      measure: 150,
    },
    ...(pda.ownerNote
      ? [
          {
            slot: "seated.owner.note",
            text: pda.ownerNote,
            fs: FS.key,
            track: TRACK.v,
            measure: OWNER.w - 40,
          },
        ]
      : []),
    ...groupSpecs("seated.runs", runs, FS.q, q, T),
    ...groupSpecs("seated.rch", rch, FS.q, q, T),
    ...groupSpecs("seated.whr", whr, FS.q, BASE_W - 36, T),
    ...barSpecs("seated.bar", pda.cfg.bar, FS.v, BAR_MEASURE),
  ];
}

export function VariantSeated({ pda }: IclVariantProps) {
  const led = !pda.configured;
  const [runs, rch, whr] = groupsOf(pda);
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";

  const l0 = B.mid - PYL.topW / 2;
  const r0 = B.mid + PYL.topW / 2;
  const l1 = B.mid - PYL.botW / 2;
  const r1 = B.mid + PYL.botW / 2;
  const ys = PYL.y1 - PYL.splay;

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
        <QLabel x={x + 20} y={y + 34} text={g.q} />
        <line x1={x + 1} y1={y + 42} x2={x + w - 1} y2={y + 42} stroke="var(--pda-hair2)" />
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
            pad={CELL_PAD}
            padY={CELL_PADY}
          />
        ))}
        {/* The clean separation the hatch was failing to make. Horizontal
            between stacked cells, vertical between the base's pair. */}
        {stacked ? (
          <line
            x1={x + 1}
            y1={y + HEAD_H + CELL_H + CELL_GAP / 2}
            x2={x + w - 1}
            y2={y + HEAD_H + CELL_H + CELL_GAP / 2}
            stroke="var(--pda-hair2)"
          />
        ) : (
          <line
            x1={x + 1 + CELL_W + CELL_GAP / 2}
            y1={y + HEAD_H}
            x2={x + 1 + CELL_W + CELL_GAP / 2}
            y2={y + HEAD_H + CELL_H}
            stroke="var(--pda-hair2)"
          />
        )}
      </g>
    );
  };

  return (
    <>
      <OwnerPlate {...OWNER} work={pda} ownerFs={FS.owner} led={led} padY={OWNER_PADY} />

      {/* The neck: structure, not signal. Drawn BEFORE the cartridge so the
          card sits ON it. Authority is structure; data is conductors. */}
      <g>
        <path
          d={`M${l0},${PYL.y0} H${r0} L${r1},${ys} V${PYL.y1} H${l1} V${ys} Z`}
          fill={led ? "rgba(255, 255, 255, 0.025)" : "rgba(126, 159, 102, 0.07)"}
          stroke={green}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <g stroke={green} opacity="0.85">
          <line x1={B.mid - 20} y1={PYL.y0 - 4} x2={B.mid - 20} y2={PYL.y0 + 4} />
          <line x1={B.mid + 20} y1={PYL.y0 - 4} x2={B.mid + 20} y2={PYL.y0 + 4} />
        </g>
      </g>

      {/* 60 units of gutter each side — the cables the owner asked to keep,
          finally with room to be seen. */}
      <Wire
        pts={[
          [CHIP.x, CHIP_CY],
          [B.x0 + NODE_W, CHIP_CY],
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
          [B.mid - 48, CHIP_B],
          [B.mid - 48, BASE_Y - 70],
          [B.mid - 80, BASE_Y - 38],
          [B.mid - 80, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />
      <Wire
        pts={[
          [B.mid + 48, CHIP_B],
          [B.mid + 48, BASE_Y - 70],
          [B.mid + 80, BASE_Y - 38],
          [B.mid + 80, BASE_Y],
        ]}
        stroke={wire}
        dashed={led}
      />

      {node(B.x0, NODE_Y, NODE_W, NODE_H, 0, true)}
      {node(RIGHT_X, NODE_Y, NODE_W, NODE_H, 1, true)}
      {node(BASE_X, BASE_Y, BASE_W, BASE_H, 2, false)}

      {/* ⚠ EMPTY `bar` PROP ON PURPOSE — it is what suppresses the
          cartridge's native lane/autonomy row (omitting it prints the
          autonomy a second time), while its own bar block is hardcoded at
          `fontSize="10"` UNSCALED and cannot be made legible. The bar is
          drawn below at the same 15 every other answer uses. */}
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
        fs={FS.v}
        led={led}
      />
    </>
  );
}
