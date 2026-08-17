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
 * holding its own named Skills.
 *
 * ## The claim
 *
 * ONE PLATE, DIVIDED — not five cards collected. The crop is partitioned with
 * no gutters, area proportional to the Skill count, and the whole thing takes a
 * single outer cut, so Pattern's fourteen occupies nearly three times
 * Stakeholder's five. Each region is HEAD · PLATES · BED: its name and the
 * count, one sentence saying what that substrate MEANS, then every encoded
 * Skill as a named plate in two columns, all of it standing on the pattern's
 * own physics field.
 *
 * **The size difference is carried three ways, all derived from one number:**
 * the region's AREA is the gestalt, the plate run is the tally you can count,
 * and the numeral is the exact figure. That is not the surface saying one thing
 * three times — the Skill count IS the subject of this reading.
 *
 * ⚠ **A GUTTER IS A STATEMENT ABOUT HOW MANY THINGS THERE ARE.** Take the
 * gutters away and the same five rectangles stop being objects and become
 * REGIONS of one surface, which is the claim this reading actually makes: one
 * intelligence layer, five recurring shapes. That is why the partition is
 * derived rather than authored, why there is one cut on the outer boundary
 * only, and why chamfering each region is banned — five machined housings would
 * undo the whole paragraph above.
 *
 * ## What it replaces, and the trade that was wrong
 *
 * ADR-070 U16's five pattern cards were `housing()` five times in a row — i.e.
 * reading 01's grid at n = 5 — which broke the owner's standing constraint that
 * this reading may not look like the work tab. U23 fixed the composition and
 * ALSO deleted the 47 named Skill plates, replacing them with a tick
 * graduation, on the argument that the roster ships one casefile row away.
 *
 * ⚠ **THAT SECOND HALF WAS THE WRONG TRADE, AND U24 REVERSES IT** (owner,
 * 2026-08-17). The count survived the deletion; the DENSITY did not. Readings
 * 01 and 02 are a field of cartridges and a board of modules — both thick with
 * named parts — and 03 became three strings over texture, which is precisely
 * why it read as a different machine beside them. Ticks are countable; plates
 * are countable AND readable, and they give a region something to be full of.
 *
 * ⚠ **THE GRADUATION IS DELETED WITH THEIR RETURN.** Keeping both would encode
 * the Skill count a third time in marks alone, beside a numeral that already
 * states it. Its 26 units go to the body, and that is what makes the lightest
 * region's arithmetic close.
 *
 * ⚠ **THE 5 × 8 CROSSING REMAINS GONE** (owner, 2026-08-13). `crossing()` still
 * projects it and its arithmetic is still guarded; it cannot come back inside a
 * region, because eight department codes need ~196 units of lettering and marks
 * without codes need a legend, which this surface bans.
 *
 * ## The copy
 *
 * ⚠ **FOUR LETTERED THINGS PER REGION** — name, count, paragraph, and one label
 * per Skill. `gloss` and `evalMethod` are still not drawn: the paragraph
 * (`PdaShape.meaning`) replaced them in U23 and is the only prose on this
 * console, stored in sentence case because mono caps at 13 units is the least
 * readable thing a paragraph can be.
 *
 * ⚠ **A SKILL'S LABEL IS `short`, AUTHORED AT ≤14 CHARS, NEVER `name` CLIPPED.**
 * Truncating "Legal Risk Methodology" gives "Legal Risk Met" on a client page.
 *
 * ⚠ **THE FLAGSHIP TAKES THE ACCENT, NOT THE INK.** Its plate's accent bar goes
 * green at full weight against its siblings' amber at .55; lettering it in
 * `--pda-grn-ink` against every sibling's `--pda-txt` would make the one plate
 * the drawing means to point at the DIMMEST thing in the run — the highlight
 * rendered as de-emphasis. One signal per object.
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
 * the plate and is what the eye reads as one surface divided.
 *
 * ⚠ 10, NOT 4 (owner, 2026-08-17: the boxes sat too close). Four units paints
 * ~2.6px at the binding preset, which is findable but reads as a seam rather
 * than as air; ten is ~6.5px there and ~9px at 1920. Still an order of
 * magnitude under a gutter — mosaic's own banned value is 20 BETWEEN OBJECTS,
 * and this channel belongs to the plate underneath.
 */
const GROUT = 10;

/* ── The zones, all derived from the type ───────────────────────────────── */

/** The title's baseline. ⚠ 32, not 22 (owner, 2026-08-17: the title sat too
 *  close to the top). The region's own top edge is already half a grout in from
 *  the block, so this is the only lever on the head's top air. */
const B_NAME = 32;
/** The paragraph's first baseline, and its leading. */
const B_PARA = 58;
/**
 * ⚠ 18, AND 17 IS A COIN FLIP ON A FONT METRIC. An fs-13 line box measures
 * ~16.8 units — the em box, ascender to descender, not the ink — so a 17 pitch
 * clears by 0.2 against the smoke's 0.5-unit overlap gate. This is the same
 * arithmetic that made `GLOSS_LINE_BOX` 17 rather than 15 for fs 12.
 */
const PARA_STEP = 18;
/**
 * ⚠ THREE, AND IT IS A BELT RATHER THAN A TARGET. Every `meaning` on the record
 * wraps to two lines in the NARROWER column; the third exists so a later edit
 * overflows into space that is there, and `substrateLettering` declares any
 * tail past it at measure 0 so a silent slice fails loudly instead.
 *
 * ⚠ AND A THIRD LINE OVERFLOWS THE LIGHTEST REGION. Stakeholder's body is 56.7
 * units at rest against a 54-unit plate stack; a third paragraph line costs 18
 * and puts the stack through the floor. `pda-substrate-fit` walks the ACTUAL
 * wrap for exactly this reason.
 */
const PARA_MAX = 3;
/** Air under the last paragraph line, before the plates start. */
const HEAD_PAD = 11;

/**
 * THE PLATE GRID — one named plate per encoded Skill, in two columns.
 *
 * ⚠ **THIS IS WHAT MAKES A REGION AN INSTRUMENT RATHER THAN A POSTER** (owner,
 * 2026-08-17). U23 replaced the 47 named plates with a tick graduation on the
 * argument that the roster lives one casefile row away. The count survived; the
 * DENSITY did not. Readings 01 and 02 are a field of cartridges and a board of
 * modules — both thick with named parts — and 03 became three strings over
 * texture, which is why it read as a different machine.
 *
 * ⚠ **AND THE GRADUATION IS DELETED WITH ITS RETURN.** The plates are countable
 * and readable; ticks are only countable. Keeping both would encode the Skill
 * count a third time (area, plates, ticks) beside a numeral that already states
 * it. Its 26 units go to the body, and that is what makes the lightest region's
 * arithmetic close.
 *
 * ⚠ **TWO COLUMNS, NOT A DERIVED COUNT.** Three columns fit the two wide
 * regions and not the three narrow ones (a 14-character `short` measures 114.2u
 * and a third column leaves 117.1u before the accent and its gap), so a derived
 * column count would draw two different objects on one plate. One number,
 * everywhere.
 */
const PLATE_COLS = 2;
const PLATE_PITCH = 18;
const PLATE_H = 16;
const PLATE_GAP = 12;
/** The accent bar — amber, green on the pattern's first encode. */
const ACCENT_W = 3;
/** Accent → label, and the label's right margin inside its column. */
const LABEL_GAP = 6;
const LABEL_MARGIN = 6;
/** Air under the plate stack, at the region's floor. */
const BODY_PAD = 12;

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

/**
 * Where each zone of one region sits, and where its plates seat. Pure.
 *
 * ⚠ THE BED IS THE WHOLE BODY, not a zone under the plates. U23 gave the field
 * its own band between the copy and the graduation, which meant the LIGHTEST
 * region — smallest by construction, since area is the count — had the least
 * room for it. Spanning the body puts the drawing on reading 02's register
 * (opaque modules on a faint bed) and removes the tension entirely: the plates
 * are objects ON the material rather than neighbours of it.
 */
export function regionGeometry(b: SubstrateBlock, paraLines: number, n = 0) {
  const r = innerOf(b);
  const headH = headHeight(paraLines);
  const bodyY = r.y + headH;
  const bodyH = Math.max(0, r.y + r.h - BODY_PAD - bodyY);
  const colW = (r.w - PAD_IN * 2 - PLATE_GAP * (PLATE_COLS - 1)) / PLATE_COLS;
  const rows = Math.ceil(n / PLATE_COLS);
  const stackH = rows * PLATE_PITCH;
  return {
    ...r,
    headH,
    bodyY,
    bodyH,
    colW,
    rows,
    /** What the stack claims of the body. The rest is bed, showing ABOVE it. */
    stackH,
    /** The run's top edge — seated at the region's floor. See `plateAt`. */
    stackTop: r.y + r.h - BODY_PAD - stackH,
    /** The measure a `short` label has inside its column. */
    labelMeasure: colW - ACCENT_W - LABEL_GAP - LABEL_MARGIN,
  };
}

/**
 * One plate's box, by index down the columns.
 *
 * ⚠ COLUMN-MAJOR: the run reads top-to-bottom then across, so a region's first
 * encode is its first plate and the green accent lands where the eye starts.
 *
 * ⚠ **THE RUN IS SEATED AT THE REGION'S FLOOR, NOT HUNG FROM ITS HEAD.** Area
 * is the count and the plate run is the count, but the head is a FIXED cost —
 * so hanging the run under the paragraph leaves the heaviest regions with a
 * band of bare field beneath their plates (140 units under Pattern at rest)
 * while the lightest is packed. Top-anchored, that band reads as a hole; seated,
 * it reads as the material the plates settled out of, every region's plates
 * land on one edge, and the reading is EXTRACTION rather than a list that ran
 * short. The band still varies with region size, which is honest — more area is
 * more of that substrate.
 */
export function plateAt(geo: ReturnType<typeof regionGeometry>, k: number) {
  const col = Math.floor(k / geo.rows);
  const row = k % geo.rows;
  return {
    x: geo.x + PAD_IN + col * (geo.colW + PLATE_GAP),
    y: geo.stackTop + row * PLATE_PITCH,
    w: geo.colW,
    h: PLATE_H,
  };
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
    const n = counts.get(s.key) ?? 0;

    out.push({
      slot: `${s.key}.name`,
      text: s.name,
      fs: FS.name,
      /* The count sits on the same line, right-aligned, so the name's measure
         is the region's column less that numeral's. */
      track: TRACK.name,
      measure: m - 56,
    });
    /* ⚠ THE COUNT LETTERS AT THE TITLE'S SIZE (owner, 2026-08-17: the size
       difference between substrates has to read). It is the reference's own
       move — "PATTERN / 14 SKILLS" — and it is the third of three reads that
       all derive from one number: the region's AREA is the gestalt, the plate
       run is the tally, and this is the exact figure. Three reads of one fact
       is not the surface saying it three times; the fact is the subject. */
    out.push({
      slot: `${s.key}.count`,
      text: String(n).padStart(2, "0"),
      fs: FS.name,
      track: TRACK.key,
      measure: 56,
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

    /* ⚠ THE 47 SKILL LABELS ARE THE LARGEST BLOCK OF LETTERING ON THIS CONSOLE,
       and they are content the drawing did not author and cannot shorten. Each
       is `short` — AUTHORED at ≤14 characters, never `name` truncated, because
       clipping "Legal Risk Methodology" gives "Legal Risk Met" on a client
       page. The measure is the plate's own column, not the region's. */
    const geo = regionGeometry(b, lines.length, n);
    for (const plate of skillsOf(record.skills, s.key)) {
      out.push({
        slot: `skill.${plate.id}`,
        text: plate.short,
        fs: FS.chrome,
        track: TRACK.name,
        measure: geo.labelMeasure,
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
          const plates = skillsOf(skills, b.key);
          const geo = regionGeometry(b, paraLines.length, plates.length);
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
              {geo.bodyH > 16 && isFormKey(b.key) ? (
                <>
                  <clipPath id={clipId}>
                    <rect x={0} y={0} width={geo.w} height={geo.bodyH} />
                  </clipPath>
                  <g
                    transform={`translate(${geo.x} ${geo.bodyY})`}
                    clipPath={`url(#${clipId})`}
                    opacity="0.5"
                  >
                    <FormField
                      form={b.key}
                      w={geo.w}
                      h={geo.bodyH}
                      seed={13 + i * 7}
                      k={densityFor(geo.w, geo.bodyH)}
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
              {/* THE COUNT, at the title's own size. ⚠ The size difference
                  between substrates has to READ (owner, 2026-08-17), and area
                  alone is a gestalt — a reader sees that Pattern dwarfs
                  Stakeholder and cannot see 14 against 5. This is the exact
                  figure beside the tally the plates draw. */}
              <text
                x={geo.x + geo.w - PAD_IN}
                y={geo.y + B_NAME}
                textAnchor="end"
                fontSize={FS.name}
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

              {/* THE PLATES — one per encoded Skill, named, in two columns on
                  the material they came out of. Fourteen of these ARE the mass;
                  five of them are a short run, and that is the size difference
                  a reader can count rather than estimate.

                  ⚠ THE GROUND IS OPAQUE. The bed runs behind the whole body, so
                  a translucent plate would let the field through its own label —
                  the "dust on the type" the card stack paid for.

                  ⚠ THE LABEL DOES NOT TAKE THE GREEN, THE ACCENT DOES.
                  Lettering the first encode in `--pda-grn-ink` against every
                  sibling's `--pda-txt` makes the one plate the drawing means to
                  point at the DIMMEST thing in the run. One signal per object. */}
              {plates.map((plate, k) => {
                const p = plateAt(geo, k);
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
