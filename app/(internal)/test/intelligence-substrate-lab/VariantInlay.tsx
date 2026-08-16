import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import type { SubstrateSkillPattern } from "./sampleSkills";
import { CROP_H, FS, L, W, housing, type LetterSpec } from "./substrateKit";
import { Field, type RoundSixPattern, charsFor, markCountOf, patterns } from "./roundSix";
import { type MosaicBlock, mosaicBlocks } from "./VariantMosaic";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 33 · INLAY — mosaic's division, with the material actually in it, and the
 * copy cut to a title and one paragraph.
 *
 * The owner's read on 22 (2026-08-16): the composition is right, the surface
 * is too thin — it wants the texture of 8 `gallery` or 11 `cards`. Then, on
 * this drawing's first cut: make the copy SUPER SIMPLE — the substrate's title
 * and nothing else, moved up, with a paragraph under it that concisely
 * explains what it means.
 *
 * Where each half comes from:
 *
 *   from mosaic    the PARTITION, unchanged and IMPORTED rather than re-typed
 *                  (`mosaicBlocks`). Area is the Skill count, there are no
 *                  gutters, and the whole plate takes one outer cut — so the
 *                  five regions stay REGIONS OF ONE SURFACE rather than five
 *                  cards, which is mosaic's entire argument
 *   from gallery   the FIELD AT FULL DENSITY, filling the region's body
 *                  instead of the leftover box under the type
 *   from cards     the rule that the field sits BESIDE the type, never behind
 *                  it — an opaque head, and material below it
 *
 * ⚠ THREE LETTERED THINGS LEFT WITH THE OWNER'S CUT, AND ONE OF THEM IS NEW.
 * `gloss`, `evalMethod` and the flagship's name are no longer drawn. The
 * `evalMethod` is the field ADR-070 U19 added to the record one round earlier,
 * so dropping it here is a deliberate reversal on THIS drawing and not an
 * oversight — the round-six law that every direction letters five facts is
 * what the owner overruled, on the grounds that five stacked fragments is not
 * something anybody reads. What replaces them is ONE paragraph in plain
 * sentences, which is the first prose on this reading.
 *
 * ⚠ THE FLAGSHIP SURVIVES AS A MARK, NOT AS A NAME. Its tick still runs longer
 * and takes green in the graduation; only the label went. Round six's own rule
 * — the accent carries the signal, the label stays at full ink — is satisfied
 * by dropping the label rather than by dimming it.
 *
 * ⚠ THE PARAGRAPHS ARE LAB COPY, and that is a promotion cost worth naming.
 * The record's `gloss` is a definitional FRAGMENT ("What good means under
 * ambiguity") written to sit in a 148-unit module; it is not a sentence and
 * cannot be made into one by rendering it differently. So these are authored
 * here, in the record's own vocabulary — if this direction wins, they become a
 * field on `CaseMapShape` exactly as `evalMethod` did, and pass into
 * `cases-registry`'s scan with it.
 *
 * ⚠ THE FIELD BLEEDS TO THE REGION'S EDGES. Mosaic insets its field by 16 and
 * drops it to α .34, so every region reads as a tinted box with a smudge in
 * it; here the material runs wall to wall and two neighbouring fields meet ON
 * the hairline. That is what makes the plate read as one surface of five
 * MATERIALS rather than five panels that happen to touch.
 */

export const INLAY_VIEWBOX = "0 0 932 762";

/* ── The box ────────────────────────────────────────────────────────────── */

/** ⚠ MUST MATCH `VariantMosaic`'s `BOX`, because the blocks come from there.
 *  The partition is imported; the frame it is drawn in has to agree with it or
 *  every region is offset from its own ground. */
const BOX = { x: L, y: 26, w: W, h: CROP_H - 52 };
const OUTER_CUT = 26;
const PAD_IN = 16;

/* ── The zones ──────────────────────────────────────────────────────────── */

/** The title, moved up to sit near the region's own top edge (owner). */
const B_NAME = 22;
/** The paragraph's first baseline, and its leading. */
const B_PARA = 46;
const PARA_STEP = 18;
/** ⚠ THREE, AND IT IS A BELT RATHER THAN A TARGET. Every paragraph on the
 *  record wraps to two lines in the NARROWER column; the third exists so a
 *  later edit overflows into space that is there rather than through the wall,
 *  and `inlayLettering` declares any tail past it at measure 0 so a silent
 *  slice fails loudly instead. */
const PARA_MAX = 3;
/** Air under the last paragraph line, before the material starts. */
const HEAD_PAD = 16;

/**
 * The graduation — ONE TICK PER ENCODED SKILL, at ONE PITCH ACROSS ALL FIVE.
 *
 * ⚠ THE PITCH IS SHARED AND FIXED, never fitted to a region's width. A run
 * scaled to fill its own region would make five runs of identical length and
 * encode nothing; at a shared 16 the heaviest pattern's fourteen measure 224
 * units against the narrowest region's 361 of usable width.
 */
const TICK_PITCH = 16;
const TICK_H = 11;
const TICK_FLAG_H = 18;
/** What the run reserves at the region's base, ticks plus their air. */
const TICK_BAND = 26;

/**
 * THE GROUT — what makes a region's edges findable (owner, 2026-08-16: it is
 * not clear where each block starts and ends).
 *
 * ⚠ THE HAIRLINES WERE NOT FAINT, THEY WERE SUB-PIXEL. Each region drew a
 * 1-unit rule on its top and left edge, and at this crop's meet — 0.647 at the
 * binding preset — a 1-unit rule paints 0.65 of a device pixel and the browser
 * pays the remainder in alpha. That is the same arithmetic that made reading
 * 03's stack spine and foot separator into BANDS rather than lines (ADR-070
 * U16), and drawing the division twice as thick would only have restated it.
 *
 * ⚠ AND A GROUT IS NOT A GUTTER, which is the distinction mosaic's whole
 * direction rests on. A gutter is EMPTY SPACE BETWEEN OBJECTS and it is what
 * makes five regions read as five cards — mosaic bans it at 20 units and this
 * inherits that ban. A grout is the SUBSTRATE SHOWING THROUGH between two
 * materials set into it: it belongs to the plate, not to either neighbour, and
 * it is what the eye reads as one surface divided. Four units is ~2.6px at the
 * binding preset and ~3.6px at 1920 — findable, and an order of magnitude
 * under the gutter it must not become.
 *
 * The channel replaces the strokes rather than joining them: a rule drawn
 * inside its own channel is a frame around a card, which is the read this
 * drawing exists to avoid.
 */
const GROUT = 4;

/** A region's PAINTED rect — the block inset by half the grout on every side,
 *  so two neighbours leave one full channel of plate between them and the
 *  outermost regions sit a half-channel inside the housing. */
const innerOf = (b: MosaicBlock) => ({
  x: b.x + GROUT / 2,
  y: b.y + GROUT / 2,
  w: b.w - GROUT,
  h: b.h - GROUT,
});

const measureOf = (b: MosaicBlock) => innerOf(b).w - PAD_IN * 2;

/**
 * WHAT THE SUBSTRATE MEANS, in one concise paragraph.
 *
 * ⚠ Grounded in the record rather than invented: each is its own `gloss` and
 * `evalMethod` said as a sentence, in `MAP_GROUPS`' register (those are
 * already prose — "Applies senior judgment to varied inputs."). Envelope-safe
 * by construction: no person, no team count, no vendor, no figure.
 */
const INLAY_COPY: Record<string, string> = {
  pattern:
    "The shapes the work keeps returning to, so output arrives structured rather than improvised.",
  judgment: "What good means when the inputs vary and the answer is not obvious.",
  validation: "The bar output is checked against, and the cases that make a failure visible.",
  voice: "How the organisation sounds when it speaks, held steady across readers.",
  stakeholder: "Who the work is for, and the framing that reader needs to act on it.",
};

/** ⚠ FALLS BACK TO THE RECORD'S OWN GLOSS rather than rendering blank. A
 *  sixth shape added upstream would otherwise letter a title over nothing. */
const copyFor = (p: RoundSixPattern) => INLAY_COPY[p.key] ?? p.gloss;

/** The paragraph's wrap for a block, in one place — the renderer and the spec
 *  emitter must agree on the line count or the head is sized for a drawing
 *  nobody is painting. */
const paraOf = (p: RoundSixPattern, b: MosaicBlock) =>
  wrapLines(copyFor(p), charsFor(measureOf(b), FS.gloss, 0.08), PARA_MAX);

/** Head height is derived from the paragraph, so a region's band is exactly as
 *  tall as what it carries and every unit left over goes to the material. */
const headHeight = (paraLines: number) => B_PARA + (paraLines - 1) * PARA_STEP + HEAD_PAD;

/**
 * ⚠ DENSITY IS PER UNIT AREA, AND AT A FIXED `k` IT IS NOT.
 *
 * The particle painters (`judgment`, `stakeholder`, `voice`) emit a FIXED mark
 * count scaled by `k`, while the lattice painters tile and fill whatever box
 * they are given. So at one shared `k` the regions disagree: this drawing's
 * largest field is ~123,000 units and its smallest ~15,000, which is eight
 * times the area for the same 300 marks — Judgment reads as an empty region
 * and Stakeholder as a dense one, purely because of how many Skills they have.
 *
 * That is the one thing a single inlaid surface may not do. Region SIZE is
 * already the count; if grain moved with it too, the drawing would encode the
 * same quantity a third time and do it backwards — the biggest pattern would
 * look like the thinnest material.
 *
 * So `k` is the field's own area against a reference, which holds the marks per
 * unit area constant and lets the COUNT scale. Clamped at both ends because a
 * painter's marks stop reading as material below a handful and turn to noise
 * well above the reference.
 */
const K_REF = 96_000;
const densityFor = (w: number, h: number) => Math.min(1.5, Math.max(0.4, (w * h) / K_REF));

export function VariantInlay({ record }: IslVariantProps) {
  const rows = patterns(record);
  const blocks = mosaicBlocks(rows);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  const outer = housing(BOX.x, BOX.y, BOX.w, BOX.h, OUTER_CUT);

  return (
    <>
      <defs>
        <clipPath id="r9-inlay-outer">
          <path d={outer} />
        </clipPath>
      </defs>

      {/* ONE PLATE under the whole inlay, so the regions divide a surface
          rather than each bringing their own. */}
      <path d={outer} fill="var(--pda-void)" />

      <g clipPath="url(#r9-inlay-outer)">
        {blocks.map((b, i) => {
          const p = byKey.get(b.key);
          if (!p) return null;
          const r = innerOf(b);
          const paraLines = paraOf(p, b);
          const headH = headHeight(paraLines.length);
          const bodyY = r.y + headH;
          const tickBase = r.y + r.h - 12;
          const fieldH = Math.max(0, tickBase - TICK_BAND - bodyY);

          return (
            <g key={b.key}>
              {/* The region's own lift, alternating by rank. ⚠ It is drawn on
                  the INNER rect, which is what opens the grout channel: the
                  plate's own ground is what shows between two neighbours. */}
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill="rgba(var(--dawn-rgb), 0.03)"
                fillOpacity={i % 2 === 0 ? 1 : 0.45}
              />

              {/* THE MATERIAL — wall to wall inside its own region, at the
                  field cards' density.
                  ⚠ `p` is passed EXPLICITLY: it is `validation`'s lattice
                  PITCH and a loop step in that painter, so a pass-through that
                  invents its own default (0, once) hangs the render. */}
              <Field
                form={b.key as SubstrateSkillPattern}
                x={r.x}
                y={bodyY}
                w={r.w}
                h={fieldH}
                seed={13 + i * 7}
                k={densityFor(r.w, fieldH)}
                p={14}
                opacity={0.55}
              />

              {/* THE HEAD — opaque, so the copy never sits on the field, and
                  one step stronger than the region's lift so the top of every
                  region is the second thing that finds its edge. */}
              <rect x={r.x} y={r.y} width={r.w} height={headH} fill="rgba(var(--dawn-rgb), 0.08)" />
              <text
                x={r.x + PAD_IN}
                y={r.y + B_NAME}
                fontSize={FS.name}
                fontWeight={700}
                letterSpacing=".08em"
                fill="var(--pda-txt)"
              >
                {p.name}
              </text>
              <text
                x={r.x + r.w - PAD_IN}
                y={r.y + B_NAME}
                textAnchor="end"
                fontSize={FS.key}
                letterSpacing=".18em"
                fill="var(--pda-ink)"
              >
                {p.nn}
              </text>

              {/* THE PARAGRAPH — the one thing on this drawing that is prose.
                  Sentence case on purpose: the rest of the surface shouts
                  because it is chrome, and this is the part meant to be READ. */}
              {paraLines.map((line, k) => (
                <text
                  key={line}
                  x={r.x + PAD_IN}
                  y={r.y + B_PARA + k * PARA_STEP}
                  fontSize={FS.gloss}
                  letterSpacing=".08em"
                  fill="var(--pda-txt2)"
                >
                  {line}
                </text>
              ))}

              {/* THE GRADUATION — the tally under the material it measures.
                  The first encode runs longer and takes green; with the
                  exemplar's NAME gone it is the only thing left pointing at
                  it, which is the accent doing its job unassisted. */}
              {p.ordered.map((skill, k) => {
                const first = k === 0;
                const hgt = first ? TICK_FLAG_H : TICK_H;
                return (
                  <rect
                    key={skill.id}
                    x={r.x + PAD_IN + k * TICK_PITCH}
                    y={tickBase - hgt}
                    width={2}
                    height={hgt}
                    fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={first ? 1 : 0.6}
                  />
                );
              })}
            </g>
          );
        })}

        {/* ⚠ THE INTERNAL HAIRLINES ARE DELETED, NOT THINNED. They drew a
            1-unit rule on each region's top and left edge, which paints 0.65
            of a device pixel at the binding preset — the boundary the owner
            could not find. The GROUT above is the division now: the plate's
            own ground showing between two materials, which is both findable
            and the thing an inlay's edges actually are. Adding a rule back
            inside that channel would frame each region as a card. */}
      </g>

      {/* The one cut, stroked over the clip so the outer edge stays crisp. */}
      <path d={outer} fill="none" stroke="var(--pda-hair2)" />
      <line
        x1={BOX.x}
        y1={BOX.y + 1}
        x2={BOX.x + BOX.w - OUTER_CUT}
        y2={BOX.y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
    </>
  );
}

/* ── LETTERING SPEC, MARK COUNT and MASS ────────────────────────────────── */

/**
 * ⚠ THIS DIRECTION DOES NOT USE `patternSpecs`, AND THAT IS THE OWNER'S CUT
 * RATHER THAN AN ECONOMY. Round six's shared emitter declares five facts per
 * pattern because every round-six direction letters five; this one letters
 * three — name, count, paragraph — so calling the shared emitter would declare
 * two strings the drawing does not paint, and a guard that walks strings which
 * are not on screen is worse than no guard: it passes.
 */
export const inlayLettering = (record: IslRecord): LetterSpec[] => {
  const rows = patterns(record);
  const blocks = new Map(mosaicBlocks(rows).map((b) => [b.key, b]));
  const EMPTY: MosaicBlock = { key: "", x: 0, y: 0, w: 0, h: 0 };
  const out: LetterSpec[] = [];

  for (const p of rows) {
    const b = blocks.get(p.key) ?? EMPTY;
    const m = measureOf(b);

    /* The head is one line shared with the count, so the name's column is what
       the numeral leaves. */
    out.push({ slot: `${p.key}.name`, text: p.name, fs: FS.name, track: 0.08, measure: m - 44 });
    out.push({ slot: `${p.key}.count`, text: p.nn, fs: FS.key, track: 0.18, measure: 44 });

    const lines = paraOf(p, b);
    for (const [i, line] of lines.entries()) {
      out.push({
        slot: `${p.key}.para.${i}`,
        text: line,
        fs: FS.gloss,
        track: 0.08,
        measure: m,
      });
    }

    /* ⚠ THE WRAP MUST NOT HAVE SLICED. `wrapLines` truncates at its cap and
       returns quietly, so a paragraph that outgrows PARA_MAX loses its tail
       from the drawing AND from this list, and every per-line assertion still
       passes. Declaring the remainder at measure 0 is how reading 02 makes
       that failure loud, and prose is exactly the content most likely to grow
       past a cap after the fact. */
    const copy = copyFor(p);
    const kept = lines.join(" ").length;
    if (kept < copy.length) {
      out.push({
        slot: `${p.key}.para.sliced`,
        text: copy.slice(kept).trim(),
        fs: FS.gloss,
        track: 0.08,
        measure: 0,
      });
    }
  }
  return out;
};

/**
 * ONE TICK PER ENCODED SKILL. ⚠ Mosaic exports no `markCount` and says why —
 * it draws no per-Skill mark — so this is the assertion that separates the two
 * drawings mechanically rather than only in prose: a graduation run that
 * drifted off `record.shapes[k].skills` fails here.
 */
export const inlayMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/**
 * AREA is the count, exactly as in mosaic — the partition is the same function.
 * Asserted separately all the same: sharing a helper today is not a promise
 * that a later edit will not give this drawing blocks of its own.
 */
export const inlayMass = (record: IslRecord, key: string): number => {
  const b = mosaicBlocks(patterns(record)).find((x) => x.key === key);
  return b ? b.w * b.h : 0;
};
