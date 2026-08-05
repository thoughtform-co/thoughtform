"use client";

import type { CaseMapWork } from "@/lib/cases/types";

import {
  MASS_BAND,
  SEAT,
  UNIT,
  curve,
  diamond,
  isPersonLed,
  iso,
  poly,
  wrapLines,
} from "./mapProjection";
import type { SheetData } from "./sheetTypes";

/**
 * SHEET 02 — THE UNIT (ADR-062).
 *
 * One module, exploded on a vertical assembly axis. HEIGHT IS AUTHORITY,
 * not importance: the owner is above because they answer for the outcome,
 * and the split plates divide along the DEPTH axis so both halves sit at
 * the same altitude. That is the whole point of the shape — a skill and a
 * model are mutually dependent and neither outranks the other, which a
 * radial ring of six equal components cannot say.
 *
 * HOW MUCH IT DECIDES ALONE IS A DIMENSION, NOT A PLATE. Autonomy is a
 * distance between the owner and the machine, and a dimension line with end
 * ticks is the correct technical-drawing primitive for a distance.
 *
 * LABEL DISCIPLINE. The rail asks the question, the plate answers it.
 * Provenance is carried by the drawing — hatched green is yours, open dots
 * are rented, blue dashed is the adjacent domain — and is NEVER also
 * written down. The prototype's rail used to repeat "encoded here / yours"
 * under a plate that was already hatched green, which is an admission that
 * the material language is not working.
 */

interface Props extends SheetData {
  work: CaseMapWork;
}

interface PlateDef {
  cy: number;
  title: string;
  note: string;
  owned?: boolean;
  graph?: boolean;
  one?: string;
  L?: readonly [string, string];
  R?: readonly [string, string];
}

export function MapSheetUnit({ districts, work }: Props) {
  const person = isPersonLed(work);
  const c = work.cfg;
  const district = districts.find((d) => d.id === work.dist);
  const { cx: CX, A, B, thickness: TH, plateY, railX } = UNIT;

  const plates: PlateDef[] = [
    {
      cy: plateY[0],
      title: "Who owns it",
      note: "Answers for the outcome",
      owned: true,
      one: person ? "The person" : (c?.p[0] ?? ""),
    },
    {
      cy: plateY[1],
      title: "What runs it",
      note: "Neither half runs without the other",
      L: ["Skill", person ? "Not bound" : (c?.s[0] ?? "")],
      R: ["Model", person ? "Not bound" : (c?.m[0] ?? "")],
    },
    {
      cy: plateY[2],
      title: "What it inherits",
      note: "Facts are queried / method is encoded",
      graph: true,
      L: ["Context", person ? "Held by the person" : (c?.c[0] ?? "")],
      R: ["Graph facts", person ? "Not bound" : (c?.g[0] ?? "")],
    },
    {
      cy: plateY[3],
      title: "What it can reach",
      note: "Without connectors the best setup is inert",
      L: ["Connectors", person ? "Not bound" : (c?.k[0] ?? "")],
      R: ["Surfaces", person ? "Not bound" : (c?.u[0] ?? "")],
    },
  ];

  const seat = SEAT[work.seat];
  const dimTop = plateY[0];
  const dimBottom = plateY[seat.depth];
  const dimMid = dimTop + (dimBottom - dimTop) / 2;

  return (
    <g>
      <text className="fl-imap__t fl-imap__t--gold" x={56} y={66}>
        Sheet 02 / the unit — the configuration
      </text>
      <text className="fl-imap__t" x={56} y={80}>
        One module taken apart. Height is authority, not importance.
      </text>
      <text className="fl-imap__t fl-imap__t--ink" x={1104} y={66} textAnchor="end">
        {`${work.id} / ${work.title}`}
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={1104} y={80} textAnchor="end">
        {`${district?.name ?? ""} / ${person ? "Person-led" : "Configured"}`}
      </text>

      <line className="fl-imap__axis" x1={CX} y1={126} x2={CX} y2={576} />

      {/* The work enters off-axis and curves onto the assembly. */}
      <g>
        <path className="fl-imap__hair2" d={curve(UNIT.entry, [CX - 4, 132])} />
        <path className="fl-imap__own fl-imap__own--hot" d={diamond(UNIT.entry[0], UNIT.entry[1], 9)} />
        <text className="fl-imap__t fl-imap__t--ink" x={UNIT.entry[0] + 16} y={UNIT.entry[1] + 3}>
          {`${work.id} ${work.title}`}
        </text>
      </g>

      {plates.map((p) => {
        const q1 = iso(CX, p.cy, A, B);
        const q2 = iso(CX, p.cy, A, -B);
        const q3 = iso(CX, p.cy, -A, -B);
        const q4 = iso(CX, p.cy, -A, B);
        const split = Boolean(p.L && p.R);
        const s1 = iso(CX, p.cy, 0, B);
        const s2 = iso(CX, p.cy, 0, -B);
        const leaderY = q2[1];

        return (
          <g key={p.title}>
            <polygon
              className="fl-imap__plate-side"
              points={poly([q4, q1, [q1[0], q1[1] + TH], [q4[0], q4[1] + TH]])}
            />
            <polygon
              className="fl-imap__plate-side"
              points={poly([q1, q2, [q2[0], q2[1] + TH], [q1[0], q1[1] + TH]])}
            />
            <polygon
              className="fl-imap__plate-top"
              data-owned={p.owned ? "" : undefined}
              points={poly([q1, q2, q3, q4])}
            />

            {split ? (
              <>
                <line
                  className="fl-imap__hair2 fl-imap__dash"
                  x1={s1[0]}
                  y1={s1[1]}
                  x2={s2[0]}
                  y2={s2[1]}
                />
                {/* LEFT HALF — encoded here, so it is hatched and green. */}
                <polygon
                  className="fl-imap__half fl-imap__half--own"
                  points={poly([s1, s2, iso(CX, p.cy, -A, -B), iso(CX, p.cy, -A, B)])}
                />
                {Array.from({ length: 5 }, (_, k) => {
                  const f = (k + 1) / 6;
                  const e1 = iso(CX, p.cy, -A * f, B);
                  const e2 = iso(CX, p.cy, -A * f, -B);
                  return (
                    <line className="fl-imap__hatch" key={k} x1={e1[0]} y1={e1[1]} x2={e2[0]} y2={e2[1]} />
                  );
                })}
                {/* RIGHT HALF — rented, or the adjacent domain in its own
                    hand. The blue dashed treatment says "we query this, we
                    do not own it" without writing a sentence. */}
                {p.graph ? (
                  <polygon
                    className="fl-imap__half fl-imap__half--graph"
                    points={poly([s1, s2, iso(CX, p.cy, A, -B), iso(CX, p.cy, A, B)])}
                  />
                ) : null}
                {Array.from({ length: 5 }, (_, r) =>
                  Array.from({ length: 3 }, (_, cc) => {
                    const d = iso(CX, p.cy, A * ((r + 1) / 6), B - 2 * B * ((cc + 1) / 4));
                    return (
                      <circle
                        className={p.graph ? "fl-imap__dot fl-imap__dot--graph" : "fl-imap__dot"}
                        key={`${r}-${cc}`}
                        cx={d[0]}
                        cy={d[1]}
                        r={1.1}
                      />
                    );
                  })
                )}
                <text
                  className="fl-imap__t fl-imap__t--grn"
                  x={iso(CX, p.cy, -A * 0.55, 0)[0]}
                  y={iso(CX, p.cy, -A * 0.55, 0)[1] - 2}
                  textAnchor="middle"
                >
                  {p.L?.[0]}
                </text>
                <text
                  className="fl-imap__t fl-imap__t--ink"
                  x={iso(CX, p.cy, -A * 0.55, 0)[0]}
                  y={iso(CX, p.cy, -A * 0.55, 0)[1] + 10}
                  textAnchor="middle"
                >
                  {p.L?.[1]}
                </text>
                <text
                  className={`fl-imap__t ${p.graph ? "fl-imap__t--gr" : "fl-imap__t--gold"}`}
                  x={iso(CX, p.cy, A * 0.55, 0)[0]}
                  y={iso(CX, p.cy, A * 0.55, 0)[1] - 2}
                  textAnchor="middle"
                >
                  {p.R?.[0]}
                </text>
                <text
                  className="fl-imap__t fl-imap__t--ink"
                  x={iso(CX, p.cy, A * 0.55, 0)[0]}
                  y={iso(CX, p.cy, A * 0.55, 0)[1] + 10}
                  textAnchor="middle"
                >
                  {p.R?.[1]}
                </text>
              </>
            ) : (
              <>
                <circle
                  className="fl-imap__rent"
                  cx={iso(CX, p.cy, 0, 0)[0]}
                  cy={iso(CX, p.cy, 0, 0)[1] - 10}
                  r={6}
                />
                <circle
                  className="fl-imap__rent-core"
                  cx={iso(CX, p.cy, 0, 0)[0]}
                  cy={iso(CX, p.cy, 0, 0)[1] - 10}
                  r={2.2}
                />
                <text
                  className="fl-imap__t fl-imap__t--ink"
                  x={iso(CX, p.cy, 0, 0)[0]}
                  y={iso(CX, p.cy, 0, 0)[1] + 10}
                  textAnchor="middle"
                >
                  {p.one}
                </text>
              </>
            )}

            {/* Leader to the bracketed label rail. ⚠ The two label lines sit
                26 units apart, not the prototype's 13: the casefile crop
                renders type at roughly double the prototype's unit size, and
                at 13 the question and its answer overlapped. */}
            <path className="fl-imap__leader" d={`M ${q2[0] + 6} ${leaderY} L ${railX - 8} ${leaderY}`} />
            <path
              className="fl-imap__brk"
              d={`M ${railX} ${leaderY - 10} L ${railX - 7} ${leaderY - 10} L ${railX - 7} ${leaderY + 34} L ${railX} ${leaderY + 34}`}
            />
            <text className="fl-imap__t fl-imap__t--gold" x={railX + 12} y={leaderY + 4}>
              {p.title}
            </text>
            <text className="fl-imap__t" x={railX + 12} y={leaderY + 26}>
              {p.note}
            </text>
          </g>
        );
      })}

      {/* How much it decides alone — a measured distance. */}
      <g>
        {seat.depth > 0 ? (
          <>
            <line className="fl-imap__dim" x1={UNIT.dimX} y1={dimTop} x2={UNIT.dimX} y2={dimBottom} />
            {[dimTop, dimBottom].map((yy) => (
              <line
                className="fl-imap__dim"
                key={yy}
                x1={UNIT.dimX - 5}
                y1={yy}
                x2={UNIT.dimX + 5}
                y2={yy}
              />
            ))}
            <line
              className="fl-imap__dim"
              x1={UNIT.dimX}
              y1={dimTop}
              x2={UNIT.dimX + 8}
              y2={dimTop + 7}
            />
            <line
              className="fl-imap__dim"
              x1={UNIT.dimX}
              y1={dimBottom}
              x2={UNIT.dimX + 8}
              y2={dimBottom - 7}
            />
          </>
        ) : null}
        <text className="fl-imap__t fl-imap__t--gold" x={56} y={dimMid - 12}>
          Decides alone
        </text>
        <text className="fl-imap__t fl-imap__t--ink" x={56} y={dimMid}>
          {seat.label}
        </text>
        {wrapLines(seat.note, 22).map((line, i) => (
          <text className="fl-imap__t fl-imap__t--faint" key={i} x={56} y={dimMid + 13 + i * 11}>
            {line}
          </text>
        ))}
      </g>

      {/* The gate, and who answers for it. */}
      <g>
        {person ? (
          <>
            <circle className="fl-imap__rent" cx={CX} cy={594} r={10} />
            <circle className="fl-imap__rent-core" cx={CX} cy={594} r={3.4} />
            <text className="fl-imap__t fl-imap__t--ink" x={CX + 22} y={590}>
              No gate / live judgment
            </text>
            <text className="fl-imap__t fl-imap__t--faint" x={CX + 22} y={602}>
              The standard is still moving
            </text>
          </>
        ) : (
          <>
            <line className="fl-imap__gate" x1={UNIT.gate.x1} y1={UNIT.gate.top} x2={UNIT.gate.x1} y2={UNIT.gate.bottom} />
            <line className="fl-imap__gate" x1={UNIT.gate.x2} y1={UNIT.gate.top} x2={UNIT.gate.x2} y2={UNIT.gate.bottom} />
            <text className="fl-imap__t fl-imap__t--gold" x={CX + 6} y={590}>
              The gate
            </text>
            <text className="fl-imap__t fl-imap__t--ink" x={CX + 6} y={602}>
              {work.evals}
            </text>
          </>
        )}
      </g>

      {/* The draw meter. Read against the workload, NEVER a price — the
          label says so on the surface because this is the one reading a
          reader is most likely to try to convert into money. */}
      <g>
        <text className="fl-imap__t fl-imap__t--gold" x={56} y={604}>
          Draw / mass per run
        </text>
        {Array.from({ length: 5 }, (_, k) => (
          <rect
            className="fl-imap__dm"
            data-on={k < work.mass ? "" : undefined}
            key={k}
            x={56 + k * 22}
            y={612}
            width={17}
            height={11}
          />
        ))}
        <text className="fl-imap__t fl-imap__t--ink" x={176} y={621}>
          {`${MASS_BAND[work.mass]} / ${work.vol} vol`}
        </text>
        <text className="fl-imap__t fl-imap__t--faint" x={56} y={642}>
          Read against the workload. Never a price.
        </text>
      </g>

      {!person && c ? (
        <g>
          <path className="fl-imap__brk" d="M 700 588 L 693 588 L 693 664 L 700 664" />
          <text className="fl-imap__t fl-imap__t--gold" x={712} y={598}>
            Why this lane
          </text>
          {wrapLines(c.why, 54).map((line, i) => (
            <text className="fl-imap__t fl-imap__t--faint" key={`w${i}`} x={712} y={612 + i * 12}>
              {line}
            </text>
          ))}
          {wrapLines(c.s[1], 54).map((line, i) => {
            const offset = 612 + wrapLines(c.why, 54).length * 12 + 14;
            return (
              <text className="fl-imap__t fl-imap__t--ink" key={`s${i}`} x={712} y={offset + i * 12}>
                {line}
              </text>
            );
          })}
        </g>
      ) : null}
    </g>
  );
}
