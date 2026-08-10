"use client";

import type { PdaWork } from "./pdaRecord";

/**
 * THE PDA'S DRAWING PRIMITIVES — a faithful port of the owner's
 * `thoughtform-intelligence-map-v18.html`.
 *
 * Every number here is v18's. They are transcribed rather than re-derived on
 * purpose: this is the drawing the owner authored, and a primitive that
 * "improves" a proportion is a primitive that has stopped being the thing he
 * approved.
 *
 * ── Three shapes, three kinds of object ──────────────────────────────────
 *   CARTRIDGE  a piece of work        — cut on the TOP-LEFT, a gauge, a name
 *   MODULE     a piece of intelligence — chamfered inboard edge, and a TONGUE
 *              that seats into the core's port
 *   PLATE      an org unit             — cut on the TOP-RIGHT, a name only
 *
 * A reader can tell the three apart without a key, which is what lets the
 * whole instrument run with no legend anywhere.
 */

const VENTS = [0, 1, 2];
const CONTACTS = [-1, 0, 1];

export type GlyphState = "cfg" | "led" | "hot";

/** v18's per-state stroke / fill / mark triples. */
const CART: Record<GlyphState, [string, string, string]> = {
  cfg: ["var(--pda-grn)", "rgba(126, 159, 102, 0.1)", "var(--pda-grnh)"],
  led: ["var(--pda-txt3)", "none", "var(--pda-txt3)"],
  hot: ["var(--pda-hot)", "rgba(240, 200, 106, 0.1)", "var(--pda-hot)"],
};

/**
 * THE CARTRIDGE'S TYPE, sized from the box's MEASURED SLACK (ADR-063 U1).
 *
 * The owner's ask was to grow the type "without making it too big", so these
 * are derived, not chosen. PT Mono's advance plus this drawing's tracking is
 * ~0.68 em (`MONO_ADVANCE`, the same figure the map projection uses), the
 * cartridge is 176 units wide and its text inset is 13 left / 12 right — so
 * a line has **151 units** of measure. Against the longest string in each
 * role, that gives the ceiling before it touches the far wall:
 *
 *   role        longest             chars  measure  ceiling  was   now
 *   title       CANDIDATE SCREENING   19      157      12.2   9.5   11.5
 *   team + id   CRE ... W-017        3+5      151      18.4   8.5   11
 *   lane        EVERYDAY / BOUNDED   8+7      151      13.2   7.5   10
 *
 * ⚠ THE TITLE'S MEASURE IS NOT THE OTHER TWO. It is anchored to the LEFT
 * wall alone, so it runs to the cartridge edge less breathing room (157),
 * while the metadata rows are PAIRS pinned to opposite walls and share one
 * 151-unit measure between them — growing either closes the gap in the
 * middle. Both collisions are arithmetic, not a matter of scale.
 *
 * ⚠ 11.5 IS CHOSEN SO NOTHING WRAPS. A first cut at 12 put the longest of
 * the twenty onto a second line, and MEASURED, the two lines then overlapped
 * each other by 1.6–1.9 units and ran into the lane rail at 1440. A wrapped
 * two-line title at ~5px is worse than a one-line title at ~5px anyway, so
 * the size buys single lines rather than a taller stack.
 *
 * ⚠ THE WRAP MEASURE MUST TRACK THE TITLE SIZE. It is a CHARACTER count
 * derived from the box width, so a hard-coded one silently stops matching
 * the type the moment the size moves — which is how a title ends up running
 * out through the cartridge wall with nothing on screen to say so.
 */
export const MONO_ADVANCE = 0.68;
export const CART_TYPE = { title: 11.5, code: 11, lane: 10 } as const;
/** The LEFT-anchored title's measure: the cartridge less its inset and a
 *  6-unit wall clearance. Wider than the paired rows' 151 on purpose. */
const cartTitleMeasure = (w: number) => w - 19;
/** Characters per title line at the current title size. */
export const cartTitleChars = (w: number) =>
  Math.floor(cartTitleMeasure(w) / (CART_TYPE.title * MONO_ADVANCE));

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

/* ── A · the cartridge = a piece of work ───────────────────────────────── */
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
  /** The record the reader has open. Lights the cut edge, nothing else. */
  sel?: boolean;
  /**
   * THE BAR, on the card (ADR-070 U2 — the owner's unit mockup letters the
   * bar where the small cartridge letters lane · autonomy; the autonomy
   * moved to the measured DECIDES ALONE dimension beside the card). Absolute
   * sizes on purpose: the mockup's bar is chrome-small against the title in
   * every k, so it does NOT ride `CART_TYPE × k`. Reading 01 passes nothing
   * and renders byte-identical.
   */
  bar?: { label: string; lines: readonly string[] };
}) {
  const nk = 14 * k;
  const [stroke, fill, mark] = CART[state];
  const gx = x + 30 * k;
  const gy = y + 52 * k;
  const r = 11 * k;
  const led = state === "led";

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
      <path
        d={`M${x + nk},${y} H${x + w} V${y + h} H${x} V${y + nk} Z`}
        fill={fill}
        stroke={stroke}
      />
      {/* THE OPEN RECORD lights its own cut edge. The notch is where a
          cartridge is keyed, so the selection reads as latched rather than as
          a fifth state of the gauge — and it needs no legend, because the
          reader is looking at the record they just opened. */}
      {sel ? (
        <line
          x1={x}
          y1={y + nk}
          x2={x + nk}
          y2={y}
          stroke="var(--pda-hot)"
          strokeWidth={Math.max(1.4, 1.8 * k)}
        />
      ) : null}
      <line
        x1={x + 12 * k}
        y1={y + 72 * k}
        x2={x + w - 12 * k}
        y2={y + 72 * k}
        stroke={led ? "var(--pda-hair2)" : stroke}
        opacity="0.5"
      />
      <text
        x={x + 13 * k}
        y={y + 21 * k}
        fontSize={CART_TYPE.code * k}
        letterSpacing=".2em"
        fill="var(--pda-txt3)"
      >
        {work.teamAb}
      </text>
      <text
        x={x + w - 12 * k}
        y={y + 21 * k}
        textAnchor="end"
        fontSize={CART_TYPE.code * k}
        letterSpacing=".16em"
        fill={state === "hot" ? "var(--pda-hot)" : "var(--pda-txt3)"}
      >
        {work.id}
      </text>

      {/* The gauge. A square core reads as loaded; a cross reads as empty —
          and empty is the record, not an omission. */}
      <circle cx={gx} cy={gy} r={r} fill="none" stroke={mark} strokeWidth={Math.min(k, 1.6)} />
      {led ? (
        <>
          <line
            x1={gx - r * 0.7}
            y1={gy - r * 0.7}
            x2={gx + r * 0.7}
            y2={gy + r * 0.7}
            stroke="var(--pda-txt3)"
          />
          <line
            x1={gx - r * 0.7}
            y1={gy + r * 0.7}
            x2={gx + r * 0.7}
            y2={gy - r * 0.7}
            stroke="var(--pda-txt3)"
          />
        </>
      ) : (
        <rect x={gx - 3.4 * k} y={gy - 3.4 * k} width={6.8 * k} height={6.8 * k} fill={mark} />
      )}

      {VENTS.map((i) => {
        const ox = x + (56 + i * 9) * k;
        return (
          <line
            key={i}
            x1={ox}
            y1={gy - 9 * k}
            x2={ox + 11 * k}
            y2={gy + 9 * k}
            stroke={stroke}
            opacity="0.28"
          />
        );
      })}

      {wrapLines(work.title, cartTitleChars(w)).map((line, i) => (
        <text
          key={line}
          x={x + 13 * k}
          y={y + 92 * k + i * 14 * k}
          fontSize={CART_TYPE.title * k}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}

      {bar ? (
        <>
          <text
            x={x + 13 * k}
            y={y + 108 * k}
            fontSize="10"
            letterSpacing=".22em"
            fill="var(--pda-txt3)"
          >
            {bar.label}
          </text>
          {bar.lines.map((line, i) => (
            <text
              key={i}
              x={x + 13 * k}
              y={y + 119 * k + i * 17}
              fontSize="10"
              letterSpacing=".08em"
              fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
            >
              {line}
            </text>
          ))}
        </>
      ) : (
        <>
          <text
            x={x + 13 * k}
            y={y + 119 * k}
            fontSize={CART_TYPE.lane * k}
            letterSpacing=".16em"
            fill="var(--pda-txt3)"
          >
            {work.lane}
          </text>
          {work.configured ? (
            <text
              x={x + w - 12 * k}
              y={y + 119 * k}
              textAnchor="end"
              fontSize={CART_TYPE.lane * k}
              letterSpacing=".16em"
              fill="var(--pda-txt3)"
            >
              {work.autonomy}
            </text>
          ) : null}
        </>
      )}
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
