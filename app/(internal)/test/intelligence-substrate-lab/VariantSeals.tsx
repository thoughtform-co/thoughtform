import { FormField, isFormKey } from "./particleForms";
import { FS, L, R, SUB_VIEWBOX, TRACK, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 4 · SEALS — five forms as sigils, each carrying its own field.
 *
 * The owner's `Substrate Archetypes` mockup, frame **S1**: _"five forms as
 * sigils · each seal carries its own field"_. A pattern is not a plate and not
 * a row — it is a SEAL, and what is inside the seal is the test it applies.
 * The five fields are the owner's own generators (`particleForms`): a register
 * of sine baselines for Voice, a threshold with 14 % passing for Judgment, a
 * lattice of present and absent cases for Validation, four reader nodes for
 * Stakeholder, a tiling for Pattern.
 *
 * ⚠ **THIS IS THE ONE DIRECTION THAT DOES NOT DRAW THE CROSSING.** It keeps
 * `CUT BY` — the department that paid — and drops who else taps. That is a
 * real cost against the pin grid and the crossing table, and it buys the thing
 * neither has: each pattern's own character, drawn rather than glossed.
 *
 * ⚠ **THE DIAMOND IS A CLIP, NOT A DECORATION.** The field is painted into a
 * square and cut to the seal, so the particles run to the edge and stop — a
 * seal with a field floating inside it reads as a frame around a picture.
 *
 * Adaptations from the mockup, both forced: the `SB-0n` designators are gone
 * (ordinals in costume — ADR-066), and its etch says DEPARTMENTS where the
 * mockup says TEAMS, which is the unit ban `substrate-lab-fit` enforces.
 */

export const SEALS_VIEWBOX = SUB_VIEWBOX;

const SEALS = 5;
const SPAN = R - L;
const PITCH = SPAN / SEALS;
const cx = (i: number) => L + PITCH * (i + 0.5);

/** The seal's half-diagonal. The mockup's 55 in an 888 stage, scaled to 932. */
const RAD = 58;
const CY = 300;
/** The inner dashed diamond — the mockup's 43 against its 55. */
const INNER = RAD * 0.78;

const B_NAME = 470;
const B_COUNT = 496;
const B_CUT = 520;
const B_ETCH = 610;

const MEASURE = PITCH - 12;
const ETCH = "SKILLS · DEPARTMENTS — ENCODED ONCE, TAPPED ACROSS";

const dpath = (x: number, y: number, r: number) =>
  `M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z`;

const pad2 = (n: number) => String(n).padStart(2, "0");
const countOf = (s: IslRecord["shapes"][number]) => `${pad2(s.skills)} · ${pad2(s.teams)}`;

export function VariantSeals({ record }: IslVariantProps) {
  return (
    <>
      <defs>
        <clipPath id="isl-seal">
          <path d={dpath(0, 0, RAD)} />
        </clipPath>
      </defs>

      {record.shapes.map((s, i) => {
        const x = cx(i);
        return (
          <g key={s.key}>
            {/* The field, cut to the seal. */}
            <g transform={`translate(${x} ${CY})`} clipPath="url(#isl-seal)">
              <g transform={`translate(${-RAD} ${-RAD})`}>
                {isFormKey(s.key) ? (
                  <FormField
                    form={s.key}
                    w={RAD * 2}
                    h={RAD * 2}
                    seed={3 + i}
                    k={s.key === "stakeholder" ? 0.4 : 0.32}
                    p={13}
                  />
                ) : null}
              </g>
            </g>

            <path d={dpath(x, CY, RAD)} fill="none" stroke="var(--pda-ink)" />
            <path
              d={dpath(x, CY, INNER)}
              fill="none"
              stroke="var(--pda-hair)"
              strokeDasharray="3 4"
            />

            {/* A pip at each vertex — the seal's four points, and the only
                thing on this drawing that is pure chrome. */}
            {[
              [x, CY - RAD],
              [x + RAD, CY],
              [x, CY + RAD],
              [x - RAD, CY],
            ].map(([px, py]) => (
              <rect
                key={`${px}-${py}`}
                x={px - 1.5}
                y={py - 1.5}
                width="3"
                height="3"
                transform={`rotate(45 ${px} ${py})`}
                fill="var(--pda-ink)"
              />
            ))}

            <text
              x={x}
              y={B_NAME}
              textAnchor="middle"
              fontSize={FS.key}
              letterSpacing=".24em"
              fill="var(--pda-txt)"
            >
              {s.name}
            </text>
            <text
              x={x}
              y={B_COUNT}
              textAnchor="middle"
              fontSize={FS.chrome}
              letterSpacing=".2em"
              fill="var(--pda-ink)"
            >
              {countOf(s)}
            </text>
            <text
              x={x}
              y={B_CUT}
              textAnchor="middle"
              fontSize={FS.chrome}
              letterSpacing=".2em"
              fill="var(--pda-grn-ink)"
            >
              {`CUT BY ${s.trenchedBy}`}
            </text>
          </g>
        );
      })}

      <text
        x={L + SPAN / 2}
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

export function sealsLettering(record: IslRecord): LetterSpec[] {
  return [
    ...record.shapes.flatMap((s) => [
      { slot: `${s.key}.name`, text: s.name, fs: FS.key, track: TRACK.code, measure: MEASURE },
      {
        slot: `${s.key}.count`,
        text: countOf(s),
        fs: FS.chrome,
        track: 0.2,
        measure: MEASURE,
      },
      {
        slot: `${s.key}.cut`,
        text: `CUT BY ${s.trenchedBy}`,
        fs: FS.chrome,
        track: 0.2,
        measure: MEASURE,
      },
    ]),
    { slot: "etch", text: ETCH, fs: FS.chrome, track: 0.26, measure: SPAN },
  ];
}
