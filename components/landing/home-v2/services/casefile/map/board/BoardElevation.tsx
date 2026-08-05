"use client";

import type { CaseMapDistrict, CaseMapWork } from "@/lib/cases/types";

import { MASS_BAND, type MapDetail, SEAT, isPersonLed, wrapLines } from "../mapProjection";
import {
  ELEV,
  ELEV_RAIL_PANEL,
  autonomySpan,
  boardMargins,
  boardView,
  charsIn,
  clip,
  elevBoxes,
  elevRail,
  personTierCopy,
  railChars,
  tierLines,
} from "./boardProjection";

/**
 * SHEET 02 — ELEVATION. The operation is DISSECT.
 *
 * One work stream on a vertical authority axis. HEIGHT IS AUTHORITY: the
 * person is above, and everything below is what performs the work.
 *
 * SKILL AND MODEL ARE ONE MEMBER, split down the middle — the Skill needs
 * the model and the model needs the Skill, so neither can sit above the
 * other, and a divider says that more plainly than a tie drawn across a gap
 * ever could. Loop's own half is hatched; the rented half is an open
 * outline. The drawing carries the provenance, so there is no legend.
 *
 * NOTHING IS LETTERED ON A TIER, and the rule survives the change of
 * projection because it was always arithmetic: a value like
 * `Component + supplier facts` is wider than the box that would have to hold
 * it. The tiers carry the material language; the rail carries the words.
 *
 * AUTONOMY IS A DIMENSION, not a fifth tier. It is the distance between the
 * owner and the machine, and person-led work has none, because there is no
 * machine for the distance to be measured to.
 */

interface Props {
  districts: readonly CaseMapDistrict[];
  work: CaseMapWork;
  detail: MapDetail;
}

export function BoardElevation({ districts, work, detail }: Props) {
  const view = boardView(detail);
  const type = view.type;
  const full = detail === "full";
  const box = elevBoxes();
  const margin = boardMargins(view);
  const person = isPersonLed(work);
  const seat = SEAT[work.seat];
  const span = autonomySpan(seat.depth);
  const district = districts.find((d) => d.id === work.dist);
  /* THE PANEL SHOWS FOUR, THE EXPANDED READING SIX. Six entries at panel
     type put the last one inside the provenance stamp; reach is what gives,
     and the reach TIER still draws either way. */
  const rail = elevRail(work).slice(0, full ? undefined : ELEV_RAIL_PANEL);
  const per = railChars(type);

  /** Optical centre of a box's first line. */
  const capY = (b: { y: number }, row = 0) => b.y + type * 1.35 + row * type * 1.5;
  const right = (b: { x: number; w: number }) => b.x + b.w;

  return (
    <g>
      {/* ── The header band ─────────────────────────────────────────── */}
      <text className="fl-imap__t fl-imap__t--gold" x={ELEV.left} y={ELEV.head.title}>
        02 · The configuration
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={ELEV.left} y={ELEV.head.sub}>
        {`${work.id} ${work.title} / ${district?.name ?? ""}`}
      </text>
      <text
        className="fl-imap__t fl-imap__t--ink"
        x={ELEV.right}
        y={ELEV.head.title}
        textAnchor="end"
      >
        {person ? "Person-led / not encoded" : `${work.lane} lane / ${seat.label} autonomy`}
      </text>
      <line
        className="fl-imap__hair2"
        x1={ELEV.left}
        y1={ELEV.head.rule}
        x2={ELEV.right}
        y2={ELEV.head.rule}
      />

      {/* ── The assembly axis ───────────────────────────────────────── */}
      <line
        className="fl-imap__axis"
        x1={ELEV.cx}
        y1={box.person.y + box.person.h}
        x2={ELEV.cx}
        y2={person ? box.work.y + box.work.h + 40 : ELEV.gate.y}
      />

      {/* ── Tier 1: the person, above ─────────────────────────────────
          ⚠ THE BODY WRAPS, IT DOES NOT CLIP. `bar` runs to 46 characters
          against a 35-character box at panel type, and clipping it drops
          the sheet's own statement of what good looks like — silently,
          because SVG text reports no overflow. */}
      <rect
        className="fl-imap__b-tier fl-imap__b-tier--person"
        x={box.person.x}
        y={box.person.y}
        width={box.person.w}
        height={box.person.h}
      />
      {tierLines(box.person, type, ...personTierCopy(work)).map((line) => (
        <text
          className={`fl-imap__t ${line.head ? "fl-imap__t--gold" : "fl-imap__t--faint"}`}
          key={line.text}
          x={box.person.x + ELEV.pad}
          y={line.y}
        >
          {line.text}
        </text>
      ))}

      {/* ── Tier 2: the work ────────────────────────────────────────── */}
      <rect
        className="fl-imap__b-tier fl-imap__b-tier--work"
        x={box.work.x}
        y={box.work.y}
        width={box.work.w}
        height={box.work.h}
      />
      {tierLines(box.work, type, `${work.id} ${work.title}`, work.bar).map((line) => (
        <text
          className={`fl-imap__t ${line.head ? "fl-imap__t--ink" : "fl-imap__t--faint"}`}
          key={line.text}
          x={box.work.x + ELEV.pad}
          y={line.y}
        >
          {line.text}
        </text>
      ))}

      {person ? (
        /* PERSON-LED. The lower half of the assembly does not exist, and the
           sheet says so rather than drawing empty boxes: there is no Skill,
           no lane, no gate and no draw. That absence IS the record. */
        <g>
          <circle
            className="fl-imap__b-open-gate"
            cx={ELEV.cx}
            cy={box.work.y + box.work.h + 62}
            r={16}
          />
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={ELEV.cx}
            y={box.work.y + box.work.h + 110}
            textAnchor="middle"
          >
            Not encoded / live judgment
          </text>
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={ELEV.cx}
            y={box.work.y + box.work.h + 110 + type * 1.5}
            textAnchor="middle"
          >
            No gate, no lane, no draw on record
          </text>
        </g>
      ) : (
        <g>
          {/* ── Tier 3: the interdependent pair, at ONE altitude ─────── */}
          <rect
            className="fl-imap__b-tier fl-imap__b-tier--pair"
            x={box.pair.x}
            y={box.pair.y}
            width={box.pair.w}
            height={box.pair.h}
          />
          {/* Loop's own half is HATCHED, the rented half is open dots — the
              same material language the city used, and the reason neither
              half needs a key. */}
          <rect
            className="fl-imap__half--own"
            x={box.pair.x}
            y={box.pair.y}
            width={box.pair.w / 2}
            height={box.pair.h}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              className="fl-imap__hatch"
              key={i}
              x1={box.pair.x + 4 + i * 40}
              y1={box.pair.y + box.pair.h}
              x2={box.pair.x + 4 + i * 40 + 26}
              y2={box.pair.y + box.pair.h - 26}
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) =>
            [0, 1].map((j) => (
              <circle
                className="fl-imap__dot"
                key={`${i}-${j}`}
                cx={ELEV.cx + 22 + i * 40}
                cy={box.pair.y + box.pair.h - 12 - j * 14}
                r={1.8}
              />
            ))
          )}
          <text className="fl-imap__t fl-imap__t--grn" x={box.pair.x + ELEV.pad} y={capY(box.pair)}>
            Encoded here
          </text>
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={right(box.pair) - ELEV.pad}
            y={capY(box.pair)}
            textAnchor="end"
          >
            Rented
          </text>
          {/* The tie: mutual dependence, drawn across the divider. */}
          <path
            className="fl-imap__b-tie"
            d={`M ${ELEV.cx - 26} ${box.pair.y + box.pair.h - 16} H ${ELEV.cx + 26}`}
          />
          <path
            className="fl-imap__b-tie-head"
            d={`M ${ELEV.cx - 26} ${box.pair.y + box.pair.h - 16} l 7 -4 v 8 Z`}
          />
          <path
            className="fl-imap__b-tie-head"
            d={`M ${ELEV.cx + 26} ${box.pair.y + box.pair.h - 16} l -7 -4 v 8 Z`}
          />

          {/* ── Tier 4: the footing ─────────────────────────────────── */}
          <rect
            className="fl-imap__b-tier fl-imap__b-tier--ground"
            x={box.ground.x}
            y={box.ground.y}
            width={box.ground.w}
            height={box.ground.h}
          />
          <rect
            className="fl-imap__half--graph"
            x={ELEV.cx}
            y={box.ground.y}
            width={box.ground.w / 2}
            height={box.ground.h}
          />
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={box.ground.x + ELEV.pad}
            y={capY(box.ground)}
          >
            Inherits
          </text>
          <text
            className="fl-imap__t fl-imap__t--gr"
            x={right(box.ground) - ELEV.pad}
            y={capY(box.ground)}
            textAnchor="end"
          >
            Adjacent domain
          </text>

          {/* ── Tier 5: reach ──────────────────────────────────────── */}
          <rect
            className="fl-imap__b-tier fl-imap__b-tier--reach"
            x={box.reach.x}
            y={box.reach.y}
            width={box.reach.w}
            height={box.reach.h}
          />
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={box.reach.x + ELEV.pad}
            y={capY(box.reach)}
          >
            Reaches
          </text>

          {/* ── The gate ───────────────────────────────────────────── */}
          {[0, ELEV.gate.gap].map((dy) => (
            <g key={dy}>
              <line
                className="fl-imap__gate"
                x1={ELEV.gate.x1}
                y1={ELEV.gate.y + dy}
                x2={ELEV.cx - ELEV.gate.aperture}
                y2={ELEV.gate.y + dy}
              />
              <line
                className="fl-imap__gate"
                x1={ELEV.cx + ELEV.gate.aperture}
                y1={ELEV.gate.y + dy}
                x2={ELEV.gate.x2}
                y2={ELEV.gate.y + dy}
              />
            </g>
          ))}
          {/* ⚠ THE WORD AND THE VALUE ARE TWO MARKS, NOT ONE STRING. The
              longest gate on record is 41 characters, and `Gate · ` in
              front of it is 555 units against a 540-unit rule — the
              projection test caught exactly that. So the rule names itself
              at its own left end and the value gets the whole span. */}
          <text className="fl-imap__t fl-imap__t--faint" x={ELEV.gate.x1 + 4} y={ELEV.gate.y - 6}>
            Gate
          </text>
          <text
            className="fl-imap__t fl-imap__t--gold"
            x={ELEV.cx}
            y={ELEV.gate.label}
            textAnchor="middle"
          >
            {clip(work.evals, charsIn(ELEV.gate.x2 - ELEV.gate.x1, type))}
          </text>

          {/* ── The label rail ─────────────────────────────────────── */}
          {rail.map((entry) => (
            <g key={entry.key}>
              <path
                className="fl-imap__leader"
                d={`M ${entry.from.x} ${entry.from.y} H ${entry.elbowX} V ${entry.y - type * 0.34} H ${ELEV.railText}`}
              />
              <text className="fl-imap__t fl-imap__t--faint" x={ELEV.railText} y={entry.y}>
                {entry.label}
              </text>
              <text
                className="fl-imap__t fl-imap__t--ink"
                x={ELEV.railText}
                y={entry.y + type * 1.4}
              >
                {clip(entry.value, per)}
              </text>
              {full ? (
                <text
                  className="fl-imap__t fl-imap__t--faint"
                  x={ELEV.railText}
                  y={entry.y + type * 2.8}
                >
                  {clip(entry.note, per)}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      )}

      {/* ── The autonomy dimension ──────────────────────────────────── */}
      {span ? (
        <g>
          <line
            className="fl-imap__dim"
            x1={ELEV.dimX}
            y1={span.top}
            x2={ELEV.dimX}
            y2={span.bottom}
          />
          <line
            className="fl-imap__dim"
            x1={ELEV.dimX - 7}
            y1={span.top}
            x2={ELEV.dimX + 7}
            y2={span.top}
          />
          <line
            className="fl-imap__dim"
            x1={ELEV.dimX - 7}
            y1={span.bottom}
            x2={ELEV.dimX + 7}
            y2={span.bottom}
          />
          <text
            className="fl-imap__t fl-imap__t--faint"
            x={ELEV.left}
            y={(span.top + span.bottom) / 2 - type * 0.75}
          >
            Decides alone
          </text>
          <text
            className="fl-imap__t fl-imap__t--gold"
            x={ELEV.left}
            y={(span.top + span.bottom) / 2 + type * 0.7}
          >
            {seat.label}
          </text>
        </g>
      ) : null}

      {/* ── The draw meter ──────────────────────────────────────────
          Read against the workload, NEVER a price. The caption stays at
          BOTH detail levels — a confidentiality line is not annotation to
          be reduced away. */}
      <text className="fl-imap__t fl-imap__t--faint" x={ELEV.meter.x} y={ELEV.meter.label}>
        Draw
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          className="fl-imap__dm"
          key={i}
          data-on={i < work.mass ? "" : undefined}
          x={ELEV.meter.x + i * (ELEV.meter.cell + ELEV.meter.gap)}
          y={ELEV.meter.y}
          width={ELEV.meter.cell}
          height={ELEV.meter.h}
        />
      ))}
      <text
        className="fl-imap__t fl-imap__t--ink"
        x={ELEV.meter.band}
        y={ELEV.meter.y + ELEV.meter.h - type * 0.2}
      >
        {MASS_BAND[work.mass]}
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={ELEV.meter.x} y={ELEV.meter.caption}>
        Never a price.
      </text>

      {/* ── The notes column, expanded only ─────────────────────────── */}
      {full ? (
        <g className="fl-imap__b-notes">
          <text className="fl-imap__t fl-imap__t--gold" x={margin.left.x} y={ELEV.head.title}>
            Why this lane
          </text>
          <line
            className="fl-imap__hair"
            x1={margin.left.x}
            y1={ELEV.head.rule}
            x2={margin.left.x + margin.left.w}
            y2={ELEV.head.rule}
          />
          {wrapLines(
            person
              ? "Nothing here is encoded, and that is the record. The judgment has not stopped moving, so it stays with the person who holds it."
              : (work.cfg?.why ?? ""),
            charsIn(margin.left.w, type)
          ).map((line, i) => (
            <text
              className="fl-imap__t fl-imap__t--faint"
              key={line}
              x={margin.left.x}
              y={ELEV.tier.person.y + 16 + i * type * 1.5}
            >
              {line}
            </text>
          ))}
          <text className="fl-imap__t fl-imap__t--gold" x={margin.left.x} y={ELEV.tier.work.y + 90}>
            The seat
          </text>
          {wrapLines(seat.note, charsIn(margin.left.w, type)).map((line, i) => (
            <text
              className="fl-imap__t fl-imap__t--faint"
              key={line}
              x={margin.left.x}
              y={ELEV.tier.work.y + 118 + i * type * 1.5}
            >
              {line}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  );
}
