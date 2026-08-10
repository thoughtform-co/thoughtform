"use client";

import type { ReactNode } from "react";

import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import { Cartridge, wrapLines } from "./pdaGlyphs";
import type { PdaEntry } from "./PdaEntry";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { type Pt, polylineLength, ribbonPaths } from "./ribbon";

/**
 * 02 · THE CONFIGURATION — the owner's unit board, PORTRAIT (ADR-070 U4).
 *
 * ⚠ THE CROP IS THE WHOLE FIX, AND IT IS ARITHMETIC. The console's field is
 * PORTRAIT at the viewports this is read on — 792×948 (0.835) at a tall
 * window — while this drawing was cropped LANDSCAPE (910×740, 1.23). With
 * `meet` scaling by the minimum ratio, a landscape crop in a portrait field
 * is WIDTH-bound: it rendered 792×644 into 948 and left **304px of dead
 * panel** below the drawing, which is the owner's "you're just not using
 * the space at the bottom". No amount of moving elements fixes that — the
 * letterbox is outside the drawing. The crop is now 828×950 (0.872), so the
 * field is nearly filled at a tall window (~39px of slack), and the whole
 * composition is authored bigger to match.
 *
 * ⚠ THE TRADE, NAMED: a portrait crop in the SHORT-wide fields (603×493 at
 * 1280×720, 1.22) letterboxes HORIZONTALLY instead — ~173px, and the type
 * lands at 0.519 meet rather than 0.662. One `viewBox` cannot fill both
 * aspects; the tall window is where this is read, so it wins. That is why
 * the drawing's own floor is **10** rather than 7.5 — at the worse meet, 10
 * renders 5.19px against the smoke's 4.3 (7.5 would render 3.89 and fail).
 *
 * What the U4 pass changed, all owner (2026-08-10, third round):
 *   · THE DIMENSION LINE IS DELETED — the arrowed rule and its pin ticks
 *     ("the fucking ugly line with the arrows", "those small vertical ticks
 *     … they're ugly"). DECIDES ALONE is one quiet line right above the
 *     card instead.
 *   · SKILL AND MODEL ARE SEPARATE CARDS — every question node holds TWO
 *     sub-cards side by side, close but distinct, which is the owner's
 *     mockup's own device.
 *   · The question headers letter WHITE and the nodes are much taller.
 *   · DELETED: the draw meter and NEVER A PRICE, the DRAWS ON n OF m
 *     caption, the corner brackets, the pad clusters, the vias and the
 *     registration crosses. Every one of them was chrome the owner named.
 *
 * ⚠ WHAT SURVIVES EVERY REDRAW: `CORE_RECT` (the flight's second home),
 * every lettered string derived from the record, and person-led work
 * printing what is NOT bound rather than emptying out.
 */

/**
 * THE CROP — portrait, and tight on the content (56…990 vertical).
 * ⚠ Its ASPECT is load-bearing, not just its size: see the header. Changing
 * either dimension changes how much panel the drawing fills at a tall
 * window, which is the thing this update exists to fix.
 */
export const CONFIG_VIEWBOX = "36 48 828 912";

/** The chip, and the flight's second home. `CORE_K` × the 176×136 cartridge,
 *  so the two rects are EXACTLY similar and one uniform scale carries the
 *  morph without the object changing proportion on the way. */
export const CORE_K = 1.5;
/** ⚠ `x` IS `LEFT_X + NODE_W + GUTTER` — the board is one width chain and
 *  the card is its middle link. Moving the margin or a node width without
 *  moving this puts the side nodes back on the crop's wall. */
const CHIP = { x: 318, y: 365, w: 176 * CORE_K, h: 136 * CORE_K } as const;
export const CORE_RECT: FlightRect = { ...CHIP };

const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;
const CHIP_CY = CHIP.y + CHIP.h / 2;

/** The board's centre line — the owner plate, the card and the base all
 *  hang off it. */
const MID = CHIP.x + CHIP.w / 2;

/**
 * ⚠ NOTHING LETTERS UNDER 10 (see the crop note — the portrait crop costs
 * meet at the short-wide fields, and 10 is what clears the smoke's 4.3px
 * floor there). Against the record's own worst strings:
 *
 *   role     worst                            chars  measure  at fs
 *   value    CONTEXT HELD BY THE PERSON         26    230     12 → 212u, 1 line
 *   ⚠ word   RECONCILIATION                     14    230     12 → 114u ✓
 *   owner    THE PERSON DOES THE WORK           24    224     13 → 212u
 *   bar      CONSISTENT EVIDENCE / NO …         46    238     12 → 2 lines
 *
 * ⚠ THE BINDING NUMBER IS A SINGLE WORD, NOT A STRING, AND THE GUARD FOUND
 * IT. `wrapLines` breaks on spaces only, so the longest WORD sets a
 * sub-card's minimum measure however well the value wraps — and every
 * per-line assertion still passes while it overflows, because each LINE is
 * short. `RECONCILIATION` (14) is the record's longest; sizing against
 * `INTELLIGENCE` (12) put it through the wall. `pda-viewbox` walks words
 * now, not just lines.
 *
 * ⚠ AND THE STACK IS WHAT BOUGHT THE TYPE (U5, owner: "let's stack them
 * vertically"). Side-by-side sub-cards halve the node's measure, which is
 * what forced fs 10 and three-line wraps; stacked, a sub-card gets the
 * WHOLE node width and every value in the record letters on ONE line at 12.
 */
const FS = { chrome: 10, tag: 11, head: 14, value: 11.5, owner: 13, bar: 12 } as const;

/** PT Mono's advance plus the tracking — the model `MONO_ADVANCE` evaluates
 *  at .08em, kept general because this drawing letters at five sizes. */
const adv = (fs: number, track: number) => fs * (0.6 + track);

/* ── The three question nodes ───────────────────────────────────────────
   A node is a TL-cut housing with a white question header and TWO SEPARATE
   sub-cards (owner: "model and skill are two separate cards; they should be
   close to each other, but they are separate").

   ⚠ ONE SUB-CARD SIZE ACROSS ALL SIX, and it is what makes the board read as
   proportionate (U5, owner: "what it inherits is too big… the text is so
   small. Let's make it more proportionate"). The TALL side nodes stack their
   pair VERTICALLY at full node width; the WIDE base node sits its pair side
   by side — and the two arrangements are sized so every sub-card is the same
   250x108 card with the same 230-unit measure and the same type. The base
   node's old 640 width gave it 316-wide cards holding one short line, which
   is exactly the disproportion that was called out. */
const SUB_W = 232;
const SUB_H = 130;
const SUB_GAP = 6;
const SUB_PAD = 10;
/** Header band above the first sub-card. */
const HEAD_H = 58;

const NODE_W = SUB_W + 2;
const NODE_H = HEAD_H + SUB_H * 2 + SUB_GAP + 4;
const BASE_W = SUB_W * 2 + SUB_GAP + 2;
const BASE_H = HEAD_H + SUB_H + 4;

/** Every sub-card letters into the same measure, whichever way it is seated. */
const SUB_MEASURE = SUB_W - SUB_PAD * 2;
const SUB_CHARS = Math.floor(SUB_MEASURE / adv(FS.value, 0.08));

/** THE BAR letters on the card itself, wrapped — the 46-char worst cannot
 *  hold one line inside a 281.6-unit card. */
const BAR_MEASURE = CHIP.w - 26;
const BAR_CHARS = Math.floor(BAR_MEASURE / adv(FS.bar, 0.08));

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

/** The two answers a question node holds, in the order they are drawn. */
type Pair = readonly [readonly [string, string], readonly [string, string]];

const runsPair = (w: PdaWork): Pair => [
  ["SKILL", w.cfg.skill],
  ["MODEL", w.cfg.laneRun],
];
const reachPair = (w: PdaWork): Pair => [
  ["CONNECTORS", w.cfg.system],
  ["SURFACES", w.cfg.surface],
];
const inheritsPair = (w: PdaWork): Pair => [
  ["CONTEXT", w.cfg.context],
  ["GRAPH FACTS", w.cfg.graph],
];

export function configurationLettering(work: PdaWork): ConfigLetterSpec[] {
  const c = work.cfg;
  const specs: ConfigLetterSpec[] = [
    { slot: "chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 360 },
    { slot: "designator", text: work.id, fs: FS.tag, track: 0.08, measure: 140 },
    /* ⚠ THE OWNER PLATE IS TWO COLUMNS, and the two share its measure (U5).
       The seat reads left, what it decides alone reads right — the floating
       DECIDES ALONE line between the plate and the card is deleted as
       clutter, and this is where it went. Worst case is the person-led seat
       (24 chars at 13 = 212u) beside DECIDES ALONE (106.6u) inside the
       plate's 360, so the columns cannot meet. */
    { slot: "ownerLabel", text: "WHO OWNS IT", fs: FS.tag, track: 0.22, measure: 240 },
    { slot: "owner", text: work.owner, fs: FS.owner, track: 0.08, measure: 240 },
    { slot: "decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 118 },
    { slot: "autonomy", text: work.autonomy, fs: FS.bar, track: 0.08, measure: 118 },
  ];

  /* A node's question, then each sub-card's key and its wrapped value. Two
     lines fit the sub-card (the record needs one); a THIRD is declared with
     a zero measure so a tail the wrapper would slice off fails here loudly. */
  const node = (q: string, nodeW: number, pair: Pair) => {
    specs.push({ slot: `${q}.q`, text: q, fs: FS.head, track: 0.14, measure: nodeW - 32 });
    for (const [k, v] of pair) {
      specs.push({
        slot: `${q}.${k}.k`,
        text: k,
        fs: FS.tag,
        track: 0.22,
        measure: SUB_MEASURE,
      });
      wrapLines(v, SUB_CHARS, 3).forEach((line, i) =>
        specs.push({
          slot: `${q}.${k}.L${i}`,
          text: line,
          fs: FS.value,
          track: 0.08,
          measure: i < 2 ? SUB_MEASURE : 0,
        })
      );
    }
  };
  node("WHAT RUNS IT", NODE_W, runsPair(work));
  node("WHAT IT CAN REACH", NODE_W, reachPair(work));
  node("WHAT IT INHERITS", BASE_W, inheritsPair(work));

  specs.push({ slot: "bar.label", text: "THE BAR", fs: FS.tag, track: 0.22, measure: BAR_MEASURE });
  wrapLines(c.bar, BAR_CHARS, 3).forEach((line, i) =>
    specs.push({
      slot: `bar.L${i}`,
      text: line,
      fs: FS.bar,
      track: 0.08,
      measure: i < 2 ? BAR_MEASURE : 0,
    })
  );

  return specs;
}

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

/** A multi-conductor bundle — the connection grammar (thick, not hairlines:
 *  owner, twice). Parallel conductors at constant pitch through 45° jogs. */
function Ribbon({
  pts,
  n,
  pitch = 4,
  stroke,
  opacity,
  dashed,
  draw,
}: {
  pts: readonly Pt[];
  n: number;
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

type SubKind = "enc" | "plain" | "gph";

/**
 * A question node: TL-cut housing, WHITE question header, and two separate
 * sub-cards. The material grounds are the mockup's — encoded green with a
 * hatch foot, plain, and the adjacent domain's dashed blue inset.
 */
function QNode({
  x,
  y,
  q,
  pair,
  kinds,
  seat,
  led,
  hot,
  part,
  onLit,
}: {
  x: number;
  y: number;
  q: string;
  pair: Pair;
  kinds: readonly [SubKind, SubKind];
  /** How the pair is seated — see the note at the geometry constants. */
  seat: "stack" | "row";
  led?: boolean;
  hot?: boolean;
  part: string;
  onLit: (k: string | null) => void;
}) {
  const stroke = hot ? "var(--pda-hot)" : led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const stacked = seat === "stack";
  const w = stacked ? NODE_W : BASE_W;
  const h = stacked ? NODE_H : BASE_H;

  return (
    <g onMouseEnter={() => onLit(part)} onMouseLeave={() => onLit(null)}>
      <path
        d={`M${x + 14},${y} H${x + w} V${y + h} H${x} V${y + 14} Z`}
        fill="var(--pda-void)"
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      {/* The question, WHITE (owner) — it names the reading, so it outranks
          the keys under it. */}
      <text
        x={x + 18}
        y={y + 36}
        fontSize={FS.head}
        letterSpacing=".14em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
      >
        {q}
      </text>
      <line x1={x + 1} y1={y + 50} x2={x + w - 1} y2={y + 50} stroke="var(--pda-hair2)" />

      {pair.map(([k, v], i) => {
        const sx = x + 1 + (stacked ? 0 : i * (SUB_W + SUB_GAP));
        const subY = y + HEAD_H + (stacked ? i * (SUB_H + SUB_GAP) : 0);
        const subW = SUB_W;
        const subH = SUB_H;
        const kind = kinds[i];
        const enc = kind === "enc";
        const gph = kind === "gph";
        const mat = led ? "var(--pda-txt3)" : enc ? "var(--pda-grn)" : "var(--pda-gph-line)";
        return (
          <g key={k}>
            <rect
              x={sx}
              y={subY}
              width={subW}
              height={subH}
              fill={
                enc
                  ? "rgba(126, 159, 102, 0.07)"
                  : gph
                    ? "rgba(111, 127, 168, 0.06)"
                    : "rgba(var(--dawn-rgb), 0.03)"
              }
              stroke="none"
            />
            {/* The encoded material — the hatch band on the card's foot,
                clear of the last line's descenders. */}
            {enc ? (
              <g stroke={mat} opacity="0.5">
                {Array.from({ length: Math.floor(subW / 16) }, (_, j) => (
                  <line
                    key={j}
                    x1={sx + 6 + j * 16}
                    y1={subY + subH - 4}
                    x2={sx + 13 + j * 16}
                    y2={subY + subH - 11}
                  />
                ))}
              </g>
            ) : null}
            {/* The adjacent domain — the dashed inset. */}
            {gph ? (
              <rect
                x={sx + 4}
                y={subY + 4}
                width={subW - 8}
                height={subH - 8}
                fill="none"
                stroke={mat}
                strokeDasharray="4 3"
                opacity="0.7"
              />
            ) : null}
            <text
              x={sx + SUB_PAD}
              y={subY + 26}
              fontSize={FS.tag}
              letterSpacing=".22em"
              fill={hot ? "var(--pda-hot)" : "var(--pda-txt2)"}
            >
              {k}
            </text>
            {wrapLines(v, SUB_CHARS, 3).map((line, li) => (
              <text
                key={li}
                x={sx + SUB_PAD}
                y={subY + 62 + li * 20}
                fontSize={FS.value}
                letterSpacing=".08em"
                fill={
                  hot
                    ? "var(--pda-hot)"
                    : led
                      ? "var(--pda-txt3)"
                      : enc
                        ? "var(--pda-grn)"
                        : gph
                          ? "var(--pda-gph)"
                          : "var(--pda-txt)"
                }
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* The arrival, in ms. The card carries the flight from t=0 (it is the object
   reading 01 handed over); the owner seats, the bundles draw on under it,
   the nodes light, the base last — so the board assembles outward from the
   record rather than fading in as one picture. */
const T = {
  owner: 120,
  wire: 260,
  wireStep: 60,
  node: 380,
  nodeStep: 80,
} as const;

/* The board's three seats. The side pair flanks the card with a 30-unit
   gutter each side — what the bundles need to read as RUNS rather than as
   touching edges — and the base sits under the drop. */
/* The owner plate — WIDER than the card and centred on it (U5): it carries
   two columns now (the seat, and what it decides alone), and authority
   spanning the machine is the read. */
const OWNER_W = 400;
const OWNER_H = 106;
const OWNER_Y = 170;

/** ⚠ THE BOARD IS INSET 24 FROM THE CROP ON BOTH SIDES (U6, owner: the side
 *  nodes were "too close to the border of the frame"). They sat at x 36 with
 *  the crop starting at 36 — flush against the wall, with no margin at all.
 *  The 828 crop now reads 24 | 234 | 24 | 264 | 24 | 234 | 24, and the whole
 *  chain has to move together. */
const BOARD_INSET = 24;
const GUTTER = 24;
const LEFT_X = 36 + BOARD_INSET;
const RIGHT_X = CHIP_R + GUTTER;
/** The side pair is TALLER than the card and centred on it — the card keeps
 *  the hierarchy by VALUE (it is the one lit object), never by footprint. */
const NODE_Y = CHIP_CY - NODE_H / 2;
const BASE_X = MID - BASE_W / 2;
const OWNER_X = MID - OWNER_W / 2;
/** The base sits on the board's floor; the crop ends 15 units under it. */
const BASE_Y = 945 - BASE_H;

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
  /* ⚠ GREEN IS THE ENCODED RUN (owner: "you also removed the green lines").
     The bundles that carry encoded material — the Skill, and the context the
     stream inherits — letter in the provenance green; what the stream merely
     REACHES stays amber. Person-led dashes everything. */
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const c = work.cfg;

  /* Every animated group drops its class once the pointer has moved, so a
     hover repaints without replaying the entrance. The DOCK is the one
     exception and it lives in state — see pda.css. */
  const inCls = still ? undefined : "fl-pda-in";
  const at = (ms: number) => (still ? undefined : { animationDelay: `${ms}ms` });
  let wireN = 0;
  const drawAt = () => (still ? null : T.wire + wireN++ * T.wireStep);

  const barLines = wrapLines(c.bar, BAR_CHARS);
  /* Bundle opacity — lifted whole when its node is lit. With the readout
     gone (U3) the hover's whole meaning is this cross-light. */
  const op = (part: string) => (lit === part ? 0.95 : 0.62);

  return (
    <>
      {/* ── Chrome. The draw meter and NEVER A PRICE are DELETED (owner) —
              the reading is the configuration, not a gauge. ───────────── */}
      <g className={inCls}>
        <text x="40" y="66" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
          THE CONFIGURATION
        </text>
        <text x="40" y="90" fontSize={FS.tag} letterSpacing=".08em" fill="var(--pda-txt2)">
          {work.id}
        </text>
      </g>

      {/* ── The owner, in the green plate law, seated over the card and
              carrying what it decides alone in its own right column (U5).
              ⚠ THE ARROWED DIMENSION AND ITS TICKS ARE DELETED (U4), AND SO
              IS THE FLOATING `DECIDES ALONE · WIDE` LINE BETWEEN PLATE AND
              CARD (U5, owner: "clutter … integrate it a bit more subtly").
              The plate is wider than the card on purpose: authority spans
              the machine it answers for. ─────────────────────────────── */}
      <g className={inCls} style={at(T.owner)}>
        <path
          d={`M${OWNER_X + 14},${OWNER_Y} H${OWNER_X + OWNER_W} V${OWNER_Y + OWNER_H} H${OWNER_X} V${OWNER_Y + 14} Z`}
          fill={led ? "rgba(255, 255, 255, 0.02)" : "rgba(126, 159, 102, 0.09)"}
          stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
          strokeDasharray={led ? "5 4" : undefined}
        />
        <text
          x={OWNER_X + 20}
          y={OWNER_Y + 36}
          fontSize={FS.tag}
          letterSpacing=".22em"
          fill="var(--pda-txt2)"
        >
          WHO OWNS IT
        </text>
        <text
          x={OWNER_X + 20}
          y={OWNER_Y + 74}
          fontSize={FS.owner}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        >
          {work.owner}
        </text>
        <text
          x={OWNER_X + OWNER_W - 20}
          y={OWNER_Y + 36}
          textAnchor="end"
          fontSize={FS.chrome}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          DECIDES ALONE
        </text>
        <text
          x={OWNER_X + OWNER_W - 20}
          y={OWNER_Y + 74}
          textAnchor="end"
          fontSize={FS.bar}
          letterSpacing=".08em"
          fill="var(--pda-hot)"
        >
          {work.autonomy}
        </text>
      </g>

      {/* ── The seat's own connector: a dashed line in the PLATE'S OWN
              GREEN, NOT a bundle (owner: "not with the lines like we do
              with the rest, but with other lines"). ADR-070's law is why it
              reads right — the seat is AUTHORITY, not data, so it is
              answerable-to rather than feeding-into, and one dashed line
              says that where eight solid conductors would say the opposite.
              ⚠ IT TAKES THE PLATE'S COLOUR AND FULL WEIGHT (U6). The first
              cut drew it in `--pda-dim` at 0.75 and the owner read it as
              ABSENT — "why does WHO OWNS IT not have a connector?". A line
              quiet enough to be missed is not a subtle connection, it is a
              missing one; the DASH carries the distinction, the value does
              not have to. It ends on a tick at the card's edge so the
              contact is drawn rather than implied. ───────────────────── */}
      <g
        className={inCls}
        style={at(T.owner + 80)}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
      >
        <line
          x1={MID}
          y1={OWNER_Y + OWNER_H}
          x2={MID}
          y2={CHIP.y}
          strokeDasharray="6 5"
          opacity="0.95"
        />
        <line x1={MID - 9} y1={CHIP.y} x2={MID + 9} y2={CHIP.y} opacity="0.95" />
      </g>

      {/* ── The bundles. Green carries the encoded runs; amber carries what
              the stream reaches. ─────────────────────────────────────── */}
      <Ribbon
        pts={[
          [CHIP.x, CHIP_CY],
          [LEFT_X + NODE_W, CHIP_CY],
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
      {/* Two runs into the base, jogging out to its shoulders — the drop
          that closes the board. */}
      <Ribbon
        pts={[
          [MID - 44, CHIP_B],
          [MID - 44, BASE_Y - 78],
          [MID - 74, BASE_Y - 48],
          [MID - 74, BASE_Y],
        ]}
        n={6}
        stroke={green}
        opacity={op("inh")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [MID + 44, CHIP_B],
          [MID + 44, BASE_Y - 78],
          [MID + 74, BASE_Y - 48],
          [MID + 74, BASE_Y],
        ]}
        n={6}
        stroke={wire}
        opacity={op("inh")}
        dashed={led}
        draw={drawAt()}
      />

      {/* ── The three question nodes ─────────────────────────────────── */}
      <g className={inCls} style={at(T.node)}>
        <QNode
          x={LEFT_X}
          y={NODE_Y}
          q="WHAT RUNS IT"
          pair={runsPair(work)}
          kinds={["enc", "plain"]}
          seat="stack"
          part="runs"
          led={led}
          hot={lit === "runs"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + T.nodeStep)}>
        <QNode
          x={RIGHT_X}
          y={NODE_Y}
          q="WHAT IT CAN REACH"
          pair={reachPair(work)}
          kinds={["plain", "plain"]}
          seat="stack"
          part="rch"
          led={led}
          hot={lit === "rch"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + 2 * T.nodeStep)}>
        <QNode
          x={BASE_X}
          y={BASE_Y}
          q="WHAT IT INHERITS"
          pair={inheritsPair(work)}
          kinds={["enc", "gph"]}
          seat="row"
          part="inh"
          led={led}
          hot={lit === "inh"}
          onLit={onLit}
        />
      </g>

      {/* ── The one bright object: the card, carrying THE BAR on its face.
              The dock's `fill-box` origin stays the cartridge's own. ──── */}
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
        <path
          d={`M${CHIP.x + 14 * CORE_K},${CHIP.y} H${CHIP_R} V${CHIP_B} H${CHIP.x} V${CHIP.y + 14 * CORE_K} Z`}
          fill={led ? "rgba(var(--dawn-rgb), 0.04)" : "rgba(var(--dawn-rgb), 0.09)"}
          stroke="none"
        />
        <Cartridge
          x={CHIP.x}
          y={CHIP.y}
          w={CHIP.w}
          h={CHIP.h}
          state={led ? "led" : "hot"}
          work={work}
          k={CORE_K}
          bar={{ label: "THE BAR", lines: barLines }}
        />
      </g>
      {/* The bar's hover bed — a SIBLING of the dock group on purpose: the
          listener re-renders on hover, and the dock's entrance style must
          never re-evaluate mid-flight. */}
      <rect
        x={CHIP.x}
        y={CHIP.y + 150}
        width={CHIP.w}
        height={CHIP.h - 150}
        fill="transparent"
        onMouseEnter={() => onLit("gat")}
        onMouseLeave={() => onLit(null)}
      />
    </>
  );
}

/** Re-exported so `pda.css`'s dock duration and this drawing stay one pair. */
export { PDA_FLIGHT_MS };
