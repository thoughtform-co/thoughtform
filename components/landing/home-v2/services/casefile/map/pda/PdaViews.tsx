"use client";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { CONFIG_VIEWBOX } from "./PdaConfiguration";
import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import type { PdaEntry } from "./PdaEntry";
import { Cartridge, Module, Pads, Plate, wrapLines } from "./pdaGlyphs";
import type { PdaShape, PdaTeam, PdaWork } from "./pdaRecord";

/**
 * THE THREE VIEWS, ported from `thoughtform-intelligence-map-v18.html`.
 *
 * The authoring space is 780 x 850 and every coordinate below is the owner's.
 * ⚠ Do not re-derive them. A drawing whose proportions have been "tidied" is
 * a different drawing.
 */

/** The AUTHORING space every coordinate below is expressed in. It is NOT what
 *  gets rendered any more — each reading crops its own viewBox (`VIEW_BOX`)
 *  — but it is the frame the owner drew in, so the numbers stay readable
 *  against it. */
export const VW = 780;
export const VH = 850;

/**
 * EACH READING CROPS ITS OWN VIEWBOX (ADR-063 U1).
 *
 * `xMidYMid meet` scales by the MINIMUM of the two box ratios, and the field
 * is landscape while this authoring space is portrait — so the drawing has
 * always been HEIGHT-BOUND, and every authored unit of empty vertical margin
 * was a direct tax on rendered type. Measured against the live `getBBox()`
 * of each reading, the waste was: 82 units on 01, **288 on 02** (a third of
 * its box) and 132 on 03.
 *
 * Cropping to what each reading actually draws costs nothing — no authored
 * coordinate moves, the drawings are identical — and buys, at 1280x720:
 *
 *   01  meet 0.418 → 0.449   (+7 %)
 *   02  meet 0.418 → 0.607   (+45 %)
 *   03  meet 0.418 → 0.563   (+35 %, after 2026-08-06 dropped its two
 *                                section rules — see ViewSubstrate)
 *
 * ⚠ 02's content runs to x=797, SEVENTEEN UNITS PAST the 780 authoring
 * width — its crop is 800 wide for that reason, and narrowing it back to 780
 * clips the right-hand modules. Nothing on screen says so; `<text>` past a
 * crop simply vanishes.
 *
 * ⚠ RE-MEASURE AFTER ANY GEOMETRY CHANGE. These are bounds, not opinions:
 * `tests/lib/pda-viewbox.test.ts` re-checks them against the drawings'
 * declared extents, and the smoke measures real glyph boxes against them.
 */
export const VIEW_BOX: Record<1 | 2 | 3, string> = {
  1: "0 10 780 792",
  2: CONFIG_VIEWBOX,
  3: "0 82 780 632",
};

/**
 * LABEL TYPE, sized from each box's MEASURED slack (ADR-063 U1).
 *
 * The owner's ask was to grow the type "without making it too big", so these
 * are derived, not chosen. The measure is the label's own box (or the pitch
 * to its neighbour, for the centred rows) against its LONGEST live string at
 * PT Mono's advance plus that label's own tracking. Every one below lands
 * under 90 % of its measure:
 *
 *   label                 longest live string     was   now   of measure
 *   03 team meta          20 STREAMS               7.5   9.5    75 %
 *   03 shape meta         14 SKILLS · 22 TEAMS     8.5   9       88 %
 *   03 trenched-by        TRENCHED BY CRE          8     9.5    70 %
 *
 * ⚠ THE SHAPE META IS THE BINDING ONE at 88 % of a 150-unit pitch — it is
 * centred, so its neighbours close from both sides. Do not round it up to
 * match the row beneath it; they are different measures.
 *
 * ⚠ `Module`'s label is NOT here: it derives from the module's own height
 * (`h * 0.19`, pdaGlyphs) and 03's shape modules are already near their
 * wall — "Stakeholder" fills 89 % of the 87 units between the divider and
 * the module's right edge. That box, not this table, is 03's ceiling.
 */
const T = {
  /* ⚠ READING 02'S RUNGS LEFT WITH ITS DRAWING (2026-08-09). The switchboard
     letters at its own three tracking-aware sizes in `PdaConfiguration`,
     which is also where its fit table lives. */
  teamMeta: 9.5,
  shapeMeta: 9,
  shapeTrench: 9.5,
} as const;

/** The start pose as inline custom properties. `flPdaDock` reads these. */
function dockVars(entry: PdaEntry): React.CSSProperties | undefined {
  if (entry.kind !== "flight") return undefined;
  return {
    "--dx": `${entry.dx}px`,
    "--dy": `${entry.dy}px`,
    "--dk": entry.dk,
  } as React.CSSProperties;
}

/* ── 01 · the work ──────────────────────────────────────────────────────
   Four across, five down. Twenty cartridges is a shape, not a budget — the
   grid is what makes the estate legible at a glance, and the foot prints how
   many of the record it is showing. */
const GX = (i: number) => 12 + (i % 4) * 192;
const GY = (i: number) => 22 + Math.floor(i / 4) * 158;
const CARD_W = 176;
const CARD_H = 136;

/** Slot `i`'s box, in the authoring space. The flight's source and its
 *  destination are the same object, so both homes are published. */
export const gridRect = (i: number): FlightRect => ({
  x: GX(i),
  y: GY(i),
  w: CARD_W,
  h: CARD_H,
});

/**
 * A cartridge that flies gets a HEAD START. The grid paints in document order,
 * so a returning record crosses cartridges drawn after it; letting them begin
 * a breath later keeps the travel legible without reordering the DOM, which
 * would reorder the tab sequence with it.
 */
const RASTER_LEAD_MS = 90;

export function ViewWork({
  works,
  hover,
  onHover,
  onOpen,
  still,
  selId,
  showSel,
  entry,
}: {
  works: readonly PdaWork[];
  hover: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  still: boolean;
  /** The record the reader has open, if they have opened one. */
  selId: string;
  showSel: boolean;
  entry: PdaEntry;
}) {
  return (
    <>
      {works.map((w, i) => {
        const isSel = showSel && w.id === selId;
        /* The selected record carries the transition; everything else rasters.
           ⚠ The flight is NOT gated on `still` — see pda.css. */
        const flies = isSel && entry.kind === "flight";
        const blooms = isSel && entry.kind === "bloom" && !still;
        const cls = flies
          ? "fl-pda-hit fl-pda-dock"
          : blooms
            ? "fl-pda-hit fl-pda-bloom"
            : `fl-pda-hit${still ? "" : " fl-pda-in"}`;

        return (
          <g
            className={cls}
            key={w.id}
            style={
              flies
                ? dockVars(entry)
                : still || blooms
                  ? undefined
                  : {
                      animationDelay: `${(entry.kind === "flight" ? RASTER_LEAD_MS : 0) + i * 22}ms`,
                    }
            }
            role="button"
            tabIndex={0}
            aria-label={`${w.title}, ${w.configured ? `${w.lane} lane` : "person-led"}${
              isSel ? ", open" : ""
            }`}
            onClick={() => onOpen(w.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(w.id);
              }
            }}
            onMouseEnter={() => onHover(w.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(w.id)}
            onBlur={() => onHover(null)}
          >
            <Cartridge
              x={GX(i)}
              y={GY(i)}
              w={CARD_W}
              h={CARD_H}
              state={hover === w.id ? "hot" : w.configured ? "cfg" : "led"}
              work={w}
              sel={isSel}
            />
          </g>
        );
      })}
    </>
  );
}

/* ── 03 · the substrate ─────────────────────────────────────────────────
   The teams that run the work, the shapes they all draw on, and the crossing
   between them. A green run with a square on it is the team that PAID to
   encode that shape; every run after it is a team drawing on it for nothing. */
const TY = 118;
const SY = 632;
const TXs = (i: number) => 52 + i * 96;
const SXs = (i: number) => 88 + i * 150;

export function ViewSubstrate({
  teams,
  shapes,
  lit,
  onLit,
  still,
}: {
  teams: readonly PdaTeam[];
  shapes: readonly PdaShape[];
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
}) {
  const litTeam = teams.find((t) => t.id === lit);

  /* The crossing, flattened FIRST so each run's draw-on delay is a pure
     function of its index. Counting during render worked and lint was right
     to object: a mutable counter read while rendering is a different number
     on a re-render that bails out partway. */
  const edges = teams.flatMap((t, i) =>
    t.taps
      .map((s: CaseMapShapeKey) => {
        const j = shapes.findIndex((v) => v.key === s);
        return j < 0 ? null : { team: t, shape: s, x0: TXs(i), x1: SXs(j) };
      })
      .filter(
        (e): e is { team: PdaTeam; shape: CaseMapShapeKey; x0: number; x1: number } => e !== null
      )
  );

  return (
    <>
      {/* ⚠ NO SECTION RULES (owner, 2026-08-06). This reading carried "THE
          TEAMS THAT RUN THE WORK" over the top row and "THE SHAPES THEY ALL
          DRAW ON" under the bottom one. The foot already says it in a
          sentence — "Five shapes recur across the estate. One team pays to
          encode each. Every team after that draws on it for nothing." — and
          the brief beside it says it again. They were a matched PAIR naming
          the two rows, so they leave together; keeping one would label half a
          symmetric drawing.

          What that bought is the reason to do it: the crop tightened from 718
          authoring units to 632, and this reading is HEIGHT-BOUND, so the
          MEASURED type went 4.46–5.45px to 5.06–5.63px at 1280x720, and
          7.21–8.02 to 8.20–9.11 at 1920 — where it now clears the 8.5px floor
          for the first time. A label that explains a drawing is competing with
          the drawing for the same currency. */}

      {/* The crossing. */}
      {edges.map((e, n) => {
        const trenched = e.team.trenched === e.shape;
        const isLit = lit === e.shape || lit === e.team.id;
        const d = `M${e.x0},${TY + 26} C${e.x0},${TY + 180} ${e.x1},${SY - 190} ${e.x1},${SY - 26}`;
        const midY = (TY + 26 + 3 * (TY + 180) + 3 * (SY - 190) + (SY - 26)) / 8;
        return (
          <g key={`${e.team.id}-${e.shape}`}>
            <path
              className={still ? undefined : "fl-pda-wire"}
              style={
                still
                  ? undefined
                  : ({ "--l": 620, animationDelay: `${0.25 + n * 0.018}s` } as React.CSSProperties)
              }
              d={d}
              fill="none"
              stroke={isLit ? "var(--pda-hot)" : trenched ? "var(--pda-grn)" : "var(--pda-dim)"}
              strokeWidth={isLit || trenched ? 1.3 : 0.9}
              opacity={isLit ? 1 : trenched ? 0.85 : 0.45}
            />
            {/* The square marks the team that PAID to encode this shape —
                every run after it is a team drawing on it for nothing. */}
            {trenched ? (
              <rect
                x={(e.x0 + e.x1) / 2 - 4}
                y={midY - 4}
                width="8"
                height="8"
                fill="var(--pda-void)"
                stroke={isLit ? "var(--pda-hot)" : "var(--pda-grn)"}
              />
            ) : null}
          </g>
        );
      })}

      {teams.map((t, i) => {
        const isLit = lit === t.id || (lit !== null && t.taps.includes(lit as CaseMapShapeKey));
        return (
          <g
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            key={t.id}
            style={still ? undefined : { animationDelay: `${i * 26}ms` }}
            onMouseEnter={() => onLit(t.id)}
            onMouseLeave={() => onLit(null)}
          >
            <Plate cx={TXs(i)} cy={TY} w={84} h={50} hot={isLit} label={t.ab} />
            <text
              x={TXs(i)}
              y={TY + 42}
              textAnchor="middle"
              fontSize={T.teamMeta}
              letterSpacing=".14em"
              fill="var(--pda-txt3)"
            >
              {`${String(t.shown).padStart(2, "0")} STREAMS`}
            </text>
          </g>
        );
      })}

      {shapes.map((s, j) => {
        const isLit = lit === s.key || Boolean(litTeam && litTeam.taps.includes(s.key));
        return (
          <g
            className={still ? "fl-pda-hit" : "fl-pda-hit fl-pda-in"}
            key={s.key}
            style={still ? undefined : { animationDelay: `${300 + j * 40}ms` }}
            onMouseEnter={() => onLit(s.key)}
            onMouseLeave={() => onLit(null)}
          >
            <Pads cx={SXs(j)} y={SY - 25} lit={isLit} />
            <Module cx={SXs(j)} cy={SY} w={148} h={50} hot={isLit} label={s.name} />
            <text
              x={SXs(j)}
              y={SY + 48}
              textAnchor="middle"
              fontSize={T.shapeMeta}
              letterSpacing=".14em"
              fill="var(--pda-txt3)"
            >
              {`${s.skills} SKILLS · ${s.teams} TEAMS`}
            </text>
            <text
              x={SXs(j)}
              y={SY + 64}
              textAnchor="middle"
              fontSize={T.shapeTrench}
              letterSpacing=".14em"
              fill="var(--pda-grn-ink)"
            >
              {`TRENCHED BY ${s.trenchedBy}`}
            </text>
          </g>
        );
      })}
    </>
  );
}
