"use client";

/* Section 2 · A · the pinned build, continued. It opens on the drawing
   section 1 ends on (the layer seated in Claude Enterprise beside Shopify
   and analytics) and moves it three times as the reader scrolls: the team
   writes into the layer (adoption), the layer lifts and opens to show what
   was written, then it closes, an agent runs the work across the board
   (automation) and the team's plates rise: upstream. Mirrored from section
   1, drawing left and words right, so the two sections share an object and
   not a layout. `step` fixes a move for a still. */

import { useEffect, useRef, useState } from "react";
import { LAYER, OPENED, TOOLS, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { Glyph } from "../glyphs";
import { boxFaces, ease, lerp, makeIso, over, type Box, type Pt } from "../iso";
import { LayerSlab, slabBoxes, type SlabGeometry } from "../LayerSlab";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const VB_W = 600;
const VB_H = 592;
const LABEL_X = 452;

export function LayerPinned({ step }: { step?: 1 | 2 | 3 }) {
  const fixed = step !== undefined;
  const runway = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<number>(step ?? 1);

  useEffect(() => {
    if (fixed) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setP(1 + 2 * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);

  const active = p < 1.5 ? 1 : p < 2.5 ? 2 : 3;
  const stage = (
    <Stage route={fixed ? `S2 · A · step ${step}` : "S2 · A · pinned build"}>
      <div className="xbA xbA--flip">
        <div className="xbA__fig">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The team writes into the layer, the layer opens to show its context, skills and evals, and an agent runs the work while the team moves upstream"
          >
            <Assembly p={p} />
          </svg>
        </div>
        <div className="xbA__text">
          <div className="xb-eyebrow">{LAYER.eyebrow}</div>
          <h2 className="xb-title">
            {LAYER.title[0]}
            <br />
            <span>{LAYER.title[1]}</span>
          </h2>
          <ol className="xbA__steps">
            {LAYER.steps.map((s, i) => (
              <li key={s.n} className="xbA__step" data-on={active === i + 1 || undefined}>
                <span className="xbA__n">{s.n}</span>
                <span className="xbA__head">{s.head}</span>
                <p className="xbA__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Stage>
  );

  if (fixed) return stage;
  return (
    <div ref={runway} className="xbA-runway">
      <div className="xbA-pin">{stage}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const BASE: Box = { x0: -6.4, x1: 6.4, y0: -3.4, y1: 3.4, z0: 0, z1: 0.5 };
const TOOL_BOX: Box[] = [
  { x0: 3.1, x1: 5.7, y0: -2.9, y1: -0.5, z0: 0.5, z1: 1.25 },
  { x0: 3.1, x1: 5.7, y0: 0.5, y1: 2.9, z0: 0.5, z1: 1.25 },
];
const PLATE = 1.45;
const TEAM_X = [-4.65, -2.75, -0.85, 1.05];

function Assembly({ p }: { p: number }) {
  const iso = makeIso(23, 226, 444);
  // 0 → 1 → 0: the layer lifts and opens in step 2, then closes again.
  const open = ease(p - 1) * (1 - ease(p - 2));
  // The agent runs and the team rises, in step 3.
  const run = ease(p - 2);
  const teamZ = 7.6 + 2.6 * open + 2.8 * run;

  const g: SlabGeometry = {
    x0: -5.6,
    x1: 2.0,
    y0: -2.6,
    y1: 2.6,
    z0: lerp(BASE.z1, 2.2, open),
    t: 0.4,
    gap: lerp(0.05, 1.25, open),
  };
  const strata = slabBoxes(g);
  const slabTop = strata[2].z1;
  const writing = p < 1.5 ? 1 : 1 - ease((p - 1.5) * 2);

  return (
    <g>
      <Solid iso={iso} b={BASE} />
      <BoardDots iso={iso} b={BASE} opacity={0.5} />
      {TOOL_BOX.map((b, i) => (
        <g key={TOOLS[i].id}>
          <Solid iso={iso} b={b} />
          <Glyph
            name={TOOLS[i].id}
            transform={iso.plane(b.x0 + 0.5, b.y0 + 0.5, b.z1, 1.4 / 24)}
            stroke={TEXT}
            strokeWidth={1}
          />
        </g>
      ))}

      {/* The agent's run: the traces across the board light as it runs. */}
      {[-1.7, 1.7].map((y) => {
        const s = iso.p(g.x1, y, BASE.z1);
        const e = iso.p(TOOL_BOX[0].x0, y, BASE.z1);
        return (
          <line
            key={y}
            x1={s[0]}
            y1={s[1]}
            x2={e[0]}
            y2={e[1]}
            stroke={GOLD}
            strokeOpacity={0.35 + 0.65 * run}
            strokeWidth={1 + run}
          />
        );
      })}
      <g opacity={run}>
        {[-1.7, 1.7].map((y, k) => {
          const x = lerp(g.x1, TOOL_BOX[0].x0, 0.22 + 0.2 * k);
          const b: Box = {
            x0: x - 0.3,
            x1: x + 0.3,
            y0: y - 0.3,
            y1: y + 0.3,
            z0: BASE.z1,
            z1: BASE.z1 + 0.5,
          };
          const f = boxFaces(iso, b);
          return (
            <g key={y}>
              <polygon points={f.left} fill={over(GOLD, 0.55)} stroke={GOLD} />
              <polygon points={f.right} fill={over(GOLD, 0.35)} stroke={GOLD} />
              <polygon points={f.top} fill={GOLD} stroke={GOLD} />
            </g>
          );
        })}
      </g>

      <LayerSlab iso={iso} g={g} />

      {/* Adoption: each workstream's work written into the layer. */}
      <g opacity={writing}>
        {TEAM_X.map((cx) => {
          const s = iso.p(cx, 0, teamZ);
          const e = iso.p(cx, 0, slabTop);
          return (
            <g key={cx}>
              <line
                x1={s[0]}
                y1={s[1]}
                x2={e[0]}
                y2={e[1]}
                stroke={GOLD}
                strokeOpacity={0.7}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <rect x={e[0] - 2.5} y={e[1] - 2.5} width={5} height={5} fill={GOLD} />
            </g>
          );
        })}
      </g>

      {/* The team: four plates, rising as the agent takes the run. */}
      {TEAM_X.map((cx, i) => {
        const b: Box = {
          x0: cx - PLATE / 2,
          x1: cx + PLATE / 2,
          y0: -PLATE / 2,
          y1: PLATE / 2,
          z0: teamZ,
          z1: teamZ + 0.16,
        };
        return (
          <g key={WORKSTREAMS[i].id}>
            <Solid iso={iso} b={b} strong={p < 1.5 || p > 2.5} />
            <Glyph
              name={WORKSTREAMS[i].id}
              transform={iso.plane(b.x0 + 0.2, b.y0 + 0.2, b.z1, (PLATE - 0.4) / 24)}
              stroke={TEXT}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Labels. */}
      <g opacity={1 - open}>
        <Leader
          at={iso.p(TEAM_X[3] + PLATE / 2, -PLATE / 2, teamZ + 0.08)}
          text={run > 0.5 ? "TEAM · UPSTREAM" : "THE TEAM"}
          strong={run > 0.5}
        />
        <Leader at={iso.p(g.x1, g.y0, slabTop)} text="X-BIONIC LAYER" gold strong />
      </g>
      <g opacity={open}>
        {strata.map((b, i) => {
          const o = OPENED[2 - i];
          return (
            <Leader
              key={o.id}
              at={iso.p(b.x1, b.y0, (b.z0 + b.z1) / 2)}
              text={o.name.toUpperCase()}
              gold
              strong
            />
          );
        })}
      </g>
      <g opacity={run}>
        <Leader at={iso.p(TOOL_BOX[1].x1, 2.2, 0.9)} text="AGENT · RUNS IT" gold />
      </g>
      <Leader at={iso.p(BASE.x1, 2.2, 0.25)} text="CLAUDE ENTERPRISE" dy={18} />
    </g>
  );
}

function Leader({
  at,
  text,
  gold,
  strong,
  dy = 0,
}: {
  at: Pt;
  text: string;
  gold?: boolean;
  strong?: boolean;
  dy?: number;
}) {
  const c = gold ? GOLD : TEXT;
  const y = at[1] + dy;
  const path =
    dy === 0
      ? `M${at[0] + 4} ${at[1]}H${LABEL_X - 8}`
      : `M${at[0] + 4} ${at[1]}V${y}H${LABEL_X - 8}`;
  return (
    <g>
      <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={c} />
      <path d={path} fill="none" stroke={c} strokeOpacity={0.45} strokeWidth={1} />
      <text x={LABEL_X} y={y + 4} fill={c} fillOpacity={strong ? 1 : 0.72}>
        {text}
      </text>
    </g>
  );
}

function Solid({ iso, b, strong }: { iso: ReturnType<typeof makeIso>; b: Box; strong?: boolean }) {
  const f = boxFaces(iso, b);
  const so = strong ? 0.85 : 0.5;
  return (
    <g>
      <polygon points={f.left} fill={over(TEXT, 0.05)} stroke={TEXT} strokeOpacity={so} />
      <polygon points={f.right} fill={over(TEXT, 0.03)} stroke={TEXT} strokeOpacity={so} />
      <polygon points={f.top} fill={over(TEXT, 0.07)} stroke={TEXT} strokeOpacity={so} />
    </g>
  );
}

/** A dot every unit on a board's top face: the surface reads as a board. */
function BoardDots({
  iso,
  b,
  opacity,
}: {
  iso: ReturnType<typeof makeIso>;
  b: Box;
  opacity: number;
}) {
  const dots: Pt[] = [];
  for (let x = Math.ceil(b.x0 + 0.5); x <= b.x1 - 0.5; x += 1) {
    for (let y = Math.ceil(b.y0 + 0.5); y <= b.y1 - 0.5; y += 1) dots.push(iso.p(x, y, b.z1));
  }
  return (
    <g opacity={opacity}>
      {dots.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 0.75}
          y={y - 0.75}
          width={1.5}
          height={1.5}
          fill={TEXT}
          fillOpacity={0.5}
        />
      ))}
    </g>
  );
}
