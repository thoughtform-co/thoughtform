"use client";

import type { CaseMapChain, CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import type { MapHover } from "../MapHoverCard";
import { type MapDetail, type MapTotals, isPersonLed, pad2, wrapLines } from "../mapProjection";
import {
  PLACE,
  type PlacedCell,
  boardMargins,
  boardView,
  charsIn,
  placeRegisters,
  routeChains,
} from "./boardProjection";

/**
 * SHEET 01 — PLACEMENT. The operation is LOCATE, and CROSS.
 *
 * Two columns of department registers: a bordered stack of labelled cells,
 * headed by the department on its own baseline. The primitive is a box with
 * text inside it, so a label cannot collide with the drawing — it is bounded
 * by the cell that contains it, and the cell's width is a constant.
 *
 * PERSON-LED CELLS DRAW HOLLOW. Three of the 27 stay person-led on purpose,
 * and they are on screen at rest: a map that shows only what was configured
 * shows what was built and hides what was not.
 *
 * THE RUNS ARE WHAT THE CITY COULD NOT DRAW. Its sheet 01 clustered modules
 * on district plates and seated them all on one bus — which says every
 * department shares a standard, and says nothing about work moving between
 * them. The chains cross, orthogonally, through the gutter.
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  chains: readonly CaseMapChain[];
  totals: MapTotals;
  detail: MapDetail;
  selectedId: string;
  litId: string | null;
  onLight: (id: string | null) => void;
  onOpen: (id: string) => void;
  onHover: (hover: MapHover | null) => void;
}

export function BoardPlacement({
  shapes,
  districts,
  works,
  chains,
  totals,
  detail,
  selectedId,
  litId,
  onLight,
  onOpen,
  onHover,
}: Props) {
  const view = boardView(detail);
  const type = view.type;
  const full = detail === "full";
  const registers = placeRegisters(districts, works);
  const routes = routeChains(chains, registers);
  const margin = boardMargins(view);

  /** Optical centre of a row: the cap height sits above the geometric middle. */
  const mid = (cell: { y: number; h: number }) => cell.y + cell.h / 2 + type * 0.34;

  const enter = (work: CaseMapWork) => {
    onLight(work.id);
    onHover({ kind: "work", work });
  };

  const leave = () => {
    onLight(null);
    onHover(null);
  };

  const cellText = (cell: PlacedCell) => `${cell.work.id} ${cell.work.title}`;

  return (
    <g>
      {/* ── The header band ─────────────────────────────────────────── */}
      <text className="fl-imap__t fl-imap__t--gold" x={PLACE.left} y={PLACE.head.title}>
        01 · The work
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={PLACE.left} y={PLACE.head.sub}>
        Placement / every stream on record, by department
      </text>
      <text
        className="fl-imap__t fl-imap__t--ink"
        x={PLACE.right}
        y={PLACE.head.title}
        textAnchor="end"
      >
        {`${totals.modules} modules / ${pad2(totals.districts)} departments / ${totals.personLed} person-led`}
      </text>
      <line
        className="fl-imap__hair2"
        x1={PLACE.left}
        y1={PLACE.head.rule}
        x2={PLACE.right}
        y2={PLACE.head.rule}
      />

      {/* ── The registers ───────────────────────────────────────────── */}
      {/* ⚠ THE HEAD'S TAIL IS THE COUNT AND NOTHING ELSE, at both detail
          levels. A `First: Stakeholder` tail was tried and dropped for two
          reasons that agree: it is 46 characters against a 45-character head
          at expanded type, and provenance is sheet 03's whole operation.
          One sheet, one job. */}
      {registers.map((reg) => {
        const tail = pad2(reg.cells.length);

        return (
          <g className="fl-imap__b-reg" key={reg.district.id}>
            <rect
              className="fl-imap__b-reg-box"
              x={reg.x}
              y={reg.y}
              width={PLACE.colW}
              height={reg.h}
            />
            <rect
              className="fl-imap__b-reg-head"
              x={reg.x}
              y={reg.y}
              width={PLACE.colW}
              height={PLACE.headRow}
            />
            <rect
              className="fl-imap__b-hit"
              x={reg.x}
              y={reg.y}
              width={PLACE.colW}
              height={PLACE.headRow}
              onMouseEnter={() =>
                onHover({
                  kind: "district",
                  district: reg.district,
                  keys: shapes
                    .filter((s) => reg.cells.some((c) => c.work.shapes.includes(s.key)))
                    .map((s) => s.key),
                  trenched: shapes
                    .filter((s) => works.find((w) => w.id === s.first)?.dist === reg.district.id)
                    .map((s) => s.key),
                })
              }
              onMouseLeave={leave}
            />
            <text
              className="fl-imap__t fl-imap__t--gold"
              x={reg.x + PLACE.pad}
              y={mid({ y: reg.y, h: PLACE.headRow })}
            >
              {`${reg.district.id} · ${reg.district.name}`}
            </text>
            <text
              className="fl-imap__t fl-imap__t--faint"
              x={reg.x + PLACE.colW - PLACE.pad}
              y={mid({ y: reg.y, h: PLACE.headRow })}
              textAnchor="end"
            >
              {tail}
            </text>

            {reg.cells.map((cell) => {
              const person = isPersonLed(cell.work);
              return (
                <g
                  className="fl-imap__b-cell"
                  key={cell.work.id}
                  data-person={person ? "" : undefined}
                  data-lit={litId === cell.work.id ? "" : undefined}
                  data-on={selectedId === cell.work.id ? "" : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cell.work.title}, ${person ? "person-led" : `${cell.work.lane} lane`}`}
                  onClick={() => onOpen(cell.work.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(cell.work.id);
                    }
                  }}
                  onMouseEnter={() => enter(cell.work)}
                  onMouseLeave={leave}
                  onFocus={() => enter(cell.work)}
                  onBlur={leave}
                >
                  <rect
                    className="fl-imap__b-cell-box"
                    x={cell.x}
                    y={cell.y}
                    width={cell.w}
                    height={cell.h}
                  />
                  <text className="fl-imap__t fl-imap__t--ink" x={cell.x + PLACE.pad} y={mid(cell)}>
                    {cellText(cell)}
                  </text>
                  <text
                    className="fl-imap__t fl-imap__t--faint"
                    x={cell.x + cell.w - PLACE.pad}
                    y={mid(cell)}
                    textAnchor="end"
                  >
                    {cell.work.lane ?? "Person"}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── The runs ────────────────────────────────────────────────
          Right-angled, in the gutter, one lane per chain. A curve here
          would read as a relationship diagram, which is the grammar
          sheet 02 owns; a run reads as a connection on a board. */}
      {routes.map((route) => (
        <g className="fl-imap__b-runs" key={route.chain.id}>
          {route.steps.map((step, i) => (
            <path className="fl-imap__b-run" key={`${route.chain.id}-${i}`} d={step.d} />
          ))}
          {route.steps.map((step, i) => {
            const [x, y] = [
              step.to.col === 0 ? step.to.x + step.to.w : step.to.x,
              step.to.y + step.to.h / 2,
            ];
            return (
              <circle
                className="fl-imap__b-run-pip"
                key={`${route.chain.id}-p${i}`}
                cx={x}
                cy={y}
                r={3}
              />
            );
          })}
          {/* ⚠ THE ID RIDES ITS OWN ROUTE, not the top of the gutter. Parked
              at a fixed y the two ids overlapped each other AND the subtitle:
              the gutter is 80 units wide and a 4-character label at expanded
              type is 38, so two of them side by side cannot fit. Anchored to
              each route's first port they stagger by construction, and if two
              chains ever started on the same row the lab's collision readout
              says so. */}
          {full && route.steps.length ? (
            <text
              className="fl-imap__t fl-imap__t--gold"
              x={route.laneX}
              y={Math.min(...route.steps.map((s) => s.from.y + s.from.h / 2)) - 10}
              textAnchor="middle"
            >
              {route.chain.id}
            </text>
          ) : null}
        </g>
      ))}

      {/* ── The notes column, expanded only ──────────────────────────
          The chains are named and explained here rather than on the
          drawing: a run that had to letter its own sentence in the
          gutter would be back to the city's floating-label problem. */}
      {full ? (
        <g className="fl-imap__b-notes">
          <text className="fl-imap__t fl-imap__t--gold" x={margin.left.x} y={PLACE.head.title}>
            The crossings
          </text>
          <line
            className="fl-imap__hair"
            x1={margin.left.x}
            y1={PLACE.head.rule}
            x2={margin.left.x + margin.left.w}
            y2={PLACE.head.rule}
          />
          {routes.map((route, r) => {
            const per = charsIn(margin.left.w, type);
            const lines = wrapLines(route.chain.note, per);
            const top = PLACE.top + r * 240;
            return (
              <g key={route.chain.id}>
                <text className="fl-imap__t fl-imap__t--ink" x={margin.left.x} y={top + 16}>
                  {`${route.chain.id} · ${route.chain.label}`}
                </text>
                {lines.map((line, i) => (
                  <text
                    className="fl-imap__t fl-imap__t--faint"
                    key={line}
                    x={margin.left.x}
                    y={top + 44 + i * (type * 1.5)}
                  >
                    {line}
                  </text>
                ))}
                <text
                  className="fl-imap__t fl-imap__t--gold"
                  x={margin.left.x}
                  y={top + 52 + lines.length * (type * 1.5)}
                >
                  {`${route.crossings} of ${route.steps.length} steps cross a department`}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
}
