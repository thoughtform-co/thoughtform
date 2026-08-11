"use client";

import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import { wrapLines } from "./pdaGlyphs";
import type { PdaEntry } from "./PdaEntry";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { type Pt, polylineLength, ribbonPaths } from "./ribbon";

/**
 * 02 · THE CONFIGURATION — the seated board (ADR-070 U10).
 *
 * Promoted from `/test/intelligence-config-lab`'s `seated` variant after the
 * owner picked it out of eight refinements and put it through three rounds of
 * notes. What changed from U9, and why each one is arithmetic rather than
 * taste:
 *
 * ⚠ **THE CROP IS WIDER, AND IT IS A MEASURED TRADE, NOT A FREEBIE.**
 * `meet` scales by the MINIMUM of the two box ratios, so the crop's aspect
 * decides which axis wastes. The console's field is capped at 850px wide but
 * grows with viewport height, so it is LANDSCAPE on laptops and PORTRAIT on
 * tall screens — measured on the live landing:
 *
 *   viewport     field       aspect   828×912 waste    1000×912 waste
 *   1280×720     603×493     1.223    155 across       62 across
 *   1440×800     679×548     1.239    181 across       78 across
 *   1920×1080    850×760     1.118    160 across       17 across
 *   2560×1440    850×1120    0.759    184 down         345 down
 *   1280×1440    603×1177    0.512    513 down         627 down
 *
 * One crop cannot fill both ends. U4 chose the portrait crop and paid on
 * laptops; the owner's call (2026-08-11) is the other way — **the laptop and
 * the 1920 reference win**, at the named cost of more vertical letterbox and
 * ~17 % smaller type on tall large monitors. That is why `pda-viewbox`'s
 * portrait assertion is now a LANDSCAPE one: the contract did not disappear,
 * it inverted, and it is still asserted.
 *
 * ⚠ **NOTHING LETTERS UNDER 12.** U9's keys sat at 10, which is 5.4px at the
 * binding preset and 8.3px at 1920 — under the 8.5px chrome floor ADR-063
 * records as this surface's standing defect. The owner's verdict was "utterly
 * illegible". The contrast is bought the other way round now: the ANSWER came
 * down and the KEY came up. A label nobody can read is not a quiet label, it
 * is an absent one.
 *
 * ⚠ **THE SEAT IS STRUCTURE, NOT SIGNAL.** ADR-070 U5's law — the seat is
 * AUTHORITY, not data, so it may never be one of the nodes' bundles — is
 * KEPT, but the distinction moves from WEIGHT to MATERIAL. U6 had already had
 * to take the dashed hairline from `--pda-dim` to full green because it read
 * as absent; the owner's verdict on it here was blunter. Nothing flows down a
 * pylon: it bears load, which is why it survives being drawn thick.
 *
 * ⚠ **THE CARD IS DRAWN HERE, NOT BY `Cartridge`.** `Cartridge`'s internal
 * offsets are absolute multiples of `k`, so at k 2 its title landed at +184
 * and its bar block bottomed out THREE units off the floor with a 60-unit
 * void above it. That is the glyph's layout, and reading 01's grid of twenty
 * still wants it — so this reading lays out its own contents on the same
 * silhouette. **The silhouette is the part that may not move**: `CORE_RECT`
 * stays exactly `176×136 × k` with the same `14k` chamfer, because ADR-069's
 * flight docks into it.
 *
 * One ink for every answer, keys in Tensor gold, the hatch and the dashed
 * inset replaced by a divider rule, and a bezel — the services cards' own
 * device — on the card and every node.
 */

/* ⚠ 1000 WIDE. See the header: this is the owner's trade, and `pda-viewbox`
   asserts the new aspect so it cannot drift back silently. */
export const CONFIG_VIEWBOX = "0 48 1000 912";

/** The board inside the crop. */
const B = { x0: 30, x1: 970, y0: 72, y1: 945, mid: 500 } as const;

/** The chip, and the flight's second home. `CORE_K` × the 176×136 cartridge,
 *  so the two rects are EXACTLY similar and one uniform scale carries the
 *  morph without the object changing proportion on the way. */
export const CORE_K = 2;
/** ⚠ `x` IS `B.x0 + NODE_W + GUTTER` — the board is one width chain and the
 *  card is its middle link: `30 | 234 | 60 | 352 | 60 | 234 | 30` = 1000. */
const CHIP = { x: 324, y: 314, w: 176 * CORE_K, h: 136 * CORE_K } as const;
export const CORE_RECT: FlightRect = { ...CHIP };

const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

/**
 * ⚠ NOTHING LETTERS UNDER 12 (owner, 2026-08-11) — see the header. Against
 * the record's own worst strings, at the measures below:
 *
 *   role     worst                            chars  measure  at fs
 *   value    GENERATE / CRITIQUE / REVISE       28    204     15 → 2 lines
 *   ⚠ word   RECONCILIATION                     14    204     15 → 143u ✓
 *   key      KNOWLEDGE GRAPH                    15    204     14 → 172u ✓
 *   title    CANDIDATE SCREENING                19    304     23 → 297u ✓
 *   owner    THE PERSON DOES THE WORK           24    270     16 → 261u ✓
 *   decides  DECIDES ALONE                      13    160     14 → 149u ✓
 */
const FS = { q: 13, key: 14, value: 15, owner: 16, autonomy: 13, bar: 14 } as const;

/** PT Mono's advance plus the tracking. */
const adv = (fs: number, track: number) => fs * (0.6 + track);
/** A line box is ~1.3 em, and every vertical CLEARANCE is measured against it
 *  rather than the font size. */
const lineBox = (fs: number) => fs * 1.3;
/**
 * ⚠ THE BASELINE STEP IS NOT THE LINE BOX. `lineBox` is what a line OCCUPIES;
 * stepping consecutive baselines by it makes their glyph boxes abut, and
 * `getBBox` reports taller than 1.3 em — the lab's capture gate flagged real
 * collisions between the two wrapped lines of one value. 1.7 is the house
 * number: the pre-U10 drawing stepped its values 20 at fs 11.5 (1.74×).
 */
const step = (fs: number) => fs * 1.7;
const charsFor = (measure: number, fs: number) => Math.max(1, Math.floor(measure / adv(fs, 0.08)));

/* ── The board's geometry ───────────────────────────────────────────────
   `NODE_H` lands on 272 as well, so the card and both side nodes share one
   top edge and one bottom edge. That alignment is the balance. */
const NODE_W = 234;
const CELL_W = 232;
const GUTTER = 60;
const CELL_H = 100;
const CELL_GAP = 8;
const HEAD_H = 52;
/** The floor under the last cell. `WHAT RUNS IT` used to sit on its own
 *  bottom edge (owner). */
const NODE_FLOOR = 12;
const NODE_H = HEAD_H + CELL_H * 2 + CELL_GAP + NODE_FLOOR;
const BASE_W = CELL_W * 2 + CELL_GAP + 2;
const BASE_H = HEAD_H + CELL_H + NODE_FLOOR;

const RIGHT_X = CHIP_R + GUTTER;
const NODE_Y = CHIP.y;
const BASE_X = B.mid - BASE_W / 2;
const BASE_Y = 736;

/** The seat, sized from its own ink: `OwnerPlate`'s three rows measure 62.3
 *  units, which centres in 136 with 36.9 of air above and below. */
const OWNER = { x: 240, y: 116, w: 520, h: 136 } as const;
const OWNER_PADY = 17;

/** The neck. Three sizes were tried: 110→170 read as a small dark tab (the
 *  hairline's failure in a new shape) and 140→240 as a buttress that took the
 *  eye off the card. */
const PYL = { y0: OWNER.y + OWNER.h, y1: CHIP.y, splay: 20, topW: 64, botW: 108 } as const;

const CELL_PAD = 14;
const CELL_PADY = 10;
const CELL_MEASURE = CELL_W - CELL_PAD * 2;

/* ── The card's own rhythm ────────────────────────────────────────────── */
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
const CARD_MEASURE = CHIP.w - CARD_PAD * 2;

/* ── The fit declaration ────────────────────────────────────────────────
   Every string this drawing letters, with the measure it has to fit in.
   `pda-viewbox` walks it for all twenty-seven streams: SVG `<text>` neither
   wraps nor reports overflow, so a value past its box vanishes at the edge
   with nothing on screen to say so. A lettered string missing from here is a
   defect in the drawing, not a gap in the guard. */
export interface ConfigLetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it. */
  track: number;
  measure: number;
}

export const configSpecWidth = (s: ConfigLetterSpec) => s.text.length * adv(s.fs, s.track);

/** A cell: a key and its answer. */
interface CellDef {
  key: string;
  value: string;
}
interface GroupDef {
  q: string;
  part: "runs" | "rch" | "whr";
  cells: readonly [CellDef, CellDef];
}

/**
 * The three questions and their six answers — ADR-070 U9's slotting.
 *
 * ⚠ `MODEL` ANSWERS WITH THE VERBS, NOT THE LANE (owner, 2026-08-11: "model —
 * everyday lane? What does everyday lane mean?"). The lane is a GENERIC
 * capability tier by law — the map's envelope forbids naming a model family
 * and `cases-registry` fails on one — so it cannot be made concrete by naming
 * the model. `m[1]` is the concrete thing the record already holds, and the
 * tier survives in `laneRun` for anything that wants it.
 */
const groupsOf = (w: PdaWork): readonly GroupDef[] => {
  const c = w.cfg;
  return [
    {
      q: "WHAT RUNS IT",
      part: "runs",
      cells: [
        { key: "SKILL", value: c.skill },
        { key: "MODEL", value: c.laneVerbs },
      ],
    },
    {
      q: "WHAT IT CAN REACH",
      part: "rch",
      cells: [
        { key: "KNOWLEDGE GRAPH", value: c.graph },
        { key: "CONNECTORS", value: c.system },
      ],
    },
    {
      q: "WHERE IT RUNS",
      part: "whr",
      cells: [
        { key: "AGENT", value: c.agent },
        { key: "INTERFACE", value: c.surface },
      ],
    },
  ];
};

/** The wrapped lines a value takes. ⚠ `wrapLines` SLICES at its cap, so the
 *  line PAST the cap is declared with a ZERO measure — a sliced tail then
 *  fails the guard loudly instead of vanishing on screen. */
function valueSpecs(slot: string, value: string, fs: number, measure: number): ConfigLetterSpec[] {
  return wrapLines(value, charsFor(measure, fs), 3).map((line, i) => ({
    slot: `${slot}.L${i}`,
    text: line,
    fs,
    track: 0.08,
    measure: i < 2 ? measure : 0,
  }));
}
const valueLines = (value: string, fs: number, measure: number) =>
  wrapLines(value, charsFor(measure, fs), 2);

export function configurationLettering(work: PdaWork): ConfigLetterSpec[] {
  const groups = groupsOf(work);
  const specs: ConfigLetterSpec[] = [
    { slot: "ownerLabel", text: "WHO OWNS IT", fs: FS.key, track: 0.22, measure: 270 },
    { slot: "owner", text: work.owner, fs: FS.owner, track: 0.08, measure: 270 },
    { slot: "decides", text: "DECIDES ALONE", fs: FS.key, track: 0.22, measure: 160 },
    { slot: "autonomy", text: work.autonomy, fs: FS.autonomy, track: 0.08, measure: 160 },
  ];

  /* THE SEAT'S SECOND LINE — what that seat actually owns (U7). Absent for
     person-led, which has no configured seat to gloss. */
  if (work.ownerNote) {
    specs.push({
      slot: "ownerNote",
      text: work.ownerNote,
      fs: FS.key,
      track: 0.08,
      measure: OWNER.w - 40,
    });
  }

  for (const g of groups) {
    const qMeasure = (g.part === "whr" ? BASE_W : NODE_W) - 36;
    specs.push({ slot: `${g.q}.q`, text: g.q, fs: FS.q, track: 0.14, measure: qMeasure });
    for (const cell of g.cells) {
      specs.push({
        slot: `${g.q}.${cell.key}.k`,
        text: cell.key,
        fs: FS.key,
        track: 0.22,
        measure: CELL_MEASURE,
      });
      specs.push(...valueSpecs(`${g.q}.${cell.key}`, cell.value, FS.value, CELL_MEASURE));
    }
  }

  /* ⚠ THE CARD'S OWN THREE STRINGS ARE DECLARED HERE. While the card was
     `Cartridge` they were lettered by a shared glyph and this declaration
     never saw them — the guard was walking a drawing with three invisible
     labels in it. Any reading that mounts a production glyph inherits that
     blind spot. */
  specs.push({ slot: "card.team", text: work.teamAb, fs: FS.key, track: 0.2, measure: 120 });
  specs.push({ slot: "card.id", text: work.id, fs: FS.key, track: 0.16, measure: 120 });
  specs.push({
    slot: "card.title",
    text: work.title,
    fs: CARD.titleFs,
    track: 0.08,
    measure: CARD_MEASURE,
  });

  specs.push({
    slot: "bar.label",
    text: "THE BAR",
    fs: FS.key,
    track: 0.22,
    measure: CARD_MEASURE,
  });
  specs.push(...valueSpecs("bar", work.cfg.bar, FS.bar, CARD_MEASURE));

  return specs;
}

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

/**
 * THE BEZEL — the services cards' own device. `ServicesCardRing` bakes its
 * slab with a clear bezel margin plus a hairline on the silhouette; here it
 * is a second chamfered outline inset inside the first.
 *
 * ⚠ THE INNER CHAMFER LEG IS NOT `leg − inset`. A 45° cut offset inward by
 * `d` moves its diagonal by `d√2` along the axes, not by `d` — the naive
 * value leaves the diagonal visibly closer to the outer edge than the
 * straight runs are, which reads as a mistake rather than as a bezel.
 */
const bezel = (x: number, y: number, w: number, h: number, d: number, leg: number) => {
  const inner = leg - d * (Math.SQRT2 - 1);
  return `M${x + d + inner},${y + d} H${x + w - d} V${y + h - d} H${x + d} V${y + d + inner} Z`;
};

/** A multi-conductor bundle — the connection grammar (thick, not hairlines:
 *  owner, twice). Parallel conductors at constant pitch through 45° jogs. */
function Ribbon({
  pts,
  n = 6,
  pitch = 4,
  stroke,
  opacity,
  dashed,
  draw,
}: {
  pts: readonly Pt[];
  n?: number;
  pitch?: number;
  stroke: string;
  opacity: number;
  dashed?: boolean;
  draw: number | null;
}) {
  /* ⚠ The class goes on each PATH, not the group: `fl-pda-wire` animates
     `stroke-dashoffset`, and reading 03 proves the per-path form. */
  const len = draw === null ? 0 : polylineLength(pts);
  return (
    <g stroke={stroke} opacity={opacity} fill="none" strokeWidth="1">
      {ribbonPaths(pts, n, pitch).map((d, i) => (
        <path
          key={i}
          d={d}
          strokeDasharray={dashed ? "4 3" : undefined}
          className={draw === null ? undefined : "fl-pda-wire"}
          style={
            draw === null
              ? undefined
              : ({ "--l": len, animationDelay: `${draw}ms` } as React.CSSProperties)
          }
        />
      ))}
    </g>
  );
}

/**
 * A key and its answer.
 *
 * ⚠ ONE INK FOR EVERY ANSWER, AND THE KEY IN TENSOR GOLD (owner). The Skill
 * used to letter green and the graph blue, carrying ADR-062's material
 * grammar down onto the type. On the CITY that grammar has a legend's worth
 * of context and applies to SHAPES; here it lands on six words in a row with
 * nothing to decode it, so it reads as emphasis rather than provenance.
 * `--pda-ink` is `--gold-ink`, the 4.5:1 rung of ADR-063 U2's ramp — NEVER
 * `--gold` itself, which is the MARK rung and measures ~1.1:1 as small text
 * on the light theme's parchment.
 */
function Cell({ x, y, cell, led }: { x: number; y: number; cell: CellDef; led: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL_W}
        height={CELL_H}
        fill="rgba(var(--dawn-rgb), 0.03)"
        stroke="none"
      />
      <text
        x={x + CELL_PAD}
        y={y + CELL_PADY + 20}
        fontSize={FS.key}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        {cell.key}
      </text>
      {valueLines(cell.value, FS.value, CELL_MEASURE).map((line, i) => (
        <text
          key={i}
          x={x + CELL_PAD}
          y={y + CELL_PADY + 20 + lineBox(FS.key) + step(FS.value) * (i + 0.72)}
          fontSize={FS.value}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/**
 * A question node: a TL-cut housing, a BOLD question centred in its header
 * band, a bezel, and two cells with a divider rule between them.
 *
 * ⚠ THE DIVIDER REPLACED A HATCH AND A DASHED INSET (owner: "those diagonal
 * ticks, I do not want them. I want a clean separation between skill and
 * model"). They were the material grammar again, and at this size the ticks
 * read as a texture bug.
 */
function QNode({
  x,
  y,
  w,
  h,
  g,
  stacked,
  led,
  hot,
  onLit,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  g: GroupDef;
  stacked: boolean;
  led?: boolean;
  hot?: boolean;
  onLit: (k: string | null) => void;
}) {
  const stroke = hot ? "var(--pda-hot)" : led ? "var(--pda-txt3)" : "var(--pda-amb)";
  return (
    <g onMouseEnter={() => onLit(g.part)} onMouseLeave={() => onLit(null)}>
      <path
        d={`M${x + 14},${y} H${x + w} V${y + h} H${x} V${y + 14} Z`}
        fill="var(--pda-void)"
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      <path d={bezel(x, y, w, h, 7, 14)} fill="none" stroke={stroke} opacity="0.22" />
      {/* ⚠ CENTRED IN ITS BAND, NOT ON ITS FLOOR. The band runs 0…42 to the
          rule, so a cap block with no descenders centres at a baseline of
          25.6 — it sat at 34 until the owner called it. */}
      <text
        x={x + 20}
        y={y + 26}
        fontSize={FS.q}
        fontWeight={700}
        letterSpacing=".14em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
      >
        {g.q}
      </text>
      <line x1={x + 1} y1={y + 42} x2={x + w - 1} y2={y + 42} stroke="var(--pda-hair2)" />
      {g.cells.map((c, i) => (
        <Cell
          key={c.key}
          x={x + 1 + (stacked ? 0 : i * (CELL_W + CELL_GAP))}
          y={y + HEAD_H + (stacked ? i * (CELL_H + CELL_GAP) : 0)}
          cell={c}
          led={Boolean(led)}
        />
      ))}
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
}

/** THE BAR, drawn rather than passed to a glyph — the only way it letters
 *  above the floor (`Cartridge` hardcodes its bar at 10, unscaled). */
function BarBlock({ x, y, bar, led }: { x: number; y: number; bar: string; led: boolean }) {
  return (
    <g>
      <text x={x} y={y} fontSize={FS.key} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE BAR
      </text>
      {valueLines(bar, FS.bar, CARD_MEASURE).map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + lineBox(FS.key) + step(FS.bar) * (i + 0.72)}
          fontSize={FS.bar}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/**
 * The work, on the cartridge's silhouette with its contents laid out
 * properly. The gauge is the state mark ADR-062 needs — a filled square where
 * a configuration is on record, a cross where the work is deliberately
 * person-led — and it sits IN the header row rather than floating in a band
 * of its own, which is what left the old card with a void above its title and
 * its bar against the floor.
 *
 * ⚠ THE SILHOUETTE MAY NOT MOVE. `CORE_RECT` is the flight's destination and
 * the docking group must contain this card ALONE: `fill-box` means the
 * transform is measured against the group's own bbox, and a child reaching
 * past the rect moves the origin the whole flight is computed from.
 */
function SeatCard({ work, led }: { work: PdaWork; led: boolean }) {
  const stroke = led ? "var(--pda-txt3)" : "var(--pda-hot)";
  const n = 14 * CORE_K;
  const gx = CHIP.x + CARD.gaugeCx;
  const gy = CHIP.y + CARD.gaugeCy;
  const r = CARD.gaugeR;
  return (
    <g>
      <path
        d={`M${CHIP.x + n},${CHIP.y} H${CHIP_R} V${CHIP_B} H${CHIP.x} V${CHIP.y + n} Z`}
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
        x={CHIP_R - CARD_PAD}
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
        x2={CHIP_R - CARD_PAD}
        y2={CHIP.y + CARD.rule}
        stroke="var(--pda-hair2)"
      />
      <text
        x={CHIP.x + CARD_PAD}
        y={CHIP.y + CARD.titleBase}
        fontSize={CARD.titleFs}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
      >
        {work.title}
      </text>
      <BarBlock x={CHIP.x + CARD_PAD} y={CHIP.y + CARD.barBase} bar={work.cfg.bar} led={led} />
    </g>
  );
}

/** The seat. Sized from its own ink: three rows measuring 62.3 units, which
 *  centre in 136 with 36.9 of air above and below. */
function OwnerPlate({ work, led }: { work: PdaWork; led: boolean }) {
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const p = OWNER_PADY;
  return (
    <g>
      <path
        d={`M${OWNER.x + 14},${OWNER.y} H${OWNER.x + OWNER.w} V${OWNER.y + OWNER.h} H${OWNER.x} V${OWNER.y + 14} Z`}
        fill={led ? "rgba(255, 255, 255, 0.02)" : "rgba(126, 159, 102, 0.09)"}
        stroke={green}
        strokeDasharray={led ? "5 4" : undefined}
      />
      <path
        d={bezel(OWNER.x, OWNER.y, OWNER.w, OWNER.h, 7, 14)}
        fill="none"
        stroke={green}
        opacity="0.22"
      />
      <text
        x={OWNER.x + 20}
        y={OWNER.y + 30 + p}
        fontSize={FS.key}
        letterSpacing=".22em"
        fill="var(--pda-txt2)"
      >
        WHO OWNS IT
      </text>
      <text
        x={OWNER.x + 20}
        y={OWNER.y + 34 + p + lineBox(FS.owner)}
        fontSize={FS.owner}
        letterSpacing=".08em"
        fill={green}
      >
        {work.owner}
      </text>
      {work.ownerNote ? (
        <text
          x={OWNER.x + 20}
          y={OWNER.y + 40 + p + lineBox(FS.owner) + lineBox(FS.key)}
          fontSize={FS.key}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {work.ownerNote}
        </text>
      ) : null}
      <text
        x={OWNER.x + OWNER.w - 20}
        y={OWNER.y + 30 + p}
        textAnchor="end"
        fontSize={FS.key}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        DECIDES ALONE
      </text>
      <text
        x={OWNER.x + OWNER.w - 20}
        y={OWNER.y + 34 + p + lineBox(FS.owner)}
        textAnchor="end"
        fontSize={FS.autonomy}
        letterSpacing=".08em"
        fill="var(--pda-hot)"
      >
        {work.autonomy}
      </text>
    </g>
  );
}

/* The arrival, in ms. The card carries the flight from t=0 (it is the object
   reading 01 handed over); the owner seats, the bundles draw on under it,
   the nodes light, the base last — so the board assembles outward from the
   record rather than fading in as one picture. */
const T = { owner: 120, wire: 260, wireStep: 60, node: 380, nodeStep: 80 } as const;

export function ViewConfiguration({
  work,
  lit,
  onLit,
  still,
  entry,
}: {
  work: PdaWork;
  shapes: readonly PdaShape[];
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  entry: PdaEntry;
}) {
  const led = !work.configured;
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  /* ⚠ GREEN IS THE ENCODED RUN, and ONE bundle carries it — the Skill's.
     What the stream REACHES and WHERE IT RUNS are both amber, because
     neither a graph, a connector, an agent nor an interface is material Loop
     encoded. Person-led dashes everything. */
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const [runs, rch, whr] = groupsOf(work);

  /* Every animated group drops its class once the pointer has moved, so a
     hover repaints without replaying the entrance. The DOCK is the one
     exception and it lives in state — see pda.css. */
  const inCls = still ? undefined : "fl-pda-in";
  const at = (ms: number) => (still ? undefined : { animationDelay: `${ms}ms` });
  let wireN = 0;
  const drawAt = () => (still ? null : T.wire + wireN++ * T.wireStep);
  const op = (part: string) => (lit === part ? 0.95 : 0.62);

  const l0 = B.mid - PYL.topW / 2;
  const r0 = B.mid + PYL.topW / 2;
  const l1 = B.mid - PYL.botW / 2;
  const r1 = B.mid + PYL.botW / 2;
  const ys = PYL.y1 - PYL.splay;

  return (
    <>
      <g className={inCls} style={at(T.owner)}>
        <OwnerPlate work={work} led={led} />
      </g>

      {/* ── THE PYLON. Structure, not signal: the seat is AUTHORITY, not data
              (ADR-070 U5), and that law is kept by MATERIAL rather than by
              weight. Nothing flows down it; it bears load. Drawn BEFORE the
              card so the card sits ON it. ───────────────────────────────── */}
      <g className={inCls} style={at(T.owner + 80)}>
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

      {/* 60 units of gutter each side — the cables, with room to be seen. */}
      <Ribbon
        pts={[
          [CHIP.x, CHIP_CY],
          [B.x0 + NODE_W, CHIP_CY],
        ]}
        n={8}
        stroke={green}
        opacity={op("runs")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [CHIP_R, CHIP_CY],
          [RIGHT_X, CHIP_CY],
        ]}
        n={8}
        stroke={wire}
        opacity={op("rch")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [B.mid - 48, CHIP_B],
          [B.mid - 48, BASE_Y - 70],
          [B.mid - 80, BASE_Y - 38],
          [B.mid - 80, BASE_Y],
        ]}
        stroke={wire}
        opacity={op("whr")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [B.mid + 48, CHIP_B],
          [B.mid + 48, BASE_Y - 70],
          [B.mid + 80, BASE_Y - 38],
          [B.mid + 80, BASE_Y],
        ]}
        stroke={wire}
        opacity={op("whr")}
        dashed={led}
        draw={drawAt()}
      />

      <g className={inCls} style={at(T.node)}>
        <QNode
          x={B.x0}
          y={NODE_Y}
          w={NODE_W}
          h={NODE_H}
          g={runs}
          stacked
          led={led}
          hot={lit === "runs"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + T.nodeStep)}>
        <QNode
          x={RIGHT_X}
          y={NODE_Y}
          w={NODE_W}
          h={NODE_H}
          g={rch}
          stacked
          led={led}
          hot={lit === "rch"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + 2 * T.nodeStep)}>
        <QNode
          x={BASE_X}
          y={BASE_Y}
          w={BASE_W}
          h={BASE_H}
          g={whr}
          stacked={false}
          led={led}
          hot={lit === "whr"}
          onLit={onLit}
        />
      </g>

      {/* ── The one bright object. ⚠ THE DOCK GROUP HOLDS THE CARD ALONE:
              `fill-box` measures the transform against this group's own bbox,
              so anything reaching past the rect moves the flight's origin. ── */}
      <g
        className={entry.kind === "flight" ? "fl-pda-dock" : still ? undefined : "fl-pda-bloom"}
        style={
          entry.kind === "flight"
            ? ({
                "--dx": `${entry.dx}px`,
                "--dy": `${entry.dy}px`,
                "--dk": entry.dk,
              } as React.CSSProperties)
            : undefined
        }
      >
        <SeatCard work={work} led={led} />
      </g>
      {/* The bar's hover bed — a SIBLING of the dock group on purpose: the
          listener re-renders on hover, and the dock's entrance style must
          never re-evaluate mid-flight. */}
      <rect
        x={CHIP.x}
        y={CHIP.y + CARD.barBase - 24}
        width={CHIP.w}
        height={CHIP.h - CARD.barBase + 24}
        fill="transparent"
        onMouseEnter={() => onLit("gat")}
        onMouseLeave={() => onLit(null)}
      />
    </>
  );
}

/** Re-exported so `pda.css`'s dock duration and this drawing stay one pair. */
export { PDA_FLIGHT_MS };
