"use client";

import type { CaseSkillEntry } from "@/lib/cases/types";

import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import { wrapLines } from "./pdaGlyphs";
import type { LetterSpec } from "./pdaLetters";
import type { PdaShape } from "./pdaRecord";
import { FormField, isFormKey } from "./substrateForms";
import { FS, MODULE, TRACK, band, housing } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — five pattern cards, each a stack of its named Skills.
 *
 * ## The claim
 *
 * One card per pattern. Every encoded Skill in it is a PLATE — a slab with an
 * accent at its left edge — and the plates stack from the header down, so a
 * pattern's mass is a thing you see rather than a numeral you read. Under the
 * stack, the pattern's own physics field fills whatever is left. The foot says
 * what the substrate MEANS, in the record's own gloss.
 *
 * The reading is EXTRACTION: the plates are what has been encoded, the field
 * is the material they came out of. Which is why Stakeholder's five showing
 * more raw field than Pattern's fourteen is the drawing making its point
 * rather than a hole in it.
 *
 * ## What it replaces, and what that cost
 *
 * The pin grid (ADR-070 U15) — five patterns down, eight departments across,
 * one mark per crossing. It was a good drawing and it was correct; it was
 * replaced because it answered a question about DEPARTMENTS with a surface
 * whose subject is the SUBSTRATE, and because the thing a reader actually
 * wants from this tab ("what is in Judgment?") was the one thing it would not
 * say. The owner's brief for round three was the patterns across the skills.
 *
 * ⚠ **THE 5 × 8 CROSSING IS GONE FROM THE SITE, AND THAT WAS A DECISION, NOT
 * AN OVERSIGHT** (owner, 2026-08-13). 30 taps · 5 cut · 10 empty appeared
 * nowhere else — ADR-062's isometric city still holds it in `map/**` but is
 * not what the landing renders. It cannot come back inside a card: eight
 * department codes need ~196 units of lettering against a card's 132-unit
 * window, and marks without codes need a legend, which this surface does not
 * have by law. If the crossing returns it needs its own reading, not a corner
 * of this one. `crossing()` still projects it and its arithmetic is still
 * guarded, so the record has not lost anything the drawing stopped showing.
 *
 * ## Why the named Skills are publishable here
 *
 * They already ship. The same case's REGISTRY row renders all 47 by name in
 * `SkillsBrowserPlate`, one casefile row away, so this letters nothing new —
 * it letters the same roster in the drawing that explains what groups it.
 * ⚠ What does NOT travel is the per-Skill OWNER: the source data carries
 * client staff names and `CaseSkillEntry` has refused that field since
 * ADR-056. The label is `short`, the team is not lettered at all.
 *
 * ## Adaptations, each forced by a standing law or by arithmetic
 *
 *   the label      `short`, not `name` — 14 characters against a 132-unit
 *                  window at the fs floor. Authored, never truncated:
 *                  clipping "Legal Risk Methodology" gives "Legal Risk Met"
 *   the count      a bare numeral beside the pattern name. `{n} SKILLS` was
 *                  lawful, but a card of countable plates does not need the
 *                  noun, and the numeral is the header's own right column
 *   the foot       the gloss, wrapped. It replaced `{n} SKILLS · CUT BY {ab}`
 *                  (owner: _"meaningless text"_) — two numbers and a code,
 *                  true and unreadable as a claim
 *   `CUT BY`       carried DOWN a level: the pattern's first encode takes the
 *                  green accent, so the green still points at the fact the
 *                  pin grid pointed at, with a finer finger
 *   the card       reading 02's module — the shared `housing` / `band` on
 *                  ADR-065's canonical TR+BL, head · body · foot
 *
 * ⚠ **THE SPINE IS NOT DRAWN — IT IS THE STACK'S OWN LEFT EDGE.** The first
 * cut of this drawing ran an explicit 1-unit bus down each card with a node
 * per Skill, and at this surface's meet that line paints under a device pixel:
 * the browser pays the remainder in alpha (ADR-070 U11's ceiling), the spine
 * vanished, and what survived was a dash and a dot per row — a bulleted list.
 * The accent bar carries the same reading at a weight the meet cannot erase.
 *
 * ⚠ **THE CROP'S WIDTH IS READING 02's**, and that is the whole reason this
 * drawing is elastic for free: `meet` is `field.w / 932` at every height, so
 * growing the crop costs nothing (see `pdaFit`). The substrate lab authored
 * all of its directions at 932 for exactly this promotion.
 */

/* ── The width chain, which never moves ─────────────────────────────────── */
export const SUB_CROP_W = 932;
const PAD = 26;
const L = PAD;
const R = SUB_CROP_W - PAD;
const W = R - L;

export const CARDS = 5;
const CARD_PITCH = W / CARDS;
/** 156 units. The gap between cards is the pitch's remainder, 20. */
const CARD_W = CARD_PITCH - 20;
const cardX = (i: number) => L + CARD_PITCH * i + (CARD_PITCH - CARD_W) / 2;

const BODY_PAD = MODULE.pad;
/** The plate's inner measure, 132 units. Everything horizontal is this. */
const INNER_W = CARD_W - BODY_PAD * 2;

/* ── The card's internal chain ──────────────────────────────────────────── */
/** The accent bar — amber, green on the pattern's first encode. */
const ACCENT_W = 3;
/** Accent → label. ⚠ THE HORIZONTAL BUDGET IS SPENT HERE. A 14-character
 *  `short` at fs 12 / .08 measures 114.2u against the 132-unit inner width,
 *  so the accent, this gap and the right margin may total 17.8. At 3 + 6 + 4
 *  the longest label clears by 5. */
const LABEL_GAP = 6;
const LABEL_MARGIN = 4;
const LABEL_MEASURE = INNER_W - ACCENT_W - LABEL_GAP - LABEL_MARGIN;
/** The stack's top, from the header band's bottom edge. */
const STACK_TOP_GAP = 10;
/** Stack → field. */
const FIELD_GAP = 4;

/**
 * The foot. The record's longest gloss ("HOW THE ORGANISATION SOUNDS IN
 * CONTEXT", 38 characters) wraps to FOUR lines at the 16-character measure a
 * 132-unit window allows at fs 12, and four lines at a 17-unit box is 63
 * units of ink. Anything under 70 crowds it; 78 seats it with air at both
 * ends, which is what lets the gloss be CENTRED rather than hung.
 */
const FOOT_H = 78;
/**
 * ⚠ 17, AND THE THREE UNITS OVER THE OBVIOUS 15 ARE WHAT KEEP CI GREEN.
 *
 * A 12-unit label's `getBBox` is **15.47** units tall — the font's em box,
 * ascender to descender, not its ink. At a 15-unit pitch consecutive gloss
 * lines overlap by 0.47, and the smoke's label-on-label gate fires above
 * 0.5. That is a 0.03-unit margin: not a pass, a coin flip on a font metric.
 * At 17 the boxes clear by 1.53 and the four-line gloss still seats inside
 * `FOOT_H` with 7.5 units of air at each end.
 */
const GLOSS_LINE_BOX = 17;
/** ⚠ 16, NOT 15, AND THE EXTRA CHARACTER IS LOAD-BEARING. At fs 12 / .08 the
 *  advance is 8.16u, so 16 characters measure 130.6 against the 132-unit
 *  window — the ceiling, not a round number. At 15 the Pattern gloss broke as
 *  `RECURRING / SHAPES / / STRUCTURED / OUTPUT`, stranding a slash alone on a
 *  line; at 16 `RECURRING SHAPES` holds together and the gloss is three lines
 *  instead of four. */
const GLOSS_PER = 16;
const GLOSS_MAX_LINES = 4;

/** The densest pattern. Pattern's fourteen set every vertical minimum. */
const MAX_PLATES = 14;

/* ── The vertical chain, which is the elastic one ───────────────────────── */
const CARD_Y = PAD;
const PLATE_PITCH0 = 18;
/**
 * ⚠ THE EXTRA HEIGHT IS SPLIT BETWEEN THE PLATES AND THE FIELD, AND NEITHER
 * ALONE IS RIGHT.
 *
 * All of it to the FIELD and the densest card becomes a short stack over a
 * large texture — the plates stop being the subject. All of it to the PLATE
 * PITCH and the labels stay the same size while the gaps between them grow,
 * which is ADR-070 U12's hole: a taller plate is a plate with air under it.
 * So the pitch takes a bounded share (18 → 26, which is spacing rather than a
 * gap) and the field takes the rest, because the field is the one element on
 * this card that is texture and can absorb any amount of room honestly.
 */
const PLATE_PITCH_MAX = 26;
const PLATE_PITCH_RATE = 50;

/**
 * ⚠ PAST THIS THE CARD IS A SLIVER. At 156 × 1000 the card is already 1 : 6.4
 * and the field under Pattern's stack runs 450 units; past it the extension
 * buys a taller texture and nothing else, so the remainder becomes margin and
 * `cropAround` splits it evenly (U14 — a tail hung off the bottom is how the
 * board ended up sitting high over a hole).
 *
 * Measured console fields: 603×493 → card 710 · 850×760 → 781 · 845×950 (the
 * owner's) → 996, a full fill · 603×1177 → capped, 88 units of air each end.
 */
const CARD_H_MAX = 1000;

/** The card at rest, sized by the densest stack plus a field worth painting. */
const CARD_H0 = MODULE.head + STACK_TOP_GAP + MAX_PLATES * PLATE_PITCH0 + FIELD_GAP + 60 + FOOT_H;

export const SUB_EXT_MAX = 1200;

const SUB_FIT: FitSpec = {
  cropW: SUB_CROP_W,
  cropH: CARD_H0 + PAD * 2,
  /* ⚠ HEIGHT ONLY. The width chain is five fixed cards; a wider crop would
     only float them in a bigger margin. */
  maxW: 0,
  maxH: SUB_EXT_MAX,
};

export interface SubstrateLayout {
  /** Card height at this field shape. */
  cardH: number;
  /** Plate pitch at this field shape. */
  pitch: number;
  marginY: number;
  crop: string;
}

/** THE CARDS AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it. */
export function substrateLayout(ext: FitExt): SubstrateLayout {
  const cardH = Math.min(CARD_H_MAX, CARD_H0 + ext.extH);
  const grown = cardH - CARD_H0;
  const pitch = Math.min(PLATE_PITCH_MAX, PLATE_PITCH0 + grown / PLATE_PITCH_RATE);
  const box = cropAround({ x: L, y: CARD_Y, w: W, h: cardH }, SUB_CROP_W, SUB_FIT.cropH + ext.extH);
  return { cardH, pitch, marginY: box.marginY, crop: box.crop };
}

export const substrateExt = (fieldAspect: number) => fitExt(SUB_FIT, fieldAspect);

/** The cards at rest — what the labs mount and what every guard measures. */
export const SUBSTRATE_LAYOUT_0 = substrateLayout({ extW: 0, extH: 0 });
export const SUBSTRATE_VIEWBOX = SUBSTRATE_LAYOUT_0.crop;

/* ── The record → the drawing ───────────────────────────────────────────── */

/**
 * ⚠ `engine` IS THE PATTERN, lowercased. The Skills reservoir types it as a
 * free `string` carrying a `CaseWorkShape` ("Judgment"), and the map's shapes
 * key on `"judgment"` — one join, declared once here rather than at three
 * call sites. `cases-registry` asserts every engine names a real group, so a
 * typo cannot reach this function.
 */
export const skillsOf = (skills: readonly CaseSkillEntry[], key: string): CaseSkillEntry[] =>
  skills.filter((s) => s.engine.toLowerCase() === key);

/** Where each piece of one card sits, given its stack depth. Pure. */
export function cardGeometry(i: number, plates: number, layout: SubstrateLayout) {
  const x = cardX(i);
  const footY = CARD_Y + layout.cardH - FOOT_H;
  const stackTop = CARD_Y + MODULE.head + STACK_TOP_GAP;
  const fieldY = stackTop + plates * layout.pitch + FIELD_GAP;
  return {
    x,
    bodyX: x + BODY_PAD,
    stackTop,
    fieldY,
    fieldH: Math.max(0, footY - 8 - fieldY),
    footY,
  };
}

/**
 * WHAT THIS DRAWING LETTERS, declared so `pda-substrate-fit` can measure the
 * drawing's own inputs rather than re-deriving them.
 *
 * ⚠ **A LETTERED STRING MISSING FROM THIS LIST IS A DEFECT IN THE DRAWING.**
 * Reading 03 had no fit guard at all before the pin grid, which is how "8
 * TEAMS" lived on the public page for months — a string composed at render
 * time is outside every content scanner. The 47 Skill labels are the largest
 * block of lettering on the whole console; they are all declared.
 */
export function substrateLettering(record: {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
}): LetterSpec[] {
  const out: LetterSpec[] = [];

  for (const s of record.shapes) {
    const plates = skillsOf(record.skills, s.key);

    out.push({
      slot: `${s.key}.name`,
      text: s.name,
      fs: FS.key,
      /* The count sits on the same line, right-aligned, so the name's
         measure is the inner width less that numeral's column. */
      track: TRACK.chrome,
      measure: INNER_W - 26,
    });
    out.push({
      slot: `${s.key}.count`,
      text: String(plates.length).padStart(2, "0"),
      fs: FS.key,
      track: TRACK.chrome,
      measure: 26,
    });

    for (const [li, line] of wrapLines(s.gloss, GLOSS_PER, GLOSS_MAX_LINES).entries()) {
      out.push({
        slot: `${s.key}.gloss.${li}`,
        text: line,
        fs: FS.chrome,
        track: TRACK.name,
        measure: INNER_W,
      });
    }

    for (const plate of plates) {
      out.push({
        slot: `skill.${plate.id}`,
        text: plate.short,
        fs: FS.chrome,
        track: TRACK.name,
        measure: LABEL_MEASURE,
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
  const { cardH, pitch } = layout;
  const plateH = pitch - 2;

  return (
    <>
      {shapes.map((s, i) => {
        const plates = skillsOf(skills, s.key);
        const geo = cardGeometry(i, plates.length, layout);
        const glossLines = wrapLines(s.gloss, GLOSS_PER, GLOSS_MAX_LINES);
        const isLit = lit === s.key;
        const clipId = `pda-sub-${s.key}`;
        const d = housing(geo.x, CARD_Y, CARD_W, cardH, MODULE.cut);

        return (
          <g
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            key={s.key}
            style={still ? undefined : { animationDelay: `${i * 44}ms` }}
            onMouseEnter={() => onLit(s.key)}
            onMouseLeave={() => onLit(null)}
          >
            {/* ⚠ THE GROUND IS OPAQUE, so the card hit-tests across its whole
                face. An SVG shape with no fill hit-tests on its STROKE alone,
                which is the class of bug ADR-069 found on the person-led
                cartridges. */}
            <path d={d} fill="var(--pda-void)" />
            <path d={d} fill="rgba(var(--dawn-rgb), 0.03)" />
            <path d={d} fill="none" stroke={isLit ? "var(--pda-hot)" : "var(--pda-hair2)"} />

            {/* THE HEAD — its own `band()` path, ⚠ never the full housing, or
                a spurious 45° nick lands mid-card where no edge exists. */}
            <path
              d={band(geo.x, CARD_Y, CARD_W, MODULE.head, MODULE.cut)}
              fill="rgba(var(--dawn-rgb), 0.05)"
            />
            <line
              x1={geo.x}
              y1={CARD_Y + 1}
              x2={geo.x + CARD_W - MODULE.cut}
              y2={CARD_Y + 1}
              stroke="var(--pda-hair2)"
              strokeWidth="2"
            />
            <line
              x1={geo.x}
              y1={CARD_Y + MODULE.head}
              x2={geo.x + CARD_W}
              y2={CARD_Y + MODULE.head}
              stroke="var(--pda-hair)"
            />
            <text
              x={geo.bodyX}
              y={CARD_Y + 23}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill={isLit ? "var(--pda-hot)" : "var(--pda-txt)"}
            >
              {s.name}
            </text>
            {/* The count, as a numeral beside the name. A number next to a
                name is an inventory; the sentence it used to sit in moved to
                the foot. */}
            <text
              x={geo.x + CARD_W - BODY_PAD}
              y={CARD_Y + 23}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {String(plates.length).padStart(2, "0")}
            </text>

            {/* THE STACK — one plate per encoded Skill. Fourteen of these
                accents are a bus; five of them are a short one. */}
            {plates.map((plate, k) => {
              const py = geo.stackTop + k * pitch;
              const first = Boolean(plate.flagship);
              return (
                <g key={plate.id}>
                  <rect
                    x={geo.bodyX}
                    y={py}
                    width={INNER_W}
                    height={plateH}
                    fill="rgba(var(--dawn-rgb), 0.06)"
                  />
                  <rect
                    x={geo.bodyX}
                    y={py}
                    width={ACCENT_W}
                    height={plateH}
                    fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={first ? 1 : 0.55}
                  />
                  {/* ⚠ THE LABEL DOES NOT TAKE THE GREEN, THE ACCENT DOES.
                      Lettering the first encode in `--pda-grn-ink` (#7e9f66)
                      against every sibling's `--pda-txt` (dawn at .92) makes
                      the one plate the drawing means to point at the DIMMEST
                      thing in the stack — the highlight rendered as
                      de-emphasis. The accent already carries the state at
                      full weight against the others' .55, which is one
                      signal per object rather than two saying it twice. */}
                  <text
                    x={geo.bodyX + ACCENT_W + LABEL_GAP}
                    y={py + plateH - (plateH - 12) / 2 - 2}
                    fontSize={FS.chrome}
                    letterSpacing=".08em"
                    fill="var(--pda-txt)"
                  >
                    {plate.short}
                  </text>
                </g>
              );
            })}

            {/* THE RAW FIELD — the material the plates came out of. ⚠ The clip
                lives in the group's own space at the origin; a
                `userSpaceOnUse` clip resolves in the REFERENCING element's
                coordinate system, so absolute coordinates land at twice the
                translate. */}
            {geo.fieldH > 24 && isFormKey(s.key) ? (
              <>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={INNER_W} height={geo.fieldH} />
                </clipPath>
                <g
                  transform={`translate(${geo.bodyX} ${geo.fieldY})`}
                  clipPath={`url(#${clipId})`}
                  opacity="0.8"
                >
                  <FormField
                    form={s.key}
                    w={INNER_W}
                    h={geo.fieldH}
                    seed={13 + i * 7}
                    k={0.55}
                    p={14}
                  />
                </g>
              </>
            ) : null}

            {/* THE FOOT — what this substrate MEANS, in the record's own
                words. ⚠ IT IS A BAND, NOT A HAIRLINE: a 1-unit rule paints
                under a device pixel at this meet and the browser pays the
                rest in alpha, so the separator was invisible in both themes
                while the head's identical rule read fine — the head has a
                band above it doing the work. The fill is CLIPPED TO THE
                HOUSING so the BL chamfer is inherited rather than re-derived
                by hand. */}
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
            {/* ⚠ THE GLOSS IS CENTRED IN ITS BAND, NOT HUNG FROM THE TOP.
                The five glosses wrap to two, three or four lines, and a fixed
                first baseline leaves the two-line cards with a third of the
                foot empty under them — five feet at four different fills,
                reading as four different components. */}
            {glossLines.map((gl, li) => (
              <text
                key={li}
                x={geo.bodyX}
                y={
                  geo.footY +
                  (FOOT_H - ((glossLines.length - 1) * GLOSS_LINE_BOX + 12)) / 2 +
                  12 +
                  li * GLOSS_LINE_BOX
                }
                fontSize={FS.chrome}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {gl}
              </text>
            ))}
          </g>
        );
      })}
    </>
  );
}
