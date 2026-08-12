import {
  FS,
  FormCard,
  L,
  R,
  SUB_VIEWBOX,
  cardSpecs,
  totalSkills,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 5 · DENSITY CARDS — fill is the mass.
 *
 * The owner's `Substrate Archetypes` mockup, frame **S2**: _"fill = encoded
 * skills · the jailbreak-card read"_. Five cards, and what distinguishes them
 * is how tightly each one is HATCHED — Pattern's 14 Skills pack the window,
 * Stakeholder's 5 leave it open. Magnitude stops being a number beside a name
 * and becomes the amount of ink in the box.
 *
 * ⚠ **THE PITCH IS DERIVED, NOT A TABLE.** The mockup hand-tunes five values
 * (11 / 6.5 / 9 / 14 / 5.5) which are all within 5 % of `78 / skills` — so the
 * drawing computes it. A hand-tuned density stops being true the moment the
 * record moves, and this reading's whole claim is that the ink IS the count.
 *
 * ⚠ **IT DOES NOT DRAW THE CROSSING AT ALL** — no departments, no taps, only
 * the one that cut each pattern. Against the pin grid that is the whole
 * relation gone; what it buys is a mass read no other direction has, at a
 * glance and without a number.
 */

export const DENSITY_VIEWBOX = SUB_VIEWBOX;

const ETCH = "FILL = SKILLS ENCODED ON THE FORM";
const B_ETCH = 660;

/** The mockup's five pitches collapse to this: denser hatch, more Skills. */
const pitchOf = (skills: number) => 78 / skills;

export function VariantDensity({ record }: IslVariantProps) {
  return (
    <>
      <defs>
        {record.shapes.map((s) => {
          const p = pitchOf(s.skills);
          return (
            <pattern
              key={s.key}
              id={`isl-dens-${s.key}`}
              width={p}
              height={p}
              patternUnits="userSpaceOnUse"
            >
              <path d={`M0 ${p}L${p} 0`} stroke="var(--pda-amb)" strokeOpacity="0.5" />
            </pattern>
          );
        })}
      </defs>

      {record.shapes.map((s, i) => (
        <FormCard
          key={s.key}
          i={i}
          name={s.name}
          count={String(s.skills).padStart(2, "0")}
          cutBy={s.trenchedBy}
        >
          {(f) => (
            <rect x={f.x} y={f.y} width={f.w} height={f.h} fill={`url(#isl-dens-${s.key})`} />
          )}
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

export function densityLettering(record: IslRecord): LetterSpec[] {
  /* `totalSkills` is not lettered here — the five counts are the reading, and
     a sixth number would be the drawing summarising itself. */
  void totalSkills;
  return [
    ...record.shapes.flatMap((s) => cardSpecs(s)),
    { slot: "etch", text: ETCH, fs: FS.chrome, track: 0.26, measure: R - L },
  ];
}
