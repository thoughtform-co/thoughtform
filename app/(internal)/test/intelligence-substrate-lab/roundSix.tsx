import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import { FormField } from "@/components/landing/home-v2/services/casefile/map/pda/substrateForms";

import { SAMPLE_SKILLS, type SampleSkill, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, TRACK, adv, type LetterSpec } from "./substrateKit";
import type { IslRecord } from "./variants";

/**
 * ROUND SIX's shared slice — what all five directions letter, derived once.
 *
 * ⚠ THE LAW THIS KIT EXISTS TO ENFORCE: **the definition leads, mass modifies
 * it, the Skills are texture.** Twenty directions failed at one of the two
 * ends — the incumbent buries its gloss in a foot under a roster, round five
 * dropped the gloss to make room for mass — so the five facts are derived in
 * ONE place and every direction letters the same set. A direction that
 * re-types them has become a content fork, which is the config lab's own
 * recorded lesson.
 *
 * The five facts, in the order the reader gets them:
 *
 *   name         what the shape is called
 *   gloss        WHAT IT MEANS — the subject, and the thing that has to letter
 *                at reading size rather than at the floor
 *   evalMethod   what "good" is tested against. New to the record this pass,
 *                and the first thing on this surface that answers the owner's
 *                own word for a substrate. Lettered as a GOLD KEY — gold is
 *                wayfinding, and this is the field a reader navigates by
 *   count        how many Skills hold to it
 *   flagship     one exemplar, so the reading is never purely abstract
 *
 * ⚠ **MASS COMES FROM THE FIXTURE, NOT FROM `record.skills`.** The fit test
 * builds an `IslRecord` from `crossing()` alone — no `skills`, no
 * `selectedWork` — so a direction reading `record.skills` is a direction the
 * guard walks with an empty roster and passes vacuously. `shape.skills` and
 * the fixture agree by assertion (`substrate-lab-fit`), so this reads the
 * fixture for both the count and the exemplar's name.
 *
 * ⚠ **THE FLAGSHIP TAKES A GREEN MARK AND KEEPS ITS INK.** Lettering it in
 * `--pda-grn-ink` against siblings at `--pda-txt` makes the one thing the
 * drawing means to point at the DIMMEST thing on it — production learned this
 * on the plate stack (`PdaSubstrate.tsx`) and round five re-introduced it on
 * three directions. One signal per object: the accent carries the state, the
 * label stays at full strength.
 */

export interface RoundSixPattern {
  key: string;
  /** Already uppercased by `crossing()`. */
  name: string;
  gloss: string;
  evalMethod: string;
  /** Encoded Skills in this pattern. */
  n: number;
  /** Zero-padded, because a two-digit column that jumps to one digit jitters. */
  nn: string;
  /** `n / 47` — the share every continuous encoding is derived from. */
  share: number;
  skills: readonly SampleSkill[];
  flagship: SampleSkill | undefined;
  /** The flagship's index in `skills`, or -1. Directions that draw a run of
   *  marks need the POSITION, not just the record. */
  flagshipIdx: number;
  /**
   * The same Skills with the FIRST ENCODE FIRST.
   *
   * ⚠ A RUN OF MARKS READS LEFT TO RIGHT AS AN ORDER, AND THE FIXTURE'S ORDER
   * IS ALPHABETICAL BY TEAM — which is not an order this drawing means. Left
   * in fixture order the green mark lands wherever the flagship happens to
   * sit (Validation's fell in the middle of its run), so the drawing says
   * "the fourth one is special" where the record says "this one came first
   * and the rest followed". Every direction that draws a RUN uses this;
   * directions that draw an unordered field do not care.
   */
  ordered: readonly SampleSkill[];
}

/** The estate. Derived, never authored — the pin grid's own rule. */
export const totalOf = (rows: readonly RoundSixPattern[]) => rows.reduce((n, r) => n + r.n, 0);

/** The record's five shapes, sliced against the fixture. Pure. */
export function patterns(record: IslRecord): RoundSixPattern[] {
  const rows = record.shapes.map((shape) => {
    const key = shape.key as SubstrateSkillPattern;
    const skills = SAMPLE_SKILLS.filter((s) => s.substrate === key);
    const flagshipIdx = skills.findIndex((s) => s.cut);
    const ordered =
      flagshipIdx > 0
        ? [skills[flagshipIdx], ...skills.filter((_, i) => i !== flagshipIdx)]
        : skills;
    return {
      ordered,
      key: shape.key,
      name: shape.name,
      gloss: shape.gloss,
      evalMethod: shape.evalMethod,
      n: skills.length,
      nn: String(skills.length).padStart(2, "0"),
      share: 0,
      skills,
      flagship: flagshipIdx >= 0 ? skills[flagshipIdx] : undefined,
      flagshipIdx,
    };
  });
  const total = totalOf(rows);
  for (const r of rows) r.share = total > 0 ? r.n / total : 0;
  return rows;
}

/** Ranked heaviest-first. Two directions read as a ranking and must not
 *  re-sort by hand — `byMass` sorts `PdaShape`, which these are not. */
export const ranked = (rows: readonly RoundSixPattern[]) => [...rows].sort((a, b) => b.n - a.n);

/** Characters that fit a measure at a size — the one place this arithmetic
 *  lives, so a direction cannot wrap against a per-line budget it invented. */
export const charsFor = (measure: number, fs: number, track: number) =>
  Math.max(1, Math.floor(measure / adv(fs, track)));

/* ── The lettering, declared once ───────────────────────────────────────── */

export interface RoundSixMeasures {
  name: number;
  count: number;
  gloss: number;
  evalMethod: number;
  flagship: number;
  /** Lines the gloss may take. 1 where the column is full-width. */
  glossLines: number;
}

/**
 * Every string a round-six direction letters, at the measures it letters them
 * against. `substrate-lab-fit` walks this — a lettered string missing here is
 * a defect in the drawing, not a gap in the guard.
 *
 * ⚠ THE GLOSS IS DECLARED PER WRAPPED LINE. Declaring the whole sentence
 * against the column would fail every direction; declaring only the first line
 * would let a sliced tail through silently. `wrapLines` slices at the cap, so
 * a gloss that needs more lines than it is given loses its end with nothing on
 * screen to say so.
 */
export function patternSpecs(
  record: IslRecord,
  /* ⚠ A FUNCTION, not just an object, because two directions give each pattern
     a DIFFERENT column. Mosaic's blocks are area-proportional and Grade's
     bands are depth-proportional, so one shared measure would be checking the
     narrowest block against the widest block's budget — which passes, and
     lets the narrow one overflow in silence. */
  measures: RoundSixMeasures | ((p: RoundSixPattern) => RoundSixMeasures)
): LetterSpec[] {
  const out: LetterSpec[] = [];
  for (const p of patterns(record)) {
    const m = typeof measures === "function" ? measures(p) : measures;
    out.push({
      slot: `${p.key}.name`,
      text: p.name,
      fs: FS.name,
      track: TRACK.name,
      measure: m.name,
    });
    out.push({
      slot: `${p.key}.count`,
      text: p.nn,
      fs: FS.key,
      track: TRACK.key,
      measure: m.count,
    });

    const per = charsFor(m.gloss, FS.gloss, TRACK.gloss);
    const lines = wrapLines(p.gloss, per, m.glossLines);
    for (const [i, line] of lines.entries()) {
      out.push({
        slot: `${p.key}.gloss.${i}`,
        text: line,
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: m.gloss,
      });
    }
    /* ⚠ THE WRAP MUST NOT HAVE SLICED. `wrapLines` truncates at its cap and
       returns quietly, so the tail vanishes from the drawing AND from this
       spec list — every per-line assertion then passes on a sentence that is
       missing its end. Declaring the dropped remainder at measure 0 is how
       reading 02 makes that failure loud. */
    const kept = lines.join(" ").length;
    if (kept < p.gloss.length) {
      out.push({
        slot: `${p.key}.gloss.sliced`,
        text: p.gloss.slice(kept).trim(),
        fs: FS.gloss,
        track: TRACK.gloss,
        measure: 0,
      });
    }

    out.push({
      slot: `${p.key}.eval`,
      text: p.evalMethod,
      fs: FS.chrome,
      track: TRACK.chrome,
      measure: m.evalMethod,
    });
    if (p.flagship) {
      out.push({
        slot: `${p.key}.flagship`,
        text: p.flagship.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure: m.flagship,
      });
    }
  }
  return out;
}

/** One mark per encoded Skill — the round-five guard, kept for the three
 *  directions that draw countable marks. */
export const markCountOf = (key: string) => SAMPLE_SKILLS.filter((s) => s.substrate === key).length;

/* ── The physics field, clipped ─────────────────────────────────────────── */

/**
 * A pattern's own material, painted into a box and clipped to it.
 *
 * ⚠ THE CLIP RECT LIVES INSIDE THE TRANSLATE. `clipPath` resolves in the user
 * space of the element that REFERENCES it, so a rect authored in crop
 * coordinates and applied to an already-translated group clips the wrong box.
 *
 * ⚠ AND THE ALPHA IS SET AGAINST THE RENDERED DRAWING, NOT THE 1:1 CANVAS
 * (ADR-070 U11). At the binding preset's meet a hairline paints 0.65 device px
 * and the browser pays the rest in alpha, so a field authored at the density
 * that looks right full-size arrives invisible. This is texture behind type:
 * it may never compete with the gloss sitting on it.
 */
export function Field({
  form,
  x,
  y,
  w,
  h,
  seed,
  k = 1,
  p,
  opacity = 0.42,
  clip,
}: {
  form: SubstrateSkillPattern;
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  k?: number;
  /**
   * The LATTICE PITCH, passed through to `FormField` — `validation`'s only,
   * and a loop STEP there.
   *
   * ⚠ LEAVE IT UNDEFINED TO GET THE PAINTER'S OWN DEFAULT. It used to default
   * to 0 here, which is not "no inset" (the name it carried) but a zero step:
   * `validation` hung on `x += 0` and mosaic / grade / tanks / stack never
   * mounted at all. A pass-through must not invent a default the painter it
   * forwards to would have supplied — `undefined` is the only value that lets
   * the destructuring default fire.
   */
  p?: number;
  opacity?: number;
  /** An optional silhouette, in the FIELD'S OWN space (origin at its
   *  top-left), for a field that has to take the shape of what holds it. */
  clip?: string;
}) {
  if (w <= 0 || h <= 0) return null;
  const id = `r6-fld-${form}-${seed}`;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <defs>
        <clipPath id={id}>{clip ? <path d={clip} /> : <rect width={w} height={h} />}</clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <FormField form={form} w={w} h={h} seed={seed} k={k} p={p} />
      </g>
    </g>
  );
}
