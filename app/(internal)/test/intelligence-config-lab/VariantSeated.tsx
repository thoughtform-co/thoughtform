"use client";

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
const CHIP = { x: 324, y: 314, w: 176 * CHIP_K, h: 136 * CHIP_K } as const;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

const RIGHT_X = CHIP_R + GUTTER;
const NODE_Y = CHIP.y;
const BASE_X = B.mid - BASE_W / 2;
const BASE_Y = 736;

/**
 * The seat, sized from its own ink rather than by eye. `OwnerPlate` lays out
 * three rows — the key, the seat, and what the seat owns — whose block
 * measures 62.3 units from the key's cap top to the note's descender. At
 * h 136 that centres with 36.9 of air above and below, and `OWNER_PADY` is
 * the offset that puts it there rather than against the ceiling.
 *
 * ⚠ THE HEIGHT CAME OUT OF THE MARGINS, NOT OUT OF THE PYLON. The whole
 * vertical chain re-derives around it: owner 136 + neck 62 + card 272 + drop
 * 150 + base 164 = 784 against 873 of board, so the composition still sits
 * on 44.5 units of margin top and bottom. Growing the plate without moving
 * the chain would have eaten the neck instead.
 */
const OWNER = { x: 240, y: 116, w: 520, h: 136 } as const;
const OWNER_PADY = 17;

/** The neck. Third size, and the range is known: 110→170 read as a dark tab,
 *  140→240 as a buttress that took the eye off the card. */
const PYL = { y0: OWNER.y + OWNER.h, y1: CHIP.y, splay: 20, topW: 64, botW: 108 } as const;

/* ── The card's own rhythm ──────────────────────────────────────────────
   ⚠ SEATED DRAWS ITS OWN CARD RATHER THAN MOUNTING `Cartridge`, and that is
   the only way to answer the owner's read of it (2026-08-11: "very sloppy …
   the text at the bottom is hugging the bottom border, that is completely
   unacceptable"). `Cartridge` is PRODUCTION's glyph, shared with reading 01's
   grid of twenty, and its internal offsets are absolute multiples of `k` — at
   k 2 the title lands at +184 and the bar block bottoms out 3 units off the
   floor with a 60-unit void above it. Fixing that inside `Cartridge` would
   re-lay-out the other reading.

   ⚠ WHAT MUST NOT CHANGE IS THE SILHOUETTE. ADR-069's flight docks the
   reading-01 cartridge into this rect, so `SeatCard` keeps the box EXACTLY
   `176×136 × k` and the same top-left chamfer of `14k`. Only the contents
   move.

   The rhythm, top to bottom: a header row carrying the state mark, the team
   and the id; a rule; the title; the bar. Every baseline is derived from the
   card's own top so the block cannot drift onto its floor again. */
const CARD_PAD = 24;
const CARD = {
  gaugeCx: 40,
  gaugeCy: 34,
  gaugeR: 13,
  headBase: 40,
  rule: 58,
  titleBase: 116,
  titleFs: 23,
  barBase: 168,
} as const;
/** 304 units — the worst title in the record (`Candidate screening`, 19) is
 *  297 at fs 23, so no title on this surface wraps. */
const CARD_MEASURE = 176 * CHIP_K - CARD_PAD * 2;

const CELL_PAD = 14;
const CELL_PADY = 10;
/** 204 units is 20 characters at fs 15 — the record's worst value takes two
 *  lines and `RECONCILIATION` (143u) clears the wall with 60 to spare. */
const T: CellType = { keyFs: FS.key, valueFs: FS.v, measure: CELL_W - CELL_PAD * 2, cap: 2 };
const BAR_MEASURE = CARD_MEASURE;
const BAR_FS = FS.key;

/**
 * THE BEZEL — the services cards' own device, brought over.
 *
 * `ServicesCardRing` bakes its slab with "a clear bezel margin around the
 * content" plus a hairline on the silhouette (its `glint`), and that is the
 * "subtle extra border" the owner asked for. Here it is a second chamfered
 * outline inset inside the first, at low opacity.
 *
 * ⚠ THE INNER CHAMFER LEG IS NOT `leg − inset`. A 45° cut offset inward by
 * `d` moves its diagonal by `d√2` along the axes, not by `d` — using the
 * naive value leaves the diagonal visibly closer to the outer edge than the
 * straight runs are, which is exactly the kind of not-quite-parallel that
 * reads as a mistake rather than a bezel.
 */
const bezel = (x: number, y: number, w: number, h: number, d: number, leg: number) => {
  const inner = leg - d * (Math.SQRT2 - 1);
  return `M${x + d + inner},${y + d} H${x + w - d} V${y + h - d} H${x + d} V${y + d + inner} Z`;
};

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
    /* ⚠ THE CARD'S OWN THREE STRINGS ARE DECLARED HERE NOW. While the card
       was `Cartridge`, its team code, stream id and title were lettered by a
       production glyph and this variant's declaration never saw them — so the
       lab's fit guard was walking a drawing with three invisible labels in it.
       Drawing the card locally makes them this variant's responsibility. */
    { slot: "seated.card.team", text: pda.teamAb, fs: FS.key, track: 0.2, measure: 120 },
    { slot: "seated.card.id", text: pda.id, fs: FS.key, track: 0.16, measure: 120 },
    {
      slot: "seated.card.title",
      text: pda.title,
      fs: CARD.titleFs,
      track: TRACK.v,
      measure: CARD_MEASURE,
    },
    ...barSpecs("seated.bar", pda.cfg.bar, BAR_FS, BAR_MEASURE),
  ];
}

/**
 * The work, drawn on the cartridge's silhouette with the cartridge's contents
 * laid out properly. The gauge is the state mark ADR-062 needs — a filled
 * square where a configuration is on record, a cross where the work is
 * deliberately person-led — and it moves INTO the header row rather than
 * floating in a band of its own, which is what left the old card with a void
 * above its title and its bar against the floor.
 *
 * ⚠ THE VENTS ARE DROPPED. They are `Cartridge`'s ornament and at k 2 they
 * were three diagonal strokes in the middle of the card's clearest space.
 */
function SeatCard({ work, led }: { work: IclVariantProps["pda"]; led: boolean }) {
  const stroke = led ? "var(--pda-txt3)" : "var(--pda-hot)";
  const ink = led ? "var(--pda-txt3)" : "var(--pda-txt)";
  const n = 14 * CHIP_K;
  const gx = CHIP.x + CARD.gaugeCx;
  const gy = CHIP.y + CARD.gaugeCy;
  const r = CARD.gaugeR;
  return (
    <g>
      <path
        d={`M${CHIP.x + n},${CHIP.y} H${CHIP.x + CHIP.w} V${CHIP.y + CHIP.h} H${CHIP.x} V${CHIP.y + n} Z`}
        fill={led ? "rgba(var(--dawn-rgb), 0.04)" : "rgba(240, 200, 106, 0.10)"}
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      <path
        d={bezel(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 9, n)}
        fill="none"
        stroke={stroke}
        opacity="0.3"
      />

      {/* The state mark, in the header row where it belongs. */}
      <circle cx={gx} cy={gy} r={r} fill="none" stroke={stroke} strokeWidth="1.6" />
      {led ? (
        <g stroke={stroke} strokeWidth="1.6">
          <line x1={gx - r * 0.5} y1={gy - r * 0.5} x2={gx + r * 0.5} y2={gy + r * 0.5} />
          <line x1={gx + r * 0.5} y1={gy - r * 0.5} x2={gx - r * 0.5} y2={gy + r * 0.5} />
        </g>
      ) : (
        <rect x={gx - 6} y={gy - 6} width={12} height={12} fill={stroke} />
      )}

      <text
        x={gx + r + 12}
        y={CHIP.y + CARD.headBase}
        fontSize={FS.key}
        letterSpacing=".2em"
        fill="var(--pda-txt3)"
      >
        {work.teamAb}
      </text>
      <text
        x={CHIP.x + CHIP.w - CARD_PAD}
        y={CHIP.y + CARD.headBase}
        textAnchor="end"
        fontSize={FS.key}
        letterSpacing=".16em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      >
        {work.id}
      </text>
      <line
        x1={CHIP.x + CARD_PAD}
        y1={CHIP.y + CARD.rule}
        x2={CHIP.x + CHIP.w - CARD_PAD}
        y2={CHIP.y + CARD.rule}
        stroke="var(--pda-hair2)"
      />

      <text
        x={CHIP.x + CARD_PAD}
        y={CHIP.y + CARD.titleBase}
        fontSize={CARD.titleFs}
        letterSpacing=".08em"
        fill={ink}
      >
        {work.title}
      </text>
      <BarBlock
        x={CHIP.x + CARD_PAD}
        y={CHIP.y + CARD.barBase}
        measure={BAR_MEASURE}
        bar={work.cfg.bar}
        fs={BAR_FS}
        led={led}
      />
    </g>
  );
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
        {/* The same bezel the card carries, one step quieter — the device is
            only a device if every frame on the board shares it. */}
        <path
          d={bezel(x, y, w, h, 7, 14)}
          fill="none"
          stroke={led ? "var(--pda-txt3)" : "var(--pda-amb)"}
          opacity="0.22"
        />
        <QLabel x={x + 20} y={y + 26} text={g.q} />
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

      <SeatCard work={pda} led={led} />
    </>
  );
}
