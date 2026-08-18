"use client";

import type { CaseMapShapeKey, CaseSkillEntry } from "@/lib/cases/types";

import {
  ESTATE_BLOCK_H,
  EstateBand,
  GALLERY_H,
  GalleryBand,
  estateBandY,
  estateFootprint,
  estateSlots,
  galleryBandY,
  laneX,
} from "./estateBand";
import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import type { FlightRect } from "./pdaFlight";
import type { PdaEntry } from "./PdaEntry";
import { wrapLines } from "./pdaGlyphs";
import type { LetterSpec } from "./pdaLetters";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { FormField, isFormKey } from "./substrateForms";
import { FS, TRACK } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — the estate above, five strata below, a riser shaft
 * on the left.
 *
 * ## The claim, in one sentence
 *
 * Readings 01 and 02 draw WHERE the work is and HOW one stream is
 * configured; this drawing draws WHAT THE ESTATE STANDS ON — with the
 * estate above it so the reader can see the two.
 *
 * ## What replaced U24's divided plate, and why
 *
 * ⚠ **THE PROMOTION IS ADR-070 U25 (2026-08-17).** Round nine's SECTION
 * direction won the owner's read against MANIFOLD (round-eight vessels
 * with an estate band) and CONTROL (U24's own partition with an estate
 * band, no conductors). The register comparison was that:
 *
 * - **U24 kept the roster but threw away the click's context.** Reading 03
 *   arrived from an OPENED stream and answered with the whole estate as if
 *   no stream had been opened, while readings 01 and 02 shared the same
 *   selected work at their own scales.
 * - **SECTION resumes the click.** The estate stays visible as ghost
 *   footprints; the selected stream lights ONE path — its footprint above
 *   the substrate, gold conductors through the gallery and shaft, and a
 *   lit stub into each stratum it taps. The subject at REST is still the
 *   whole layer.
 * - **The proportional claim moves from AREA to BODY.** U24 said area is
 *   the count; SECTION's heads are fixed chrome (a fs 20 name and a
 *   fs 13 paragraph in two rows) so `(h − headH) / count` is the shared
 *   unit — a refinement, not a retreat.
 * - **The 47 named Skill plates survive verbatim**, re-flowed as five
 *   columns per stratum, seated at each stratum's own floor. The
 *   extraction claim is preserved; the flagship green accent is preserved.
 *
 * See `PdaConsole.entryFor` for the flight's third home — the persistent
 * object now travels between ALL three readings, not just 01 ↔ 02.
 *
 * ## Standing rulings honoured
 *
 * ⚠ **THE 5 × 8 CROSSING STAYS GONE.** The shaft carries per-STREAM shape
 * taps (`PdaWork.taps`), which is a different projection than teams-by-
 * shape. `crossing()` still projects the 5 × 8 for reading 02's tap bars.
 *
 * ⚠ **CARTRIDGE = WORKSTREAM.** The silhouette appears in the estate band
 * only, at footprint scale — the strata below are drawn as full-width bars
 * with square corners. ADR-065's rule holds (children of a chamfered
 * console are square); no stratum is chamfered.
 *
 * ⚠ **NO LEGEND.** The strata NAMES print the shape's own label; the
 * gallery's lane markers are diamonds whose x-positions are answered by
 * looking at the drawing rather than at a key.
 *
 * ⚠ **`meaning` ≤96 chars.** The paragraph is beside the name in a
 * ~500-unit column that wraps every `meaning` on record to two lines. A
 * third line is banned (`PARA_MAX`); a longer sentence fails the fit
 * test's `.sliced` assertion loudly.
 *
 * ⚠ **`short` ≤14 chars, AUTHORED not truncated.** Each Skill plate
 * letters `plate.short`, cap enforced by `cases-registry`.
 *
 * ⚠ **DENSITY PER UNIT AREA.** The physics fields' `k` is a function of
 * `bodyW × bodyH / K_REF`, clamped, so a thin stratum's field does not
 * become the densest thing on the drawing.
 */

/* ── The width chain, which never moves ─────────────────────────────────── */
export const SUB_CROP_W = 932;
const PAD = 26;
const L = PAD;
const R = SUB_CROP_W - PAD;
const W = R - L;

/** The number of shapes on this record — five. Kept for tests that assert
 *  the drawing does not lose a column. */
export const CARDS = 5;

/**
 * ⚠ **THE ORDER IS PART OF THE ARGUMENT.** Lightest at the top, heaviest
 * at the floor — Pattern at the bedrock reads as the heaviest thing and
 * Stakeholder at the topsoil reads as the lightest. The same arithmetic
 * gives one three times the body of the other; the ORDER is what makes
 * that a section of an estate rather than a stacked bar chart.
 */
export const SECTION_ORDER: readonly CaseMapShapeKey[] = [
  "stakeholder",
  "voice",
  "validation",
  "judgment",
  "pattern",
];

/* ── The shaft — one shape per lane, 44u wide ───────────────────────────── */
export const SHAFT_X = L;
export const SHAFT_W = 44;
export const SHAFT_GAP = 10;

/** The strata's left edge — everything below the gallery starts here. */
export const STRATA_X = SHAFT_X + SHAFT_W + SHAFT_GAP;
/** The strata's own content width. */
export const STRATA_W = R - STRATA_X;

/** A shape's own lane x-position inside the shaft. */
export function shaftLaneX(shape: CaseMapShapeKey): number {
  const i = SECTION_ORDER.indexOf(shape);
  if (i < 0) return SHAFT_X + SHAFT_W / 2;
  const inner = SHAFT_W - 8;
  const pitch = inner / (SECTION_ORDER.length - 1);
  return SHAFT_X + 4 + i * pitch;
}

/* ── The strata: heads, plates, physics fields ──────────────────────────── */

/** Every stratum shares one head height — head is CHROME. */
export const HEAD_H = 54;
/** The paragraph's own step, at fs 13. */
const PARA_STEP = 17;
/** The paragraph's first baseline, from the head's own top. */
const PARA_B0 = 22;
/** Maximum wrapped lines for the paragraph. */
const PARA_MAX = 2;

/** The paragraph's own column — right of the name+count block. */
const NAME_COL_W = 260;
const PARA_COL_X = STRATA_X + NAME_COL_W + 20;
const PARA_COL_W = R - PARA_COL_X - 4;
/** The name's baseline, from the head's own top. */
const NAME_BASE = 30;

/** Plate columns per stratum. The wider crop this reading has affords more
 *  than U24's two, so 14 fits in three rows rather than seven. */
export const PLATE_COLS = 5;
export const PLATE_PITCH = 20;
const PLATE_H = PLATE_PITCH - 4;
const ACCENT_W = 3;
const LABEL_GAP = 6;
const LABEL_RIGHT = 6;

/** Bed density reference — the physics field's k scales `bodyW × bodyH`
 *  against this and clamps [0.6, 1.4]. Same shape as U24's, one number
 *  moved to match the wider bodies. */
const K_REF = 120_000;
const densityFor = (w: number, h: number) => Math.min(1.4, Math.max(0.6, (w * h) / K_REF));

/* ── The vertical chain, which is the elastic one ───────────────────────── */

/**
 * ⚠ **BOX_H0 IS THE PLATE'S OWN HEIGHT, INCLUDING THE ESTATE BAND.** U24's
 * 696 stays here on purpose — the outer plate is unchanged; what changes is
 * the CONTENT of that plate (an estate band + gallery + five strata, versus
 * five regions of material). This keeps the crop aspect at rest at the
 * same 0.807 U24 arrived at, which is the ceiling on the narrowest field
 * (1440×800, aspect 0.807) — a crop even fractionally taller would go
 * height-bound there and leak dead panel.
 *
 * The strata block is what shrinks: `STRATA_H0 = BOX_H0 − ESTATE_BLOCK_H`.
 * Every ext goes to strata bodies; heads and the estate block stay fixed.
 */
const BOX_H0 = 696;
export const SUB_EXT_MAX = 1200;
/** The strata's own height at rest — everything below the estate block. */
export const STRATA_H0 = BOX_H0 - ESTATE_BLOCK_H;

const BOX_Y = PAD;

const SUB_FIT: FitSpec = {
  cropW: SUB_CROP_W,
  cropH: BOX_H0 + PAD * 2,
  /* ⚠ HEIGHT ONLY. The width chain is the shaft, the strata, and their
     five plate columns; a wider crop would only float the plate in a
     bigger margin. */
  maxW: 0,
  maxH: SUB_EXT_MAX,
};

export interface SubstrateLayout {
  /** The plate's height at this field shape (estate + strata). */
  boxH: number;
  /** The strata block's own height at this field shape. */
  strataH: number;
  /** The strata block's top edge in crop coordinates. */
  strataTop: number;
  /** Half the crop's vertical slack, above the plate. */
  marginY: number;
  crop: string;
}

/**
 * THE PLATE AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it.
 *
 * The extension goes ENTIRELY to strata bodies. Heads are fixed chrome (a
 * 54-unit head can hold a two-line paragraph beside a name at fs 20 —
 * proportional shrinkage would put the paragraph under the smoke's floor)
 * and the estate + gallery block is fixed too (its cell size cannot shrink
 * without losing the silhouette).
 */
export function substrateLayout(ext: FitExt): SubstrateLayout {
  const boxH = BOX_H0 + ext.extH;
  const strataH = boxH - ESTATE_BLOCK_H;
  const strataTop = BOX_Y + ESTATE_BLOCK_H;
  const box = cropAround({ x: L, y: BOX_Y, w: W, h: boxH }, SUB_CROP_W, SUB_FIT.cropH + ext.extH);
  return { boxH, strataH, strataTop, marginY: box.marginY, crop: box.crop };
}

export const substrateExt = (fieldAspect: number) => fitExt(SUB_FIT, fieldAspect);

/** The plate at rest — what production renders on the binding preset. */
export const SUBSTRATE_LAYOUT_0 = substrateLayout({ extW: 0, extH: 0 });
export const SUBSTRATE_VIEWBOX = SUBSTRATE_LAYOUT_0.crop;

/* ── The record → the drawing ───────────────────────────────────────────── */

/**
 * ⚠ `engine` IS THE PATTERN, lowercased. The Skills reservoir types it as a
 * free `string` carrying a `CaseWorkShape` ("Judgment"), and the map's
 * shapes key on `"judgment"` — one join, declared once here rather than at
 * three call sites. `cases-registry` asserts every engine names a real
 * group.
 */
export const skillsOf = (skills: readonly CaseSkillEntry[], key: string): CaseSkillEntry[] =>
  skills.filter((s) => s.engine.toLowerCase() === key);

export interface SectionStratum {
  key: CaseMapShapeKey;
  /** The stratum's top edge — relative to the strata block's own origin.
   *  Add `layout.strataTop` to get the crop-space y. */
  y: number;
  h: number;
  /** How many lines the paragraph wraps to at this shape's column. */
  paraLines: number;
  /** Encoded Skill count. */
  n: number;
  /** Head chrome height — constant across all strata. */
  headH: number;
  /** Body below the head. */
  bodyH: number;
  /** Where the plate stack starts, from the strata-block-relative y=0. */
  stackTop: number;
  stackH: number;
  /** The shaft stub's y for this stratum. */
  stubY: number;
}

/**
 * WHERE EACH STRATUM SITS at one crop height. Pure, so the fit guard and
 * the drawing measure the same rectangles.
 *
 * ⚠ **THE UNIT IS DERIVED, NEVER AUTHORED.** `bodyPerSkill = (strataH −
 * 5 × headH) / totalSkills`. That is what makes `(h − headH) / count` the
 * same across all five strata — the drawing's arithmetic claim. Every ext
 * goes to bodies (heads are fixed chrome) and the ratio holds at every
 * field shape.
 */
export function sectionStrata(shapes: readonly PdaShape[], strataH: number): SectionStratum[] {
  const byKey = new Map(shapes.map((s) => [s.key as CaseMapShapeKey, s]));
  const rows = SECTION_ORDER.filter((k) => byKey.has(k)).map((k) => ({
    key: k,
    n: byKey.get(k)!.skills,
    meaning: byKey.get(k)!.meaning,
  }));
  const totalSkills = rows.reduce((n, r) => n + r.n, 0);
  const bodyPool = strataH - HEAD_H * rows.length;
  const unit = totalSkills > 0 ? bodyPool / totalSkills : 0;

  const out: SectionStratum[] = [];
  let y = 0;
  for (const r of rows) {
    const paraLines = paraOf(r.meaning).length;
    const headH = HEAD_H;
    const bodyH = Math.max(0, r.n * unit);
    const plateRows = Math.ceil(r.n / PLATE_COLS);
    const stackH = plateRows * PLATE_PITCH;
    const h = headH + bodyH;
    /* Plates seat 8 units above the stratum's floor, so the flagship
       accent has a hair of ground under it — U24's extraction rule kept. */
    const stackTop = y + h - stackH - 8;
    /* Stub enters mid-BODY, not mid-stratum, so the reader's eye lands on
       the plate stack rather than on the head band above it. */
    const stubY = y + headH + bodyH / 2;
    out.push({ key: r.key, y, h, paraLines, n: r.n, headH, bodyH, stackTop, stackH, stubY });
    y += h;
  }
  return out;
}

/**
 * The paragraph's wrap at the head's own column. One place, so the head's
 * height and the fit test cannot disagree about how many lines a `meaning`
 * takes.
 */
export function paraOf(meaning: string): string[] {
  const per = Math.max(1, Math.floor(PARA_COL_W / (FS.gloss * (0.6 + TRACK.gloss))));
  return wrapLines(meaning, per, PARA_MAX);
}

/** One plate's rect within its stratum. `y0` is the strata block's top in
 *  crop coordinates. */
export function plateAt(
  stratum: SectionStratum,
  k: number,
  colW: number,
  colGap: number,
  y0: number
): FlightRect {
  const rows = Math.ceil(stratum.n / PLATE_COLS);
  const col = Math.floor(k / rows);
  const row = k % rows;
  return {
    x: STRATA_X + col * (colW + colGap),
    y: y0 + stratum.stackTop + row * PLATE_PITCH,
    w: colW,
    h: PLATE_H,
  };
}

/** The stratum's own plate column geometry. Column width is derived from
 *  the strata block's width less the fixed inter-column gaps. */
export function sectionColumns(): { colW: number; colGap: number } {
  const colGap = 6;
  const colW = (STRATA_W - colGap * (PLATE_COLS - 1)) / PLATE_COLS;
  return { colW, colGap };
}

/* ── The lettering declaration — what the fit test walks ────────────────── */

export function substrateLettering(record: {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
  /** Optional — passed by the console when the arithmetic must apply to
   *  the LIVE layout rather than the resting one. */
  strataH?: number;
}): LetterSpec[] {
  const strataH = record.strataH ?? STRATA_H0;
  const strata = sectionStrata(record.shapes, strataH);
  const byKey = new Map(record.shapes.map((s) => [s.key as CaseMapShapeKey, s]));
  const out: LetterSpec[] = [];
  const { colW } = sectionColumns();
  const labelMeasure = colW - ACCENT_W - LABEL_GAP - LABEL_RIGHT;

  for (const s of strata) {
    const shape = byKey.get(s.key);
    if (!shape) continue;

    out.push({
      slot: `${s.key}.name`,
      text: shape.name,
      fs: FS.name,
      track: TRACK.name,
      /* Count sits on the same line, right-anchored in its own 56u; the
         name's measure is the head's left column less that numeral. */
      measure: NAME_COL_W - 24 - 56,
    });
    out.push({
      slot: `${s.key}.count`,
      text: String(s.n).padStart(2, "0"),
      fs: FS.name,
      track: TRACK.key,
      measure: 56,
    });

    const lines = paraOf(shape.meaning);
    for (const [i, line] of lines.entries()) {
      out.push({
        slot: `${s.key}.para.${i}`,
        text: line,
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: PARA_COL_W,
      });
    }

    /* ⚠ THE WRAP MUST NOT HAVE SLICED. `wrapLines` truncates at its cap and
       returns quietly, so a paragraph that outgrows `PARA_MAX` loses its
       tail from the drawing AND from this list, and every per-line
       assertion still passes. Declaring the tail at measure 0 makes it
       fail loudly. */
    const kept = lines.join(" ").length;
    if (kept < shape.meaning.length) {
      out.push({
        slot: `${s.key}.para.sliced`,
        text: shape.meaning.slice(kept).trim(),
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: 0,
      });
    }

    for (const plate of skillsOf(record.skills, s.key)) {
      out.push({
        slot: `skill.${plate.id}`,
        text: plate.short,
        fs: FS.chrome,
        track: TRACK.name,
        measure: labelMeasure,
      });
    }
  }

  return out;
}

/** How many conductors a stream would draw when selected — exactly the taps
 *  count on the record, or zero for person-led. */
export function sectionConductorCount(work: PdaWork): number {
  return work.configured ? work.taps.length : 0;
}

/* ── The drawing ───────────────────────────────────────────────────────── */

/** The start pose as inline custom properties for `flPdaDock`. */
function dockVars(entry: PdaEntry): React.CSSProperties | undefined {
  if (entry.kind !== "flight") return undefined;
  return {
    "--dx": `${entry.dx}px`,
    "--dy": `${entry.dy}px`,
    "--dk": entry.dk,
  } as React.CSSProperties;
}

export function ViewSubstrate({
  shapes,
  skills,
  works,
  selectedId,
  showSel,
  onOpen,
  hover,
  onHover,
  lit,
  onLit,
  still,
  layout,
  entry,
}: {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
  /** The projected estate — twenty streams from `selectWorks`. */
  works: readonly PdaWork[];
  /** The record the reader has open, if they have opened one. */
  selectedId: string | null;
  /** True once the reader has ever opened a stream — mirrors reading 01. */
  showSel: boolean;
  /** Called when the reader activates a footprint above — the third home. */
  onOpen: (id: string) => void;
  hover: string | null;
  onHover: (id: string | null) => void;
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  layout: SubstrateLayout;
  /** How the selection entered THIS reading — flight, bloom or raster. */
  entry: PdaEntry;
}) {
  const strata = sectionStrata(shapes, layout.strataH);
  const byKey = new Map(shapes.map((s) => [s.key as CaseMapShapeKey, s]));
  const { colW, colGap } = sectionColumns();
  const y0 = layout.strataTop;
  const shaftBottom = y0 + layout.strataH;

  const selected = showSel ? (works.find((w) => w.id === selectedId) ?? null) : null;
  const selectedTaps = selected?.taps ?? [];
  const galleryY = galleryBandY(PAD);
  const galleryMid = galleryY + GALLERY_H / 2;

  return (
    <>
      {/* THE PLATE GROUND — one opaque surface across the whole box, so the
          strata's physics fields paint against substrate rather than the
          console field's own bed. */}
      <rect x={L} y={BOX_Y} width={W} height={layout.boxH} fill="var(--pda-void)" />

      {/* THE ESTATE BAND above — twenty ghost cartridge footprints. */}
      <EstateBand
        works={works}
        y0={estateBandY(PAD)}
        bandLeft={L}
        bandWidth={W}
        selectedId={showSel ? selectedId : null}
        onOpen={onOpen}
        onHover={onHover}
        hover={hover}
        still={still}
      />

      {/* THE GALLERY BAND — five lane markers, one per shape. */}
      <GalleryBand y0={galleryY} bandLeft={L} bandWidth={W} />

      {/* THE SHAFT — five vertical lanes, plus stubs into every stratum at
          structural alpha. Selection lights the specific stubs later. */}
      <rect
        x={SHAFT_X}
        y={y0}
        width={SHAFT_W}
        height={layout.strataH}
        fill="rgba(var(--dawn-rgb), 0.03)"
      />
      {SECTION_ORDER.map((k) => {
        const x = shaftLaneX(k);
        return (
          <line key={`lane-${k}`} x1={x} y1={y0} x2={x} y2={shaftBottom} stroke="var(--pda-hair)" />
        );
      })}
      <line x1={SHAFT_X} y1={y0} x2={SHAFT_X + SHAFT_W} y2={y0} stroke="var(--pda-hair2)" />
      <line
        x1={SHAFT_X}
        y1={shaftBottom}
        x2={SHAFT_X + SHAFT_W}
        y2={shaftBottom}
        stroke="var(--pda-hair2)"
      />

      {/* The stubs — one per lane per stratum, at 50% opacity. */}
      {strata.map((s) => (
        <g key={`stubs-${s.key}`}>
          {SECTION_ORDER.map((k) => (
            <line
              key={`stub-${s.key}-${k}`}
              x1={shaftLaneX(k)}
              y1={y0 + s.stubY}
              x2={STRATA_X}
              y2={y0 + s.stubY}
              stroke="var(--pda-hair)"
              strokeOpacity={0.5}
            />
          ))}
        </g>
      ))}

      {/* THE FIVE STRATA. */}
      {strata.map((s, i) => {
        const shape = byKey.get(s.key);
        if (!shape) return null;
        const sy = y0 + s.y;
        const isLit = lit === s.key;
        const isTapped = selectedTaps.includes(s.key);
        const paraLines = paraOf(shape.meaning);
        const plates = skillsOf(skills, s.key);

        return (
          <g
            key={s.key}
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            style={still ? undefined : { animationDelay: `${140 + i * 40}ms` }}
            onMouseEnter={() => onLit(s.key)}
            onMouseLeave={() => onLit(null)}
          >
            {/* THE BODY BED — the pattern's own physics field, clipped to
                the stratum's rectangle. Full width, from head to floor.
                ⚠ THE CLIP LIVES INSIDE THE TRANSLATE (roundSix's lesson):
                `clipPath` resolves in the referencing element's own space,
                so an absolute clip rect applied to a translated group
                clips the wrong box entirely. */}
            {isFormKey(s.key) && s.bodyH > 16 ? (
              <g
                transform={`translate(${STRATA_X} ${sy + s.headH})`}
                opacity={isTapped ? 0.85 : 0.65}
              >
                <defs>
                  <clipPath id={`pda-sub-body-${s.key}-${i}`}>
                    <rect x={0} y={0} width={STRATA_W} height={s.bodyH} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#pda-sub-body-${s.key}-${i})`}>
                  <FormField
                    form={s.key}
                    w={STRATA_W}
                    h={s.bodyH}
                    seed={17 + i * 13}
                    k={densityFor(STRATA_W, s.bodyH)}
                    p={16}
                  />
                </g>
              </g>
            ) : null}

            {/* THE HEAD BAND — a step opaque so the paragraph never sits
                on the field. */}
            <rect
              x={STRATA_X}
              y={sy}
              width={STRATA_W}
              height={s.headH}
              fill="rgba(var(--dawn-rgb), 0.08)"
            />

            {/* THE INTER-STRATUM HAIRLINE — a rule between strata, not a
                border around one. The topmost stratum drops this rule. */}
            {i > 0 ? (
              <line
                x1={STRATA_X}
                y1={sy}
                x2={STRATA_X + STRATA_W}
                y2={sy}
                stroke="var(--pda-hair2)"
              />
            ) : null}

            {/* NAME + COUNT on the left. */}
            <text
              x={STRATA_X + 12}
              y={sy + NAME_BASE}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill={isLit || isTapped ? "var(--pda-hot)" : "var(--pda-txt)"}
            >
              {shape.name}
            </text>
            <text
              x={STRATA_X + NAME_COL_W - 12}
              y={sy + NAME_BASE}
              textAnchor="end"
              fontSize={FS.name}
              letterSpacing=".18em"
              fill="var(--pda-ink)"
            >
              {String(s.n).padStart(2, "0")}
            </text>

            {/* MEANING — beside the name, up to two lines. */}
            {paraLines.map((line, k) => (
              <text
                key={line}
                x={PARA_COL_X}
                y={sy + PARA_B0 + k * PARA_STEP}
                fontSize={FS.gloss}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {line}
              </text>
            ))}

            {/* PLATES — one per encoded Skill, seated at the stratum's own
                floor. Column-major so the flagship lands at top-left. */}
            {plates.map((plate, k) => {
              const p = plateAt(s, k, colW, colGap, y0);
              const first = Boolean(plate.flagship);
              return (
                <g key={plate.id}>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="var(--pda-void)" />
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    fill="rgba(var(--dawn-rgb), 0.07)"
                  />
                  <rect
                    x={p.x}
                    y={p.y}
                    width={ACCENT_W}
                    height={p.h}
                    fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={first ? 1 : 0.55}
                  />
                  <text
                    x={p.x + ACCENT_W + LABEL_GAP}
                    y={p.y + p.h - (p.h - 12) / 2 - 2}
                    fontSize={FS.chrome}
                    letterSpacing=".08em"
                    fill="var(--pda-txt)"
                  >
                    {plate.short}
                  </text>
                </g>
              );
            })}

            {/* LIT-EDGE on a tapped stratum. A hairline at the top edge
                rather than a full border — the stratum is a division, not
                an object. */}
            {isTapped ? (
              <line
                x1={STRATA_X}
                y1={sy + 1}
                x2={STRATA_X + STRATA_W}
                y2={sy + 1}
                stroke="var(--pda-hot)"
                strokeWidth={1.6}
              />
            ) : null}
          </g>
        );
      })}

      {/* THE OUTER FRAME of the strata block. */}
      <rect
        x={STRATA_X}
        y={y0}
        width={STRATA_W}
        height={layout.strataH}
        fill="none"
        stroke="var(--pda-hair2)"
      />

      {/* THE SELECTED STREAM'S CONDUCTORS — one per shape it TAPS, gold,
          from footprint drop → gallery lane → shaft lane → stratum stub.
          ⚠ At rest (no selection) this whole block draws nothing. */}
      {selected ? (
        <SelectedPath
          selected={selected}
          works={works}
          strata={strata}
          y0={y0}
          galleryY={galleryY}
          galleryMid={galleryMid}
          entry={entry}
        />
      ) : null}

      {/* THE PLATE'S OWN EDGE, stroked over the strata clip so it stays
          crisp. */}
      <rect x={L} y={BOX_Y} width={W} height={layout.boxH} fill="none" stroke="var(--pda-hair2)" />
    </>
  );
}

/** The selected stream's gold path — footprint drop → gallery lane → shaft
 *  lane → stratum stub. `entry` decides whether the docking group carries
 *  a flight transform. */
function SelectedPath({
  selected,
  works,
  strata,
  y0,
  galleryY,
  galleryMid,
  entry,
}: {
  selected: PdaWork;
  works: readonly PdaWork[];
  strata: readonly SectionStratum[];
  y0: number;
  galleryY: number;
  galleryMid: number;
  entry: PdaEntry;
}) {
  const slot = estateSlots(works, estateBandY(PAD), L, W).find((s) => s.id === selected.id);
  if (!slot) return null;

  const fx = slot.x + slot.w / 2;
  const fy = slot.y + slot.h;
  const stratumOf = new Map(strata.map((s) => [s.key, s]));

  return (
    /* ⚠ THE DOCK GROUP WRAPS THE FOOTPRINT'S PATH ONLY (`fill-box`) if a
       flight is arriving. The path itself does not fly — only the
       footprint above lights first; the conductors DRAW after with the
       group's arrival class, so the reader sees the connection land after
       the object seats. */
    <g
      className={entry.kind === "flight" ? undefined : "fl-pda-in"}
      style={dockVars(entry) ?? { animationDelay: "260ms" }}
    >
      <line x1={fx} y1={fy} x2={fx} y2={galleryMid} stroke="var(--pda-hot)" strokeWidth={1.4} />

      {selected.taps.map((k) => {
        const stratum = stratumOf.get(k);
        if (!stratum) return null;
        const sx = shaftLaneX(k);
        const gx = laneX(k, L, W);
        const stubYCrop = y0 + stratum.stubY;
        return (
          <g key={`path-${selected.id}-${k}`}>
            <line
              x1={fx}
              y1={galleryMid}
              x2={gx}
              y2={galleryMid}
              stroke="var(--pda-hot)"
              strokeWidth={1.2}
            />
            <line
              x1={gx}
              y1={galleryMid}
              x2={gx}
              y2={galleryY + GALLERY_H + 4}
              stroke="var(--pda-hot)"
              strokeWidth={1.2}
            />
            <line
              x1={gx}
              y1={galleryY + GALLERY_H + 4}
              x2={sx}
              y2={galleryY + GALLERY_H + 4}
              stroke="var(--pda-hot)"
              strokeWidth={1.2}
            />
            <line
              x1={sx}
              y1={galleryY + GALLERY_H + 4}
              x2={sx}
              y2={stubYCrop}
              stroke="var(--pda-hot)"
              strokeWidth={1.4}
            />
            <line
              x1={sx}
              y1={stubYCrop}
              x2={STRATA_X}
              y2={stubYCrop}
              stroke="var(--pda-hot)"
              strokeWidth={1.6}
            />
            {/* A small gold diamond at the strata entry — the reader's own
                landing mark. */}
            <rect
              x={STRATA_X - 4}
              y={stubYCrop - 4}
              width={8}
              height={8}
              transform={`rotate(45 ${STRATA_X} ${stubYCrop})`}
              fill="var(--pda-hot)"
            />
          </g>
        );
      })}
    </g>
  );
}

/* ── Backward-compat re-exports (for the lab and the tests) ────────────── */

/** Alias, kept because `estateFootprint` is the canonical name here now. */
export { estateFootprint };

/** `ESTATE_BLOCK_H` is the substrate's OWN vocabulary — the height the
 *  strata block subtracts from the plate. Kept behind the same export
 *  point so a caller does not have to reach into `estateBand` for a
 *  layout constant. */
export { ESTATE_BLOCK_H };
