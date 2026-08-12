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
import { FS as FS_SHIPPED } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

export {
  DEPT_UNIT,
  DeptHead,
  FS_FLOOR,
  SubstrateHatch,
  Tap,
  TRACK,
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
/** The fill window, inset inside the card — the mockup's 14 / 52 / 46. */
export const FILL_PAD = 14;
export const FILL_TOP = 52;
export const FILL_BOT = 46;
export const cardX = (i: number) => L + CARD_PITCH * i + (CARD_PITCH - CARD_W) / 2;

export interface CardFill {
  /** The fill window in the card's own coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * ONE CARD — a top rule, a named header, a fill window, and a foot.
 *
 * ⚠ The corner cut is the mockup's TOP-RIGHT, which is also ADR-065's
 * canonical diagonal — the one place these two agree without an override.
 */
export function FormCard({
  i,
  name,
  count,
  cut,
  children,
}: {
  i: number;
  name: string;
  count: string;
  cut: string;
  children: (fill: CardFill) => React.ReactNode;
}) {
  const x = cardX(i);
  const fill: CardFill = {
    x: x + FILL_PAD,
    y: CARD_Y + FILL_TOP,
    w: CARD_W - FILL_PAD * 2,
    h: CARD_H - FILL_TOP - FILL_BOT,
  };
  const c = 12;
  return (
    <g>
      <path
        d={`M${x},${CARD_Y} H${x + CARD_W - c} L${x + CARD_W},${CARD_Y + c} V${CARD_Y + CARD_H} H${x} Z`}
        fill="var(--pda-void)"
        stroke="var(--pda-hair2)"
      />
      {/* The 2px top rule, stopped at the cut — the same rule reading 02's
          modules carry, and it stops for the same reason. */}
      <path
        d={`M${x},${CARD_Y + 1} H${x + CARD_W - c}`}
        stroke="var(--pda-amb)"
        strokeWidth="2"
        opacity="0.55"
      />
      <text
        x={x + FILL_PAD}
        y={CARD_Y + 30}
        fontSize={FS.key}
        letterSpacing=".16em"
        fill="var(--pda-txt)"
      >
        {name}
      </text>
      <path
        d={`M${x + FILL_PAD},${CARD_Y + 42} H${x + CARD_W - FILL_PAD}`}
        stroke="var(--pda-hair)"
      />
      {children(fill)}
      <text
        x={x + FILL_PAD}
        y={CARD_Y + CARD_H - 14}
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-grn-ink)"
      >
        {cut}
      </text>
      <text
        x={x + CARD_W - FILL_PAD}
        y={CARD_Y + CARD_H - 34}
        textAnchor="end"
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".04em"
        fill="var(--pda-ink)"
      >
        {count}
      </text>
    </g>
  );
}

/** What a card letters, so both directions declare the same set. */
export const cardSpecs = (
  s: { key: string; name: string; skills: number; trenchedBy: string },
  measure: number
): LetterSpecType[] => [
  { slot: `${s.key}.name`, text: s.name, fs: FS.key, track: 0.16, measure },
  {
    slot: `${s.key}.count`,
    text: String(s.skills).padStart(2, "0"),
    fs: FS.hero,
    track: 0.04,
    measure,
  },
  {
    slot: `${s.key}.cut`,
    text: `CUT BY ${s.trenchedBy}`,
    fs: FS.chrome,
    track: 0.14,
    measure,
  },
];
