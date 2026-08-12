/**
 * What the three lab drawings share with the shipped one.
 *
 * ⚠ **THE KIT LIVES IN PRODUCTION NOW** (2026-08-12). It was authored here at
 * reading 02's crop width precisely so that a promoted winner would be a copy
 * rather than a re-fit — and the pin grid is that winner (ADR-070 U15), so
 * `Tap`, `DeptHead`, `housing`, the type ladder and the spec emitters moved to
 * `map/pda/substrateKit` and this file re-exports them. Two copies of a
 * measured drawing is how a lab starts passing what production would fail.
 *
 * ⚠ ONE ADVANCE MODEL FOR BOTH LABS AND THE DRAWING. `adv` / `specWidth` /
 * `LetterSpec` are production's now too (`map/pda/pdaLetters`): PT Mono's
 * advance is a property of the font, not of a route.
 */

import type { LetterSpec as LetterSpecType } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  FS as FS_SHIPPED,
  MODULE,
  band,
  housing,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

export {
  DEPT_UNIT,
  DeptHead,
  FS_FLOOR,
  MODULE,
  SubstrateHatch,
  Tap,
  TRACK,
  band,
  byMass,
  deptSpecs,
  housing,
  shapeSpecs,
  tappers,
  totalSkills,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

/**
 * ⚠ `hero` IS THE LAB'S OWN RUNG, and it stays here rather than in production.
 * The crossing table and the containment drawing letter the estate's 47 as a
 * headline; the pin grid does not — its five row counts sum to 47 in plain
 * sight and the proof register beside it already claims the total, so a sixth
 * number would be the surface saying something twice. Production's ladder
 * carries no rung it does not draw.
 */
export const FS = { ...FS_SHIPPED, hero: 22 } as const;

export { adv, specWidth } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
export type { LetterSpec } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";

/* ── The lab's own crop ─────────────────────────────────────────────────
   ⚠ ONE CROP FOR ALL THREE DIRECTIONS, and it is reading 02's width. The
   comparison is only worth making in the same box, and sharing 932 is what
   let the winner inherit U12's elastic treatment unchanged. 762 is that width
   at the binding preset's field aspect (603 × 493 = 1.223).

   ⚠ THE LAB'S CROP IS STATIC and production's is not any more — the shipped
   baseline mounted here draws at REST. The lab's housing is a fixed preset, so
   there is no field shape for a crop to be derived from. */
export const SUB_VIEWBOX = "0 0 932 762";
export const CROP_W = 932;
export const CROP_H = 762;

/** The width chain. Every variant hangs off these three. */
export const PAD = 26;
export const L = PAD;
export const R = CROP_W - PAD;
export const W = R - L;

/* ── The card, shared by the two card directions ────────────────────────
   The owner's `Substrate Archetypes` frames S2 and S4 are the SAME card with
   two different fills — a hatch whose pitch is the density, and the pattern's
   own particle field. One component, so the comparison is about the fill and
   nothing else. */

export const CARDS = 5;
export const CARD_PITCH = W / CARDS;
export const CARD_W = CARD_PITCH - 20;
export const CARD_Y = 150;
export const CARD_H = 430;
export const cardX = (i: number) => L + CARD_PITCH * i + (CARD_PITCH - CARD_W) / 2;

/**
 * The foot — two cells in a row, reading 02's own key-over-value pair.
 *
 * ⚠ **THE PITCH IS MEASURED AGAINST THE LINE BOX, NEVER THE FONT SIZE**
 * (ADR-069's law, and it cost a capture to relearn). Reading 02 steps its key
 * to its value by 20 at 12.5 / 14 — half-sum of the line boxes is 17.2, so 20
 * clears. This card's value is the `name` rung at 20, whose ascent alone is
 * 20.8 units, so the same 22 put the numeral's cap 2.1 units INTO the key's
 * descender on all five cards. 28 clears it by 3.9.
 */
const FOOT_H = 62;
const KEY_BASE = 20;
const VAL_BASE = 48;
const CELLS = 2;
const CELL_W = (CARD_W - MODULE.pad * 2) / CELLS;
/** A cell's key and its answer, measured against its own column. */
export const CARD_KEY_MEASURE = CELL_W - 4;

export interface CardFill {
  /** The fill window in the card's own coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * ONE CARD — AND IT IS READING 02's MODULE (owner, 2026-08-12: _"more in line
 * with the cards in configuration"_).
 *
 * Every measure and every layer below is `QNode`'s, from the shared `MODULE`
 * constants and the shared `housing` / `band` paths:
 *
 *   - opaque `--pda-void` ground, then a dawn-.03 lift — R4's density rule,
 *     which is what makes a module pop off the bed and which inverts correctly
 *     on the light flip
 *   - a 1px `--pda-hair2` border on TWO OPPOSED 45° cuts, TR+BL
 *   - a header band at dawn .05 on its own `band()` path, ⚠ never the full
 *     housing — that puts a spurious nick mid-card where no edge exists
 *   - the 2px top rule, ⚠ STOPPED at the cut or it overshoots into the notch
 *   - a hairline closing the band, full width
 *   - the label bold at `.14em`, at the module's own `pad` inset
 *   - a foot of gold KEYS over ink VALUES — one ink for every answer, the key
 *     in Tensor gold, because gold is wayfinding and a field label is how the
 *     reader finds the field
 *
 * The mockup's own card had a single TR cut, an underlined header and a big
 * gold numeral floating bottom-right. What survives of it is the composition:
 * five tall cards in a row, a window in each, the count and the cutter at the
 * foot. What changed is that it is now the same OBJECT as a configuration
 * module rather than a card that resembles one.
 */
export function FormCard({
  i,
  name,
  count,
  cutBy,
  children,
}: {
  i: number;
  name: string;
  count: string;
  cutBy: string;
  children: (fill: CardFill) => React.ReactNode;
}) {
  const x = cardX(i);
  const y = CARD_Y;
  const w = CARD_W;
  const h = CARD_H;
  const d = housing(x, y, w, h, MODULE.cut);
  const footY = y + h - FOOT_H;
  const fill: CardFill = {
    x: x + MODULE.pad,
    y: y + MODULE.head + 10,
    w: w - MODULE.pad * 2,
    h: footY - (y + MODULE.head + 10),
  };
  const cell = (n: number) => x + MODULE.pad + CELL_W * n;

  return (
    <g>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill="rgba(var(--dawn-rgb), 0.03)" />
      <path d={d} fill="none" stroke="var(--pda-hair2)" />

      <path d={band(x, y, w, MODULE.head, MODULE.cut)} fill="rgba(var(--dawn-rgb), 0.05)" />
      <line
        x1={x}
        y1={y + 1}
        x2={x + w - MODULE.cut}
        y2={y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
      <line x1={x} y1={y + MODULE.head} x2={x + w} y2={y + MODULE.head} stroke="var(--pda-hair)" />
      <text
        x={x + MODULE.pad}
        y={y + 23}
        fontSize={FS.key}
        fontWeight={700}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        {name}
      </text>

      {children(fill)}

      <line x1={x} y1={footY} x2={x + w} y2={footY} stroke="var(--pda-hair)" />
      <text
        x={cell(0)}
        y={footY + KEY_BASE}
        fontSize={FS.chrome}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        SKILLS
      </text>
      <text
        x={cell(0)}
        y={footY + VAL_BASE}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {count}
      </text>
      <text
        x={cell(1)}
        y={footY + KEY_BASE}
        fontSize={FS.chrome}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        CUT BY
      </text>
      <text
        x={cell(1)}
        y={footY + VAL_BASE}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-grn-ink)"
      >
        {cutBy}
      </text>
    </g>
  );
}

/** What a card letters, so both directions declare the same set. */
export const cardSpecs = (s: {
  key: string;
  name: string;
  skills: number;
  trenchedBy: string;
}): LetterSpecType[] => [
  {
    slot: `${s.key}.name`,
    text: s.name,
    fs: FS.key,
    track: 0.14,
    measure: CARD_W - MODULE.pad * 2,
  },
  {
    slot: `${s.key}.k.skills`,
    text: "SKILLS",
    fs: FS.chrome,
    track: 0.18,
    measure: CARD_KEY_MEASURE,
  },
  {
    slot: `${s.key}.v.skills`,
    text: String(s.skills).padStart(2, "0"),
    fs: FS.name,
    track: 0.08,
    measure: CARD_KEY_MEASURE,
  },
  { slot: `${s.key}.k.cut`, text: "CUT BY", fs: FS.chrome, track: 0.18, measure: CARD_KEY_MEASURE },
  {
    slot: `${s.key}.v.cut`,
    text: s.trenchedBy,
    fs: FS.name,
    track: 0.08,
    measure: CARD_KEY_MEASURE,
  },
];
