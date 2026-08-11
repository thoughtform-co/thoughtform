"use client";

import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import { wrapLines } from "./pdaGlyphs";
import type { PdaEntry } from "./PdaEntry";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { type Pt, polylineLength, ribbonPaths } from "./ribbon";

/**
 * 02 · THE CONFIGURATION — the R4 substrate field (ADR-070 U11).
 *
 * The composition is the owner's `design_handoff_intel_config_r4`
 * (2026-08-11) — a design handoff, not a sketch: a README with a module
 * table, a chrome grammar and a token list, plus `r4-substrate-field.html`
 * as a pixel-exact prototype of one state (W-017). **Every module position
 * below is that table's**, in that file's own 888 × 744 stage coordinates,
 * so the drawing can be diffed against the reference rather than argued
 * about.
 *
 * ⚠ **THE HANDOFF SAYS "RECREATE PIXEL-PERFECTLY" AND THE TYPE IS THE ONE
 * THING THAT CANNOT BE.** The prototype is authored at 1:1 in a 960-wide
 * frame; this console's field is 603 × 493 at 1280×720 and 850 × 760 at
 * 1920×1080, so `meet` scales the whole drawing to 0.68 / 0.96. The
 * reference's 8.5px field label lands at **5.6px** on a laptop — the size
 * the owner called "utterly illegible" one day earlier, and under the
 * 8.5px chrome floor ADR-063 records as this surface's standing defect.
 * So the reference's type RANKING is kept and its bottom rungs are lifted
 * to the floor: the ladder's range narrows, which is the cost, and every
 * rung renders LARGER than what shipped yesterday, which is the win.
 *
 * ⚠ **THE CROP IS THE REFERENCE'S OWN FRAME, AND THAT IS WHY THE PANEL
 * FILLS.** `meet` takes the minimum of the two box ratios, so the crop's
 * aspect decides which axis letterboxes. Measured field aspects are 1.223
 * (1280×720), 1.239 (1440×800) and 1.118 (1920×1080); the R4 stage is
 * **1.194**, i.e. almost exactly the panel it has to fill. With the frame
 * inset restored (see `CONFIG_VIEWBOX`) the crop is 1.241 and the meet goes
 * 0.541 → **0.647** at the binding preset and 0.833 → **0.912** at 1920.
 * That is a **+20 % / +9 % type lift bought by the aspect alone**, before a
 * single font size changed — and it is what pays for the lifted bottom rungs.
 *
 * Rendered, at the smallest rung (12): **7.8px** at 1280×720 and **10.9px**
 * at 1920×1080, against 7.0 / 10.0 for the board this replaces. Every rung
 * on the ladder is larger than what shipped yesterday: the value goes
 * 8.1 → 9.1px and the title 12.4 → 14.2px at the binding preset.
 *
 * ⚠ **WHAT THE REFERENCE LETTERS THAT THIS DRAWING DOES NOT**, each for a
 * reason that is arithmetic or a standing law rather than taste:
 *
 *   side stamps (5)     invented designators (`S-03 · M-01 / REV C`) —
 *                       ordinals in costume, which this surface has
 *                       removed twice (ADR-066, ADR-068's `T-01` scan)
 *   passive labels (6)  same, and at 6px they render 4.0px — under the
 *                       smoke's own 4.3px floor. The MARKS stay: the bed's
 *                       texture never depended on the letters
 *   header metas (3)    `RUNS` beside `WHAT RUNS IT` is the question said
 *                       twice, and at a legible size the pair does not fit
 *                       a 204-unit module (163.5 + 44.4 against 180)
 *   ribbon tags (4)     `LANE 01–08` collides with the model LANE, which is
 *                       a live record field; and the bundles are named by
 *                       the modules they enter
 *   satellite meters(2) a 4-bar gauge beside a client's named Skill implies
 *                       a measurement this case does not publish and the
 *                       reference did not author. The CORE's meter stays,
 *                       because there it is real — see `LANES`
 *
 * Everything else — the module table, the opposed corner cuts, the 2px top
 * rules, the opaque-modules-on-a-faint-bed density rule, the 8-wire hatched
 * ribbons, the ghost die, the meanders, the passives, the vias and the role
 * law (gold = wayfinding, green = the human) — is the reference's.
 *
 * ⚠ **THE CARD IS DRAWN HERE, NOT BY `Cartridge`**, and its SILHOUETTE may
 * not move: `CORE_RECT` is ADR-069's flight destination. The reference's
 * core is 300 × 224 (1.339) and the cartridge is 176 × 136 (1.294), which
 * are not similar — a uniform `dk` cannot carry a shape that changes
 * proportion — so the box is `176 × 136 × CORE_K` centred on the
 * reference's own core centre. It lands within a unit of the table
 * horizontally and 3.6 units vertically.
 */

/**
 * THE REFERENCE'S STAGE PLUS ITS FRAME INSET, trimmed to what the drawing
 * actually reaches — a uniform **26 units** around content that runs
 * `4…884 × 20…719`.
 *
 * ⚠ THE INSET IS NOT PADDING, IT IS THE REFERENCE'S OWN FRAME. The handoff
 * draws a 960 × 880 frame and insets its stage 36px inside it, so its modules
 * sit 40px off the frame wall — 4.2 % of the width. Cropping to the STAGE
 * alone dropped that: measured on the live landing, the side modules landed
 * **2.7px** off the console wall and read as clipped rather than as bleeding.
 * ADR-064's "the frame is a bezel the content bleeds into" is about a
 * CAPTURE filling its bay; a technical drawing whose outermost rule touches
 * the wall has simply lost its margin.
 *
 * The inset costs type — it is width that no longer scales — and 26 is where
 * that stops being worth it: the drawing is width-bound at 0.647 and
 * height-bound at 0.657 at the binding preset, i.e. it fills the panel to
 * within one percent on BOTH axes, which is as close to no letterbox as a
 * single crop gets.
 *
 * `pda-viewbox` asserts the containment, the aspect and the inset itself, so
 * none of the three can drift back silently.
 */
export const CONFIG_VIEWBOX = "-22 -6 932 751";

/** The modules, verbatim from the handoff's position table. */
const OWNER = { x: 232, y: 20, w: 424, h: 108 } as const;
const LEFT = { x: 4, y: 192, w: 204, h: 218 } as const;
const RIGHT = { x: 680, y: 192, w: 204, h: 218 } as const;
const BASE = { x: 244, y: 532, w: 400, h: 128 } as const;

/**
 * The card, and the flight's second home. `CORE_K` × the 176×136 cartridge,
 * so the two rects are EXACTLY similar and one uniform scale carries the
 * morph without the object changing proportion on the way.
 *
 * ⚠ `1.7` is chosen so the box matches the reference's 300-wide core to
 * within a unit; the reference's own 300 × 224 is not similar to the
 * cartridge and cannot be used directly.
 */
export const CORE_K = 1.7;
const CORE_W = 176 * CORE_K;
const CORE_H = 136 * CORE_K;
/** Centred on the reference core's centre (444, 300). */
const CORE = { x: 444 - CORE_W / 2, y: 300 - CORE_H / 2, w: CORE_W, h: CORE_H } as const;
export const CORE_RECT: FlightRect = { ...CORE };

const CORE_R = CORE.x + CORE.w;
const CORE_B = CORE.y + CORE.h;
const CORE_CY = CORE.y + CORE.h / 2;

/** The reference's 45° corner cut, 12 deep, on every satellite. */
const CUT = 12;
/** ⚠ The CARD's cut stays PROPORTIONAL to the cartridge's, so the object the
 *  flight carries keeps its silhouette all the way across. */
const CORE_CUT = 14 * CORE_K;

/**
 * THE TYPE LADDER — the reference's RANKING, with its bottom rungs lifted to
 * the floor the owner set (ADR-070 U10: nothing letters under 12).
 *
 *   role        reference   here   why it moved
 *   title           30       22    the record's longest is CANDIDATE
 *                                  SCREENING (19 chars) against the
 *                                  reference's CAMPAIGN COPY (13); 22 is
 *                                  the largest that letters 19 in 263u
 *   value           11       14    the floor, plus the rank above the key
 *   owner name    11.5       14    near-parity with the value, exactly as
 *                                  the reference has it; bold + green
 *                                  carries the emphasis, not size
 *   question         9       13    demoted BELOW the value, which is the
 *                                  reference's own order and ADR-069's
 *                                  principle: the question is chrome
 *   field key      8.5     12.5    the floor +0.5
 *   chrome       6.5–8       12    the floor. This is where the reference's
 *                                  range is lost — it is bought back in
 *                                  ALPHA, which does not shrink with meet
 */
const FS = {
  title: 22,
  value: 14,
  owner: 14,
  q: 13,
  id: 13,
  lat: 13,
  ownerKey: 13,
  key: 12.5,
  chrome: 12,
} as const;

/** PT Mono's advance plus the tracking. */
const adv = (fs: number, track: number) => fs * (0.6 + track);
/**
 * ⚠ THE BASELINE STEP IS NOT THE LINE BOX. `lineBox` is what a line OCCUPIES;
 * stepping consecutive baselines by it makes their glyph boxes abut, and
 * `getBBox` reports taller than 1.3 em — the lab's capture gate flagged real
 * collisions between the two wrapped lines of one value. 1.7 is the house
 * number, and the smoke's label-on-label walk is what holds it.
 */
const STEP = FS.value * 1.7;
const charsFor = (measure: number, fs: number) => Math.max(1, Math.floor(measure / adv(fs, 0.08)));

/* ── The module interior ────────────────────────────────────────────────
   One padding, one header height, one cell height, so the two satellites and
   the base share a rhythm. `CELL_H` seats a key line plus two wrapped value
   lines with 15 units under the descenders. */
const PAD = 12;
const CORE_PAD = 18;
const HEAD_H = 34;
const CELL_H = 87;
const KEY_BASE = 24;
const VAL_BASE = 44;

const SAT_MEASURE = LEFT.w - PAD * 2;
const BASE_COL = BASE.w / 2;
const BASE_MEASURE = BASE_COL - PAD * 2;
const CORE_MEASURE = CORE.w - CORE_PAD * 2;
/** The seat's two columns. The worst pair is the person-led owner line (252u)
 *  beside `DECIDES ALONE` (124.8u) — 367 of 388, so the columns cannot meet. */
const OWNER_MEASURE = 250;
const OWNER_RIGHT = 128;

/**
 * THE LANE LADDER — four cells, filled to where this stream runs.
 *
 * ⚠ THIS IS THE ONE THING THE OWNER DELETED THAT THE R4 HANDOFF BRINGS BACK,
 * and it is a different quantity wearing the same shape. ADR-070 U4 removed
 * the DRAW PER RUN meter, which measured WORKLOAD and needed a NEVER A PRICE
 * caption to stay honest; `PdaWork.draw` still carries that and still letters
 * nowhere. This meter is the capability LANE, which is generic by law, is
 * already published, and has exactly four values — so the gauge is the record
 * rather than a rating of it.
 *
 * It also answers the complaint that retired `laneRun` from the MODEL cell
 * (owner, 2026-08-11: _"model — everyday lane? What does everyday lane
 * mean?"_). Nothing on the surface placed the tier in a scale; four cells
 * with two lit is that scale, and the verbs stay in the module.
 */
const LANES = ["FAST", "EVERYDAY", "DEEP", "FRONTIER"] as const;
const laneStep = (lane: string) => LANES.indexOf(lane as (typeof LANES)[number]) + 1;
const laneLabel = (lane: string) => (laneStep(lane) > 0 ? `${lane} TIER` : "NO LANE");
const METER = { cell: 13, gap: 3, h: 4 } as const;
const METER_W = METER.cell * 4 + METER.gap * 3;

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
 * The three questions and their six answers — ADR-070 U9's slotting, which
 * the R4 handoff's own module table repeats unchanged.
 *
 * ⚠ `MODEL` ANSWERS WITH THE VERBS, NOT THE LANE. The lane is a GENERIC
 * capability tier by law — the map's envelope forbids naming a model family
 * and `cases-registry` fails on one — so it cannot be made concrete by naming
 * the model. `m[1]` is the concrete thing the record already holds, and the
 * tier is answered by the card's lane ladder instead.
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
    {
      slot: "ownerLabel",
      text: "WHO OWNS IT",
      fs: FS.ownerKey,
      track: 0.2,
      measure: OWNER_MEASURE,
    },
    { slot: "owner", text: work.owner, fs: FS.owner, track: 0.1, measure: OWNER_MEASURE },
    { slot: "decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.2, measure: OWNER_RIGHT },
    { slot: "autonomy", text: work.autonomy, fs: FS.lat, track: 0.22, measure: OWNER_RIGHT },
  ];

  /* THE SEAT'S SECOND LINE — what that seat actually owns (U7). Absent for
     person-led, which has no configured seat to gloss. */
  if (work.ownerNote) {
    specs.push({
      slot: "ownerNote",
      text: work.ownerNote,
      fs: FS.chrome,
      track: 0.14,
      measure: OWNER.w - 36,
    });
  }

  for (const g of groups) {
    const measure = g.part === "whr" ? BASE_MEASURE : SAT_MEASURE;
    const qMeasure = (g.part === "whr" ? BASE.w : LEFT.w) - PAD * 2;
    specs.push({ slot: `${g.q}.q`, text: g.q, fs: FS.q, track: 0.14, measure: qMeasure });
    for (const cell of g.cells) {
      specs.push({
        slot: `${g.q}.${cell.key}.k`,
        text: cell.key,
        fs: FS.key,
        track: 0.18,
        measure,
      });
      specs.push(...valueSpecs(`${g.q}.${cell.key}`, cell.value, FS.value, measure));
    }
  }

  /* ⚠ THE CARD'S OWN STRINGS ARE DECLARED HERE. While the card was
     `Cartridge` they were lettered by a shared glyph and this declaration
     never saw them — the guard was walking a drawing with three invisible
     labels in it. Any reading that mounts a production glyph inherits that
     blind spot. */
  specs.push({ slot: "card.team", text: work.teamAb, fs: FS.chrome, track: 0.24, measure: 120 });
  specs.push({ slot: "card.id", text: work.id, fs: FS.id, track: 0.18, measure: 120 });
  specs.push({
    slot: "card.title",
    text: work.title,
    fs: FS.title,
    track: 0.01,
    measure: CORE_MEASURE,
  });
  specs.push({
    slot: "card.tier",
    text: laneLabel(work.lane),
    fs: FS.chrome,
    track: 0.2,
    measure: CORE_MEASURE - METER_W - 12,
  });

  specs.push({
    slot: "bar.label",
    text: "THE BAR",
    fs: FS.key,
    track: 0.18,
    measure: CORE_MEASURE,
  });
  specs.push(...valueSpecs("bar", work.cfg.bar, FS.value, CORE_MEASURE));

  return specs;
}

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

/**
 * A MODULE HOUSING — the R4 grammar: opaque fill, 1px border, a 2px top rule,
 * and TWO OPPOSED 45° CORNER CUTS (top-left + bottom-right).
 *
 * ⚠ THE DIAGONAL IS TL+BR, WHICH IS ADR-065'S MIRRORED CASE, and it is the
 * owner's for the second time: the console frame these plates sit in took the
 * same override in ADR-065 U2. So the drawing and its housing now cut the
 * same way, which is the argument the first override did not have.
 *
 * The cut line is the outline itself — the reference builds it from a rotated
 * cover square with one border, which is the CSS way of drawing exactly this
 * path.
 */
const housing = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c},${y} H${x + w} V${y + h - c} L${x + w - c},${y + h} H${x} V${y + c} Z`;

/** A multi-conductor bundle — 8 parallel wires at 4 pitch behind a 45° hatch,
 *  the reference's one cable grammar on all five docks. */
function Ribbon({
  pts,
  hatch,
  stroke,
  fill,
  opacity,
  dashed,
  draw,
}: {
  pts: readonly Pt[];
  /** The hatched bands, in the reference's own rects — vertical runs only on
   *  the buses, exactly as the handoff specifies. */
  hatch: readonly (readonly [number, number, number, number])[];
  stroke: string;
  fill: string;
  opacity: number;
  dashed?: boolean;
  draw: number | null;
}) {
  /* ⚠ The class goes on each PATH, not the group: `fl-pda-wire` animates
     `stroke-dashoffset`, and reading 03 proves the per-path form. */
  const len = draw === null ? 0 : polylineLength(pts);
  return (
    <g opacity={opacity}>
      {/* ⚠ THE HATCH ARRIVES WITH ITS WIRES. It is a fill, so it cannot
          draw on — and left ungated it painted at full strength while the
          conductors were still travelling, which read as empty bands landing
          before their cables. Same delay, so the band assembles as one. */}
      <g
        className={draw === null ? undefined : "fl-pda-in"}
        style={{ animationDelay: `${draw}ms` }}
      >
        {hatch.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={`url(#${fill})`} />
        ))}
      </g>
      <g stroke={stroke} fill="none" strokeWidth="1">
        {ribbonPaths(pts, 8, 4).map((d, i) => (
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
    </g>
  );
}

/**
 * A key and its answer.
 *
 * ⚠ ONE INK FOR EVERY ANSWER, AND THE KEY IN TENSOR GOLD (owner, and the R4
 * token law says the same: gold is wayfinding, and a field label is how the
 * reader finds the field). `--pda-ink` is `--gold-ink`, the 4.5:1 rung of
 * ADR-063 U2's ramp — NEVER `--gold` itself, which is the MARK rung and
 * measures ~1.1:1 as small text on the light theme's parchment.
 */
function Cell({
  x,
  y,
  cell,
  measure,
  led,
}: {
  x: number;
  y: number;
  cell: CellDef;
  measure: number;
  led: boolean;
}) {
  return (
    <g>
      <text
        x={x + PAD}
        y={y + KEY_BASE}
        fontSize={FS.key}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        {cell.key}
      </text>
      {valueLines(cell.value, FS.value, measure).map((line, i) => (
        <text
          key={i}
          x={x + PAD}
          y={y + VAL_BASE + STEP * i}
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
 * A question module: the R4 housing, a header band carrying the question in
 * bold, and two cells.
 *
 * ⚠ NO DIVIDER BETWEEN THE CELLS. The owner's "clean separation between skill
 * and model" (2026-08-11) was a ruling against the hatch and the dashed inset
 * that were there; the R4 reference makes the gold key the separator instead,
 * and a rule between two blocks that already start with a gold word is the
 * chrome this pass is removing.
 */
function QNode({
  box,
  g,
  stacked,
  led,
  hot,
  onLit,
}: {
  box: { x: number; y: number; w: number; h: number };
  g: GroupDef;
  stacked: boolean;
  led?: boolean;
  hot?: boolean;
  onLit: (k: string | null) => void;
}) {
  const { x, y, w, h } = box;
  /* The reference borders its satellites at dawn .25 — quiet, well under the
     core's gold and the seat's green. `--pda-hair2` is this console's own
     hairline at that weight, already re-derived for the light flip. */
  const stroke = hot ? "var(--pda-hot)" : led ? "var(--pda-txt3)" : "var(--pda-hair2)";
  const measure = stacked ? SAT_MEASURE : BASE_MEASURE;
  return (
    <g onMouseEnter={() => onLit(g.part)} onMouseLeave={() => onLit(null)}>
      <path d={housing(x, y, w, h, CUT)} fill="var(--pda-void)" />
      {/* THE DENSITY RULE: modules are OPAQUE so they pop off the bed. The
          lift is a dawn wash, which inverts correctly on the light flip —
          there it darkens the plate against parchment. */}
      <path d={housing(x, y, w, h, CUT)} fill="rgba(var(--dawn-rgb), 0.03)" />
      <path
        d={housing(x, y, w, h, CUT)}
        fill="none"
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      {/* The header band, and the 2px top rule over it. */}
      <path d={housing(x, y, w, HEAD_H, CUT)} fill="rgba(var(--dawn-rgb), 0.05)" />
      <line x1={x + CUT} y1={y + 1} x2={x + w} y2={y + 1} stroke={stroke} strokeWidth="2" />
      <line x1={x} y1={y + HEAD_H} x2={x + w} y2={y + HEAD_H} stroke="var(--pda-hair)" />
      <text
        x={x + PAD}
        y={y + 23}
        fontSize={FS.q}
        fontWeight={700}
        letterSpacing=".14em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
      >
        {g.q}
      </text>
      {g.cells.map((c, i) => (
        <Cell
          key={c.key}
          x={x + (stacked ? 0 : i * BASE_COL)}
          y={y + HEAD_H + (stacked ? i * CELL_H : 0)}
          cell={c}
          measure={measure}
          led={Boolean(led)}
        />
      ))}
    </g>
  );
}

/** The lane ladder and its label — see `LANES`. Four cells, lit to the tier
 *  this stream runs on; person-led lights none and says so. */
function LaneMeter({ x, y, lane }: { x: number; y: number; lane: string }) {
  const step = laneStep(lane);
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x + i * (METER.cell + METER.gap)}
          y={y}
          width={METER.cell}
          height={METER.h}
          fill={i < step ? "var(--pda-amb)" : "none"}
          stroke="var(--pda-hair2)"
        />
      ))}
      <text
        x={x + METER_W + 12}
        y={y + METER.h / 2 + FS.chrome * 0.36}
        fontSize={FS.chrome}
        letterSpacing=".2em"
        fill="var(--pda-ink)"
      >
        {laneLabel(lane)}
      </text>
    </g>
  );
}

/**
 * THE WORK — the reference's core module, on the cartridge's silhouette.
 *
 * The gauge is the state mark ADR-062 needs: the reference's square-in-square
 * where a configuration is on record, and a crossed square where the work is
 * deliberately person-led.
 *
 * ⚠ THE SILHOUETTE MAY NOT MOVE. `CORE_RECT` is the flight's destination and
 * the docking group must contain this card ALONE: `fill-box` means the
 * transform is measured against the group's own bbox, and a child reaching
 * past the rect moves the origin the whole flight is computed from.
 */
function SeatCard({ work, led }: { work: PdaWork; led: boolean }) {
  const stroke = led ? "var(--pda-txt3)" : "var(--pda-hot)";
  const d = housing(CORE.x, CORE.y, CORE.w, CORE.h, CORE_CUT);
  const gx = CORE.x + CORE_PAD;
  const gy = CORE.y + 14;
  /* ⚠ THE BAR BLOCK IS SEATED, NOT STACKED. The reference pins its meter to
     the card's floor and lets the slack fall where it lands; at this size
     that put a 55-unit hole in the middle of the one bright object. 120
     splits it — 39 units of air above the block and 39 below, measured
     against the title's descenders and the meter's cap. */
  const barBase = CORE.y + 120;
  const meterY = CORE.y + CORE.h - 22;
  return (
    <g>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={led ? "rgba(var(--dawn-rgb), 0.03)" : "rgba(240, 200, 106, 0.07)"} />
      <path d={d} fill="none" stroke={stroke} strokeDasharray={led ? "5 4" : undefined} />
      <line
        x1={CORE.x + CORE_CUT}
        y1={CORE.y + 1}
        x2={CORE_R}
        y2={CORE.y + 1}
        stroke={stroke}
        strokeWidth="2"
      />

      {/* The state mark: the reference's 14-unit outline with a 5-unit fill. */}
      <rect x={gx} y={gy} width={14} height={14} fill="none" stroke={stroke} />
      {led ? (
        <g stroke={stroke}>
          <line x1={gx + 3} y1={gy + 3} x2={gx + 11} y2={gy + 11} />
          <line x1={gx + 11} y1={gy + 3} x2={gx + 3} y2={gy + 11} />
        </g>
      ) : (
        <rect x={gx + 4.5} y={gy + 4.5} width={5} height={5} fill={stroke} />
      )}

      <text
        x={gx + 23}
        y={gy + 11}
        fontSize={FS.chrome}
        letterSpacing=".24em"
        fill="var(--pda-txt2)"
      >
        {work.teamAb}
      </text>
      <text
        x={CORE_R - CORE_PAD}
        y={gy + 11}
        textAnchor="end"
        fontSize={FS.id}
        letterSpacing=".18em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      >
        {work.id}
      </text>

      <text
        x={gx}
        y={CORE.y + 66}
        fontSize={FS.title}
        fontWeight={700}
        letterSpacing=".01em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
      >
        {work.title}
      </text>

      <text x={gx} y={barBase} fontSize={FS.key} letterSpacing=".18em" fill="var(--pda-ink)">
        THE BAR
      </text>
      {valueLines(work.cfg.bar, FS.value, CORE_MEASURE).map((line, i) => (
        <text
          key={i}
          x={gx}
          y={barBase + 20 + STEP * i}
          fontSize={FS.value}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}

      <LaneMeter x={gx} y={meterY} lane={work.lane} />
    </g>
  );
}

/**
 * The seat. Green marks the human and is used nowhere else — the R4 role law,
 * which is ADR-070 U5's own distinction expressed as a colour rather than as
 * a line weight.
 */
function OwnerPlate({ work, led }: { work: PdaWork; led: boolean }) {
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const d = housing(OWNER.x, OWNER.y, OWNER.w, OWNER.h, CUT);
  const lx = OWNER.x + 18;
  const rx = OWNER.x + OWNER.w - 18;
  /* Centred on its own ink: three rows measuring 61.4 units in a 108-unit
     plate, which is 23.3 of air above and below. */
  const r1 = OWNER.y + 33;
  return (
    <g>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={led ? "rgba(var(--dawn-rgb), 0.03)" : "rgba(126, 159, 102, 0.07)"} />
      <path d={d} fill="none" stroke={green} strokeDasharray={led ? "5 4" : undefined} />
      <line
        x1={OWNER.x + CUT}
        y1={OWNER.y + 1}
        x2={OWNER.x + OWNER.w}
        y2={OWNER.y + 1}
        stroke={green}
        strokeWidth="2"
      />

      <text x={lx} y={r1} fontSize={FS.ownerKey} letterSpacing=".2em" fill="var(--pda-txt2)">
        WHO OWNS IT
      </text>
      <text
        x={rx}
        y={r1}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".2em"
        fill="var(--pda-txt3)"
      >
        DECIDES ALONE
      </text>

      <text
        x={lx}
        y={r1 + 26}
        fontSize={FS.owner}
        fontWeight={700}
        letterSpacing=".1em"
        fill={green}
      >
        {work.owner}
      </text>
      <text
        x={rx}
        y={r1 + 26}
        textAnchor="end"
        fontSize={FS.lat}
        fontWeight={700}
        letterSpacing=".22em"
        fill="var(--pda-hot)"
      >
        {work.autonomy}
      </text>

      {work.ownerNote ? (
        <text x={lx} y={r1 + 48} fontSize={FS.chrome} letterSpacing=".14em" fill="var(--pda-txt2)">
          {work.ownerNote}
        </text>
      ) : null}
    </g>
  );
}

/**
 * THE SUBSTRATE BED — the field the modules sit on, and the thing the
 * reference is named for.
 *
 * ⚠ ITS DENSITY RULE IS AN ALPHA CEILING, NOT A SIZE FLOOR: nothing here
 * exceeds ~.14, and the modules stay opaque so they pop. That is why the bed
 * survives this drawing's type lift unchanged while its LABELS did not — a
 * mark at .14 reads as texture at any scale, and a 4px letter reads as dirt.
 *
 * Every coordinate is the reference's own.
 */
function SubstrateBed() {
  const vias =
    "M40 160h3v3h-3zM90 300h3v3h-3zM150 452h3v3h-3zM240 706h3v3h-3zM420 480h3v3h-3z" +
    "M520 150h3v3h-3zM640 140h3v3h-3zM760 150h3v3h-3zM856 600h3v3h-3zM300 716h3v3h-3z" +
    "M660 700h3v3h-3zM560 480h3v3h-3zM220 150h3v3h-3zM360 150h3v3h-3z";
  const passives = [
    [56, 64],
    [806, 84],
    [96, 470],
    [816, 470],
    [70, 688],
    [700, 700],
  ] as const;
  return (
    /* ⚠ ONE GROUP OPACITY IS THE ALPHA CEILING — but it is set against the
       RENDERED drawing, not the reference's 1:1 canvas. `meet` is 0.647 at
       the binding preset, so every 1-unit hairline here paints 0.65 device px
       and the browser pays for the rest in alpha: the reference's ~.14 bed
       arrives at ~.09 and disappears. 0.85 is what puts it back where the
       reference has it. */
    <g opacity="0.85" aria-hidden="true">
      {/* The ghost die — the card's own footprint, 20 units proud on every
          side. It is what the eye reads as the card's bezel. */}
      <rect
        x={CORE.x - 20}
        y={CORE.y - 20}
        width={CORE.w + 40}
        height={CORE.h + 40}
        fill="none"
        stroke="var(--pda-hair2)"
        strokeDasharray="4 5"
      />
      <path
        d="M20 140H180L220 180V400M868 440V560L820 610H700"
        fill="none"
        stroke="var(--pda-hair2)"
      />
      <g fill="var(--pda-hair2)">
        {passives.map(([px, py]) => (
          <g key={`${px}-${py}`}>
            <rect x={px} y={py} width={10} height={4} />
            <rect x={px} y={py + 7} width={10} height={4} />
          </g>
        ))}
      </g>
      <path d={vias} fill="var(--pda-hair2)" opacity="0.7" />
    </g>
  );
}

/* The arrival, in ms. The card carries the flight from t=0 (it is the object
   reading 01 handed over); the bed settles, the owner seats, the bundles draw
   on under it, the modules light — so the board assembles outward from the
   record rather than fading in as one picture. */
const T = { bed: 60, owner: 120, wire: 260, wireStep: 60, node: 380, nodeStep: 80 } as const;

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
  /* ⚠ GREEN IS THE HUMAN AND NOTHING ELSE (the R4 role law, which is why the
     seat's drop is the one green bundle on the board). What the stream runs
     on, reaches and runs in are all gold: none of them is a person. */
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

  return (
    <>
      {/* ⚠ ONE PATTERN PAIR PER MOUNT. The ids are stable because the fragment
          unmounts with the reading; `url(#…)` resolves against the document,
          so a second copy on the page would be a silent collision. */}
      <defs>
        <pattern id="fl-pda-hatch-au" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke="var(--pda-amb)" strokeOpacity="0.34" strokeWidth="1" />
        </pattern>
        <pattern id="fl-pda-hatch-vd" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke={green} strokeOpacity="0.4" strokeWidth="1" />
        </pattern>
      </defs>

      <g className={inCls} style={at(T.bed)}>
        <SubstrateBed />
      </g>

      <g className={inCls} style={at(T.owner)}>
        <OwnerPlate work={work} led={led} />
      </g>

      {/* ── THE FIVE DOCKS, one cable grammar (the handoff's own rule). The
              seat's drop is green because the seat is a PERSON; the other four
              are gold. ADR-070 U5's law — the seat is AUTHORITY, not data — is
              kept by COLOUR here rather than by weight or by a dashed line,
              and it is the reference's role law saying the same thing. ───── */}
      <Ribbon
        pts={[
          [444, OWNER.y + OWNER.h],
          [444, CORE.y],
        ]}
        hatch={[[430, OWNER.y + OWNER.h, 28, CORE.y - OWNER.y - OWNER.h]]}
        stroke={green}
        fill="fl-pda-hatch-vd"
        opacity={0.85}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [CORE.x, CORE_CY],
          [LEFT.x + LEFT.w, CORE_CY],
        ]}
        hatch={[[LEFT.x + LEFT.w, CORE_CY - 14, CORE.x - LEFT.x - LEFT.w, 28]]}
        stroke={wire}
        fill="fl-pda-hatch-au"
        opacity={op("runs")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [CORE_R, CORE_CY],
          [RIGHT.x, CORE_CY],
        ]}
        hatch={[[CORE_R, CORE_CY - 14, RIGHT.x - CORE_R, 28]]}
        stroke={wire}
        fill="fl-pda-hatch-au"
        opacity={op("rch")}
        dashed={led}
        draw={drawAt()}
      />
      {/* BUS A and BUS B — two bundles off the card's floor, jogging 45° into
          the base module's two columns. Hatch on the vertical runs only. */}
      {[
        [376, 348],
        [512, 540],
      ].map(([from, to]) => (
        <Ribbon
          key={from}
          pts={[
            [from, CORE_B],
            [from, 448],
            [to, 476],
            [to, BASE.y],
          ]}
          hatch={[
            [from - 14, CORE_B, 28, 448 - CORE_B],
            [to - 14, 476, 28, BASE.y - 476],
          ]}
          stroke={wire}
          fill="fl-pda-hatch-au"
          opacity={op("whr")}
          dashed={led}
          draw={drawAt()}
        />
      ))}

      <g className={inCls} style={at(T.node)}>
        <QNode box={LEFT} g={runs} stacked led={led} hot={lit === "runs"} onLit={onLit} />
      </g>
      <g className={inCls} style={at(T.node + T.nodeStep)}>
        <QNode box={RIGHT} g={rch} stacked led={led} hot={lit === "rch"} onLit={onLit} />
      </g>
      <g className={inCls} style={at(T.node + 2 * T.nodeStep)}>
        <QNode box={BASE} g={whr} stacked={false} led={led} hot={lit === "whr"} onLit={onLit} />
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
        x={CORE.x}
        y={CORE.y + 100}
        width={CORE.w}
        height={100}
        fill="transparent"
        onMouseEnter={() => onLit("gat")}
        onMouseLeave={() => onLit(null)}
      />
    </>
  );
}

/** Re-exported so `pda.css`'s dock duration and this drawing stay one pair. */
export { PDA_FLIGHT_MS };
