import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  FormField,
  isFormKey,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateForms";
import {
  SAMPLE_SKILLS,
  skillsIn,
  type SampleSkill,
  type SubstrateSkillPattern,
} from "./sampleSkills";
import {
  CARD_H,
  CARD_W,
  CARD_Y,
  FS,
  MODULE,
  SUB_VIEWBOX,
  TRACK,
  band,
  cardX,
  housing,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 11 · CARDS — the substrate as extraction, one card per pattern.
 *
 * Round three, second pass. The owner's ruling on the first: _"at the
 * bottom of the vertical cards where we have (SKILLS CUT BY 07 which is
 * meaningless text) just a one-sentence explanation what each substrate
 * MEANS… and then the overview of the skills; I don't want a boring ass
 * text list, use something else."_
 *
 * Two things changed, and they are the whole pass:
 *
 * ⚠ **THE FOOT IS THE MEANING NOW.** `SKILLS 07 · CUT BY CRE` was two
 * numbers and a code — true, and unreadable as a claim. The foot prints
 * the pattern's own GLOSS instead, wrapped: _"HOW THE ORGANISATION
 * SOUNDS IN CONTEXT"_, _"WHAT GOOD MEANS UNDER AMBIGUITY"_. That
 * sentence is what makes a substrate mean something rather than being a
 * word with a count beside it — the same argument ADR-070 U15 made when
 * it ADDED the gloss to the shipped pin grid. The count survives as a
 * numeral in the HEADER, where a number beside a name reads as an
 * inventory rather than as a sentence that failed.
 *
 * ⚠ **THE SKILLS ARE A STACK OF PLATES, NOT A LIST.** Each encoded Skill
 * is a 16-unit slab with an accent at its left edge, stacked from the
 * header down. Fourteen of those accents are a bus and five are a short
 * one — which puts this card in the same hand as reading 02, whose whole
 * vocabulary is docks, lanes and conductors. A left-aligned column of
 * names says "here are some words"; a stack says "these all draw on one
 * thing", which is the sentence the substrate tab exists to make.
 *
 * ⚠ **THE FIELD IS WHAT THE STACK LEAVES, AND IT SITS BELOW.** Cards
 * without their physics field are five identical rectangles told apart
 * by header text alone. Behind the plates at 0.55 it read as dust ON the
 * type; below them it reads as EXTRACTION — the plates are what has been
 * encoded, the field is the material they came out of. Which is why
 * Stakeholder's five showing more raw field than Pattern's fourteen is
 * the drawing making its point rather than a hole in it.
 *
 * ⚠ **THE CUTTER IS ONE ACCENT.** Every plate carries the same 3-unit
 * bar; the pattern's flagship encode takes it in green and takes green
 * ink on the label. One mark, one meaning — the shipped `CUT BY` grammar
 * carried down from the district level to the Skill level.
 */

export const CARDS_VIEWBOX = SUB_VIEWBOX;

/* ── The card's own vertical chain ─────────────────────────────────────
   ⚠ THIS CARD DOES NOT USE `FormCard`. The shared component's foot is a
   two-cell key/value row (SKILLS · CUT BY) and this pass replaces the
   foot entirely with a wrapped sentence — so the card is drawn here,
   from the same `housing` / `band` / `MODULE` primitives, at the same
   footprint (CARD_W × CARD_H at cardX(i)) so it can be judged against
   gallery in the same box. */

/** Foot height. The record's longest gloss ("HOW THE ORGANISATION SOUNDS
 *  IN CONTEXT", 38 chars) wraps to FOUR lines at the 15-character measure
 *  a 132-unit window allows at fs 12 — 4 × 15u of line box plus 10u of
 *  padding is 70. Anything less clips the voice card's last line. */
const FOOT_H = 70;
const GLOSS_LINE_BOX = 15;
const GLOSS_PER = 15;
const GLOSS_MAX_LINES = 4;

/* ── The stack ────────────────────────────────────────────────────────
   ⚠ **THE SPINE IS NOT DRAWN — IT IS THE STACK'S OWN LEFT EDGE.** The
   first cut of this pass drew an explicit 1-unit bus with a node per
   tap, and at the lab's meet of 0.646 that line paints 0.65 device px:
   the browser pays the remainder in alpha (ADR-070 U11's ceiling), the
   spine vanished, and what survived was a dash and a dot per row —
   which is a BULLETED LIST, the exact thing the ruling rejected. Every
   plate now carries a 3-unit accent at its left edge, and fourteen of
   those stacked at an 18-unit pitch ARE the bus, at a weight that
   cannot be alpha'd away. */

/** One plate per encoded Skill. 16 of body, 2 of gap. */
const PLATE_H = 16;
const PLATE_PITCH = 18;
/** The accent bar — amber, and green on the pattern's flagship encode.
 *  Wide enough to survive the meet; the stack's rhythm depends on it. */
const ACCENT_W = 3;
/** Accent → label. */
const LABEL_GAP = 6;
/** The stack's top, measured from the header band's bottom edge. */
const STACK_TOP_GAP = 10;

const BODY_PAD = MODULE.pad;

export function VariantCards({ record }: IslVariantProps) {
  return (
    <>
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const skills = skillsIn(pattern);
        const geo = cardGeometry(i, skills.length);
        const glossLines = wrapLines(shape.gloss, GLOSS_PER, GLOSS_MAX_LINES);
        const clipId = `isl-cards-${shape.key}`;
        const d = housing(geo.x, geo.y, CARD_W, CARD_H, MODULE.cut);

        return (
          <g key={shape.key}>
            {/* THE CARD — reading 02's module, drawn from the shared
                primitives: opaque ground, a dawn-.03 lift, a 1px border
                on the canonical TR+BL diagonal. */}
            <path d={d} fill="var(--pda-void)" />
            <path d={d} fill="rgba(var(--dawn-rgb), 0.03)" />
            <path d={d} fill="none" stroke="var(--pda-hair2)" />

            {/* THE HEADER BAND — its own `band()` path, never the full
                housing, or a spurious 45° nick lands mid-card where no
                edge exists. */}
            <path
              d={band(geo.x, geo.y, CARD_W, MODULE.head, MODULE.cut)}
              fill="rgba(var(--dawn-rgb), 0.05)"
            />
            <line
              x1={geo.x}
              y1={geo.y + 1}
              x2={geo.x + CARD_W - MODULE.cut}
              y2={geo.y + 1}
              stroke="var(--pda-hair2)"
              strokeWidth="2"
            />
            <line
              x1={geo.x}
              y1={geo.y + MODULE.head}
              x2={geo.x + CARD_W}
              y2={geo.y + MODULE.head}
              stroke="var(--pda-hair)"
            />
            <text
              x={geo.x + BODY_PAD}
              y={geo.y + 23}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            {/* The count, as a numeral beside the name. A number next to
                a name is an inventory; the sentence it used to sit in
                moved to the foot. */}
            <text
              x={geo.x + CARD_W - BODY_PAD}
              y={geo.y + 23}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {String(skills.length).padStart(2, "0")}
            </text>

            {/* THE STACK — one plate per encoded Skill, accent at the
                left edge. Fourteen of these ARE the bus; five of them
                are a short one. */}
            {skills.map((skill, k) => {
              const py = geo.stackTop + k * PLATE_PITCH;
              const cut = Boolean(skill.cut);
              return (
                <g key={skill.id}>
                  <rect
                    x={geo.bodyX}
                    y={py}
                    width={geo.bodyW}
                    height={PLATE_H}
                    fill="rgba(var(--dawn-rgb), 0.06)"
                  />
                  <rect
                    x={geo.bodyX}
                    y={py}
                    width={ACCENT_W}
                    height={PLATE_H}
                    fill={cut ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={cut ? 1 : 0.55}
                  />
                  <text
                    x={geo.bodyX + ACCENT_W + LABEL_GAP}
                    y={py + PLATE_H - 5}
                    fontSize={FS.chrome}
                    letterSpacing=".08em"
                    fill={cut ? "var(--pda-grn-ink)" : "var(--pda-txt)"}
                  >
                    {labelOf(skill)}
                  </text>
                </g>
              );
            })}

            {/* THE RAW FIELD — the pattern's own physics, in what the
                stack leaves. ⚠ It sits BELOW the plates rather than
                behind them: at 0.55 behind fourteen labels it read as
                dust on the type, and the reading it wants to make is
                extraction — the plates are what has been encoded, the
                field is the material they came out of. Which is why a
                five-Skill card showing more raw field than a fourteen
                is correct rather than a hole.

                ⚠ The clip lives in the group's own space at the origin;
                a `userSpaceOnUse` clip resolves in the REFERENCING
                element's coordinate system, so absolute coordinates
                land at twice the translate. */}
            {geo.fieldH > 24 ? (
              <>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={geo.bodyW} height={geo.fieldH} />
                </clipPath>
                <g
                  transform={`translate(${geo.bodyX} ${geo.fieldY})`}
                  clipPath={`url(#${clipId})`}
                  opacity="0.8"
                >
                  {isFormKey(pattern) ? (
                    <FormField
                      form={pattern}
                      w={geo.bodyW}
                      h={geo.fieldH}
                      seed={13 + i * 7}
                      k={0.8}
                      p={14}
                    />
                  ) : null}
                </g>
              </>
            ) : null}

            {/* THE FOOT — what this substrate MEANS, in the record's own
                words.

                ⚠ IT IS A BAND, NOT A HAIRLINE. A 1-unit rule at
                `--pda-hair` paints 0.65 device px at the lab's meet and
                the browser pays the rest in alpha (ADR-070 U11), so the
                separator this foot had was invisible in BOTH themes
                while the header's identical rule read fine — the header
                has a band above it doing the work. The foot gets the
                same treatment, which also puts the card on reading 02's
                three-zone module grammar: head · body · foot.

                ⚠ The fill is CLIPPED TO THE HOUSING rather than drawn as
                its own path, so the BL chamfer is inherited instead of
                re-derived. A 45° cut offset by hand is how the two
                corners drift apart. */}
            <clipPath id={`${clipId}-hull`}>
              <path d={d} />
            </clipPath>
            <g clipPath={`url(#${clipId}-hull)`}>
              <rect
                x={geo.x}
                y={geo.footY}
                width={CARD_W}
                height={FOOT_H}
                fill="rgba(var(--dawn-rgb), 0.05)"
              />
            </g>
            <line
              x1={geo.x}
              y1={geo.footY}
              x2={geo.x + CARD_W}
              y2={geo.footY}
              stroke="var(--pda-hair2)"
            />
            {glossLines.map((line, li) => (
              <text
                key={li}
                x={geo.x + BODY_PAD}
                y={geo.footY + 18 + li * GLOSS_LINE_BOX}
                fontSize={FS.chrome}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </>
  );
}

/* ── Geometry, pure so the guard can walk the same numbers ───────────── */

interface CardGeometry {
  x: number;
  y: number;
  bodyX: number;
  bodyW: number;
  /** Top edge of the first plate. */
  stackTop: number;
  /** Top edge of the raw field, i.e. below the last plate. */
  fieldY: number;
  /** What the stack left. Zero-ish on the densest card, and that is the
   *  drawing making its point rather than running out of room. */
  fieldH: number;
  footY: number;
}

/**
 * ⚠ **THE FIELD'S HEIGHT IS DERIVED FROM THE SKILL COUNT**, which is why
 * this takes the count rather than reading it off a default. Pattern's
 * fourteen plates leave 60u and Stakeholder's five leave 222u; both are
 * the correct drawing, and a static split would have letterboxed one end
 * exactly the way ADR-070 U12 describes.
 */
function cardGeometry(i: number, skillCount: number): CardGeometry {
  const x = cardX(i);
  const y = CARD_Y;
  const footY = y + CARD_H - FOOT_H;
  const stackTop = y + MODULE.head + STACK_TOP_GAP;
  const stackBottom = stackTop + skillCount * PLATE_PITCH;
  const fieldY = stackBottom + 4;
  return {
    x,
    y,
    bodyX: x + BODY_PAD,
    bodyW: CARD_W - BODY_PAD * 2,
    stackTop,
    fieldY,
    fieldH: Math.max(0, footY - 8 - fieldY),
    footY,
  };
}

/** Label ink priority: the fixture's hand-crafted short form. Every Skill
 *  declares one, so this can never fall through to the full title. */
const labelOf = (s: SampleSkill): string => s.shortTitle;

/**
 * The label's measure — the plate's width, less the accent, its gap and
 * a right margin. 132 − 3 − 6 − 4 = 119u, which is 14.5 characters at
 * fs 12 track .08. The fixture caps `shortTitle` at 14 and
 * `substrate-lab-fit` asserts that cap, so the two numbers are the same
 * constraint declared at both ends.
 */
const LABEL_MEASURE = CARD_W - BODY_PAD * 2 - ACCENT_W - LABEL_GAP - 4;
/** The gloss and the header both measure against the full inner width. */
const HEAD_MEASURE = CARD_W - BODY_PAD * 2 - 26;
const GLOSS_MEASURE = CARD_W - BODY_PAD * 2;

export function cardsLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];

  for (const shape of record.shapes) {
    const skills = skillsIn(shape.key as SubstrateSkillPattern);

    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: HEAD_MEASURE,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: String(skills.length).padStart(2, "0"),
      fs: FS.key,
      track: TRACK.chrome,
      measure: 26,
    });

    /* The foot's sentence, line by line — this is what replaced the
       `SKILLS · CUT BY` pair, so the guard measures it line for line. */
    for (const [li, line] of wrapLines(shape.gloss, GLOSS_PER, GLOSS_MAX_LINES).entries()) {
      out.push({
        slot: `${shape.key}.gloss.${li}`,
        text: line,
        fs: FS.chrome,
        track: TRACK.name,
        measure: GLOSS_MEASURE,
      });
    }
  }

  /* One label per encoded Skill, on the bus. */
  for (const skill of SAMPLE_SKILLS) {
    out.push({
      slot: `${skill.id}.label`,
      text: labelOf(skill),
      fs: FS.chrome,
      track: TRACK.name,
      measure: LABEL_MEASURE,
    });
  }

  return out;
}
