"use client";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect, FlightVars } from "./pdaFlight";
import { Cartridge, Module, Pads, Plate, Port, moduleAnswerChars, wrapLines } from "./pdaGlyphs";
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
  2: "0 112 800 586",
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
 *   02 chrome             DECIDES ALONE            8    10      52 %
 *   02 autonomy value     BOUNDED                  9    10.5    32 %
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
  cfgLabel: 10,
  cfgValue: 10.5,
  /* The readout runs from the boundary's left edge to its right, less the
     mark and a wall: 738 units, which is 108 characters at this size. The
     longest live sentence is 96 (W-021's), i.e. 89 % — the same margin the
     shape meta above runs at. */
  cfgReadout: 10,
  teamMeta: 9.5,
  shapeMeta: 9,
  shapeTrench: 9.5,
} as const;

/**
 * HOW THE SELECTION ENTERS a reading it has just been shown in.
 *
 * `flight` is the morph — the object travels from the home it had in the
 * outgoing reading (`pdaFlight.ts` computes the pose). `bloom` is the existing
 * gesture for arriving from a reading that had no home for it. `raster` is
 * everything else, which is the drawing's own staggered entrance.
 */
export type PdaEntry = { kind: "raster" } | { kind: "bloom" } | ({ kind: "flight" } & FlightVars);

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

/* ── 02 · the configuration ─────────────────────────────────────────────
   The core is the cartridge you clicked, grown. Four modules seat into it on
   tongues; the OWNER sits above and OUTSIDE the dashed boundary, because the
   seat above the loop is not a component of the machine. */
const CX = 390;
const CY = 440;
const CW = 250;
const CH = 193;
const CORE_K = 1.42;
const MW = 224;
const MH = 56;
const LX = 131;
const RX = 649;
const PY: [number, number] = [CY - 52, CY + 52];

/** The core's box, and the flight's other home. */
export const CORE_RECT: FlightRect = { x: CX - CW / 2, y: CY - CH / 2, w: CW, h: CH };

/**
 * THE READOUT, in the band the boundary's foot and the draw meter leave.
 *
 * It starts past its own mark and runs to the boundary's right edge, so the
 * line belongs to the box it describes. 738 units at size 10 is 108
 * characters; the longest live sentence is 96, and the guard measures the rest.
 */
const READOUT = { x: 30, right: 768, y: 596 } as const;
export const readoutMeasure = () => READOUT.right - READOUT.x;
export const READOUT_TYPE = T.cfgReadout;

/**
 * THE FOUR QUESTIONS, AND WHERE THEIR ANSWERS COME FROM.
 *
 * The questions were the whole of this reading until 2026-08-08: four generic
 * labels that read identically for all twenty-seven streams, while the record
 * held nine authored pairs per configuration that nothing drew. `answers`
 * picks the names and `note` the sentence behind them — the drawing letters
 * the name, the readout carries the note.
 *
 * ⚠ WHAT IT IS HELD TO ANSWERS WITH THE BAR, wrapped. `evals` runs to 41
 * characters ("BRIEFS THAT SHIPPED + BRIEFS THAT STALLED"), which is 142 % of
 * the module's measure — it cannot be lettered there at any legible size, so
 * it goes to the note beside the seat that answers for the gate.
 */
const PARTS = [
  {
    k: "runs",
    title: "WHAT RUNS IT",
    x: LX,
    y: PY[0],
    flip: false,
    lines: (w: PdaWork) => [w.cfg.skill, w.cfg.laneRun],
    note: (w: PdaWork) => w.cfg.runsNote,
  },
  {
    k: "rch",
    title: "WHAT IT CAN REACH",
    x: LX,
    y: PY[1],
    flip: false,
    lines: (w: PdaWork) => [w.cfg.system, w.cfg.surface],
    note: (w: PdaWork) => w.cfg.rchNote,
  },
  {
    k: "inh",
    title: "WHAT IT INHERITS",
    x: RX,
    y: PY[0],
    flip: true,
    lines: (w: PdaWork) => [w.cfg.context, w.cfg.graph],
    note: (w: PdaWork) => w.cfg.inhNote,
  },
  {
    k: "gat",
    title: "WHAT IT IS HELD TO",
    x: RX,
    y: PY[1],
    flip: true,
    lines: (w: PdaWork) => wrapLines(w.cfg.bar, moduleAnswerChars(MW, MH)),
    note: (w: PdaWork) => w.cfg.gatNote,
  },
] as const;

/** The module dimensions the answers are measured against. */
export const MODULE_BOX = { w: MW, h: MH } as const;

/**
 * What reading 02 letters for one work, for the fit guard.
 *
 * Exported so the arithmetic measures the LINES THE DRAWING DRAWS rather than
 * a second reading of the record — a guard that re-derives its own inputs
 * cannot notice the drawing pointing at the wrong field.
 */
export function configurationLines(work: PdaWork) {
  return PARTS.map((p) => ({
    k: p.k,
    head: p.title,
    lines: p.lines(work) as readonly string[],
    note: p.note(work),
  }));
}

export function ViewConfiguration({
  work,
  lit,
  onLit,
  still,
  entry,
}: {
  work: PdaWork;
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  entry: PdaEntry;
}) {
  const cls = (base: string) => (still ? base : `${base} fl-pda-in`);
  const flies = entry.kind === "flight";
  /* The rest state is why this lane and not a lighter one; a hovered module
     hands its own note to the same line. The readout is the ONE reactive
     string in the drawing, and it carries no `data-fl-text`: the casefile's
     decoder caches its targets once per client and would strand a stale
     sentence after the first directory switch. */
  const note = PARTS.find((p) => p.k === lit)?.note(work) ?? work.cfg.why;

  return (
    <>
      <g className={still ? undefined : "fl-pda-in"}>
        <rect
          x="12"
          y="316"
          width="756"
          height="248"
          fill="none"
          stroke="var(--pda-hair2)"
          strokeDasharray="4 7"
        />
        <text x="20" y="308" fontSize={T.cfgLabel} letterSpacing=".22em" fill="var(--pda-txt3)">
          THE CONFIGURATION
        </text>
      </g>

      {/* The owner, outside the boundary. */}
      <g
        className={still ? undefined : "fl-pda-in"}
        style={still ? undefined : { animationDelay: "60ms" }}
      >
        <Plate cx={CX} cy={160} w={214} h={44} hot label={work.owner} />
        <text
          x={CX}
          y="134"
          textAnchor="middle"
          fontSize={T.cfgLabel}
          letterSpacing=".22em"
          fill="var(--pda-ink)"
        >
          WHO OWNS IT
        </text>
        <path
          className={still ? undefined : "fl-pda-wire"}
          style={still ? undefined : ({ "--l": 134, animationDelay: ".2s" } as React.CSSProperties)}
          d={`M${CX},182 V316`}
          stroke="var(--pda-dim)"
          fill="none"
        />
        <rect
          x={CX - 7}
          y="313"
          width="14"
          height="6"
          fill="var(--pda-void)"
          stroke="var(--pda-dim)"
        />
        {/* ⚠ 18 UNITS OF PITCH, not v18's 13. The label/value pair grew from
            8/9 to 10/10.5 and MEASURED, 13 left them overlapping by 1.8
            units — a line box is taller than its font size, so a pitch that
            worked at 8 is a collision at 10. */}
        <text x={CX + 16} y="234" fontSize={T.cfgLabel} letterSpacing=".2em" fill="var(--pda-txt3)">
          DECIDES ALONE
        </text>
        <text x={CX + 16} y="252" fontSize={T.cfgValue} letterSpacing=".2em" fill="var(--pda-hot)">
          {work.autonomy}
        </text>
      </g>

      {/* The ports come up on the core's walls BEFORE the modules travel into
          them — a receptacle that appears after its plug has seated is a
          receptacle nothing seated into. */}
      {PARTS.map((p, i) => (
        <g
          className={still ? undefined : "fl-pda-in"}
          key={`port-${p.k}`}
          style={still ? undefined : { animationDelay: `${380 + i * 60}ms` }}
        >
          <Port x={p.flip ? CX + CW / 2 : CX - CW / 2} y={p.y} hot={lit === p.k} />
        </g>
      ))}

      {/* The modules seat inboard; the core body is drawn OVER the tongues,
          which is what sells the seat. Each carries the record's own answers
          now, so the four questions have four different shapes per stream. */}
      {PARTS.map((p, i) => (
        <g
          className={cls("fl-pda-hit fl-pda-seat")}
          key={p.k}
          style={
            still
              ? undefined
              : ({
                  "--sx": `${p.flip ? 36 : -36}px`,
                  animationDelay: `${520 + i * 80}ms`,
                } as React.CSSProperties)
          }
          /* Focusable for the same reason the cartridges are: the readout's
             note is the only per-stream copy on this drawing that is not
             lettered anywhere, so a hover-only module would put it out of
             reach of the keyboard entirely. The `<text>` nodes stay the
             accessible content — no `aria-label` here, which would override
             them. */
          tabIndex={0}
          onMouseEnter={() => onLit(p.k)}
          onMouseLeave={() => onLit(null)}
          onFocus={() => onLit(p.k)}
          onBlur={() => onLit(null)}
        >
          <Pads cx={p.x} y={p.y - MH / 2} lit={lit === p.k} />
          <Module
            cx={p.x}
            cy={p.y}
            w={MW}
            h={MH}
            hot={lit === p.k}
            label={p.title}
            flip={p.flip}
            plug
            answers={p.lines(work)}
          />
        </g>
      ))}

      {/* ⚠ THE CORE IS THE OBJECT THAT SURVIVED THE VIEW CHANGE, and this
          group holds the cartridge ALONE — the flight measures its start pose
          against this group's own box, so a child reaching past the
          cartridge's path would move the origin under it. The fringe below is
          a sibling for that reason. */}
      <g
        className={flies ? "fl-pda-dock" : still ? undefined : "fl-pda-bloom"}
        style={dockVars(entry)}
      >
        <Cartridge
          x={CORE_RECT.x}
          y={CORE_RECT.y}
          w={CW}
          h={CH}
          state="hot"
          work={work}
          k={CORE_K}
        />
      </g>

      {/* The core's own fringe, lighting up once it has landed. */}
      <g
        className={still ? undefined : "fl-pda-in"}
        style={still ? undefined : { animationDelay: `${PDA_FLIGHT_MS}ms` }}
      >
        <Pads cx={CX} y={CORE_RECT.y} n={13} pitch={16} len={6} />
        <Pads cx={CX} y={CORE_RECT.y + CH} n={13} pitch={16} len={6} down />
      </g>

      {/* THE READOUT — one line, and the only copy on this surface that
          answers to the pointer. */}
      <g
        className={still ? undefined : "fl-pda-in"}
        style={still ? undefined : { animationDelay: "700ms" }}
      >
        <path
          d={`M13,${READOUT.y - 5.5} H21 L25,${READOUT.y - 1} L21,${READOUT.y + 3.5} H13 Z`}
          fill="var(--pda-hot)"
        />
        <text
          x={READOUT.x}
          y={READOUT.y}
          fontSize={T.cfgReadout}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {note}
        </text>
      </g>

      {/* Draw per run. Read against the workload, NEVER a price. */}
      <g
        className={still ? undefined : "fl-pda-in"}
        style={still ? undefined : { animationDelay: "760ms" }}
      >
        <text
          x={CX}
          y="662"
          textAnchor="middle"
          fontSize={T.cfgLabel}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          DRAW PER RUN
        </text>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = CX - 62 + i * 26;
          const on = i < work.draw;
          return (
            <path
              key={i}
              d={`M${x},672 H${x + 16} L${x + 22},679 L${x + 16},686 H${x} Z`}
              fill={on ? "var(--pda-hot)" : "none"}
              stroke={on ? "var(--pda-hot)" : "var(--pda-hair2)"}
            />
          );
        })}
      </g>
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
