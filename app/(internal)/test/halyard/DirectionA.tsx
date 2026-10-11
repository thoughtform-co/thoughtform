"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

import { OFFER } from "./copy";
import { Glyph, type GlyphId } from "./glyphs";
import { iso, path, rect, seg, type IsoFrame, type Vec3 } from "./iso";
import { Layer } from "./Layer";
import { fitItems, type FitItem } from "./fit";
import { monoWidth, useBox } from "./useBox";

/**
 * A · ASSEMBLY. The Unsiloed grammar: the text holds still on the left while
 * one isometric drawing builds on the right, in three steps read in order.
 * Scroll drives the step; `?step=` freezes one for a still.
 *
 *   1  the team: four workstream stations on the floor
 *   2  traces run from each station into the layer, which forms above them
 *   3  the layer docks into a Claude Enterprise housing; Shopify and
 *      analytics are wired to the housing
 */

type Step = 1 | 2 | 3;

/* ── The scene, in world units ─────────────────────────────────────────── */
const PAD = 40;
const PITCH = 92;
const STATIONS = OFFER.workstreams.map((w, i) => ({
  ...w,
  short: w.label.replace(/^Creative\s+/i, "").toUpperCase(),
  glyph: w.id as GlyphId,
  y: i * PITCH,
}));
/* Claude Enterprise: the board the company already runs, carrying the tools
   it is already connected to. The layer is the new module it takes. */
const BOARD = { x0: 150, x1: 392, y0: 30, y1: 334, z: 22 };
const LAYER = { x: 172, y: 86, w: 92, d: 210, t: 10 };
const LAYER_Z: Record<Step, number> = { 1: 132, 2: 132, 3: BOARD.z };
const TOOLS = [
  { id: "shopify" as GlyphId, label: OFFER.tools.shopify.toUpperCase(), x: 316, y: 42 },
  { id: "analytics" as GlyphId, label: OFFER.tools.analytics.toUpperCase(), x: 316, y: 176 },
];
const TOOL = { w: 58, d: 64, h: 14 };
const JOG_X = 108;
const LEAD_Z = 214; /* the layer's label rides this datum */
const STEM = 26; /* px from an anchor up to its glyph chip */
const STEM_T = 38; /* the tools' chips stand clear of the board's top */
const LEGEND = 22; /* px past the board's right corner to the tools' legend */
const CHIP = 30;
const ASC = 9; /* PT Mono cap height at 12px, for box arithmetic */

/* where each station's trace lands under the layer */
const landY = (i: number) => LAYER.y + 26 + i * ((LAYER.d - 52) / 3);

function items(): FitItem[] {
  const f0: IsoFrame = { ox: 0, oy: 0, k: 1 };
  const out: FitItem[] = [];
  const pt = (p: Vec3) => {
    const [ax, ay] = iso(f0, p);
    out.push({ ax, ay, x0: 0, x1: 0, y0: 0, y1: 0 });
  };
  for (const s of STATIONS) {
    pt([0, s.y, 0]);
    pt([0, s.y + PAD, 0]);
    pt([PAD, s.y + PAD, 0]);
  }
  pt([BOARD.x0, BOARD.y0, BOARD.z]);
  pt([BOARD.x1, BOARD.y0, BOARD.z]);
  pt([BOARD.x1, BOARD.y1, 0]);
  pt([BOARD.x0, BOARD.y1, 0]);
  pt([LAYER.x, LAYER.y, LAYER_Z[2] + LAYER.t]);
  pt([LAYER.x + LAYER.w + 18, LAYER.y + LAYER.d, LAYER_Z[2]]);
  /* type */
  for (const s of STATIONS) {
    const [ax, ay] = iso(f0, [PAD / 2, s.y + PAD / 2, 0]);
    out.push({
      ax,
      ay,
      x0: -CHIP / 2 - 14 - monoWidth(s.short) - 4,
      x1: CHIP / 2,
      y0: -STEM - CHIP / 2 - 4,
      y1: 0,
    });
  }
  {
    const [ax, ay] = iso(f0, [PAD / 2, PAD / 2, 0]);
    out.push({
      ax,
      ay,
      x0: -CHIP / 2 - 14 - monoWidth("CREATIVE WORKSTREAMS") - 4,
      x1: 0,
      y0: -STEM - CHIP - 50,
      y1: 0,
    });
  }
  {
    const [ax, ay] = iso(f0, [LAYER.x, LAYER.y, LEAD_Z]);
    out.push({ ax, ay, x0: 0, x1: 12 + monoWidth("THE LAYER"), y0: -ASC - 6, y1: 0 });
  }
  {
    const [ax, ay] = iso(f0, [BOARD.x1, BOARD.y1, 0]);
    out.push({
      ax,
      ay,
      x0: -monoWidth("CLAUDE ENTERPRISE") / 2,
      x1: monoWidth("CLAUDE ENTERPRISE") / 2,
      y0: 0,
      y1: 40,
    });
  }
  const [rvx] = iso(f0, [BOARD.x1, BOARD.y0, BOARD.z]);
  for (const t of TOOLS) {
    const [ax, ay] = iso(f0, [t.x + TOOL.w / 2, t.y + TOOL.d / 2, BOARD.z + TOOL.h]);
    out.push({ ax, ay, x0: -CHIP / 2, x1: CHIP / 2, y0: -STEM_T - CHIP / 2 - 4, y1: 0 });
    /* the label rides a legend column just past the board's right corner */
    out.push({
      ax: rvx,
      ay,
      x0: 0,
      x1: LEGEND + monoWidth(t.label) + 4,
      y0: -STEM_T - 8,
      y1: -STEM_T + 6,
    });
  }
  return out;
}
const ITEMS = items();

function trace(f: IsoFrame, i: number, yc: number, step: Step): string {
  /* Floor run in +x, a jog in y onto the layer's span, then in: under the
     floating layer it rises into its underside; on the board it climbs the
     board's edge and runs across its top to the docked layer. One command
     structure for both, so the path transitions. */
  const yt = landY(i);
  const docked = step === 3;
  const pts: Vec3[] = docked
    ? [
        [PAD / 2, yc, 0],
        [JOG_X, yc, 0],
        [JOG_X, yt, 0],
        [BOARD.x0, yt, 0],
        [BOARD.x0, yt, BOARD.z],
        [LAYER.x + 2, yt, BOARD.z],
      ]
    : [
        [PAD / 2, yc, 0],
        [JOG_X, yc, 0],
        [JOG_X, yt, 0],
        [LAYER.x + 26, yt, 0],
        [LAYER.x + 26, yt, LAYER_Z[2]],
        [LAYER.x + 26, yt, LAYER_Z[2]],
      ];
  const r = (n: number) => Math.round(n * 10) / 10;
  return pts
    .map((p, j) => {
      const [x, y] = iso(f, p);
      return `${j ? "L" : "M"}${r(x)} ${r(y)}`;
    })
    .join(" ");
}

function box(f: IsoFrame, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return {
    top: path(f, [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    fx: path(f, [
      [x1, y0, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x1, y0, z0],
    ]),
    fy: path(f, [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ]),
  };
}

function Drawing({ step, w, h }: { step: Step; w: number; h: number }) {
  const f = useMemo(() => fitItems(ITEMS, w, h, { pad: 6, kMax: 1.3 }), [w, h]);
  const k = f.k ?? 1;
  const dz = (LAYER_Z[2] - LAYER_Z[step]) * k; /* screen px the layer drops */

  /* floor grid over the scene's footprint */
  const grid: string[] = [];
  for (let x = -40; x <= 420; x += 40) grid.push(seg(f, [x, -40, 0], [x, 400, 0]));
  for (let y = -40; y <= 400; y += 40) grid.push(seg(f, [-40, y, 0], [420, y, 0]));

  const board = box(f, BOARD.x0, BOARD.x1, BOARD.y0, BOARD.y1, 0, BOARD.z);
  /* the socket the layer lands in, and the board's own wiring to its tools */
  const socket = path(f, [
    [LAYER.x - 8, LAYER.y - 8, BOARD.z],
    [LAYER.x + LAYER.w + 26, LAYER.y - 8, BOARD.z],
    [LAYER.x + LAYER.w + 26, LAYER.y + LAYER.d + 8, BOARD.z],
    [LAYER.x - 8, LAYER.y + LAYER.d + 8, BOARD.z],
  ]);

  const [lax, lay] = iso(f, [LAYER.x, LAYER.y, LAYER_Z[step] + LAYER.t]);
  const [ldx, ldy] = iso(f, [LAYER.x, LAYER.y, LEAD_Z]);
  const [cbx, cby] = iso(f, [BOARD.x1, BOARD.y1, 0]);
  const [g0x, g0y] = iso(f, [PAD / 2, PAD / 2, 0]);
  const [rvx] = iso(f, [BOARD.x1, BOARD.y0, BOARD.z]);
  const [mx, my] = iso(f, [200, 180, 0]);
  const fade = useId().replace(/:/g, "");

  return (
    <svg
      className="hy-svg hy-svg--clip"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={`${fade}-g`}
          cx={mx}
          cy={my}
          r={Math.max(w, h) * 0.55}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${fade}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <rect x="0" y="0" width={w} height={h} fill={`url(#${fade}-g)`} />
        </mask>
      </defs>
      <path d={grid.join(" ")} className="hy-hair" mask={`url(#${fade}-m)`} />

      {/* ── 3 · Claude Enterprise, under everything that lands on it ── */}
      <g className="hy-a__claude" data-on={step >= 3 ? "" : undefined}>
        <path d={board.fx} className="hy-board-face" />
        <path d={board.fy} className="hy-board-face" />
        <path d={board.top} className="hy-board-top" />
        <path d={socket} className="hy-line-dash" />
        {TOOLS.map((t) => {
          const b = box(f, t.x, t.x + TOOL.w, t.y, t.y + TOOL.d, BOARD.z, BOARD.z + TOOL.h);
          return (
            <g key={t.id}>
              <path d={b.fx} className="hy-board-face" />
              <path d={b.fy} className="hy-board-face" />
              <path d={b.top} className="hy-board-top" />
            </g>
          );
        })}
        <path d={`M${cbx} ${cby + 6} V${cby + 18}`} className="hy-line" />
        <text x={cbx} y={cby + 34} textAnchor="middle" className="hy-svg-label hy-svg-label--ink">
          {OFFER.claude.toUpperCase()}
        </text>
      </g>

      {/* ── 1 · the team ── */}
      <g className="hy-a__team">
        <text
          x={g0x - CHIP / 2 - 14}
          y={g0y - STEM - CHIP - 30}
          textAnchor="end"
          className="hy-svg-label hy-svg-label--dim"
        >
          CREATIVE WORKSTREAMS
        </text>
        {STATIONS.map((s) => {
          const [cx, cy] = iso(f, [PAD / 2, s.y + PAD / 2, 0]);
          const gy = cy - STEM;
          return (
            <g key={s.id}>
              <path d={rect(f, 0, s.y, PAD, PAD)} className="hy-pad" />
              <path d={`M${cx} ${cy} V${gy + CHIP / 2}`} className="hy-line-2" />
              <rect
                x={cx - CHIP / 2}
                y={gy - CHIP / 2}
                width={CHIP}
                height={CHIP}
                className="hy-chip"
              />
              <Glyph id={s.glyph} x={cx - 10} y={gy - 10} size={20} />
              <text x={cx - CHIP / 2 - 14} y={gy + 4} textAnchor="end" className="hy-svg-label">
                {s.short}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── 2 · traces from the team into the layer ── */}
      <g className="hy-a__traces" data-on={step >= 2 ? "" : undefined}>
        {STATIONS.map((s, i) => {
          const d = trace(f, i, s.y + PAD / 2, step);
          return (
            <path
              key={s.id}
              d={d}
              style={{ d: `path("${d}")` } as CSSProperties}
              className="hy-trace"
            />
          );
        })}
      </g>

      <g
        className="hy-a__layer"
        data-on={step >= 2 ? "" : undefined}
        style={{ transform: `translateY(${dz}px)` }}
      >
        <Layer
          f={f}
          at={[LAYER.x, LAYER.y, LAYER_Z[2]]}
          w={LAYER.w}
          d={LAYER.d}
          t={LAYER.t}
          plug="x"
        />
      </g>

      {/* the tools' chips last, so nothing crosses them */}
      <g className="hy-a__claude" data-on={step >= 3 ? "" : undefined}>
        {TOOLS.map((t) => {
          const [tcx, tcy] = iso(f, [t.x + TOOL.w / 2, t.y + TOOL.d / 2, BOARD.z + TOOL.h]);
          const gy = tcy - STEM_T;
          const lx = rvx + LEGEND;
          return (
            <g key={t.id}>
              <path d={`M${tcx} ${tcy} V${gy + CHIP / 2}`} className="hy-line-2" />
              <path d={`M${tcx + CHIP / 2} ${gy} H${lx - 10}`} className="hy-line-2" />
              <rect
                x={tcx - CHIP / 2}
                y={gy - CHIP / 2}
                width={CHIP}
                height={CHIP}
                className="hy-chip"
              />
              <Glyph id={t.id} x={tcx - 10} y={gy - 10} size={20} />
              <text x={lx} y={gy + 4} className="hy-svg-label">
                {t.label}
              </text>
            </g>
          );
        })}
      </g>

      <g className="hy-a__layer-label" data-on={step >= 2 ? "" : undefined}>
        <path
          d={`M${lax} ${lay} V${ldy}`}
          style={{ d: `path("M${lax} ${lay} V${ldy}")` } as CSSProperties}
          className="hy-gold-lead"
        />
        <text x={ldx + 10} y={ldy + 4} className="hy-svg-label hy-svg-label--gold">
          {OFFER.layer.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}

export function DirectionA({ step: frozen }: { step: number | null }) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [scrollStep, setScrollStep] = useState<Step>(1);
  const step: Step = (frozen as Step | null) ?? scrollStep;
  const [boxRef, box] = useBox<HTMLDivElement>();

  useEffect(() => {
    if (frozen) return;
    const el = runwayRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      setScrollStep(p < 0.34 ? 1 : p < 0.67 ? 2 : 3);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [frozen]);

  return (
    <div ref={runwayRef} className="hy-runway" data-frozen={frozen ? "" : undefined}>
      <div className="hy-stage">
        <section className="hy-box hy-a" aria-label={OFFER.title} data-step={step}>
          <header className="hy-a__head">
            <p className="hy-eyebrow">{OFFER.eyebrow}</p>
            <h2 className="hy-title">{OFFER.title}</h2>
          </header>
          <ol className="hy-a__steps">
            {OFFER.steps.map((s, i) => (
              <li key={s.n} className="hy-a__step" data-on={i + 1 === step ? "" : undefined}>
                <span className="hy-a__n">{s.n}</span>
                <span className="hy-a__t">{s.title}</span>
                <span className="hy-a__b">
                  <span className="hy-body">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="hy-a__fig">
            <div ref={boxRef} className="hy-a__draw">
              {box.w > 0 ? <Drawing step={step} w={box.w} h={box.h} /> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
