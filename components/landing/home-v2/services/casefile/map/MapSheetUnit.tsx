"use client";

import type { CaseMapWork } from "@/lib/cases/types";

import {
  MASS_BAND,
  type MapDetail,
  SEAT,
  UNIT,
  UNIT_RAIL_LABELS,
  charsIn,
  curve,
  diamond,
  isPersonLed,
  iso,
  poly,
  sheetView,
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
 * LABEL DISCIPLINE. The rail asks the question AND names the answer; the
 * plate answers in MATERIAL — hatched green is encoded here, open dots are
 * rented, blue-grey dashed is the adjacent domain we query but do not own.
 * Provenance is therefore carried by the drawing and never also written
 * down. The prototype's rail used to repeat "encoded here / yours" under a
 * plate that was already hatched green, which is an admission that the
 * material language is not working.
 *
 * ⚠ NOTHING IS LETTERED ON A PLATE, and that is arithmetic (see
 * `UNIT_RAIL_LABELS`): the values are wider than the plate they would sit
 * on, at every detail level. The first cut lettered them and they crossed
 * the centre line on every module.
 *
 * WHAT THE PANEL DROPS. The rail's second line, the seat's note, the entry
 * title and the "why this lane" block are `full`-only. They are not
 * decoration — they are the sentences a reader wants once they have
 * decided to read, which is what the EXPAND control is for.
 */

interface Props extends SheetData {
  work: CaseMapWork;
  detail: MapDetail;
}

interface PlateDef {
  cy: number;
  title: string;
  note: string;
  owned?: boolean;
  graph?: boolean;
  /** Rail copy: one line for the owner plate, two for a split plate. */
  answers: string[];
  /** A split plate letters no words but draws two materials. */
  split: boolean;
}

export function MapSheetUnit({ districts, work, detail }: Props) {
  const person = isPersonLed(work);
  const c = work.cfg;
  const district = districts.find((d) => d.id === work.dist);
  const CROP = sheetView("unit", detail);
  const TYPE = CROP.type;
  const full = detail === "full";
  const { cx: CX, A, B, thickness: TH, plateY, railX, railText, left } = UNIT;

  /** Every rail line wraps against the crop's own right margin. */
  const railChars = charsIn(UNIT.right - railText, TYPE);
  const line = (label: string, value: string) => `${label} · ${value}`;

  const plates: PlateDef[] = [
    {
      cy: plateY[0],
      title: "Who owns it",
      note: "Answers for the outcome",
      owned: true,
      split: false,
      answers: [person ? "The person" : (c?.p[0] ?? "")],
    },
    {
      cy: plateY[1],
      title: "What runs it",
      note: "Neither half runs without the other",
      split: true,
      answers: person
        ? ["Not bound to a Skill", "No lane"]
        : [
            line(UNIT_RAIL_LABELS.skill, c?.s[0] ?? ""),
            line(UNIT_RAIL_LABELS.model, c?.m[0] ?? ""),
          ],
    },
    {
      cy: plateY[2],
      title: "What it inherits",
      note: "Facts are queried / method is encoded",
      graph: true,
      split: true,
      answers: person
        ? ["Context held by the person", "No graph"]
        : [
            line(UNIT_RAIL_LABELS.context, c?.c[0] ?? ""),
            line(UNIT_RAIL_LABELS.graph, c?.g[0] ?? ""),
          ],
    },
    {
      cy: plateY[3],
      title: "What it can reach",
      note: "Without connectors the best setup is inert",
      split: true,
      answers: person
        ? ["Nothing bound", "No surface"]
        : [
            line(UNIT_RAIL_LABELS.connectors, c?.k[0] ?? ""),
            line(UNIT_RAIL_LABELS.surfaces, c?.u[0] ?? ""),
          ],
    },
  ];

  const seat = SEAT[work.seat];
  const dimTop = plateY[0];
  const dimBottom = plateY[seat.depth];
  const dimMid = dimTop + (dimBottom - dimTop) / 2;

  return (
    <g>
      <text className="fl-imap__t fl-imap__t--gold" x={left} y={66}>
        Sheet 02 / the unit — the configuration
      </text>
      <text className="fl-imap__t" x={left} y={84}>
        {full
          ? "One module taken apart. Height is authority, not importance."
          : "Height is authority, not importance."}
      </text>
      <text className="fl-imap__t fl-imap__t--ink" x={UNIT.right} y={66} textAnchor="end">
        {`${work.id} / ${work.title}`}
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={UNIT.right} y={84} textAnchor="end">
        {`${district?.name ?? ""} / ${person ? "Person-led" : "Configured"}`}
      </text>

      <line className="fl-imap__axis" x1={CX} y1={UNIT.axis.top} x2={CX} y2={UNIT.axis.bottom} />

      {/* The work enters off-axis and curves onto the assembly. The panel
          prints the id alone — the header already names the module, and the
          full title here runs into the first plate's leading vertex. */}
      <g>
        <path className="fl-imap__hair2" d={curve(UNIT.entry, [CX - 4, UNIT.axis.top])} />
        <path
          className="fl-imap__own fl-imap__own--hot"
          d={diamond(UNIT.entry[0], UNIT.entry[1], 9)}
        />
        <text className="fl-imap__t fl-imap__t--ink" x={UNIT.entry[0] + 16} y={UNIT.entry[1] + 3}>
          {full ? `${work.id} ${work.title}` : work.id}
        </text>
      </g>

      {plates.map((p) => {
        const q1 = iso(CX, p.cy, A, B);
        const q2 = iso(CX, p.cy, A, -B);
        const q3 = iso(CX, p.cy, -A, -B);
        const q4 = iso(CX, p.cy, -A, B);
        const s1 = iso(CX, p.cy, 0, B);
        const s2 = iso(CX, p.cy, 0, -B);
        const leaderY = q2[1];
        /* The rail block: question, then one wrapped line per answer. */
        const railLines = p.answers.flatMap((a) => wrapLines(a, railChars));

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

            {p.split ? (
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
                    <line
                      className="fl-imap__hatch"
                      key={k}
                      x1={e1[0]}
                      y1={e1[1]}
                      x2={e2[0]}
                      y2={e2[1]}
                    />
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
              </>
            ) : (
              <>
                <circle
                  className="fl-imap__rent"
                  cx={iso(CX, p.cy, 0, 0)[0]}
                  cy={iso(CX, p.cy, 0, 0)[1] - 4}
                  r={6}
                />
                <circle
                  className="fl-imap__rent-core"
                  cx={iso(CX, p.cy, 0, 0)[0]}
                  cy={iso(CX, p.cy, 0, 0)[1] - 4}
                  r={2.2}
                />
              </>
            )}

            {/* Leader to the bracketed label rail. The bracket wraps the
                whole block, so it grows with the wrapped answer rather than
                spanning a fixed 44 units the copy can outrun. */}
            <path
              className="fl-imap__leader"
              d={`M ${q2[0] + 6} ${leaderY} L ${railX - 8} ${leaderY}`}
            />
            <path
              className="fl-imap__brk"
              d={`M ${railX} ${leaderY - 16} L ${railX - 7} ${leaderY - 16} L ${railX - 7} ${
                leaderY + 4 + railLines.length * 16
              } L ${railX} ${leaderY + 4 + railLines.length * 16}`}
            />
            <text className="fl-imap__t fl-imap__t--gold" x={railText} y={leaderY - 4}>
              {p.title}
            </text>
            {railLines.map((l, i) => (
              <text
                className="fl-imap__t fl-imap__t--ink"
                key={`${p.title}-${i}`}
                x={railText}
                y={leaderY + 14 + i * 16}
              >
                {l}
              </text>
            ))}
            {full ? (
              <text
                className="fl-imap__t fl-imap__t--faint"
                x={railText}
                y={leaderY + 18 + railLines.length * 16}
              >
                {p.note}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* How much it decides alone — a measured distance. */}
      <g>
        {seat.depth > 0 ? (
          <>
            <line
              className="fl-imap__dim"
              x1={UNIT.dimX}
              y1={dimTop}
              x2={UNIT.dimX}
              y2={dimBottom}
            />
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
        <text className="fl-imap__t fl-imap__t--gold" x={left} y={dimMid - 14}>
          Decides alone
        </text>
        <text className="fl-imap__t fl-imap__t--ink" x={left} y={dimMid + 4}>
          {seat.label}
        </text>
        {full
          ? wrapLines(seat.note, charsIn(UNIT.dimX - left - 14, TYPE)).map((l, i) => (
              <text
                className="fl-imap__t fl-imap__t--faint"
                key={i}
                x={left}
                y={dimMid + 24 + i * 15}
              >
                {l}
              </text>
            ))
          : null}
      </g>

      {/* The gate, and who answers for it. */}
      <g>
        {person ? (
          <>
            <circle
              className="fl-imap__rent"
              cx={UNIT.gate.x1 + 6}
              cy={UNIT.gate.top + 16}
              r={10}
            />
            <circle
              className="fl-imap__rent-core"
              cx={UNIT.gate.x1 + 6}
              cy={UNIT.gate.top + 16}
              r={3.4}
            />
            <text className="fl-imap__t fl-imap__t--gold" x={CX + 6} y={UNIT.gate.top + 12}>
              No gate / live judgment
            </text>
            <text className="fl-imap__t fl-imap__t--ink" x={CX + 6} y={UNIT.gate.top + 30}>
              The standard is still moving
            </text>
          </>
        ) : (
          <>
            <line
              className="fl-imap__gate"
              x1={UNIT.gate.x1}
              y1={UNIT.gate.top}
              x2={UNIT.gate.x1}
              y2={UNIT.gate.bottom}
            />
            <line
              className="fl-imap__gate"
              x1={UNIT.gate.x2}
              y1={UNIT.gate.top}
              x2={UNIT.gate.x2}
              y2={UNIT.gate.bottom}
            />
            <text className="fl-imap__t fl-imap__t--gold" x={CX + 6} y={UNIT.gate.top + 12}>
              The gate
            </text>
            <text className="fl-imap__t fl-imap__t--ink" x={CX + 6} y={UNIT.gate.top + 30}>
              {work.evals}
            </text>
          </>
        )}
      </g>

      {/* The draw meter. Read against the workload, NEVER a price — the
          label says so ON THE PANEL TOO, because this is the one reading a
          reader is most likely to try to convert into money, and a
          confidentiality caption is not annotation to be reduced away. */}
      <g>
        <text className="fl-imap__t fl-imap__t--gold" x={left} y={UNIT.meterY}>
          Draw / mass per run
        </text>
        {Array.from({ length: 5 }, (_, k) => (
          <rect
            className="fl-imap__dm"
            data-on={k < work.mass ? "" : undefined}
            key={k}
            x={left + k * 22}
            y={UNIT.meterY + 8}
            width={17}
            height={11}
          />
        ))}
        <text className="fl-imap__t fl-imap__t--ink" x={left + 122} y={UNIT.meterY + 20}>
          {`${MASS_BAND[work.mass]} / ${work.vol} vol`}
        </text>
        <text className="fl-imap__t fl-imap__t--faint" x={left} y={UNIT.meterY + 38}>
          Read against the workload. Never a price.
        </text>
      </g>

      {/* Why this lane — expanded only. It is the sentence that keeps the
          lane from reading as a default, and it needs a column the panel
          does not have. */}
      {full && !person && c ? (
        <g>
          <path
            className="fl-imap__brk"
            d={`M ${railX} ${UNIT.meterY - 12} L ${railX - 7} ${UNIT.meterY - 12} L ${railX - 7} ${
              UNIT.meterY + 44
            } L ${railX} ${UNIT.meterY + 44}`}
          />
          <text className="fl-imap__t fl-imap__t--gold" x={railText} y={UNIT.meterY - 2}>
            Why this lane
          </text>
          {wrapLines(c.why, railChars).map((l, i) => (
            <text
              className="fl-imap__t fl-imap__t--faint"
              key={`w${i}`}
              x={railText}
              y={UNIT.meterY + 14 + i * 15}
            >
              {l}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  );
}
