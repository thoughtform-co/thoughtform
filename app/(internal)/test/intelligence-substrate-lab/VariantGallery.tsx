import {
  FormField,
  isFormKey,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateForms";
import { FS, FormCard, L, R, SUB_VIEWBOX, cardSpecs, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 8 · GALLERY — field cards with the skills drawn in.
 *
 * Round three, the card direction. The mockup's S4 card already renders
 * each pattern's own physics inside its window; this variant keeps that
 * and ADDS a pip ladder down the window's left rail, one square per
 * encoded Skill. So the card that carries a pattern's CHARACTER also
 * carries its COUNT — neither S1's seals nor S2's density nor S4's field
 * did both.
 *
 * ⚠ AN EVALUATION METHOD IS A TEST YOU CAN COUNT AND A TEST YOU CAN
 * PICTURE. `density` draws the mass and drops the physics; `field` draws
 * the physics and drops the mass; this card draws both, because the atom
 * is the SKILL and a Skill is one encoded call the evaluation gates on.
 *
 * ⚠ THE PAIR WITH `field` IS THE POINT. Both mount inside `FormCard`, so
 * the shared card is what the comparison is about: `field` shows the form
 * alone in a wide window, `gallery` narrows the field by 24 units and gives
 * that column back to the skills. If the reader wants character over count,
 * `field` remains. If they want the two, this is it.
 *
 * ⚠ NO CROSSING HERE, AND THIS IS THE NAMED TRADE. `rack` is the
 * relational round-three variant; a card cannot fit the crossing at
 * legible type inside a 132-unit window.
 */

export const GALLERY_VIEWBOX = SUB_VIEWBOX;

/** The pip column — one square per encoded Skill, top-anchored so the
 *  ladder GROWS with the pattern. Pattern's 14 fill most of the column;
 *  Stakeholder's 5 stop a third of the way down and the air below IS the
 *  mass reading, matching what the `rack` variant does horizontally.
 *
 *  Pitch 20 · pip 10 · col 24 → last pip's bottom at `6 + 13 × 20 + 10 =
 *  276` in the fill window's own coordinates; the window's height is
 *  ~324 at every preset, so the record's heaviest row clears with 48
 *  units of slack. Never tighter, or the pip becomes decoration. */
const PIP = 10;
const PIP_PITCH = 20;
const PIP_COL_W = 24;
const PIP_TOP = 6;

const ETCH = "EACH FORM ITS PHYSICS · EACH PIP AN ENCODED SKILL";
const B_ETCH = 660;

export function VariantGallery({ record }: IslVariantProps) {
  return (
    <>
      {record.shapes.map((s, i) => (
        <FormCard
          key={s.key}
          i={i}
          name={s.name}
          count={String(s.skills).padStart(2, "0")}
          cutBy={s.trenchedBy}
        >
          {(f) => {
            const fieldX = f.x + PIP_COL_W;
            const fieldW = f.w - PIP_COL_W;
            return (
              <>
                {/* PIP LADDER — one square per encoded Skill, top-anchored.
                    Uniform amber, one ink: the drawing does not claim
                    department ownership of individual skills, because the
                    record does not carry it. */}
                {Array.from({ length: s.skills }, (_, k) => (
                  <rect
                    key={k}
                    x={f.x + (PIP_COL_W - PIP) / 2}
                    y={f.y + PIP_TOP + k * PIP_PITCH}
                    width={PIP}
                    height={PIP}
                    fill="var(--pda-amb)"
                    fillOpacity="0.72"
                  />
                ))}

                {/* FIELD — the form's own physics, clipped to what's left
                    of the window. ⚠ THE CLIP IS IN THE GROUP'S OWN SPACE
                    at the origin (the `field` variant relearnt this the
                    hard way: a `userSpaceOnUse` clip resolves in the
                    referencing element's coordinate system, so absolute
                    coordinates here land at TWICE the translate). */}
                <clipPath id={`isl-gal-${s.key}`}>
                  <rect x={0} y={0} width={fieldW} height={f.h} />
                </clipPath>
                <g transform={`translate(${fieldX} ${f.y})`} clipPath={`url(#isl-gal-${s.key})`}>
                  {isFormKey(s.key) ? (
                    <FormField form={s.key} w={fieldW} h={f.h} seed={13 + i * 7} k={1} p={14} />
                  ) : null}
                </g>
              </>
            );
          }}
        </FormCard>
      ))}

      <text
        x={L + (R - L) / 2}
        y={B_ETCH}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".26em"
        fill="var(--pda-txt3)"
      >
        {ETCH}
      </text>
    </>
  );
}

export function galleryLettering(record: IslRecord): LetterSpec[] {
  return [
    ...record.shapes.flatMap((s) => cardSpecs(s)),
    { slot: "etch", text: ETCH, fs: FS.chrome, track: 0.26, measure: R - L },
  ];
}
