"use client";

import type { CaseSkillEntry } from "@/lib/cases/types";

import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import { wrapLines } from "./pdaGlyphs";
import type { LetterSpec } from "./pdaLetters";
import type { PdaShape } from "./pdaRecord";
import { FormField, isFormKey } from "./substrateForms";
import { FS, TRACK, housing } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — one plate divided into five regions of material, each
 * a title, one paragraph, and the pattern's own physics.
 *
 * ## The claim
 *
 * ONE PLATE, DIVIDED — not five cards collected. The crop is partitioned with
 * no gutters, area proportional to the Skill count, and the whole thing takes a
 * single outer cut, so Pattern's fourteen occupies nearly three times
 * Stakeholder's five and no numeral is doing that work. Each region letters its
 * name and one sentence saying what that substrate MEANS, over its own physics
 * field. A graduation of one tick per encoded Skill runs at the base of each
 * material, at one shared pitch across all five, so the area a reader sees is
 * also a number they can count.
 *
 * ⚠ **A GUTTER IS A STATEMENT ABOUT HOW MANY THINGS THERE ARE.** Take the
 * gutters away and the same five rectangles stop being objects and become
 * REGIONS of one surface, which is the claim this reading actually makes: one
 * intelligence layer, five recurring shapes. That is why the partition is
 * derived rather than authored, why there is one cut on the outer boundary
 * only, and why chamfering each region is banned — five machined housings would
 * undo the whole paragraph above.
 *
 * ## What it replaces, and what that cost
 *
 * ADR-070 U16's five pattern cards — a stack of named Skill plates over the
 * pattern's field, gloss in the foot. It was `housing()` five times in a row,
 * i.e. reading 01's grid at n = 5, which broke the owner's standing constraint
 * that this reading may not look like the work tab before a string was placed.
 *
 * ⚠ **THE 47 NAMED SKILL PLATES WENT WITH IT**, and that is the real cost. The
 * stack lettered every Skill's `short`; the graduation letters none of them —
 * the ticks are countable, not readable. Nothing is lost from the RECORD (the
 * same case's registry row renders all 47 by name in `SkillsBrowserPlate`, one
 * casefile row away) and the drawing gains the thing it never had: a sentence
 * a reader can actually read. If the roster must return it needs its own
 * reading, not a corner of this one.
 *
 * ⚠ **THE 5 × 8 CROSSING REMAINS GONE** (owner, 2026-08-13). `crossing()` still
 * projects it and its arithmetic is still guarded; it cannot come back inside a
 * region, because eight department codes need ~196 units of lettering and marks
 * without codes need a legend, which this surface bans.
 *
 * ## The copy, cut to the bone
 *
 * ⚠ **THREE LETTERED THINGS PER REGION, AND ONE OF THEM IS NEW** (owner,
 * 2026-08-16: make it SUPER SIMPLE — the title, moved up, with a paragraph
 * under it that concisely explains what it means). `gloss`, `evalMethod` and
 * the 47 Skill labels are no longer drawn. What replaces them is
 * `PdaShape.meaning` — the first prose on this console, stored in sentence case
 * because mono caps at 13 units is the least readable thing a paragraph can be.
 *
 * ⚠ **THE FLAGSHIP SURVIVES AS A MARK, NOT A NAME.** Its tick runs longer and
 * takes green. The rule the card stack learned — the accent carries the signal,
 * the label stays at full ink — is satisfied here by dropping the label rather
 * than by dimming it.
 *
 * ## Two things that are arithmetic, not taste
 *
 * ⚠ **DENSITY IS PER UNIT AREA.** The particle painters emit a FIXED mark count
 * scaled by `k`, while the lattice painters tile. At one shared `k` the largest
 * field and the smallest get the same 300 marks, so the SMALLEST region reads
 * as the densest material — the drawing would encode the count a third time,
 * and backwards. `k` is the field's own area against a reference.
 *
 * ⚠ **THE DIVISION IS A GROUT, AND THERE ARE NO INTERNAL RULES.** A 1-unit rule
 * paints 0.65 of a device pixel at this crop's meet and the browser pays the
 * rest in alpha — the same arithmetic that made U16's stack spine and foot
 * separator into bands. So the regions paint on a rect inset by half a channel
 * and the PLATE shows between two materials. A grout belongs to the plate; a
 * gutter is empty space between objects. No rule goes back inside the channel:
 * a line in its own channel frames a card.
 *
 * ⚠ **THE CROP'S WIDTH IS READING 02's**, which is what makes this elastic for
 * free: `meet` is `field.w / 932` at every height, so growing the crop costs
 * nothing (see `pdaFit`). The substrate lab authored every direction at 932 for
 * exactly this promotion.
 *
 * ⚠ **BUT NOT ITS HEIGHT — 748, NOT THE LAB'S 762.** The lab's crop is static
 * and its aspect (0.8176) is fractionally TALLER than the narrowest measured
 * console field (1440×800, 0.8071), which makes it height-bound there and costs
 * 9px of dead panel. A static crop can afford that; an elastic one cannot,
 * because height-bound is the one state this reading's `fitExt` has no lever
 * for. So promotion was a copy of the DRAWING and a re-fit of the BOX — see
 * `BOX_H0`.
 */

/* ── The width chain, which never moves ─────────────────────────────────── */
export const SUB_CROP_W = 932;
const PAD = 26;
const L = PAD;
const R = SUB_CROP_W - PAD;
const W = R - L;

export const CARDS = 5;

/** The outer cut. Larger than a module's, because it reads at the scale of the
 *  whole panel rather than of one card. */
const OUTER_CUT = 26;
/** A region's own text inset. */
const PAD_IN = 16;

/**
 * THE GROUT — the channel of plate between two materials.
 *
 * ⚠ NOT A GUTTER. A gutter is empty space between OBJECTS and is what makes
 * five regions read as five cards; this drawing bans it. A grout belongs to
 * the plate and is what the eye reads as one surface divided. Four units is
 * ~2.6px at the binding preset and ~3.6px at 1920 — findable, and an order of
 * magnitude under the gutter it must not become.
 */
const GROUT = 4;

/* ── The zones, all derived from the type ───────────────────────────────── */

/** The title, near the region's own top edge. */
const B_NAME = 22;
/** The paragraph's first baseline, and its leading. */
const B_PARA = 46;
const PARA_STEP = 18;
/**
 * ⚠ THREE, AND IT IS A BELT RATHER THAN A TARGET. Every `meaning` on the record
 * wraps to two lines in the NARROWER column; the third exists so a later edit
 * overflows into space that is there, and `substrateLettering` declares any
 * tail past it at measure 0 so a silent slice fails loudly instead.
 */
const PARA_MAX = 3;
/** Air under the last paragraph line, before the material starts. */
const HEAD_PAD = 16;

/**
 * The graduation — ONE TICK PER ENCODED SKILL, at ONE PITCH ACROSS ALL FIVE.
 *
 * ⚠ THE PITCH IS SHARED AND FIXED, never fitted to a region's width. A run
 * scaled to fill its own region would make five runs of identical length and
 * encode nothing. At 16 the heaviest pattern's fourteen measure 224 units
 * against the narrowest region's ~361 of usable width.
 */
const TICK_PITCH = 16;
const TICK_H = 11;
const TICK_FLAG_H = 18;
/** What the run reserves at a region's base, ticks plus their air. */
const TICK_BAND = 26;

/**
 * ⚠ DENSITY IS PER UNIT AREA, AND AT A FIXED `k` IT IS NOT — see the header.
 * Clamped at both ends because a painter's marks stop reading as material below
 * a handful and turn to noise well above the reference.
 */
const K_REF = 96_000;
const densityFor = (w: number, h: number) => Math.min(1.5, Math.max(0.4, (w * h) / K_REF));

/* ── The vertical chain, which is the elastic one ───────────────────────── */

const BOX_Y = PAD;
/**
 * The plate at rest.
 *
 * ⚠ **696 — AND THE CEILING IS THE NARROWEST FIELD'S ASPECT, NOT A ROUND
 * NUMBER.** The whole elastic mechanism only works while the crop is
 * WIDTH-bound: `fitExt` grows height when the field is taller than the crop and
 * this reading forbids width growth (below), so a crop even fractionally taller
 * in aspect than some field goes height-bound there and can no longer reach the
 * panel's edges.
 *
 * The measured console fields run 0.807 (1440×800, the narrowest) to 1.95
 * (1280×1440), so the rest crop's aspect must sit at or under **0.807**:
 * `cropH ≤ 932 × 0.807 = 752`, i.e. `BOX_H0 ≤ 700`. The substrate lab drew
 * every direction at 710 / crop 762 — aspect 0.8176 — which is width-bound at
 * 1280×720 and, by four thousandths, height-bound at 1440×800. That cost 9px of
 * dead panel there and `pda-viewbox` caught it on the first run.
 *
 * 696 clears the narrowest field with margin and costs the plate 14 units of
 * height at rest, which the regions absorb as material.
 */
const BOX_H0 = 696;

export const SUB_EXT_MAX = 1200;

const SUB_FIT: FitSpec = {
  cropW: SUB_CROP_W,
  cropH: BOX_H0 + PAD * 2,
  /* ⚠ HEIGHT ONLY. The width chain is the partition's own two columns; a wider
     crop would only float the plate in a bigger margin. */
  maxW: 0,
  maxH: SUB_EXT_MAX,
};

export interface SubstrateLayout {
  /** The plate's height at this field shape. */
  boxH: number;
  marginY: number;
  crop: string;
}

/**
 * THE PLATE AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it.
 *
 * ⚠ **THE EXTENSION GOES ENTIRELY TO THE REGIONS, AND THAT IS HONEST HERE
 * WHERE IT WOULD NOT BE ELSEWHERE.** Reading 02 has to split its extension
 * between cables and cells because a taller module with a fixed head is a
 * module with a hole under it. This plate has no hole to make: every region's
 * head is fixed and everything below it is MATERIAL, which is texture and
 * absorbs any amount of room without reading as air. The regions also stay
 * proportional to each other, so area-is-the-count survives at every height —
 * and the thinnest region's material, which is the tight case at rest, is the
 * one that gains most.
 */
export function substrateLayout(ext: FitExt): SubstrateLayout {
  const boxH = BOX_H0 + ext.extH;
  const box = cropAround({ x: L, y: BOX_Y, w: W, h: boxH }, SUB_CROP_W, SUB_FIT.cropH + ext.extH);
  return { boxH, marginY: box.marginY, crop: box.crop };
}

export const substrateExt = (fieldAspect: number) => fitExt(SUB_FIT, fieldAspect);

/** The plate at rest — what the labs mount and what every guard measures. */
export const SUBSTRATE_LAYOUT_0 = substrateLayout({ extW: 0, extH: 0 });
export const SUBSTRATE_VIEWBOX = SUBSTRATE_LAYOUT_0.crop;

/* ── The record → the drawing ───────────────────────────────────────────── */

/**
 * ⚠ `engine` IS THE PATTERN, lowercased. The Skills reservoir types it as a
 * free `string` carrying a `CaseWorkShape` ("Judgment"), and the map's shapes
 * key on `"judgment"` — one join, declared once here rather than at three call
 * sites. `cases-registry` asserts every engine names a real group.
 */
export const skillsOf = (skills: readonly CaseSkillEntry[], key: string): CaseSkillEntry[] =>
  skills.filter((s) => s.engine.toLowerCase() === key);

export interface SubstrateRow {
  key: string;
  /** Encoded Skills in this pattern — what its area is proportional to. */
  n: number;
}

export interface SubstrateBlock {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The rows a partition is computed from. One derivation, so the drawing and
 *  the guard cannot disagree about what they are dividing. */
export const substrateRows = (
  shapes: readonly PdaShape[],
  skills: readonly CaseSkillEntry[]
): SubstrateRow[] => shapes.map((s) => ({ key: s.key, n: skillsOf(skills, s.key).length }));

/**
 * SLICE AND DICE. Pure, so the fit guard walks the same rectangles the drawing
 * paints and the area-is-the-count assertion can check them directly.
 *
 * ⚠ THE PARTITION IS DERIVED, NEVER AUTHORED. The heaviest patterns fill the
 * left column until the running sum passes half the estate, and the rest take
 * the right. Hardcoding "pattern and judgment go left" would silently mis-draw
 * the moment a Skill moves between shapes, and the areas would stop being the
 * counts — which is the one thing this drawing claims.
 */
export function substrateBlocks(rows: readonly SubstrateRow[], boxH: number): SubstrateBlock[] {
  const order = [...rows].sort((a, b) => b.n - a.n);
  const total = order.reduce((n, r) => n + r.n, 0);
  if (total <= 0 || order.length === 0) return [];

  let run = 0;
  let cut = 1;
  for (let i = 0; i < order.length; i += 1) {
    run += order[i].n;
    if (run * 2 >= total) {
      cut = i + 1;
      break;
    }
  }
  const left = order.slice(0, cut);
  const right = order.slice(cut);
  const leftN = left.reduce((n, r) => n + r.n, 0);
  const leftW = right.length === 0 ? W : (W * leftN) / total;

  const out: SubstrateBlock[] = [];
  const stack = (col: readonly SubstrateRow[], x: number, w: number) => {
    const n = col.reduce((m, r) => m + r.n, 0);
    let y = BOX_Y;
    for (const [i, r] of col.entries()) {
      /* The last block takes the remainder, so rounding never leaves a
         one-unit seam of plate showing through mid-column. */
      const h = i === col.length - 1 ? BOX_Y + boxH - y : (boxH * r.n) / n;
      out.push({ key: r.key, x, y, w, h });
      y += h;
    }
  };
  stack(left, L, leftW);
  if (right.length > 0) stack(right, L + leftW, W - leftW);
  return out;
}

/** A region's PAINTED rect — the block inset by half the grout on every side,
 *  so two neighbours leave one full channel of plate between them. */
export const innerOf = (b: SubstrateBlock) => ({
  x: b.x + GROUT / 2,
  y: b.y + GROUT / 2,
  w: b.w - GROUT,
  h: b.h - GROUT,
});

/** A region's own text column. */
export const measureOf = (b: SubstrateBlock) => innerOf(b).w - PAD_IN * 2;

/** Characters that fit a measure at a size — the one place this arithmetic
 *  lives, so the drawing cannot wrap against a budget it invented. */
const charsFor = (measure: number, fs: number, track: number) =>
  Math.max(1, Math.floor(measure / (fs * (0.6 + track))));

/** The paragraph's wrap for a region, in one place — the renderer and the spec
 *  emitter must agree on the line count or the head is sized for a drawing
 *  nobody is painting. */
export const paraOf = (meaning: string, b: SubstrateBlock) =>
  wrapLines(meaning, charsFor(measureOf(b), FS.gloss, TRACK.gloss), PARA_MAX);

/** Head height is derived from the paragraph, so a region's band is exactly as
 *  tall as what it carries and every unit left over goes to the material. */
export const headHeight = (paraLines: number) => B_PARA + (paraLines - 1) * PARA_STEP + HEAD_PAD;

/** Where each zone of one region sits. Pure. */
export function regionGeometry(b: SubstrateBlock, paraLines: number) {
  const r = innerOf(b);
  const headH = headHeight(paraLines);
  const bodyY = r.y + headH;
  const tickBase = r.y + r.h - 12;
  return { ...r, headH, bodyY, tickBase, fieldH: Math.max(0, tickBase - TICK_BAND - bodyY) };
}

/**
 * WHAT THIS DRAWING LETTERS, declared so `pda-substrate-fit` can measure the
 * drawing's own inputs rather than re-deriving them.
 *
 * ⚠ **A LETTERED STRING MISSING FROM THIS LIST IS A DEFECT IN THE DRAWING.**
 * Reading 03 had no fit guard at all before the pin grid, which is how "8
 * TEAMS" lived on the public page for months — a string composed at render time
 * is outside every content scanner.
 */
export function substrateLettering(record: {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
}): LetterSpec[] {
  const rows = substrateRows(record.shapes, record.skills);
  const blocks = new Map(substrateBlocks(rows, SUBSTRATE_LAYOUT_0.boxH).map((b) => [b.key, b]));
  const counts = new Map(rows.map((r) => [r.key, r.n]));
  const out: LetterSpec[] = [];

  for (const s of record.shapes) {
    const b = blocks.get(s.key);
    if (!b) continue;
    const m = measureOf(b);

    out.push({
      slot: `${s.key}.name`,
      text: s.name,
      fs: FS.name,
      /* The count sits on the same line, right-aligned, so the name's measure
         is the region's column less that numeral's. */
      track: TRACK.name,
      measure: m - 44,
    });
    out.push({
      slot: `${s.key}.count`,
      text: String(counts.get(s.key) ?? 0).padStart(2, "0"),
      fs: FS.key,
      track: TRACK.key,
      measure: 44,
    });

    const lines = paraOf(s.meaning, b);
    for (const [i, line] of lines.entries()) {
      out.push({
        slot: `${s.key}.para.${i}`,
        text: line,
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: m,
      });
    }

    /* ⚠ THE WRAP MUST NOT HAVE SLICED. `wrapLines` truncates at its cap and
       returns quietly, so a paragraph that outgrows PARA_MAX loses its tail
       from the drawing AND from this list, and every per-line assertion still
       passes. Declaring the remainder at measure 0 is how reading 02 makes that
       failure loud — and prose is the content most likely to grow past a cap
       after the fact. */
    const kept = lines.join(" ").length;
    if (kept < s.meaning.length) {
      out.push({
        slot: `${s.key}.para.sliced`,
        text: s.meaning.slice(kept).trim(),
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: 0,
      });
    }
  }

  return out;
}

export function ViewSubstrate({
  shapes,
  skills,
  lit,
  onLit,
  still,
  layout,
}: {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  layout: SubstrateLayout;
}) {
  const rows = substrateRows(shapes, skills);
  const blocks = substrateBlocks(rows, layout.boxH);
  const byKey = new Map(shapes.map((s) => [s.key as string, s]));
  const counts = new Map(rows.map((r) => [r.key, r.n]));
  const outer = housing(L, BOX_Y, W, layout.boxH, OUTER_CUT);

  return (
    <>
      <defs>
        <clipPath id="pda-sub-outer">
          <path d={outer} />
        </clipPath>
      </defs>

      {/* ONE PLATE under the whole drawing, so the regions divide a surface
          rather than each bringing their own — and so the grout has something
          to show. */}
      <path d={outer} fill="var(--pda-void)" />

      <g clipPath="url(#pda-sub-outer)">
        {blocks.map((b, i) => {
          const s = byKey.get(b.key);
          if (!s) return null;
          const paraLines = paraOf(s.meaning, b);
          const geo = regionGeometry(b, paraLines.length);
          const plates = skillsOf(skills, b.key);
          const isLit = lit === b.key;
          const clipId = `pda-sub-${b.key}`;

          return (
            <g
              className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
              key={b.key}
              style={still ? undefined : { animationDelay: `${i * 44}ms` }}
              onMouseEnter={() => onLit(b.key)}
              onMouseLeave={() => onLit(null)}
            >
              {/* The region's lift, alternating by rank. ⚠ It is drawn on the
                  INNER rect, which is what opens the grout channel. ⚠ And it is
                  a FILL, however faint — an SVG shape with no fill hit-tests on
                  its stroke alone, the class of bug ADR-069 found on the
                  person-led cartridges. */}
              <rect
                x={geo.x}
                y={geo.y}
                width={geo.w}
                height={geo.h}
                fill="rgba(var(--dawn-rgb), 0.03)"
                fillOpacity={i % 2 === 0 ? 1 : 0.45}
              />

              {/* THE MATERIAL — wall to wall inside its own region. ⚠ The clip
                  lives in the group's own space at the origin; a
                  `userSpaceOnUse` clip resolves in the REFERENCING element's
                  coordinate system, so absolute coordinates land at twice the
                  translate. ⚠ `p` is passed EXPLICITLY: it is `validation`'s
                  lattice PITCH and a loop step in that painter. */}
              {geo.fieldH > 16 && isFormKey(b.key) ? (
                <>
                  <clipPath id={clipId}>
                    <rect x={0} y={0} width={geo.w} height={geo.fieldH} />
                  </clipPath>
                  <g
                    transform={`translate(${geo.x} ${geo.bodyY})`}
                    clipPath={`url(#${clipId})`}
                    opacity="0.55"
                  >
                    <FormField
                      form={b.key}
                      w={geo.w}
                      h={geo.fieldH}
                      seed={13 + i * 7}
                      k={densityFor(geo.w, geo.fieldH)}
                      p={14}
                    />
                  </g>
                </>
              ) : null}

              {/* THE HEAD — opaque, so the copy never sits on the field, and
                  one step stronger than the region's lift so the top of every
                  region is the second thing that finds its edge. */}
              <rect
                x={geo.x}
                y={geo.y}
                width={geo.w}
                height={geo.headH}
                fill="rgba(var(--dawn-rgb), 0.08)"
              />
              <text
                x={geo.x + PAD_IN}
                y={geo.y + B_NAME}
                fontSize={FS.name}
                fontWeight={700}
                letterSpacing=".08em"
                fill={isLit ? "var(--pda-hot)" : "var(--pda-txt)"}
              >
                {s.name}
              </text>
              <text
                x={geo.x + geo.w - PAD_IN}
                y={geo.y + B_NAME}
                textAnchor="end"
                fontSize={FS.key}
                letterSpacing=".18em"
                fill="var(--pda-ink)"
              >
                {String(counts.get(b.key) ?? 0).padStart(2, "0")}
              </text>

              {/* THE PARAGRAPH — the one thing on this console that is prose.
                  Sentence case on purpose: the rest of the surface shouts
                  because it is chrome, and this is the part meant to be READ. */}
              {paraLines.map((line, k) => (
                <text
                  key={line}
                  x={geo.x + PAD_IN}
                  y={geo.y + B_PARA + k * PARA_STEP}
                  fontSize={FS.gloss}
                  letterSpacing=".08em"
                  fill="var(--pda-txt2)"
                >
                  {line}
                </text>
              ))}

              {/* THE GRADUATION — the tally under the material it measures. The
                  first encode runs longer and takes green; with the exemplar's
                  name gone it is the only thing pointing at it, which is the
                  accent doing its job unassisted. */}
              {plates.map((plate, k) => {
                const first = Boolean(plate.flagship);
                const hgt = first ? TICK_FLAG_H : TICK_H;
                return (
                  <rect
                    key={plate.id}
                    x={geo.x + PAD_IN + k * TICK_PITCH}
                    y={geo.tickBase - hgt}
                    width={2}
                    height={hgt}
                    fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={first ? 1 : 0.6}
                  />
                );
              })}

              {/* The lit edge. A stroke that appears on hover is a STATE; a
                  stroke that is always there is a frame around a card, which is
                  the read this drawing exists to avoid. */}
              {isLit ? (
                <rect
                  x={geo.x}
                  y={geo.y}
                  width={geo.w}
                  height={geo.h}
                  fill="none"
                  stroke="var(--pda-hot)"
                />
              ) : null}
            </g>
          );
        })}
      </g>

      {/* The one cut, stroked over the clip so the outer edge stays crisp. */}
      <path d={outer} fill="none" stroke="var(--pda-hair2)" />
      <line
        x1={L}
        y1={BOX_Y + 1}
        x2={L + W - OUTER_CUT}
        y2={BOX_Y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
    </>
  );
}
