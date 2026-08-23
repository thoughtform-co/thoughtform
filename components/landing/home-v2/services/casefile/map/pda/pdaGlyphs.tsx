"use client";

import type { CaseSkillEntry } from "@/lib/cases/types";

import type { PdaWork } from "./pdaRecord";
import { PlacedField, isFormKey } from "./substrateForms";
import { housing } from "./substrateKit";

/**
 * THE PDA'S DRAWING PRIMITIVES — v18's `Module`, `Port`, `Pads` and `Plate`,
 * plus THE CARD, which is no longer v18's.
 *
 * `Module` and below are transcribed from the owner's
 * `thoughtform-intelligence-map-v18.html` rather than re-derived: those are
 * the drawings he authored, and a primitive that "improves" a proportion is a
 * primitive that has stopped being the thing he approved.
 *
 * ── Three shapes, three kinds of object ──────────────────────────────────
 *   CARTRIDGE  a piece of work        — a chamfered housing, a mark, a name
 *   MODULE     a piece of intelligence — chamfered inboard edge, and a TONGUE
 *              that seats into the core's port
 *   PLATE      an org unit             — cut on the TOP-RIGHT, a name only
 *
 * A reader can tell the three apart without a key, which is what lets the
 * whole instrument run with no legend anywhere.
 *
 * ⚠ **THE CARTRIDGE IS READING 02's SEAT CARD AT 1 / `CORE_K` SINCE
 * 2026-08-13** (owner: _"the styling of the work cards should match the ones
 * in configuration"_). It kept v18's silhouette and interior while reading 02
 * was redrawn on the R4 handoff (ADR-070 U11–U13), so the ONE OBJECT ADR-069's
 * flight carries between the two readings changed its corners, its mark, its
 * colour and its title's height in mid-air. See `CARD`.
 */

const CONTACTS = [-1, 0, 1];

export type GlyphState = "cfg" | "led" | "hot";

/**
 * THE CARD'S PER-STATE STROKE / FILL / MARK-INK TRIPLES — reading 02's now,
 * not v18's.
 *
 * ⚠ **`cfg` WENT FROM GREEN TO GOLD, AND IT IS A ROLE FIX RATHER THAN A
 * RESTYLE.** R4's role law is that **gold is wayfinding and green is the human
 * and nothing else** (ADR-070 U11) — the seat plate is the green object on this
 * instrument, and a configured stream is gold, which is what `SeatCard` already
 * drew. v18 had reading 01 painting *configured* green, so the same object was
 * green in the grid and gold in the configuration and the flight changed its
 * colour on the way across. A persistent object may not do that.
 *
 * The distinction green was carrying survives TWICE over: solid gold against a
 * dim DASHED body, and a squared mark against a crossed one.
 */
const CART: Record<GlyphState, [string, string, string]> = {
  cfg: ["var(--pda-hot)", "rgba(240, 200, 106, 0.07)", "var(--pda-hot)"],
  led: ["var(--pda-txt3)", "rgba(var(--dawn-rgb), 0.03)", "var(--pda-txt3)"],
  /* Hover steps the WASH, not the hue: the stroke is already the lit rung, so
     a second hue here would give one state two meanings. */
  hot: ["var(--pda-hot)", "rgba(240, 200, 106, 0.18)", "var(--pda-hot)"],
};

/**
 * READING 02's SCALE. The seat card is this cartridge at `CORE_K`, so the two
 * homes of ADR-069's flying object are ONE drawing at two sizes.
 *
 * ⚠ 1.7 is chosen so the box matches R4's 300-wide core to within a unit;
 * R4's own 300 × 224 is not similar to the cartridge (1.339 against 1.294),
 * and a uniform `dk` cannot carry a shape that changes proportion.
 */
export const CORE_K = 1.7;

/**
 * THE CARTRIDGE'S SILHOUETTE — the box every rung below is measured against.
 *
 * ⚠ **ONE SOURCE, BECAUSE THE OBJECT NOW HAS THREE HOMES** (ADR-070 U33).
 * Reading 01's grid, reading 02's seat and the carrier's hub each mount this
 * card at their own `k`, and until this constant existed all three DECLARED THE
 * BOX THEMSELVES — `PdaViews`' `CARD_W`/`CARD_H`, `PdaConfiguration`'s `176 *
 * CORE_K`, and the carrier's own pair. Three copies of a silhouette is the exact
 * shape of the defect ADR-069 U1 recorded one level in: not a value that is
 * wrong, a value that can become wrong in one place while every per-home guard
 * stays green. The interior was harmonised in that pass; the OUTLINE was not.
 */
export const CARD_BOX = { w: 176, h: 136 } as const;

/**
 * THE CARD'S INTERIOR, AT THE CARTRIDGE'S OWN 176 × 136 BASE.
 *
 * ⚠ **EVERY VALUE HERE IS `SeatCard`'s OWN, DIVIDED BY `CORE_K`.** That is what
 * makes the grid card and the seat card one drawing instead of two that
 * resemble each other, and `tests/lib/pda-card.test.ts` holds the pair — so a
 * number moved on one side fails rather than quietly diverging.
 *
 * ⚠ **THE TYPE IS THE ONE THING THAT DOES NOT SCALE WITH IT.** `CART_TYPE` is
 * derived from THIS box's measured slack and reading 02's `FS` from the seat's
 * own; the seat's 22-unit title ÷ 1.7 is 12.9, past the 11.5 ceiling chosen
 * below so that none of the twenty titles wraps. Proportional type parity is
 * not available to a card at 59 % of the size — see ADR-063 §Outstanding, which
 * is where reading 01's density sits and stays.
 */
export const CARD = {
  /** The 45° corner cut, on ADR-065's canonical TR + BL diagonal. */
  cut: 14,
  /** The inset every label hangs off — the seat's 18. */
  pad: 18 / CORE_K,
  /** The state mark's side, and its top off the card's own top. */
  mark: 14 / CORE_K,
  markY: 14 / CORE_K,
  /** The header row's baseline, and the team code's offset past the mark. */
  headBase: 25 / CORE_K,
  teamDx: 23 / CORE_K,
  /** R4's bright top rule — the seat's 2. */
  rule: 2 / CORE_K,
  /** THE BAR's label and its first value line, on a card that letters one. */
  barLabel: 120 / CORE_K,
  barLine: 140 / CORE_K,
  /** The seat's own title baseline. Used ONLY when a bar fills the space
   *  beneath it — see `CART_TITLE_BASE`. */
  titleSeated: 66 / CORE_K,
  /** The lane meter's top, up off the card's floor — the seat's 22. */
  footUp: 22 / CORE_K,
} as const;

/**
 * THE TITLE'S BASELINE — the one measure that is NOT the seat's, and the
 * reason is arithmetic rather than taste.
 *
 * The seat hangs its title 28 % down and fills everything under it with THE
 * BAR. The grid's card letters no bar (owner, 2026-08-13: match the styling,
 * not the content), so seat parity would pool **80 units — 59 % of the card —
 * into one hole** under the title. This surface already has a rule for that and
 * it is `configLayout`'s: **SPLIT THE SLACK, DON'T POOL IT.** The header row
 * and the foot stay pinned at seat parity; the title takes the middle with
 * equal air either side:
 *
 *   header descender 17.8 · foot cap-top 120.6 · one line at 11.5
 *   → 45.7 units each side, baseline 71.75
 *
 * ⚠ A CARD THAT DOES LETTER A BAR TAKES `CARD.titleSeated` INSTEAD: the space
 * is no longer slack, so there is nothing to split.
 */
const CART_TITLE_BASE = 71.75;

/**
 * THE CARTRIDGE'S TYPE, sized from the box's MEASURED SLACK (ADR-063 U1).
 *
 * The owner's ask was to grow the type "without making it too big", so these
 * are derived, not chosen. PT Mono's advance plus this drawing's tracking is
 * ~0.68 em (`MONO_ADVANCE`, the same figure the map projection uses) and the
 * cartridge is 176 units wide. Its inset is `CARD.pad` — 10.59, the seat's own
 * 18 ÷ `CORE_K` — on BOTH sides since the 2026-08-13 harmonisation, so a
 * left-anchored line has **159.4 units** and a pinned pair shares **154.8**.
 * Against the longest string in each role:
 *
 *   role        longest             chars  measure  ceiling  now
 *   title       CANDIDATE SCREENING   19     159.4    12.3    11.5
 *   team + id   CRE … W-017          3+5     154.8    18.9    11
 *   lane meter  EVERYDAY TIER         13     154.8    14.9    10
 *
 * ⚠ THE TITLE'S MEASURE IS NOT THE OTHER TWO. It is anchored to the LEFT wall
 * alone, so it runs to the card edge less a 6-unit clearance, while the header
 * row is a PAIR pinned to opposite walls sharing one measure BETWEEN them —
 * growing either closes the gap in the middle. Both collisions are arithmetic.
 *
 * ⚠ THE FOOT IS NO LONGER A PAIR. `autonomy` came off the card with the lane
 * meter's arrival (owner, 2026-08-13); reading 02 letters it on the OWNER
 * PLATE, which is where a person's latitude belongs. The foot is now one
 * left-anchored run — the four cells plus their label.
 *
 * ⚠ 11.5 IS CHOSEN SO NOTHING WRAPS. A first cut at 12 put the longest of
 * the twenty onto a second line, and MEASURED, the two lines then overlapped
 * each other by 1.6–1.9 units and ran into the lane rail at 1440. A wrapped
 * two-line title at ~5px is worse than a one-line title at ~5px anyway, so
 * the size buys single lines rather than a taller stack. The wider inset above
 * bought 2.4 units of margin, NOT a rung — do not spend it.
 *
 * ⚠ THE WRAP MEASURE MUST TRACK THE TITLE SIZE **AND `k`**. It is a CHARACTER
 * count derived from the box width, so a hard-coded one silently stops matching
 * the type the moment either moves — which is how a title ends up running out
 * through the card wall with nothing on screen to say so. ⚠ `k` was missing
 * here until 2026-08-13: the measure scaled with the box while the divisor did
 * not, so every lab mounting a card at k ≠ 1 was wrapping against the wrong
 * capacity (at k 2 it allowed 42 characters where 21 fit).
 */
export const MONO_ADVANCE = 0.68;
export const CART_TYPE = { title: 11.5, code: 11, lane: 10 } as const;
/** The LEFT-anchored title's measure: the card less its inset and a 6-unit
 *  wall clearance. Wider than the header pair's measure on purpose. */
const cartTitleMeasure = (w: number, k = 1) => w - (CARD.pad + 6) * k;
/** Characters per title line at the current title size. */
export const cartTitleChars = (w: number, k = 1) =>
  Math.floor(cartTitleMeasure(w, k) / (CART_TYPE.title * k * MONO_ADVANCE));
/** The header pair's shared measure — the card less both insets. */
export const cartPairMeasure = (w: number, k = 1) => w - CARD.pad * 2 * k;

/**
 * THE MODULE'S ANSWER TYPE, derived from the module's own measure.
 *
 * A module letters between its divider and its outboard wall. The divider is
 * a full `h` from the inboard edge — the gauge circle needs that room — and
 * the text is inset 11 from it, so a 224x56 module has `224 − 56 − 11` = 157
 * units, less the cartridge title's own 6-unit wall clearance: **151**.
 *
 * Against the live record, the binding string is the graph node, and it is
 * arithmetic rather than a matter of taste:
 *
 *   role      longest live string           chars  of 151 at 8
 *   graph     COMPONENT + SUPPLIER FACTS     26      93.6 %   ← the ceiling
 *   skill     BRIEFING INTELLIGENCE          21      75.7 %
 *   surface   CHAT + PLANNING BOARD          21      75.7 %
 *   system    CODE + TEST RUNNER             18      64.9 %
 *   context   STRUCTURAL LIBRARY             18      64.9 %
 *   lane      EVERYDAY LANE                  13      46.9 %
 *
 * ⚠ 8 IS THE LARGEST SIZE WITH ROOM LEFT. 8.5 puts the graph node at 99.5 %
 * of its measure, i.e. one authored character from running through the wall,
 * and 9 is over it. The size buys margin against the next copy edit, which is
 * what a derived constant is for.
 *
 * ⚠ THE HEADER IS SMALLER THAN THE ANSWER, deliberately: the question is
 * chrome and the answer is the content. It also tracks at .14em (the module
 * label's own tracking, factor 0.74) rather than the answer's .08em, so its
 * measure is NOT this one — the longest question, WHAT IT IS HELD TO, runs to
 * 99.9 units of 151.
 */
export const MODULE_TYPE = { head: 7.5, answer: 8 } as const;
/**
 * A LINE BOX IS TALLER THAN ITS FONT SIZE — ~1.3 em for this face, and the
 * whole reason the DECIDES ALONE pair needed 18 units of pitch at size 10
 * (PdaViews). Every vertical clearance on the module is measured against this,
 * not against the size, and `tests/lib/pda-viewbox.test.ts` re-checks it.
 */
export const MONO_LINE_BOX = 1.3;
/** The question's baseline, once it has answers beneath it. */
export const moduleHeadBaseline = (y0: number, h: number) => y0 + h * 0.2;
/** The answers' baselines: two lines 20 units apart at h 56, or one centred. */
export const moduleAnswerBaselines = (y0: number, h: number, n: number): number[] =>
  n > 1 ? [y0 + h * 0.465, y0 + h * 0.82] : [y0 + h * 0.64];
/** The answer's measure: the module less its divider gutter and a wall. */
export const moduleAnswerMeasure = (w: number, h: number) => w - h - 11 - 6;
/** Characters per answer line at the current answer size. */
export const moduleAnswerChars = (w: number, h: number) =>
  Math.floor(moduleAnswerMeasure(w, h) / (MODULE_TYPE.answer * MONO_ADVANCE));

/** Greedy wrap to a character measure, capped at two lines. */
export function wrapLines(text: string, per: number, max = 2): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > per && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out.slice(0, max);
}

/**
 * THE STATE MARK — R4's square-in-square where a configuration is on record,
 * and a CROSSED square where the work is deliberately person-led. Empty is the
 * record, not an omission (ADR-062), which is why it is drawn rather than left
 * blank.
 *
 * ⚠ SHARED, so the grid card and the seat card cannot drift: the seat mounts it
 * at side 14 and the grid at `14 / CORE_K`. Every inner offset is a fraction of
 * the side, so one side length carries the whole mark.
 */
export function StateMark({
  x,
  y,
  side,
  led,
  stroke,
}: {
  x: number;
  y: number;
  side: number;
  led: boolean;
  stroke: string;
}) {
  const u = side / 14;
  return (
    <>
      <rect x={x} y={y} width={side} height={side} fill="none" stroke={stroke} />
      {led ? (
        <g stroke={stroke}>
          <line x1={x + 3 * u} y1={y + 3 * u} x2={x + 11 * u} y2={y + 11 * u} />
          <line x1={x + 11 * u} y1={y + 3 * u} x2={x + 3 * u} y2={y + 11 * u} />
        </g>
      ) : (
        <rect x={x + 4.5 * u} y={y + 4.5 * u} width={5 * u} height={5 * u} fill={stroke} />
      )}
    </>
  );
}

/**
 * THE LANE LADDER — four cells, lit to where this stream runs (ADR-070 U11).
 *
 * The gauge IS the record rather than a rating of it: the capability lane is
 * generic by law, is already published, and has exactly four values, so four
 * cells with two lit is the scale the bare word `EVERYDAY` never had. Person-led
 * work lights none and says so.
 *
 * ⚠ IT IS NOT THE RETIRED DRAW METER, which measured WORKLOAD and needed a
 * NEVER A PRICE caption to stay honest. `PdaWork.draw` still letters nowhere.
 *
 * ⚠ SHARED WITH READING 02 since 2026-08-13 — the seat mounts it at `CORE_K`
 * and the grid at 1. The FONT SIZE is passed rather than scaled, because each
 * card letters at its own derived chrome rung; everything geometric scales.
 */
export const LANES = ["FAST", "EVERYDAY", "DEEP", "FRONTIER"] as const;
export const laneStep = (lane: string) => LANES.indexOf(lane as (typeof LANES)[number]) + 1;
export const laneLabel = (lane: string) => (laneStep(lane) > 0 ? `${lane} TIER` : "NO LANE");

/** The meter's own measures at the card's base scale — the seat's 13 / 3 / 4
 *  cells and its 12-unit gap to the label. */
const METER = { cell: 13 / CORE_K, gap: 3 / CORE_K, h: 4 / CORE_K, dx: 12 / CORE_K } as const;
/** The four cells' total width at scale `k`. */
export const meterWidth = (k = 1) => (METER.cell * 4 + METER.gap * 3) * k;
/** The label's left edge, measured from the meter's own x. */
export const meterLabelDx = (k = 1) => meterWidth(k) + METER.dx * k;

export function LaneMeter({
  x,
  y,
  lane,
  fs,
  k = 1,
}: {
  x: number;
  y: number;
  lane: string;
  fs: number;
  k?: number;
}) {
  const step = laneStep(lane);
  const cell = METER.cell * k;
  const gap = METER.gap * k;
  const h = METER.h * k;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x + i * (cell + gap)}
          y={y}
          width={cell}
          height={h}
          fill={i < step ? "var(--pda-amb)" : "none"}
          stroke="var(--pda-hair2)"
        />
      ))}
      <text
        x={x + meterLabelDx(k)}
        y={y + h / 2 + fs * 0.36}
        fontSize={fs}
        letterSpacing=".2em"
        fill="var(--pda-ink)"
      >
        {laneLabel(lane)}
      </text>
    </g>
  );
}

/* ── A · the cartridge = a piece of work ─────────────────────────────────
   ⚠ THIS IS `SeatCard`'s DRAWING AT 1 / `CORE_K` (see `CARD`). What the
   2026-08-13 harmonisation took off it, and why each one went:

     the TL notch     → the TR + BL chamfer pair, which is ADR-065's canonical
                        diagonal and the silhouette reading 02 has carried
                        since ADR-070 U13. A single notch IS lawful for a
                        uniform set inside a chamfered housing (ADR-065 U1),
                        but only "on the lawful diagonal" — and top-left never
                        was one, while the object it is a home for changed
                        shape mid-flight.
     the circle gauge → R4's squared `StateMark`, moved UP INTO THE HEADER ROW.
                        The gauge floated in a band of its own that spent 37 %
                        of the card on one 22-unit circle, and that band is
                        what pinned the title at 68 % down.
     the three vents  → nothing. Material language the seat card does not
                        speak, and the only thing on the card that was neither
                        chrome nor content.
     the divider      → nothing. R4 makes the gold key the separator; a rule
                        between two blocks is the chrome this pass removes.
     the lane pair    → the shared `LaneMeter`. `autonomy` comes off the card
                        with it (owner) — reading 02 letters it on the OWNER
                        PLATE, which is where a person's latitude belongs, and
                        a value printed in both places is this surface's
                        said-twice defect.
     green `cfg`      → gold. See `CART`: it is a role fix, not a restyle. */
export function Cartridge({
  x,
  y,
  w,
  h,
  state,
  work,
  k = 1,
  sel = false,
  bar,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  state: GlyphState;
  work: PdaWork;
  k?: number;
  /** The record the reader has open. Lights the cut edges, nothing else. */
  sel?: boolean;
  /**
   * THE BAR, on the card (ADR-070 U2 — the owner's unit mockup letters the bar
   * where v18's cartridge lettered lane · autonomy).
   *
   * ⚠ IT SCALES WITH `k` NOW. It was hardcoded at `fontSize="10"`, which `k`
   * never reached — the recorded reason every config-lab variant's minPx stuck
   * at 5.4px however large its card was. Production's grid passes no bar, so
   * the fix only reaches the labs, which is where the defect was measured.
   *
   * ⚠ PASSING A BAR ALSO MOVES THE TITLE to the seat's own baseline: the space
   * beneath it stops being slack. See `CART_TITLE_BASE`.
   */
  bar?: { label: string; lines: readonly string[] };
}) {
  const [stroke, fill, markInk] = CART[state];
  const led = state === "led";
  const cut = CARD.cut * k;
  const pad = CARD.pad * k;
  const rule = CARD.rule * k;
  /** The interior's left wall — every label on the card hangs off this. */
  const gx = x + pad;
  const d = housing(x, y, w, h, cut);
  const headBase = y + CARD.headBase * k;
  const titleBase = y + (bar ? CARD.titleSeated : CART_TITLE_BASE) * k;
  const barFs = CART_TYPE.lane * k;

  return (
    <>
      {/* ⚠ THE HIT AREA IS ITS OWN RECT, and it is not decoration.
          A person-led cartridge's body is `fill: none` — the record, not an
          omission — and an unfilled path hit-tests on its STROKE alone, so
          clicking the middle of the card reached the bare `<svg>` and nothing
          happened. That silently cost exactly the three person-led streams
          their control, on a surface whose whole argument is that the negative
          space is a reading (`document.elementFromPoint` named all three at
          once; the keyboard path was unaffected, which is why no guard saw it).
          The rect matches the path's extremes, so the group's fill box — which
          the flight measures its origin from — does not move. */}
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      {/* R4's density rule: the card is OPAQUE, then washed, then outlined —
          three passes over one path so it pops off whatever it sits on. */}
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeDasharray={led ? "5 4" : undefined} />
      {/* R4's bright top rule. ⚠ It STOPS at the cut — run it to `x + w` and it
          overshoots into the chamfer. Its centre sits half a weight down so the
          stroke lands flush inside the top edge rather than straddling it. */}
      <line
        x1={x}
        y1={y + rule / 2}
        x2={x + w - cut}
        y2={y + rule / 2}
        stroke={stroke}
        strokeWidth={rule}
      />
      {/* THE OPEN RECORD lights its own CUT EDGES, and only once reading 02 has
          been shown. The chamfers are where the card is keyed into its housing,
          so the selection reads as latched rather than as a fourth state of the
          mark — and it needs no legend, because the reader is looking at the
          record they just opened. ⚠ BOTH diagonals light now: the silhouette
          has two since the harmonisation, and lighting one of a symmetric pair
          reads as a rendering fault rather than as a latch. */}
      {sel ? (
        <g stroke="var(--pda-hot)" strokeWidth={Math.max(1.4, 1.8 * k)}>
          <line x1={x + w - cut} y1={y} x2={x + w} y2={y + cut} />
          <line x1={x + cut} y1={y + h} x2={x} y2={y + h - cut} />
        </g>
      ) : null}

      {/* THE HEADER ROW — the mark, the team, the stream id, one baseline. */}
      <StateMark x={gx} y={y + CARD.markY * k} side={CARD.mark * k} led={led} stroke={markInk} />
      <text
        x={gx + CARD.teamDx * k}
        y={headBase}
        fontSize={CART_TYPE.code * k}
        letterSpacing=".24em"
        fill="var(--pda-txt2)"
      >
        {work.teamAb}
      </text>
      <text
        x={x + w - pad}
        y={headBase}
        textAnchor="end"
        fontSize={CART_TYPE.code * k}
        letterSpacing=".18em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      >
        {work.id}
      </text>

      {/* ⚠ THE WRAP CAPACITY TAKES `k`. The step is measured against the LINE
          BOX, not the font size — abutting glyph boxes is what the smoke's
          label-on-label walk caught the last time this drawing's type grew. */}
      {wrapLines(work.title, cartTitleChars(w, k)).map((line, i) => (
        <text
          key={line}
          x={gx}
          y={titleBase + i * CART_TYPE.title * MONO_LINE_BOX * k}
          fontSize={CART_TYPE.title * k}
          fontWeight={700}
          letterSpacing=".01em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}

      {/* THE BAR, on the cards that letter one — the seat's own block, its key
          in Tensor gold. The step is the seat's ratio (1.7 × the size), which is
          what the unscaled `17` happened to be at the old fixed size of 10. */}
      {bar ? (
        <>
          <text
            x={gx}
            y={y + CARD.barLabel * k}
            fontSize={barFs}
            letterSpacing=".18em"
            fill="var(--pda-ink)"
          >
            {bar.label}
          </text>
          {bar.lines.map((line, i) => (
            <text
              key={i}
              x={gx}
              y={y + CARD.barLine * k + i * barFs * CORE_K}
              fontSize={barFs}
              letterSpacing=".08em"
              fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
            >
              {line}
            </text>
          ))}
        </>
      ) : null}

      {/* THE FOOT — the shared lane ladder, pinned up off the card's floor at
          the seat's own clearance. One left-anchored run: the pair that used to
          live here took `autonomy` with it. */}
      <LaneMeter
        x={gx}
        y={y + h - CARD.footUp * k}
        lane={work.lane}
        fs={CART_TYPE.lane * k}
        k={k}
      />
    </>
  );
}

/* ── B · the module = a piece of intelligence, with a plug on its inboard
      end. The tongue is what makes the configuration read as ASSEMBLED
      rather than as a diagram of four boxes near a fifth. ───────────────── */
export function Module({
  cx,
  cy,
  w,
  h,
  hot,
  label,
  flip = false,
  plug = false,
  answers,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  hot?: boolean;
  label: string;
  flip?: boolean;
  plug?: boolean;
  /**
   * One or two ANSWER lines beneath the label, which becomes a header.
   *
   * ⚠ WITHOUT THIS THE MODULE RENDERS EXACTLY AS IT DID. Reading 03's shape
   * modules letter at `h * 0.19` and their longest name already fills 89 % of
   * that box (ADR-063) — they cannot take the header size, and they have
   * nothing to answer.
   */
  answers?: readonly string[];
}) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const c = h * 0.34;
  const k = hot ? "var(--pda-hot)" : "var(--pda-amb)";
  const fill = hot ? "rgba(240, 200, 106, 0.12)" : "rgba(192, 154, 70, 0.05)";
  const fs = h * 0.19;
  const gx = flip ? x1 - h / 2 : x0 + h / 2;
  const dv = flip ? x1 - h : x0 + h;
  const body = flip
    ? `M${x1 - c},${y0} H${x0} V${y1} H${x1 - c} L${x1},${y1 - c} V${y0 + c} Z`
    : `M${x0 + c},${y0} H${x1} V${y1} H${x0 + c} L${x0},${y1 - c} V${y0 + c} Z`;

  const t = 32;
  const e = flip ? x0 : x1;
  const s2 = flip ? -1 : 1;

  return (
    <>
      {plug ? (
        <>
          <path
            d={`M${e},${cy - 12} H${e + s2 * t} V${cy + 12} H${e} Z`}
            fill="var(--pda-void)"
            stroke={k}
          />
          {CONTACTS.map((i) => (
            <line
              key={i}
              x1={e + s2 * 6}
              y1={cy + i * 6}
              x2={e + s2 * (t - 4)}
              y2={cy + i * 6}
              stroke={k}
              opacity="0.55"
            />
          ))}
        </>
      ) : null}
      <path d={body} fill={fill} stroke={k} strokeWidth="1.2" strokeLinejoin="miter" />
      <circle cx={gx} cy={cy} r={h * 0.19} fill="none" stroke={k} opacity="0.7" />
      <circle cx={gx} cy={cy} r={h * 0.075} fill={k} />
      <line x1={dv} y1={y0 + 7} x2={dv} y2={y1 - 7} stroke={k} opacity="0.3" />
      {/* The label CENTRES when it is the whole content, and rises to a header
          when there are answers under it. All three baselines derive from the
          module's own top edge, and the pitch is chosen against the LINE BOX
          rather than the font size — the mistake the DECIDES ALONE pair paid
          for in PdaViews. A line box is ~1.3 em, so two 8-unit answers 20
          apart clear each other by 8 units; the 12 a naive reading suggests
          would leave under 2, which is inside the smoke's own noise. */}
      <text
        x={flip ? dv - 11 : dv + 11}
        y={answers ? moduleHeadBaseline(y0, h) : cy + fs * 0.36}
        textAnchor={flip ? "end" : "start"}
        fontSize={answers ? MODULE_TYPE.head : fs}
        letterSpacing=".14em"
        fill={hot ? "var(--pda-hot)" : answers ? "var(--pda-txt3)" : "var(--pda-txt)"}
      >
        {label}
      </text>
      {answers?.map((line, i) => (
        <text
          key={line}
          x={flip ? dv - 11 : dv + 11}
          y={moduleAnswerBaselines(y0, h, answers.length)[i]}
          textAnchor={flip ? "end" : "start"}
          fontSize={MODULE_TYPE.answer}
          letterSpacing=".08em"
          fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}
    </>
  );
}

/** The receptacle on the core body that a tongue seats into. */
export function Port({ x, y, hot }: { x: number; y: number; hot?: boolean }) {
  const k = hot ? "var(--pda-hot)" : "var(--pda-amb)";
  return (
    <>
      <path
        d={`M${x - 11},${y - 21} H${x + 11} V${y + 21} H${x - 11} Z`}
        fill="var(--pda-void)"
        stroke={k}
      />
      {CONTACTS.map((i) => (
        <line
          key={i}
          x1={x - 6}
          y1={y + i * 6}
          x2={x + 6}
          y2={y + i * 6}
          stroke={k}
          opacity="0.8"
        />
      ))}
      {/* The latch flickers once as the tongue seats — the one place on this
          surface where a stutter is the point rather than a flourish. */}
      <rect className="fl-pda-latch" x={x - 3} y={y - 27} width="6" height="4" fill={k} />
    </>
  );
}

/**
 * Contact pads along an edge — a module's top by default, and the core's own
 * fringe when it is asked for more of them.
 *
 * The count is odd so the run is centred on `cx` without arithmetic, and it
 * runs `down` for a bottom edge. Nothing here is lettered, which is why the
 * fringe can be as dense as the board wants: it is material language, the
 * same category as the cartridge's vents.
 */
export function Pads({
  cx,
  y,
  lit,
  n = 7,
  pitch = 11,
  len = 7,
  down = false,
}: {
  cx: number;
  y: number;
  lit?: boolean;
  n?: number;
  pitch?: number;
  len?: number;
  down?: boolean;
}) {
  const half = (n - 1) / 2;
  return (
    <>
      {Array.from({ length: n }, (_, j) => j - half).map((i) => (
        <line
          key={i}
          x1={cx + i * pitch}
          y1={down ? y : y - len}
          x2={cx + i * pitch}
          y2={down ? y + len : y}
          stroke={lit ? "var(--pda-hot)" : "var(--pda-amb)"}
          opacity="0.6"
        />
      ))}
    </>
  );
}

/* ── D · the skill chip = an atom of encoded substrate ───────────────────
   The chip is the ANSWER TO "WHAT RUNS IT · SKILL" (ADR-071, 2026-08-19).
   Reading 02 draws it under the SKILL key. On the 2↔3 transition the chip
   does not fly as this drawing — its PLATE morphs (`carrierChipMorphIn/Out`,
   the path itself interpolates into the destination cell's ring) and its
   NAME flies its own dock; this glyph is the RESTING form the morph leaves
   from and returns to. One resting drawing, one journey — ADR-069 U1's law,
   met by making the arrival geometry the destination's own. ─────────────── */

/**
 * THE CHIP'S SILHOUETTE. Square-cornered (ADR-065: children of a chamfered
 * housing are square) so it never reads as another cartridge — the reader
 * needs a chip and a card to look UNLIKE each other, or the flight becomes
 * unreadable.
 *
 * ⚠ THE WIDTH IS THE SKILL CELL'S OWN MEASURE, so the chip fills the value
 * slot in reading 02 without a gutter and reads as "this IS the SKILL". The
 * height is enough for one line of the value rung (fs 14) plus its wall
 * clearance.
 */
export const SKILL_CHIP_W = 180;
export const SKILL_CHIP_H = 40;

/**
 * THE CHIP'S TYPE, one line at reading 02's value rung.
 *
 * ⚠ **THE FLIGHT'S dk IS `CARRIER_LABEL_FS / CHIP_FS`** — the roster's short
 * runs at 14 units in the chip and 13 units in the carrier cell, so the
 * flown name lands at exactly the rung the 47 Skill names around it letter
 * at. See `PdaCarrier`'s HUB_K comment for the same derivation on the seat
 * card. Every roster `short` is ≤14 chars (pinned by `cases-registry`),
 * which measures 180 × (14 × 0.6 + tracking) → fits the chip's own measure
 * with slack for a wall clearance.
 */
export const CHIP_FS = 14;
const CHIP_PAD_X = 8;

/**
 * The engine tag's rung — chrome, tracked wide so it reads STRUCTURAL beside
 * the skill's NAMED type. Same rule the map's substrate names follow
 * (`BAND_FS`/`BAND_TRACK`).
 *
 * ⚠ **12 IS THE READING 02 FLOOR, not a taste choice.** The chip lives on
 * reading 02, and ADR-070 U10 set 12 as this reading's TYPE FLOOR because
 * anything smaller renders under 6.5px at the binding preset. The tag is
 * chrome — the reader does not linger on it — but chrome under the floor is
 * still absent chrome. It reads structural against the skill (fs 14, `.04em`)
 * via TRACKING and CASE, which is the same distinction the map's substrate
 * names use one level down.
 */
const CHIP_TAG_FS = 12;
const CHIP_TAG_TRACK = 0.18;

/**
 * How the chip's material picks up the target substrate's identity.
 *
 * ⚠ **THE PHYSICS FIELD IS WHAT NAMES THE ENGINE, NOT A LABEL.** The chip's
 * background is the same field the carrier's cells draw on for the shape it
 * files under — Voice's veins, Judgment's grid, etc. So the reader sees the
 * chip and its destination region wearing the same material before the
 * flight even fires. The engine tag on the top-right is a KEY for a reader
 * who has not opened the carrier yet; on the carrier the field alone
 * suffices.
 *
 * ⚠ **NO GREEN.** The role law stands: green is the human and nothing else
 * (ADR-070 U11). A skill is a piece of encoded substrate — its bracket is
 * always gold, whichever engine it files under.
 */
const CHIP_FIELD_ALPHA = 0.18;

/**
 * The chip's atom of authored data. Everything the drawing needs from the
 * roster in one shape, so a caller does not have to know the roster's own
 * type on top of this glyph's.
 */
export interface SkillChipEntry {
  short: string;
  engine: string;
}

/**
 * Project a roster entry (or a `null` skillId's fallback) into what the chip
 * letters. `null` means the stream is person-led or the join failed; the
 * chip renders nothing rather than a placeholder.
 */
export function skillChipEntry(skill: CaseSkillEntry | undefined | null): SkillChipEntry | null {
  if (!skill) return null;
  return { short: skill.short, engine: skill.engine };
}

/**
 * THE CHIP, at rest — reading 02's SKILL slot is its one mounted home.
 *
 * ⚠ **THE OBJECT KEEPS ITS SILHOUETTE AT EVERY SCALE.** `k` is the mount's
 * uniform scale (reading 02 passes 1; the labs may mount it larger) and
 * every rung below is measured from `k` at the same base (`SKILL_CHIP_W` ×
 * `SKILL_CHIP_H`). The 2↔3 transition does NOT remount this drawing — the
 * plate's journey is the morphing path in `PdaCarrier`/`PdaConfiguration`
 * and the name flies its own dock — so this glyph never has to survive a
 * transform mid-flight.
 *
 * ⚠ **THE HIT TARGET IS `transparent`, NOT `none`.** SVG events fire on
 * `visiblePainted` by default and `none` reports no paint, so a passive chip
 * wrapped in a listener would only click on its stroke — which is exactly
 * the same drift the cartridge caught for person-led work (see `Cartridge`).
 * Reading 02's chip is pointer-inert. This keeps that guarantee.
 */
export function SkillChip({
  x,
  y,
  entry,
  k = 1,
  seed = 71,
}: {
  x: number;
  y: number;
  entry: SkillChipEntry;
  k?: number;
  /** Deterministic pattern seed — the substrate field's PRNG needs one and
   *  the arrival dock must NOT re-roll it on every render. */
  seed?: number;
}) {
  const w = SKILL_CHIP_W * k;
  const h = SKILL_CHIP_H * k;
  const engineKey = entry.engine.toLowerCase();
  const skillFs = CHIP_FS * k;
  const tagFs = CHIP_TAG_FS * k;
  const padX = CHIP_PAD_X * k;
  return (
    <g pointerEvents="none">
      {/* THE MATERIAL. The physics field says which engine this Skill files
          under; the chip fills the substrate's shape at low alpha so the
          object reads as "belonging to this region" without a label. */}
      {isFormKey(engineKey) ? (
        <PlacedField
          form={engineKey}
          x={x}
          y={y}
          w={w}
          h={h}
          seed={seed}
          k={k}
          opacity={CHIP_FIELD_ALPHA}
        />
      ) : null}
      {/* R4's density rule, borrowed: opaque ground, faint dawn wash, then
          the hairline. The wash inverts correctly on the light flip because
          it is expressed against `--dawn-rgb`. */}
      <rect x={x} y={y} width={w} height={h} fill="var(--pda-void)" />
      <rect x={x} y={y} width={w} height={h} fill="rgba(var(--dawn-rgb), 0.03)" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="var(--pda-dim)" strokeWidth={1} />
      {/* ⚠ THE ROLE TAG IS AT THE TOP-RIGHT, out of the skill name's way.
          Chrome (uppercase, tracked wide), never green. */}
      <text
        x={x + w - padX}
        y={y + 13 * k}
        textAnchor="end"
        fontSize={tagFs}
        letterSpacing={`${CHIP_TAG_TRACK}em`}
        fill="var(--pda-txt2)"
      >
        {entry.engine.toUpperCase()}
      </text>
      {/* THE SKILL. Left-anchored at the value rung, one line — the roster's
          14-character cap means it always fits, and the flight's `dk` lands
          this text at the plate's own label rung (13 units on the carrier). */}
      <text
        x={x + padX}
        y={y + CHIP_NAME_BASE * k}
        fontSize={skillFs}
        letterSpacing={`${CHIP_NAME_TRACK}em`}
        fill="var(--pda-ink)"
      >
        {entry.short.toUpperCase()}
      </text>
    </g>
  );
}

/** The name's own type rungs — one source for the render above AND the
 *  flight's name-rect arithmetic below. */
export const CHIP_NAME_TRACK = 0.04;
const CHIP_NAME_BASE = 30;

/**
 * The chip name's NOMINAL BOX, in the chip's own frame (ADR-071 U1).
 *
 * ⚠ **THE NAME FLIES ITS OWN FLIGHT, so it needs its own rect.** The plate's
 * flight is centre-to-centre on the chip's box, but the name is
 * LEFT-ANCHORED inside the plate while the carrier's arc label is
 * CENTRE-ANCHORED on its arc — flying the name on the plate's vars makes it
 * jump sideways at liftoff. This box is the name's rendered run (PT Mono's
 * 0.6 em advance plus the tracking) centred on its own visual middle
 * (baseline − 0.36 em, the same correction the carrier's readouts use), so
 * `pdaFlight(nameRect → arc label rect)` lifts off exactly where the ink is.
 */
export function skillChipNameRect(
  x: number,
  y: number,
  name: string,
  k = 1
): { x: number; y: number; w: number; h: number } {
  const w = name.length * CHIP_FS * (0.6 + CHIP_NAME_TRACK) * k;
  const h = CHIP_FS * 1.3 * k;
  const cx = x + CHIP_PAD_X * k + w / 2;
  const cy = y + CHIP_NAME_BASE * k - CHIP_FS * 0.36 * k;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/* ── C · the plate = an org unit. Cut on the TOP-RIGHT, so it is the
      cartridge's mirror and cannot be mistaken for one. ─────────────────── */
export function Plate({
  cx,
  cy,
  w,
  h,
  hot,
  label,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  hot?: boolean;
  label: string;
}) {
  return (
    <>
      <path
        d={`M${cx - w / 2},${cy - h / 2} H${cx + w / 2 - 8} L${cx + w / 2},${cy - h / 2 + 8} V${cy + h / 2} H${cx - w / 2} Z`}
        fill={hot ? "rgba(240, 200, 106, 0.12)" : "rgba(255, 255, 255, 0.02)"}
        stroke={hot ? "var(--pda-hot)" : "var(--pda-dim)"}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="10"
        letterSpacing=".2em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt2)"}
      >
        {label}
      </text>
    </>
  );
}
