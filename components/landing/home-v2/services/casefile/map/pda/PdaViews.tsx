"use client";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { Cartridge, Module, Pads, Plate, Port } from "./pdaGlyphs";
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
 *   03  meet 0.418 → 0.495   (+18 %)
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
  3: "0 24 780 718",
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
 *   03 section rules      THE TEAMS THAT RUN…      8.5  11      26 %
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
  secLabel: 11,
  teamMeta: 9.5,
  shapeMeta: 9,
  shapeTrench: 9.5,
} as const;

/* ── 01 · the work ──────────────────────────────────────────────────────
   Four across, five down. Twenty cartridges is a shape, not a budget — the
   grid is what makes the estate legible at a glance, and the foot prints how
   many of the record it is showing. */
const GX = (i: number) => 12 + (i % 4) * 192;
const GY = (i: number) => 22 + Math.floor(i / 4) * 158;

export function ViewWork({
  works,
  hover,
  onHover,
  onOpen,
  still,
}: {
  works: readonly PdaWork[];
  hover: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  still: boolean;
}) {
  return (
    <>
      {works.map((w, i) => (
        <g
          className={`fl-pda-hit${still ? "" : " fl-pda-in"}`}
          key={w.id}
          style={still ? undefined : { animationDelay: `${i * 22}ms` }}
          role="button"
          tabIndex={0}
          aria-label={`${w.title}, ${w.configured ? `${w.lane} lane` : "person-led"}`}
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
            w={176}
            h={136}
            state={hover === w.id ? "hot" : w.configured ? "cfg" : "led"}
            work={w}
          />
        </g>
      ))}
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

const PARTS = [
  { k: "runs", title: "WHAT RUNS IT", x: LX, y: PY[0], flip: false },
  { k: "rch", title: "WHAT IT CAN REACH", x: LX, y: PY[1], flip: false },
  { k: "inh", title: "WHAT IT INHERITS", x: RX, y: PY[0], flip: true },
  { k: "gat", title: "WHAT IT IS HELD TO", x: RX, y: PY[1], flip: true },
] as const;

export function ViewConfiguration({
  work,
  lit,
  onLit,
  still,
}: {
  work: PdaWork;
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
}) {
  const cls = (base: string) => (still ? base : `${base} fl-pda-in`);

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
          fill="var(--pda-amb)"
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

      {/* The modules seat inboard; the core body is drawn OVER the tongues,
          which is what sells the seat. */}
      {PARTS.map((p, i) => (
        <g
          className={cls("fl-pda-hit fl-pda-seat")}
          key={p.k}
          style={
            still
              ? undefined
              : ({
                  "--sx": `${p.flip ? 36 : -36}px`,
                  animationDelay: `${300 + i * 80}ms`,
                } as React.CSSProperties)
          }
          onMouseEnter={() => onLit(p.k)}
          onMouseLeave={() => onLit(null)}
        >
          <Module
            cx={p.x}
            cy={p.y}
            w={MW}
            h={MH}
            hot={lit === p.k}
            label={p.title}
            flip={p.flip}
            plug
          />
        </g>
      ))}

      <g className={still ? undefined : "fl-pda-bloom"}>
        <Cartridge
          x={CX - CW / 2}
          y={CY - CH / 2}
          w={CW}
          h={CH}
          state="hot"
          work={work}
          k={CORE_K}
        />
      </g>

      {PARTS.map((p, i) => (
        <g
          className={still ? undefined : "fl-pda-in"}
          key={`port-${p.k}`}
          style={still ? undefined : { animationDelay: `${520 + i * 80}ms` }}
        >
          <Port x={p.flip ? CX + CW / 2 : CX - CW / 2} y={p.y} hot={lit === p.k} />
        </g>
      ))}

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
      <g className={still ? undefined : "fl-pda-in"}>
        <text x="12" y="46" fontSize={T.secLabel} letterSpacing=".22em" fill="var(--pda-txt3)">
          THE TEAMS THAT RUN THE WORK
        </text>
        <text x="12" y={SY + 96} fontSize={T.secLabel} letterSpacing=".22em" fill="var(--pda-txt3)">
          THE SHAPES THEY ALL DRAW ON
        </text>
      </g>

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
              fill="var(--pda-grn)"
            >
              {`TRENCHED BY ${s.trenchedBy}`}
            </text>
          </g>
        );
      })}
    </>
  );
}
