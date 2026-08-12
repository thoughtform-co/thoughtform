import { FormField, isFormKey } from "./particleForms";
import { FS, FormCard, L, R, SUB_VIEWBOX, cardSpecs, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 6 · FIELD CARDS — each form renders its own test.
 *
 * The owner's `Substrate Archetypes` mockup, frame **S4**: the same card as
 * the density direction, with the hatch replaced by the pattern's own particle
 * field. Where density says HOW MUCH, this says WHAT KIND: a register of sine
 * baselines for Voice, a threshold with a pass rate for Judgment, a lattice of
 * present and absent cases for Validation, four reader nodes for Stakeholder,
 * a repeating tiling for Pattern.
 *
 * ⚠ **THE PAIR WITH S2 IS THE POINT.** They are one component with two fills
 * (`FormCard`), so the comparison is about what a card should carry and
 * nothing else. Density is countable and abstract; the field is characterful
 * and not countable. The pin grid is neither — it is relational.
 *
 * ⚠ The fields are painted at the card's own size rather than scaled from a
 * square: `preserveAspectRatio="none"` on a nested SVG would stretch a
 * circular reader node into an ellipse and a 45° tiling into a lean.
 */

export const FIELD_VIEWBOX = SUB_VIEWBOX;

const ETCH = "EACH FORM RENDERS ITS OWN TEST";
const B_ETCH = 660;

export function VariantField({ record }: IslVariantProps) {
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
          {(f) => (
            <>
              {/* ⚠ THE CLIP IS DERIVED FROM THE WINDOW IT CLIPS — a hardcoded
                  box goes stale the moment the card's chrome moves, and a
                  field that overruns its window paints over the foot.
                  ⚠ AND IT IS IN THE GROUP'S OWN SPACE, AT THE ORIGIN. A
                  `userSpaceOnUse` clip resolves in the coordinate system the
                  referencing element establishes, so absolute coordinates here
                  land at TWICE the translate and cut the field away almost
                  entirely — which renders as a card that simply has no
                  drawing in it. */}
              <clipPath id={`isl-fld-${s.key}`}>
                <rect x={0} y={0} width={f.w} height={f.h} />
              </clipPath>
              <g transform={`translate(${f.x} ${f.y})`} clipPath={`url(#isl-fld-${s.key})`}>
                {isFormKey(s.key) ? (
                  <FormField form={s.key} w={f.w} h={f.h} seed={11 + i * 11} k={1} p={16} />
                ) : null}
              </g>
            </>
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

export function fieldLettering(record: IslRecord): LetterSpec[] {
  return [
    ...record.shapes.flatMap((s) => cardSpecs(s)),
    { slot: "etch", text: ETCH, fs: FS.chrome, track: 0.26, measure: R - L },
  ];
}
