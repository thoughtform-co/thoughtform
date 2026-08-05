"use client";

import type { CaseMapWork } from "@/lib/cases/types";

import type { MapHover } from "./MapHoverCard";
import {
  BOARD,
  BOARD_INDEX,
  type MapDetail,
  type MapTotals,
  boardIndexLines,
  isPersonLed,
  iso,
  pad2,
  placeBoardDistricts,
  poly,
  sheetView,
  textWidth,
  worksInDistrict,
} from "./mapProjection";
import type { SheetData } from "./sheetTypes";

/**
 * SHEET 01 — THE BOARD (ADR-062).
 *
 * The estate as a switchboard: districts are teams, modules are work
 * streams, and every district traces down to one bus. The bus is the
 * encoding standard drawn as hardware, which is what ties the map to the
 * navigational-interface leitmotif rather than leaving it an org chart.
 *
 * THE PARTS INDEX IS NOT ON THE PANEL, and that is a measurement, not a
 * preference. A schematic without its index is decor — but 27 index rows at
 * a readable size need ~620 units of height in a crop that has 570, and
 * squeezing both into the casefile's 611px console put every label at
 * 6.8px. So the index is what EXPAND restores: at `detail === "full"` the
 * crop reaches back to x 40 and the schedule is drawn there. It also
 * survives in the two places that never needed the projection — the hover
 * card names any module on demand, and the mobile fallback IS the index.
 *
 * ACCESSIBILITY. On the panel the chips ARE the control, so they carry the
 * focus ring and the label rather than being `aria-hidden` twins.
 */

interface Props extends SheetData {
  totals: MapTotals;
  selectedId: string;
  litId: string | null;
  detail: MapDetail;
  onLight: (id: string | null) => void;
  onOpen: (id: string) => void;
  onHover: (hover: MapHover | null) => void;
}

export function MapSheetBoard({
  districts,
  works,
  totals,
  selectedId,
  litId,
  detail,
  onLight,
  onOpen,
  onHover,
}: Props) {
  const placed = placeBoardDistricts(districts);
  const CROP = sheetView("board", detail);
  /* The heading band hangs off the BOARD's own extent, not the crop, so the
     expanded sheet does not push the title out to the index column. */
  const headL = detail === "full" ? BOARD_INDEX.x : CROP.x + 8;
  const headR = CROP.x + CROP.w - 8;

  const busL = iso(BOARD.cx, BOARD.cy, -BOARD.A, 0);
  const busR = iso(BOARD.cx, BOARD.cy, BOARD.A, 0);

  const enter = (w: CaseMapWork) => {
    onLight(w.id);
    onHover({ kind: "work", work: w });
  };
  const leave = () => {
    onLight(null);
    onHover(null);
  };

  return (
    <g>
      <text className="fl-imap__t fl-imap__t--gold" x={headL} y={CROP.y + 22}>
        Sheet 01 / the board — the work
      </text>
      <text className="fl-imap__t" x={headL} y={CROP.y + 40}>
        Every stream, in the district that owns it. Hover to name one.
      </text>
      <text className="fl-imap__t fl-imap__t--faint" x={headR} y={CROP.y + 22} textAnchor="end">
        {`${totals.modules} modules / ${pad2(totals.districts)} districts`}
      </text>

      {/* The board plate and its grid. */}
      <g>
        <polygon
          className="fl-imap__board-face"
          points={poly([
            iso(BOARD.cx, BOARD.cy, BOARD.A, BOARD.B),
            iso(BOARD.cx, BOARD.cy, BOARD.A, -BOARD.B),
            iso(BOARD.cx, BOARD.cy, -BOARD.A, -BOARD.B),
            iso(BOARD.cx, BOARD.cy, -BOARD.A, BOARD.B),
          ])}
        />
        {Array.from({ length: 11 }, (_, i) => {
          const f = -BOARD.A + 2 * BOARD.A * ((i + 1) / 12);
          const p1 = iso(BOARD.cx, BOARD.cy, f, BOARD.B);
          const p2 = iso(BOARD.cx, BOARD.cy, f, -BOARD.B);
          return (
            <line
              className="fl-imap__board-grid"
              key={`gx${i}`}
              x1={p1[0]}
              y1={p1[1]}
              x2={p2[0]}
              y2={p2[1]}
            />
          );
        })}
        {Array.from({ length: 7 }, (_, j) => {
          const h = -BOARD.B + 2 * BOARD.B * ((j + 1) / 8);
          const p1 = iso(BOARD.cx, BOARD.cy, BOARD.A, h);
          const p2 = iso(BOARD.cx, BOARD.cy, -BOARD.A, h);
          return (
            <line
              className="fl-imap__board-grid"
              key={`gy${j}`}
              x1={p1[0]}
              y1={p1[1]}
              x2={p2[0]}
              y2={p2[1]}
            />
          );
        })}
      </g>

      {/* The bus every district seats on. */}
      <g>
        <line className="fl-imap__bus" x1={busL[0]} y1={busL[1]} x2={busR[0]} y2={busR[1]} />
        <line
          className="fl-imap__bus fl-imap__bus--shadow"
          x1={busL[0] + 3}
          y1={busL[1] + 1.5}
          x2={busR[0] + 3}
          y2={busR[1] + 1.5}
        />
        {/* ⚠ 20 units apart, not 11. At 11 the two lines' caps met at
            every viewport — the bus label was the last surviving overlap
            on this sheet, and it read as one smudged word. */}
        <text
          className="fl-imap__t fl-imap__t--gold"
          x={busL[0] - 8}
          y={busL[1] - 7}
          textAnchor="end"
        >
          The bus
        </text>
        <text
          className="fl-imap__t fl-imap__t--faint"
          x={busL[0] - 8}
          y={busL[1] + 13}
          textAnchor="end"
        >
          One standard
        </text>
      </g>

      {/* Districts, painted far to near. */}
      {placed.map((p) => {
        const T = BOARD.thickness;
        const traceFrom = iso(BOARD.cx, BOARD.cy, p.a, p.b > 0 ? p.b - BOARD.db : p.b + BOARD.db);
        const traceTo = iso(BOARD.cx, BOARD.cy, p.a, 0);
        const c1 = iso(BOARD.cx, BOARD.cy, p.a + BOARD.da, p.b + BOARD.db);
        const c2 = iso(BOARD.cx, BOARD.cy, p.a + BOARD.da, p.b - BOARD.db);
        const c3 = iso(BOARD.cx, BOARD.cy, p.a - BOARD.da, p.b - BOARD.db);
        const c4 = iso(BOARD.cx, BOARD.cy, p.a - BOARD.da, p.b + BOARD.db);

        return (
          <g key={p.district.id}>
            <line
              className="fl-imap__trace"
              x1={traceFrom[0]}
              y1={traceFrom[1]}
              x2={traceTo[0]}
              y2={traceTo[1]}
            />
            <circle className="fl-imap__junction" cx={traceTo[0]} cy={traceTo[1]} r={2.4} />
            <polygon
              className="fl-imap__dist-side"
              points={poly([c4, c1, [c1[0], c1[1] + T], [c4[0], c4[1] + T]])}
            />
            <polygon
              className="fl-imap__dist-side"
              points={poly([c1, c2, [c2[0], c2[1] + T], [c1[0], c1[1] + T]])}
            />
            <polygon className="fl-imap__dist-top" points={poly([c1, c2, c3, c4])} />

            {worksInDistrict(works, p.district.id).map((w, ci) => {
              const off = BOARD.chip[ci] ?? BOARD.chip[BOARD.chip.length - 1];
              const ca = p.a + off[0];
              const cb = p.b + off[1];
              const h = BOARD.chipHeight;
              const r = BOARD.chipHalf;
              const top = BOARD.cy - h;
              const q1 = iso(BOARD.cx, top, ca + r, cb + r);
              const q2 = iso(BOARD.cx, top, ca + r, cb - r);
              const q3 = iso(BOARD.cx, top, ca - r, cb - r);
              const q4 = iso(BOARD.cx, top, ca - r, cb + r);
              const centre = iso(BOARD.cx, top, ca, cb);

              return (
                <g
                  key={w.id}
                  className="fl-imap__chip"
                  data-chip={w.id}
                  data-on={w.id === selectedId ? "" : undefined}
                  data-lit={litId === w.id ? "" : undefined}
                  data-person={isPersonLed(w) ? "" : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${w.title}, ${p.district.name} — ${
                    isPersonLed(w) ? "person-led" : `${w.lane} lane`
                  }. Open its configuration.`}
                  onMouseEnter={() => enter(w)}
                  onMouseLeave={leave}
                  onFocus={() => enter(w)}
                  onBlur={leave}
                  onClick={() => onOpen(w.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(w.id);
                    }
                  }}
                >
                  <polygon
                    className="fl-imap__chip-side"
                    points={poly([q4, q1, [q1[0], q1[1] + h], [q4[0], q4[1] + h]])}
                  />
                  <polygon
                    className="fl-imap__chip-side"
                    points={poly([q1, q2, [q2[0], q2[1] + h], [q1[0], q1[1] + h]])}
                  />
                  <polygon className="fl-imap__chip-top" points={poly([q1, q2, q3, q4])} />
                  {/* A generous invisible target: the chip face is ~22px on a
                      2:1 axonometric, which is under the comfortable minimum. */}
                  <circle className="fl-imap__chip-hit" cx={centre[0]} cy={centre[1]} r={15} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* PLAQUES DRAW LAST. They ride above every plate in their own layer —
          nothing on the board may bury a district's name. This bug appeared
          three times in the prototypes, always by emitting the plaque inside
          the district's own group. */}
      <g>
        {placed.map((p) => {
          /* BACK ROW PLAQUES GO ABOVE THEIR PLATE. The rows are 156 units
             apart and the plates 120 deep, leaving ~18 screen-units of gap —
             less than a plaque needs. Hung below, a back-row plaque lands on
             the front row's plate. Above it, there is open board. */
          const back = p.b < 0;
          const anchor = back
            ? iso(BOARD.cx, BOARD.cy, p.a - BOARD.da, p.b - BOARD.db)
            : iso(BOARD.cx, BOARD.cy, p.a + BOARD.da, p.b + BOARD.db);
          const count = worksInDistrict(works, p.district.id).length;
          /* DERIVED from the sheet's own type size, not a magic 9.4: the
             expanded sheet letters at 14 units where the panel letters at
             15, and a hard-coded plaque would then hang off its name. */
          const w = textWidth(p.district.name, CROP.type) + 16;
          const top = back ? anchor[1] - 42 : anchor[1] + 10;
          return (
            <g key={`plq-${p.district.id}`} className="fl-imap__plaque">
              <rect x={anchor[0] - w / 2} y={top} width={w} height={40} />
              <text
                className="fl-imap__t fl-imap__t--gold"
                x={anchor[0]}
                y={top + 16}
                textAnchor="middle"
              >
                {p.district.name}
              </text>
              <text
                className="fl-imap__t fl-imap__t--faint"
                x={anchor[0]}
                y={top + 34}
                textAnchor="middle"
              >
                {count === 1 ? "1 module" : `${count} modules`}
              </text>
            </g>
          );
        })}
      </g>

      {/* THE PARTS INDEX — expanded only. The chips are the control on the
          panel; here the schedule is, so the rows carry the same hover and
          click as the chip they name and light it in place. */}
      {detail === "full" ? (
        <g className="fl-imap__index">
          <line
            className="fl-imap__hair"
            x1={BOARD_INDEX.x}
            y1={BOARD_INDEX.top - 10}
            x2={BOARD_INDEX.x + BOARD_INDEX.w}
            y2={BOARD_INDEX.top - 10}
          />
          <text className="fl-imap__t fl-imap__t--gold" x={BOARD_INDEX.x} y={BOARD_INDEX.top - 18}>
            Index / parts
          </text>
          {boardIndexLines(districts, works).map((line) =>
            line.kind === "head" ? (
              <g key={`h-${line.id}`}>
                <text className="fl-imap__t fl-imap__t--gold" x={BOARD_INDEX.x} y={line.y}>
                  {line.label}
                </text>
                <text
                  className="fl-imap__t fl-imap__t--faint"
                  x={BOARD_INDEX.x + BOARD_INDEX.w}
                  y={line.y}
                  textAnchor="end"
                >
                  {line.tail}
                </text>
              </g>
            ) : (
              <g
                key={line.id}
                className="fl-imap__ix"
                data-on={line.id === selectedId ? "" : undefined}
                data-lit={litId === line.id ? "" : undefined}
                role="button"
                tabIndex={0}
                aria-label={`${line.label} — ${line.tail}. Open its configuration.`}
                onMouseEnter={() => {
                  const work = works.find((w) => w.id === line.id);
                  if (work) enter(work);
                }}
                onMouseLeave={leave}
                onFocus={() => {
                  const work = works.find((w) => w.id === line.id);
                  if (work) enter(work);
                }}
                onBlur={leave}
                onClick={() => onOpen(line.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(line.id);
                  }
                }}
              >
                <rect
                  className="fl-imap__ix-hit"
                  x={BOARD_INDEX.x - 4}
                  y={line.y - 11}
                  width={BOARD_INDEX.w + 8}
                  height={BOARD_INDEX.row}
                />
                <path
                  className={line.person ? "fl-imap__rent" : "fl-imap__own"}
                  d={
                    line.person
                      ? `M ${BOARD_INDEX.x + 3} ${line.y - 4} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`
                      : `M ${BOARD_INDEX.x + 3} ${line.y - 8} L ${BOARD_INDEX.x + 7} ${line.y - 4} L ${BOARD_INDEX.x + 3} ${line.y} L ${BOARD_INDEX.x - 1} ${line.y - 4} Z`
                  }
                />
                <text className="fl-imap__t fl-imap__t--ink" x={BOARD_INDEX.x + 14} y={line.y}>
                  {line.label}
                </text>
                <text
                  className="fl-imap__t fl-imap__t--faint"
                  x={BOARD_INDEX.x + BOARD_INDEX.w}
                  y={line.y}
                  textAnchor="end"
                >
                  {line.tail}
                </text>
              </g>
            )
          )}
        </g>
      ) : null}
    </g>
  );
}
