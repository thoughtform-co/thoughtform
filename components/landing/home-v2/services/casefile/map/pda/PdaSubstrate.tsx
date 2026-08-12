"use client";

import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import type { LetterSpec } from "./pdaLetters";
import type { PdaShape, PdaTeam } from "./pdaRecord";
import { DeptHead, FS, Tap, TRACK, housing, shapeSpecs } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — the pin grid (ADR-070 U15).
 *
 * The composition is the owner's `Substrate Archetypes (Standalone).html`,
 * frame **S3 — PIN GRID**: _"forms × teams in one socket · the whole substrate
 * at a glance"_. Five patterns down, eight departments across, one mark per
 * crossing. ⚠ **THE MOCKUP IS THE LIVE RECORD ALREADY DRAWN** — every mark in
 * it resolves against `crossing()`: 30 taps, 5 cut, 10 empty sockets, rows of
 * 3 · 7 · 7 · 5 · 8, columns in `MAP_DISTRICTS` order. So this is a coordinate
 * port, not a re-derivation.
 *
 * ## What it replaces, and why
 *
 * The old drawing was eight plates over five `Module` cards joined by 30
 * crossing beziers, and it had three defects the owner named in one sentence
 * (_"the shape of the cards, especially the bottom ones with the really weird
 * notch, isn't nice to look at"_):
 *
 *   - **`Module`'s cut is `h × 0.34` on BOTH left corners.** On a 148 × 50
 *     card that is 17 units twice — 68 % of the left edge gone, leaving a
 *     16-unit stub, plus a 19-unit bullseye. It read as a blunt wedge, and it
 *     sat beside `Plate`'s single flat-8 cut and `Cartridge`'s `14k`: three
 *     glyphs, three corner grammars, two proportional to different things.
 *   - **A pattern was drawn as a `Module`**, which on this surface is the
 *     silhouette of A THING THAT RUNS. A pattern is not one. (The substrate
 *     lab's founding diagnosis; `variants.ts` states it.)
 *   - **Answering "who draws on Judgment?" meant tracing a curve** through 29
 *     others — the same failure that retired ADR-062's isometric city. A cell
 *     is read by position, so the question is answered by looking.
 *
 * ⚠ **AND IT CARRIED A LIVE CONFIDENTIALITY DEFECT.** The old meta line was
 * `{n} SKILLS · {n} TEAMS`, which rendered **8 TEAMS** for PATTERN — 8 is the
 * DEPARTMENT count, and both published team counts (22 briefed, 14 running the
 * layer) are different units and different sets. `cases-registry` bans exactly
 * that phrase and never saw it, because it walks content objects with
 * `JSON.stringify` and this was composed at render time. The pin grid does not
 * need the phrase at all: a row's marks ARE its department count.
 *
 * ## Adaptations, each forced by a standing law or by arithmetic
 *
 *   SB-01…SB-05      deleted — ordinals in costume (ADR-066 removed every
 *                    ordinal on this surface; ADR-070 U11 removed R4's own
 *                    passive designators for the same reason)
 *   the legend       deleted — this surface has NO LEGEND by law (ADR-062):
 *                    the drawing carries provenance. Each row letters
 *                    `CUT BY {ab}`, which decodes its own green mark in place
 *   the gloss        ADDED — it letters nowhere else in production, and it is
 *                    what makes a pattern mean something rather than being a
 *                    word with a count beside it. It is also what sets the
 *                    identity gutter's width: 38 chars at fs 13 is 336 units
 *   the counts       `{n} SKILLS` only, never a department count — see above
 *   the socket       a chamfered HOUSING (ADR-065's canonical TR+BL, the cut
 *                    reading 02 settled on in U13) rather than the mockup's
 *                    plain rect and gold corner diamond, which is R4's
 *                    registration-mark family — deleted in U11
 *
 * ⚠ **THE CROP'S WIDTH IS READING 02's**, and that is the whole reason this
 * drawing is elastic for free: `meet` is `field.w / 932` at every height, so
 * growing the crop costs nothing (see `pdaFit`). The substrate lab authored
 * all three of its directions at 932 for exactly this promotion.
 */

/* ── The width chain, which never moves ─────────────────────────────────── */
export const SUB_CROP_W = 932;
const PAD = 26;
const L = PAD;
const R = SUB_CROP_W - PAD;

/** The identity gutter — sized by the longest `gloss` at `FS.gloss`, which is
 *  38 chars = 336 units, i.e. 90 % of this measure. The house norm. */
const GUT_W = 374;
const SOCK_X = L + GUT_W + 20;
const SOCK_W = R - SOCK_X;

const COLS = 8;
const ROWS = 5;
const COL_PITCH = SOCK_W / COLS;

/* ── The vertical chain, which is the elastic one ───────────────────────── */
const HEAD_Y = PAD;
/** `DeptHead` draws a 34-unit plate, its code at +22 and its count at +52. */
const HEAD_H = 70;
const SOCK_Y = HEAD_Y + HEAD_H;
const ROW_H0 = 112;

/**
 * ⚠ THE EXTRA HEIGHT GOES TO THE ROWS, AND TO NOTHING ELSE.
 *
 * The two other candidates are both holes: the head gap is the distance
 * between a column's label and the column it labels, and a margin is the dead
 * panel this whole mechanism exists to remove. Rows are the drawing's own
 * rhythm — five bands, each holding a three-line identity and a mark — so
 * growth there is spacing rather than a gap, and it is SPLIT five ways by
 * construction (ADR-070 U12's law: pooled air is a hole).
 *
 * Past the cap a row stops being a band and starts being an identity floating
 * in one, so the remainder becomes margin and `cropAround` splits it. Measured
 * fields: 603×493 → row 128 · 850×760 → 142 · **845×950 (the owner's) → 185,
 * a full fill** · 850×1120 → capped, 104 units of air each end.
 */
const ROW_H_MAX = 190;
/**
 * ⚠ THIS CLAMP IS FAR LOOSER THAN READING 02'S 620, AND THE DIFFERENCE IS
 * WHERE THE EXTENSION GOES.
 *
 * Reading 02 spends its extension on CONTENT — the cable runs between its
 * modules — so past a point the drawing itself distorts and a clamp is the
 * honest answer (_"a 590-unit bus run is a gap with wires in it"_). Here the
 * ROW CAP already protects the drawing: past it the extension buys nothing but
 * margin, and `cropAround` splits margin evenly. So clamping early would
 * strictly hurt — the emptiness is the same either way, and an unclamped crop
 * puts it half above and half below instead of hanging it all off the bottom,
 * where `xMidYMin` anchors the letterbox.
 *
 * Measured at 603 × 1177 (a portrait desktop window, the only shape that gets
 * near it): clamped at 620 the drawing sits 91px from the top and 426px from
 * the bottom; unclamped it is 258px from each. Same pixels of nothing, and one
 * of them looks like a mistake.
 */
export const SUB_EXT_MAX = 1200;

const BLOCK_H0 = HEAD_H + ROWS * ROW_H0;
const SUB_FIT: FitSpec = {
  cropW: SUB_CROP_W,
  cropH: BLOCK_H0 + PAD * 2,
  /* ⚠ HEIGHT ONLY. Every measured desktop field is TALLER than this crop
     (0.807 … 1.318 against its 0.732), so the width branch is unreachable in
     practice — and were it reachable, a wider crop would only float a fixed
     width chain in a bigger margin. */
  maxW: 0,
  maxH: SUB_EXT_MAX,
};

export interface SubstrateLayout {
  rowH: number;
  cell: number;
  sockH: number;
  marginY: number;
  crop: string;
}

/** THE GRID AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it. */
export function substrateLayout(ext: FitExt): SubstrateLayout {
  const rowH = Math.min(ROW_H_MAX, ROW_H0 + ext.extH / ROWS);
  const sockH = ROWS * rowH;
  /* The mark grows with its band, so the matrix reads at a glance on a tall
     panel instead of becoming five sparse rows of dots. */
  const cell = Math.min(34, Math.max(18, rowH * 0.22));
  const box = cropAround(
    { x: L, y: HEAD_Y, w: R - L, h: HEAD_H + sockH },
    SUB_CROP_W,
    SUB_FIT.cropH + ext.extH
  );
  return { rowH, cell, sockH, marginY: box.marginY, crop: box.crop };
}

export const substrateExt = (fieldAspect: number) => fitExt(SUB_FIT, fieldAspect);

/** The grid at rest — what the labs mount and what every guard measures. */
export const SUBSTRATE_LAYOUT_0 = substrateLayout({ extW: 0, extH: 0 });
export const SUBSTRATE_VIEWBOX = SUBSTRATE_LAYOUT_0.crop;

const colX = (i: number) => SOCK_X + COL_PITCH * (i + 0.5);
const rowY = (j: number, rowH: number) => SOCK_Y + rowH * (j + 0.5);

/* Baselines inside a row, from its centre. The three-line identity is 64 units
   of ink whatever the band does, so it stays centred as the band grows. */
const B_NAME = -20;
const B_GLOSS = 4;
const B_CUT = 26;
/** The `{n} SKILLS` pin, right-aligned on the name's line. */
const META_MEASURE = 120;
const NAME_MEASURE = GUT_W - META_MEASURE - 20;

/**
 * WHAT THIS DRAWING LETTERS, declared so `pda-substrate-fit` can measure the
 * drawing's own inputs rather than re-deriving them.
 *
 * ⚠ **READING 03 HAD NO FIT GUARD AT ALL** until this drawing. Every other
 * reading's labels are walked arithmetically; 03's were checked only by the
 * browser smoke's 4.3px floor, which is why an unpublishable string ("8
 * TEAMS") lived in it for months. A drawing that declares what it letters is
 * the only version of this that a scanner can reach.
 */
export function substrateLettering(record: {
  teams: readonly PdaTeam[];
  shapes: readonly PdaShape[];
}): LetterSpec[] {
  return [
    ...record.teams.flatMap((t) => [
      {
        slot: `dept.${t.id}`,
        text: t.ab,
        fs: FS.key,
        track: TRACK.code,
        measure: COL_PITCH - 8,
      },
      {
        slot: `dept.${t.id}.n`,
        text: String(t.shown).padStart(2, "0"),
        fs: FS.chrome,
        track: TRACK.chrome,
        measure: COL_PITCH - 8,
      },
    ]),
    ...record.shapes.flatMap((s) =>
      shapeSpecs(s, { name: NAME_MEASURE, gloss: GUT_W, meta: META_MEASURE })
    ),
  ];
}

export function ViewSubstrate({
  teams,
  shapes,
  lit,
  onLit,
  still,
  layout,
}: {
  teams: readonly PdaTeam[];
  shapes: readonly PdaShape[];
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  layout: SubstrateLayout;
}) {
  const { rowH, cell, sockH } = layout;

  return (
    <>
      {/* ⚠ NO SECTION RULES (owner, 2026-08-06) and NO LEGEND (ADR-062). The
          marks are decoded in place: a row says CUT BY its own department, and
          the column that cut it carries the only green mark in that row. */}

      {/* ONE SOCKET — a machined housing, so it takes the canonical cut. */}
      <path
        d={housing(SOCK_X, SOCK_Y, SOCK_W, sockH, 12)}
        fill="var(--pda-void)"
        stroke="var(--pda-hair2)"
      />

      {/* ⚠ THE BAND RULES ARE WHAT KEEP A TALL PANEL FROM READING AS EMPTY.
          The rows carry the extension (see `substrateLayout`), so at the
          owner's 845 × 950 they run 185 units against 64 units of ink — and
          without a boundary that air reads as a hole between two rows rather
          than as the height of one. Measured at rest they are 112 apart and
          nearly invisible; they earn their ink exactly where the drawing
          stretches. Four internal rules for five bands: the socket's own walls
          close the set, so a fifth would be drawing an edge twice. */}
      {shapes.slice(1).map((s, j) => (
        <line
          key={`band-${s.key}`}
          x1={SOCK_X}
          x2={SOCK_X + SOCK_W}
          y1={SOCK_Y + rowH * (j + 1)}
          y2={SOCK_Y + rowH * (j + 1)}
          stroke="var(--pda-hair)"
        />
      ))}

      {teams.map((t, i) => {
        const isLit = lit === t.id;
        return (
          <g
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            key={t.id}
            style={still ? undefined : { animationDelay: `${i * 26}ms` }}
            onMouseEnter={() => onLit(t.id)}
            onMouseLeave={() => onLit(null)}
          >
            {/* The plate is opaque, so it hit-tests at its centre. */}
            <DeptHead cx={colX(i)} y={HEAD_Y} w={COL_PITCH - 9} team={t} hot={isLit} />
          </g>
        );
      })}

      {shapes.map((s, j) => {
        const cy = rowY(j, rowH);
        const isLit = lit === s.key;
        return (
          <g
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            key={s.key}
            style={still ? undefined : { animationDelay: `${240 + j * 44}ms` }}
            onMouseEnter={() => onLit(s.key)}
            onMouseLeave={() => onLit(null)}
          >
            {/* ⚠ THE BED IS EXPLICITLY FILLED. An SVG shape with no fill
                hit-tests on its STROKE alone, which is the class of bug
                ADR-069 found on the person-led cartridges — a row whose
                content is three text lines would otherwise be hoverable only
                where a glyph happens to be. */}
            <rect
              x={L}
              y={cy - rowH / 2}
              width={R - L}
              height={rowH}
              fill="transparent"
              stroke="none"
            />

            <text
              x={L}
              y={cy + B_NAME}
              fontSize={FS.name}
              letterSpacing=".08em"
              fill={isLit ? "var(--pda-hot)" : "var(--pda-txt)"}
            >
              {s.name}
            </text>
            <text
              x={L + GUT_W}
              y={cy + B_NAME}
              textAnchor="end"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {`${s.skills} SKILLS`}
            </text>
            <text
              x={L}
              y={cy + B_GLOSS}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {s.gloss}
            </text>
            <text
              x={L}
              y={cy + B_CUT}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-grn-ink)"
            >
              {`CUT BY ${s.trenchedBy}`}
            </text>

            {teams.map((t, i) => (
              <Tap
                key={t.id}
                cx={colX(i)}
                cy={cy}
                size={cell}
                on={t.taps.includes(s.key)}
                cut={t.trenched === s.key}
                hot={isLit || lit === t.id}
              />
            ))}
          </g>
        );
      })}
    </>
  );
}
