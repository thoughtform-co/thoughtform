"use client";

import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
} from "@/lib/cases/types";

import type { MapHover } from "../MapHoverCard";
import { type MapDetail, type MapTotals, pad2, wrapLines } from "../mapProjection";
import {
  PLANE,
  boardMargins,
  boardView,
  charsIn,
  planeBottom,
  planeCell,
  planeColumns,
  planeRows,
} from "./boardProjection";

/**
 * SHEET 03 — PLANE. The operation is TABULATE.
 *
 * Five shapes of judgment against eight departments, as a grid.
 *
 * THIS IS THE LEAST NETWORK-LIKE SHEET OF THE THREE, deliberately. What it
 * has to show is how many departments draw on each shape and which one paid
 * to encode it first — and those are COUNTS. A reader who has to trace
 * crossing risers to answer "did this spread" is doing the drawing's job.
 * Sheet 01 is a network and sheet 02 an anatomy; if this were a third
 * arrangement of lines it would compete with both.
 *
 * Four readings land at once, and none can collide with another:
 *
 *   negative space   the blank cells — what nothing draws on yet
 *   convergence      a full row — one shape drawn on by many departments
 *   the ratchet      the filled cell, exactly one per row: who paid
 *   inheritance      reading DOWN a column: what a department never paid for
 *
 * THE BLANK CELLS ARE DRAWN AS NOTHING, on purpose. A grid that fills them
 * in has hidden the one thing it exists to show.
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  totals: MapTotals;
  detail: MapDetail;
  litMain: CaseMapShapeKey | null;
  litDistrict: string | null;
  onLitMain: (key: CaseMapShapeKey | null) => void;
  onLitDistrict: (id: string | null) => void;
  onHover: (hover: MapHover | null) => void;
}

/** The ratchet, stated in words. Hoisted so the projection test wraps the
 *  exact string the sheet draws. */
export const BOARD_RATCHET =
  "The cost of encoding a shape falls on the first stream that needs it; every stream after inherits it. That is the only line in the readout that improves rather than accumulates.";

export function BoardPlane({
  shapes,
  districts,
  works,
  totals,
  detail,
  litMain,
  litDistrict,
  onLitMain,
  onLitDistrict,
  onHover,
}: Props) {
  const view = boardView(detail);
  const type = view.type;
  const full = detail === "full";
  const cols = planeColumns(districts);
  const rows = planeRows(shapes, districts, works);
  const bottom = planeBottom(rows);
  const margin = boardMargins(view);

  return (
    <g>
      {/* ── The header band ─────────────────────────────────────────── */}
      <text className="fl-imap__t fl-imap__t--gold" x={PLANE.row.x} y={PLANE.head.title}>
        03 · The substrate
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={PLANE.row.x} y={PLANE.head.sub}>
        Plane / shapes of judgment against the departments that draw on them
      </text>
      <text
        className="fl-imap__t fl-imap__t--ink"
        x={PLANE.grid.right}
        y={PLANE.head.title}
        textAnchor="end"
      >
        {`${pad2(totals.mains)} shapes / ${totals.skills} skills / ${totals.taps} draws`}
      </text>
      <line
        className="fl-imap__hair2"
        x1={PLANE.row.x}
        y1={PLANE.head.rule}
        x2={PLANE.grid.right}
        y2={PLANE.head.rule}
      />

      {/* ── Column heads ────────────────────────────────────────────── */}
      {cols.map((col) => (
        <g
          className="fl-imap__b-col"
          key={col.district.id}
          data-lit={litDistrict === col.district.id ? "" : undefined}
          data-dim={litDistrict && litDistrict !== col.district.id ? "" : undefined}
        >
          <text
            className="fl-imap__t fl-imap__t--ink"
            x={col.cx}
            y={PLANE.colHead}
            textAnchor="middle"
          >
            {col.district.id}
          </text>
          <rect
            className="fl-imap__b-hit"
            x={col.x}
            y={PLANE.colHead - type * 1.2}
            width={col.w}
            height={bottom - PLANE.colHead + type * 1.2}
            onMouseEnter={() => {
              onLitDistrict(col.district.id);
              onHover({
                kind: "district",
                district: col.district,
                keys: rows
                  .filter((r) => r.tapped.includes(col.district.id))
                  .map((r) => r.shape.key),
                trenched: rows
                  .filter((r) => r.trenched === col.district.id)
                  .map((r) => r.shape.key),
              });
            }}
            onMouseLeave={() => {
              onLitDistrict(null);
              onHover(null);
            }}
          />
        </g>
      ))}

      {/* ── The grid ────────────────────────────────────────────────── */}
      {rows.map((row, i) => (
        <line
          className="fl-imap__b-grid"
          key={`h${row.shape.key}`}
          x1={PLANE.row.x}
          y1={row.y}
          x2={PLANE.grid.right}
          y2={row.y}
          data-head={i === 0 ? "" : undefined}
        />
      ))}
      <line
        className="fl-imap__b-grid"
        x1={PLANE.row.x}
        y1={bottom}
        x2={PLANE.grid.right}
        y2={bottom}
      />
      {cols.map((col) => (
        <line
          className="fl-imap__b-grid"
          key={`v${col.district.id}`}
          x1={col.x}
          y1={PLANE.grid.top}
          x2={col.x}
          y2={bottom}
        />
      ))}
      <line
        className="fl-imap__b-grid"
        x1={PLANE.grid.right}
        y1={PLANE.grid.top}
        x2={PLANE.grid.right}
        y2={bottom}
      />

      {/* ── Rows: the shape, its counts, and its cells ──────────────── */}
      {rows.map((row) => (
        <g
          className="fl-imap__b-row"
          key={row.shape.key}
          data-lit={litMain === row.shape.key ? "" : undefined}
          data-dim={litMain && litMain !== row.shape.key ? "" : undefined}
        >
          <rect
            className="fl-imap__b-hit"
            x={PLANE.row.x}
            y={row.y}
            width={PLANE.grid.right - PLANE.row.x}
            height={row.h}
            onMouseEnter={() => {
              onLitMain(row.shape.key);
              onHover({
                kind: "main",
                shape: row.shape,
                districts: districts.filter((d) => row.tapped.includes(d.id)),
              });
            }}
            onMouseLeave={() => {
              onLitMain(null);
              onHover(null);
            }}
          />
          <text className="fl-imap__t fl-imap__t--gold" x={PLANE.row.x} y={row.cy - type * 0.3}>
            {row.shape.label}
          </text>
          {/* ⚠ THE ROW HEAD IS 250 UNITS AND THAT IS THE WHOLE BUDGET. The
              first cut printed `14 skills / 8 of 8 draw on it` here — 335
              units, which runs 75 units INTO the grid. The count of who
              draws is already on screen as the marks; the head only has to
              name the shape and its Skills. */}
          <text className="fl-imap__t fl-imap__t--faint" x={PLANE.row.x} y={row.cy + type * 1.05}>
            {`${row.shape.skills} skills / ${row.tapped.length} draw`}
          </text>

          {cols.map((col) => {
            const state = planeCell(row, col.district.id);
            if (state === "none") return null;
            return state === "trenched" ? (
              <rect
                className="fl-imap__b-mark fl-imap__b-mark--first"
                key={col.district.id}
                x={col.cx - PLANE.mark.square / 2}
                y={row.cy - PLANE.mark.square / 2}
                width={PLANE.mark.square}
                height={PLANE.mark.square}
              />
            ) : (
              <circle
                className="fl-imap__b-mark fl-imap__b-mark--tap"
                key={col.district.id}
                cx={col.cx}
                cy={row.cy}
                r={PLANE.mark.circle}
              />
            );
          })}
        </g>
      ))}

      {/* ── The annotation band ─────────────────────────────────────
          The marks carry their own provenance in a sentence, the way the
          city's did. This is annotation, not a legend: it is a claim the
          drawing makes, not a key the drawing needs. */}
      <text className="fl-imap__t fl-imap__t--ink" x={PLANE.note.x} y={PLANE.note.y}>
        {`${totals.reused} of ${totals.configured} configured streams drew on a shape that already existed.`}
      </text>
      <text
        className="fl-imap__t fl-imap__t--faint"
        x={PLANE.note.x}
        y={PLANE.note.y + PLANE.note.line}
      >
        Filled square / the department that paid to encode the shape.
      </text>
      <text
        className="fl-imap__t fl-imap__t--faint"
        x={PLANE.note.x}
        y={PLANE.note.y + PLANE.note.line * 2}
      >
        Open circle / a department that inherited it. Blank / nothing here draws on it.
      </text>

      {/* ── The notes column, expanded only ─────────────────────────── */}
      {full ? (
        <g className="fl-imap__b-notes">
          <text className="fl-imap__t fl-imap__t--gold" x={margin.left.x} y={PLANE.head.title}>
            The ratchet
          </text>
          <line
            className="fl-imap__hair"
            x1={margin.left.x}
            y1={PLANE.head.rule}
            x2={margin.left.x + margin.left.w}
            y2={PLANE.head.rule}
          />
          {wrapLines(BOARD_RATCHET, charsIn(margin.left.w, type)).map((line, i) => (
            <text
              className="fl-imap__t fl-imap__t--faint"
              key={line}
              x={margin.left.x}
              y={PLANE.grid.top + i * type * 1.5}
            >
              {line}
            </text>
          ))}
          {/* ⚠ THE GLOSSES WRAP, THEY DO NOT CLIP. The longest is 46
              characters against a 43-character column, so a single-line
              layout drops four characters off the end of the sheet's own
              definition of a shape. The stack carries its own running y for
              the same reason: a fixed pitch assumes every entry is one line
              and the moment one is not, they letter through each other. */}
          {(() => {
            const per = charsIn(margin.left.w, type);
            let y = PLANE.note.y - 60;
            return rows.map((row) => {
              const lines = wrapLines(`${row.shape.label} · ${row.shape.gloss}`, per);
              const block = lines.map((line, i) => (
                <text
                  className="fl-imap__t fl-imap__t--faint"
                  key={line}
                  x={margin.left.x}
                  y={y + i * type * 1.4}
                >
                  {line}
                </text>
              ));
              y += lines.length * type * 1.4 + type * 0.5;
              return <g key={row.shape.key}>{block}</g>;
            });
          })()}
        </g>
      ) : null}
    </g>
  );
}
